import Stripe from "npm:stripe@16.12.0";
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) return new Response("stripe not configured", { status: 500 });
  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("missing signature", { status: 400 });
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return new Response(`webhook signature failed: ${(e as Error).message}`, { status: 400 });
  }
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId = s.metadata?.user_id;
        const product = s.metadata?.product;
        const credits = parseInt(s.metadata?.credits || "0", 10);
        if (!userId) break;
        await admin.from("payments").insert({
          user_id: userId,
          amount: s.amount_total || 0,
          currency: s.currency || "usd",
          payment_type: s.mode === "subscription" ? "subscription" : "credit_pack",
          credits_added: credits,
          stripe_session_id: s.id,
          stripe_payment_intent_id: typeof s.payment_intent === "string" ? s.payment_intent : null,
          status: "succeeded",
        });
        if (credits > 0) {
          const { data: u } = await admin.from("user_usage").select("credits_extra").eq("user_id", userId).maybeSingle();
          await admin.from("user_usage").update({ credits_extra: (u?.credits_extra || 0) + credits }).eq("user_id", userId);
        }
        if (s.mode === "subscription" && product === "growth") {
          await admin.from("subscriptions").upsert({
            user_id: userId,
            stripe_customer_id: typeof s.customer === "string" ? s.customer : null,
            stripe_subscription_id: typeof s.subscription === "string" ? s.subscription : null,
            plan: "growth",
            status: "active",
          }, { onConflict: "user_id" });
          await admin.from("user_usage").update({ plan: "growth", monthly_limit: 3000 }).eq("user_id", userId);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const { data: row } = await admin.from("subscriptions").select("user_id").eq("stripe_customer_id", customerId).maybeSingle();
        if (!row) break;
        const plan = sub.status === "active" || sub.status === "trialing" ? "growth" : "free";
        await admin.from("subscriptions").update({
          stripe_subscription_id: sub.id,
          status: sub.status,
          plan,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          cancel_at_period_end: sub.cancel_at_period_end,
        }).eq("user_id", row.user_id);
        await admin.from("user_usage").update({
          plan,
          monthly_limit: plan === "growth" ? 3000 : 500,
        }).eq("user_id", row.user_id);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const { data: row } = await admin.from("subscriptions").select("user_id").eq("stripe_customer_id", customerId).maybeSingle();
        if (!row) break;
        await admin.from("subscriptions").update({ status: "canceled", plan: "free" }).eq("user_id", row.user_id);
        await admin.from("user_usage").update({ plan: "free", monthly_limit: 500 }).eq("user_id", row.user_id);
        break;
      }
      case "invoice.payment_succeeded":
      case "invoice.payment_failed": {
        // Could log here; subscription.updated covers status changes
        break;
      }
    }
    return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(`webhook handler error: ${(e as Error).message}`, { status: 500 });
  }
});