// Shared branded HTML email layout for Rocket.
// Logo asset is served from Lovable's CDN — stable URL.

const LOGO_URL =
  "https://id-preview--ec8b5822-131a-40d9-8a55-f90a28ced572.lovable.app/__l5e/assets-v1/d64d2310-23c4-4327-8624-7bd94b3b182e/rocket-logo-white.png";

export const BRAND = {
  blue: "#3B82F6",
  blueHover: "#2563EB",
  ink: "#0A0A0A",
  text: "#1F2937",
  muted: "#6B7280",
  border: "#E5E7EB",
  bg: "#F9FAFB",
};

type LayoutOpts = {
  preheader?: string;
  title: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

export function renderEmail({ preheader, title, bodyHtml, ctaLabel, ctaUrl }: LayoutOpts): string {
  const cta = ctaLabel && ctaUrl
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0;">
         <tr><td align="left">
           <a href="${ctaUrl}" style="display:inline-block;background:${BRAND.blue};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 26px;border-radius:9999px;font-family:Inter,Arial,sans-serif;">${ctaLabel}</a>
         </td></tr>
       </table>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:Inter,Arial,sans-serif;color:${BRAND.text};">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>` : ""}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.bg};padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;">
      <tr>
        <td style="background:${BRAND.blue};padding:28px 32px;" align="left">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="vertical-align:middle;padding-right:10px;">
                <img src="${LOGO_URL}" width="28" height="28" alt="Rocket" style="display:block;border:0;outline:none;text-decoration:none;width:28px;height:28px;" />
              </td>
              <td style="vertical-align:middle;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.01em;font-family:Inter,Arial,sans-serif;">Rocket</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:36px 32px 32px;">
          <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;font-weight:700;letter-spacing:-0.01em;color:${BRAND.ink};font-family:Inter,Arial,sans-serif;">${title}</h1>
          <div style="font-size:15px;line-height:1.65;color:${BRAND.text};font-family:Inter,Arial,sans-serif;">${bodyHtml}</div>
          ${cta}
        </td>
      </tr>
      <tr>
        <td style="padding:20px 32px 28px;border-top:1px solid ${BRAND.border};background:#FAFAFA;">
          <div style="font-size:12px;color:${BRAND.muted};font-family:Inter,Arial,sans-serif;">
            You're getting this email from <a href="https://tryrocket.ai" style="color:${BRAND.blue};text-decoration:none;">Rocket</a> — the AI launch co-pilot for vibe coders.
          </div>
          <div style="margin-top:10px;font-size:11px;color:${BRAND.muted};font-family:Inter,Arial,sans-serif;">
            © Rocket 2026 · Make your product a brand.
          </div>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export type Template = "welcome" | "rocket_generated" | "trial_started" | "payment_succeeded" | "credits_purchased";

export function buildEmail(template: Template, data: any): { subject: string; html: string } {
  switch (template) {
    case "welcome":
      return {
        subject: "Welcome to Rocket 🚀",
        html: renderEmail({
          preheader: "Your AI launch co-pilot is ready.",
          title: `Welcome to Rocket${data?.name ? `, ${data.name}` : ""}.`,
          bodyHtml: `<p>You're in. Rocket helps you brand your app with AI — drop in a product URL and we'll generate your full launch kit in under 60 seconds.</p>
                     <p>You start with <strong>500 free credits</strong>. No card required.</p>`,
          ctaLabel: "Generate your first Rocket",
          ctaUrl: "https://tryrocket.ai/generate",
        }),
      };
    case "rocket_generated":
      return {
        subject: `Your Rocket for ${data?.product_name ?? "your product"} is ready`,
        html: renderEmail({
          preheader: "Your launch kit is ready to review.",
          title: `Your Rocket for ${data?.product_name ?? "your product"} is ready.`,
          bodyHtml: `<p>We've generated your complete launch kit — positioning, taglines, social copy, founder bio, Product Hunt assets, directory submissions, and a full launch checklist.</p>
                     <p>Review it, tweak anything you want, and ship.</p>`,
          ctaLabel: "Open your Rocket",
          ctaUrl: `https://tryrocket.ai/rocket/${data?.rocket_id ?? ""}`,
        }),
      };
    case "trial_started":
      return {
        subject: "Your Rocket Growth trial has started",
        html: renderEmail({
          preheader: "7 days of Growth — on the house.",
          title: "Your 7-day Growth trial is live.",
          bodyHtml: `<p>You now have <strong>3,000 credits/month</strong>, priority generation, and exports unlocked.</p>
                     <p>If you cancel before day 7, you won't be charged.</p>`,
          ctaLabel: "Go to dashboard",
          ctaUrl: "https://tryrocket.ai/dashboard",
        }),
      };
    case "payment_succeeded":
      return {
        subject: "Payment received",
        html: renderEmail({
          preheader: `Receipt for $${((data?.amount ?? 0) / 100).toFixed(2)}.`,
          title: "Payment received — thank you.",
          bodyHtml: `<p>We received your payment of <strong>$${((data?.amount ?? 0) / 100).toFixed(2)} ${(data?.currency ?? "usd").toUpperCase()}</strong>.</p>
                     <p>You can manage your subscription anytime from Settings.</p>`,
          ctaLabel: "Manage billing",
          ctaUrl: "https://tryrocket.ai/settings",
        }),
      };
    case "credits_purchased":
      return {
        subject: `${data?.credits ?? 0} Rocket Credits added`,
        html: renderEmail({
          preheader: "Your credits are live.",
          title: `${data?.credits ?? 0} credits added to your account.`,
          bodyHtml: `<p>Your credit pack is on your account and ready to use.</p>`,
          ctaLabel: "Generate a Rocket",
          ctaUrl: "https://tryrocket.ai/generate",
        }),
      };
  }
}

// Helper: send via Resend directly (server-side only)
export async function sendBranded(
  resendKey: string,
  fromEmail: string,
  to: string,
  template: Template,
  data: any,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const { subject, html } = buildEmail(template, data);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: fromEmail, to: [to], subject, html }),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: JSON.stringify(json) };
    return { ok: true, id: json.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}