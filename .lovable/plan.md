
# Rocket Polish & Expansion Plan

Big scope — breaking into clear phases. I'll ship in this order, committing each phase.

## Phase 1 — Branding pass (global)
- Swap header logo (Index, AppShell, footer, Login, Signup, Join) to `rocket-logo-white.png` on dark chip, or use the colored rocket asset directly.
- Add design tokens in `index.css` + `tailwind.config.ts`:
  - `--brand: 217 91% 60%` (the screenshot blue ~ `#3B82F6`)
  - `--brand-foreground: 0 0% 100%`
  - radius `0.75rem` on primary CTA
- Update `Button` `default` variant → brand blue, `rounded-full`, subtle shadow. Replace all `bg-neutral-900` CTA buttons across landing/auth/app to use the new `<Button>` or matching classes.
- Homepage: H1 → "Make Your Product a Brand.", sub → "Rocket helps you brand your app with AI."
- `/join` same sub-headline change.

## Phase 2 — Homepage additions
- FAQ accordion section below pricing (8 Qs).
- Footer redesign (multi-column like trymedia.ai) with: Product, Free Tools, Resources, Company, Social. Include X / Instagram / Discord / TryLaunch / contact.
- Inject Crisp widget into `index.html` head.

## Phase 3 — New static pages & routes
- `/about` — story + team placeholder.
- `/blog` — index listing 15 articles (MDX-free, plain TSX data file `src/content/articles.ts`).
- `/blog/:slug` — article detail.
- `/media-kit` — both logos, brand colors, usage rules, download links.
- `/tools` — index of 15 free tools.
- `/tools/:slug` — each tool page (calls `free-tool` edge function w/ OpenAI).
- Footer + nav links wired up.

### 15 Free tools
1. tagline-generator  
2. value-prop-generator  
3. brand-name-generator  
4. positioning-statement-generator  
5. elevator-pitch-generator  
6. product-hunt-tagline  
7. twitter-bio-generator  
8. linkedin-headline-generator  
9. mission-statement-generator  
10. slogan-generator  
11. about-us-generator  
12. feature-benefit-rewriter  
13. cold-email-generator  
14. landing-headline-generator  
15. domain-name-ideas

### 15 Articles (titles)
Launch playbooks, positioning, PMF, distribution, indie hacker tactics, etc. Stored in `src/content/articles.ts` w/ markdown body rendered via `react-markdown`.

## Phase 4 — Branded Resend emails (auto-fire)
- Rewrite `send-email/index.ts` HTML templates with shared layout: white bg, rocket logo at top (hosted on tryrocket.ai), brand-blue CTA button, footer.
- Templates: `welcome`, `rocket_generated`, `trial_started`, `payment_succeeded`, `credits_purchased`, `rocket_shared`.
- Wire auto-fire:
  - `welcome` → after signup success in `Signup.tsx`
  - `rocket_generated` → at end of `generate-rocket` edge function (server-side fetch to Resend directly, since edge→edge auth is awkward; inline the send)
  - `trial_started` + `payment_succeeded` + `credits_purchased` → in `stripe-webhook` handlers
- Set `EMAIL_FROM` to `Rocket <hello@tryrocket.ai>`.

## Phase 5 — Polish RocketDetail
- Section "Copy" buttons per block.
- "Export Markdown" + "Export PDF" (html2pdf.js) buttons in header.
- Drag-to-reorder sections (dnd-kit) — persisted in `rocket.section_order` JSONB.
- Improve typography + cards using brand tokens.

## Phase 6 — Multi-directory handoff
Replace single TryLaunch button with a "Launch to" dropdown containing:
- G2, Product Hunt, There's An AI For That, Hacker News, Peerlist, BetaList, Uneed, Alternative.me, Indie Hackers
Each opens a new tab to the directory's submit URL with pre-filled query params where supported (PH supports `?name=&tagline=&url=`; others just deep-link to submit page). Also keep "Launch on TryLaunch" primary.

## Technical notes
- No Lovable Cloud — all backend via your Supabase project + edge functions.
- New edge function `free-tool` (single endpoint, switches on `tool` param) calling OpenAI; rate-limited by IP in a `free_tool_usage` table (new migration).
- New migration adds `section_order JSONB` to `rockets` + `free_tool_usage` table.
- New deps: `react-markdown`, `remark-gfm`, `@dnd-kit/core`, `@dnd-kit/sortable`, `html2pdf.js`.
- All buttons route through updated `<Button>` for consistency.

## What I'll deliver in this single pass
Phases 1–6 in one go. After I'm done you'll need to:
1. Run the new SQL migration in Supabase.
2. Redeploy edge functions: `send-email`, `generate-rocket`, `stripe-webhook`, `free-tool` (new).
3. Add the `hello@tryrocket.ai` sender domain in Resend if not done.

Confirm and I'll start shipping.
