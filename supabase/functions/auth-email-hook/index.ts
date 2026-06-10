import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

// deploy trigger
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const HOOK_SECRET = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
const FROM_EMAIL = Deno.env.get("EMAIL_FROM") || "Rocket <hello@tryrocket.ai>";

const BRAND = { blue: "#3B82F6", ink: "#0A0A0A", text: "#1F2937", muted: "#6B7280", border: "#E5E7EB", bg: "#F9FAFB" };
const LOGO_URL = "https://tryrocket.ai/favicon.png";

function shell({ preheader, title, bodyHtml, ctaLabel, ctaUrl }: { preheader?: string; title: string; bodyHtml: string; ctaLabel?: string; ctaUrl?: string }) {
  const cta = ctaLabel && ctaUrl
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0;"><tr><td><a href="${ctaUrl}" style="display:inline-block;background:${BRAND.blue};color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 26px;border-radius:9999px;font-family:Inter,Arial,sans-serif;">${ctaLabel}</a></td></tr></table>`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title></head><body style="margin:0;padding:0;background:${BRAND.bg};font-family:Inter,Arial,sans-serif;color:${BRAND.text};">${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>` : ""}<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="padding:32px 12px;"><tr><td align="center"><table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;width:100%;background:#fff;border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;"><tr><td style="background:${BRAND.blue};padding:24px 32px;color:#fff;font-size:18px;font-weight:700;">Rocket</td></tr><tr><td style="padding:36px 32px 32px;"><h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;font-weight:700;color:${BRAND.ink};">${title}</h1><div style="font-size:15px;line-height:1.65;">${bodyHtml}</div>${cta}</td></tr><tr><td style="padding:20px 32px 28px;border-top:1px solid ${BRAND.border};background:#FAFAFA;font-size:12px;color:${BRAND.muted};">Sent by <a href="https://tryrocket.ai" style="color:${BRAND.blue};text-decoration:none;">Rocket</a> — AI launch co-pilot.</td></tr></table></td></tr></table></body></html>`;
}

function buildEmail(actionType: string, confirmationUrl: string, token: string, newEmail?: string) {
  switch (actionType) {
    case "signup":
      return { subject: "Confirm your Rocket account", html: shell({ preheader: "One click to verify your email.", title: "Confirm your email to launch Rocket.", bodyHtml: `<p>Welcome to Rocket — your AI launch co-pilot. Tap below to confirm your email and start generating brands.</p>`, ctaLabel: "Confirm email", ctaUrl: confirmationUrl }) };
    case "magiclink":
      return { subject: "Your Rocket sign-in link", html: shell({ preheader: "Tap to sign in to Rocket.", title: "Sign in to Rocket.", bodyHtml: `<p>Click below to sign in. This link expires shortly and can only be used once.</p>`, ctaLabel: "Sign in to Rocket", ctaUrl: confirmationUrl }) };
    case "recovery":
      return { subject: "Reset your Rocket password", html: shell({ preheader: "Set a new password.", title: "Reset your password.", bodyHtml: `<p>We received a request to reset your Rocket password. Click below to set a new one. If you didn't request this, you can ignore this email.</p>`, ctaLabel: "Reset password", ctaUrl: confirmationUrl }) };
    case "invite":
      return { subject: "You've been invited to Rocket", html: shell({ preheader: "Accept your invite.", title: "You're invited to Rocket.", bodyHtml: `<p>You've been invited to join Rocket. Click below to accept and set up your account.</p>`, ctaLabel: "Accept invite", ctaUrl: confirmationUrl }) };
    case "email_change":
      return { subject: "Confirm your new email", html: shell({ preheader: "Verify your new email.", title: "Confirm your new email address.", bodyHtml: `<p>Click below to confirm <strong>${newEmail ?? "your new email"}</strong> as the new email on your Rocket account.</p>`, ctaLabel: "Confirm new email", ctaUrl: confirmationUrl }) };
    case "reauthentication":
      return { subject: `Your Rocket verification code: ${token}`, html: shell({ title: "Verify it's you.", bodyHtml: `<p>Enter this code in Rocket:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px;margin:18px 0;">${token}</p><p>If you didn't request this, you can ignore this email.</p>` }) };
    default:
      return { subject: "Rocket", html: shell({ title: "Rocket", bodyHtml: `<p><a href="${confirmationUrl}">Continue</a></p>` }) };
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
    if (!HOOK_SECRET) throw new Error("SEND_EMAIL_HOOK_SECRET not configured");

    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    const secret = HOOK_SECRET.replace(/^v1,whsec_/, "");
    const wh = new Webhook(secret);
    const data = wh.verify(payload, headers) as {
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

    const { user, email_data } = data;
    const confirmationUrl = `${email_data.site_url}/auth/v1/verify?token=${email_data.token_hash}&type=${email_data.email_action_type}&redirect_to=${encodeURIComponent(email_data.redirect_to || "")}`;
    const { subject, html } = buildEmail(email_data.email_action_type, confirmationUrl, email_data.token, email_data.new_email);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_EMAIL, to: [user.email], subject, html }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error", err);
      return new Response(JSON.stringify({ error: err }), { status: 500 });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("auth-email-hook error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});