# Rocket V1 Build Plan

## Part 1 — Move waitlist to /join (quick)
- Current homepage (video bg, "Rocket" headline, waitlist form, audio) → move verbatim to `/join`.
- `Index.tsx` becomes the new marketing homepage.

## Part 2 — New Homepage (`/`)
- White-first, Apple/Linear/Stripe-inspired, Inter, large type, soft gradients, rounded cards.
- Hero: "Vibe Code Your Idea." + "AI made building easy. Rocket helps you launch." + CTAs "Generate Rocket" / "View Example".
- Sections: How it works, Outputs preview, Pricing, Footer.

## Part 3 — Auth (Supabase)
- Lovable Cloud already wired. Add Email + Google login pages (`/login`, `/signup`).
- `users_profile` table + trigger on signup.
- Protected routes for app shell.

## Part 4 — Database (Supabase migration)
Tables with RLS: `users_profile`, `rockets`, `rocket_assets`, `subscriptions`, `user_usage`, `payments`. Users see only their own rows. Includes GRANTs.

## Part 5 — Credit System
- On signup: Free plan, 500 credits/month.
- Server-side decrement via edge function before each AI call.
- Display in navbar/dashboard/settings.

## Part 6 — Generate Flow
- `/generate`: URL input → loading messages → calls `generate-rocket` edge function.
- Edge function: fetch URL (Firecrawl connector), extract text, call OpenAI, persist `rockets` + `rocket_assets`.
- Redirect to `/rocket/:id`.

## Part 7 — Rocket Page (`/rocket/:id`)
- Cards per asset type (positioning, audience, founder, launch copy, social, strategy, checklist).
- Each card: Copy / Edit / Save / Regenerate (regen costs 1 credit).
- "Launch on TryLaunch.ai" CTA.

## Part 8 — Dashboard (`/dashboard`)
- Rockets list, credits remaining (progress bar), subscription status, billing link, open rocket.

## Part 9 — Stripe (BYOK)
- Edge functions: `create-checkout`, `customer-portal`, `stripe-webhook`.
- Products: Growth $20/mo (7-day trial), Credit Packs $5/$10/$25.
- Webhook handles: checkout.session.completed, subscription.*, invoice.payment_*.
- Updates `subscriptions`, `user_usage`, `payments`.

## Part 10 — Email (Resend connector)
- Edge function `send-email` w/ templates: welcome, rocket generated, trial started, payment successful, credits purchased.

## Part 11 — Analytics
- GA4 via `VITE_GA_ID` in `index.html`. Track listed events.

---

## Secrets needed
- `OPENAI_API_KEY` (user-provided)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (user-provided)
- `VITE_STRIPE_PUBLISHABLE_KEY` (publishable, in code/env)
- `RESEND_API_KEY` (via Resend connector) OR Lovable Emails
- `VITE_GA_ID`
Supabase URL/keys already configured via Lovable Cloud.

## Open questions before I build
1. **Scope of first pass**: This is ~2-3 days of work in one shot. Want me to ship it all in one go, or stage it (auth + DB + generate flow first; Stripe + email + dashboard polish second)?
2. **Stripe**: Use Lovable's built-in Stripe Payments (no API key needed, recommended) or BYOK with your existing Stripe account? Trial + credit packs both supported either way.
3. **Email**: Use Lovable Emails (built-in, requires email domain setup on tryrocket.ai) or Resend connector?
4. **OpenAI vs Lovable AI Gateway**: You specified OpenAI. Lovable AI Gateway (Gemini) is included in your plan with no key needed — fine to use, or strictly OpenAI?
5. **Site scraping**: OK to use Firecrawl connector (recommended) for fetching product URLs?
6. **Google Analytics ID**: Do you have one yet?

Answer those and I'll execute.
