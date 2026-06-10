## Goal

Stop forcing every prompt into a branding text generation. Route prompts to one of four workflows and add real image generation for visual asset requests.

## UX

### `/create` form
Below the prompt input, add a "What do you need help with?" selector with five chips:
- **Auto-detect** (default) — backend classifies intent
- **Brand It**, **Design It**, **Launch It**, **Promote It** — force a workflow

Submitting passes `workflow: "auto" | "brand" | "design" | "launch" | "promote"` to `generate-rocket`.

### `/rocket/:id` (project detail)
Header gains a workflow tab strip showing which workflow produced the project. Each workflow renders its own section groups (see below). The "Launch to…" dropdown stays. Export menu stays. A "Run another workflow on this project" button lets the user invoke a second workflow against the same rocket (e.g., started with Brand, now run Design).

## Backend: `generate-rocket`

1. **Classifier step** (when `workflow === "auto"`): one Gemini call returns `{ workflow: "brand"|"design"|"launch"|"promote" }` from prompt + optional URL context. Cheap, low-tokens, JSON schema.
2. **Dispatch** to a per-workflow asset plan:
   - `brand` → current Positioning + Audience + Founder sections (subset of today's plan)
   - `design` → Logo Concepts, Style Direction, Color Palette, Typography Notes, Image Prompts (text), plus N generated images
   - `launch` → Launch Submission, Product Hunt Copy, Directory Copy, Founder Story, Pre/Day/Post Checklists, Strategy
   - `promote` → X Thread, LinkedIn Post, Reddit Post, Influencer Outreach, PR Pitch, Creator Campaign brief
3. Single Gemini structured-output call per workflow (same pattern as today). Returns text assets keyed by `asset_type`.
4. **Design workflow image generation**: after text generation, call AI Gateway `/v1/images/generations` for each `image_prompt_*` asset (default 3 logo concepts). Upload PNG bytes to a Supabase Storage bucket `rocket-assets/<user_id>/<rocket_id>/<asset_id>.png`. Store the public URL on the asset row.

### DB changes
- `rockets.workflow text not null default 'brand'`
- `rocket_assets.kind text not null default 'text'` — `'text' | 'image'`
- `rocket_assets.image_url text`, `image_prompt text`
- Storage bucket `rocket-assets` (public read, owner write)

Credit cost: text workflow = 1 credit (today). Design workflow = 1 credit text + 1 credit per image (3 images default = 4 total). Surface this clearly on the form.

## UI: section rendering

Asset cards stay markdown/textarea for text. New `ImageAssetCard` for `kind === 'image'`:
- Shows the generated PNG
- "Regenerate", "Generate variation" (uses same prompt + slight tweak), "Download PNG", "Copy prompt"
- **SVG download deferred** — image models output raster only. True SVG requires vectorization (potrace) which adds complexity; not in this scope. Document as a follow-up.

## Files

- `supabase/functions/generate-rocket/index.ts` — add classifier + workflow dispatch + per-workflow asset plans + image gen loop
- `supabase/functions/regenerate-asset/index.ts` — branch on `kind`; for images, regenerate via images endpoint with same/varied prompt
- `supabase/functions/_shared/workflows.ts` (new) — asset plans + prompt templates per workflow
- `supabase/migrations/<ts>_workflows.sql` (new) — schema + storage bucket + policies
- `src/pages/Generate.tsx` — workflow chips, pass `workflow` to function
- `src/pages/RocketDetail.tsx` — workflow-aware GROUPS, ImageAssetCard, "Run another workflow" button
- `src/components/ImageAssetCard.tsx` (new)

## Out of scope (call-outs)

- **True SVG export** — requires vectorization library; will provide PNG only for v1
- **Hero/social/ad/thumbnail templates** — v1 Design workflow ships Logo + generic image prompts; specialized templates (16:9 hero, 1200×630 OG, YouTube thumbnail) added next iteration
- **Per-user OAuth Drive upload of images** — existing Drive export already handles project ZIP; same path will pick up new image assets automatically

## Open questions (need answers before I build)

1. **Default image count for Design workflow** — 3 logo concepts (4 credits total) or 1 (2 credits)?
2. **Auto-detect on/off** — should the chip default be "Auto-detect" or force the user to pick a workflow each time?
3. **Existing projects** — backfill `workflow='brand'` for every existing rocket so the UI renders them, correct?
