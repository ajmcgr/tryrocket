import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { buildEmail, type Template } from "../_shared/email-template.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = Deno.env.get("EMAIL_FROM") || "Rocket <hello@tryrocket.ai>";
const HOOK_SECRET = (Deno.env.get("SEND_EMAIL_HOOK_SECRET") || "").replace(/^v1,whsec_/, "");

const ACTION_TO_TEMPLATE: Record<string, Template> = {
  signup: "auth_signup",
  magiclink: "auth_magiclink",
  recovery: "auth_recovery",
  invite: "auth_invite",
  email_change: "auth_email_change",
  email_change_current: "auth_email_change",
  email_change_new: "auth_email_change",
  reauthentication: "auth_reauth",
};

Deno.serve(async (req) => {
  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
    if (!HOOK_SECRET) throw new Error("SEND_EMAIL_HOOK_SECRET not configured");

    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    const wh = new Webhook(HOOK_SECRET);
    const { user, email_data } = wh.verify(payload, headers) as {
      user: { email: string };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
        site_url: string;
        new_email?: string;
      };
    };

    const template = ACTION_TO_TEMPLATE[email_data.email_action_type] ?? "auth_signup";
    const confirmation_url =
      `${email_data.site_url}/auth/v1/verify?token=${email_data.token_hash}` +
      `&type=${email_data.email_action_type}&redirect_to=${encodeURIComponent(email_data.redirect_to || "")}`;

    const { subject, html } = buildEmail(template, {
      confirmation_url,
      token: email_data.token,
      new_email: email_data.new_email,
    });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_EMAIL, to: [user.email], subject, html }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ error: { http_code: res.status, message: errText } }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({}), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: { http_code: 401, message: (e as Error).message } }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }
});