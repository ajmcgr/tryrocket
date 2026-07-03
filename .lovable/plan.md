# Asset Engine Refactor — Slice 2 of Rocket V3

**Goal:** Every asset that Rocket generates opens as a **finished visual deliverable**, not a wall of markdown or a raw JSON dump. Content stays in `assets.content` / `assets.meta` — the *render + edit + export* layer becomes proper per-type surfaces.

This is purely additive. Nothing existing is removed:
- Auth, billing, credits, DB, projects, sharing, URL analysis, logo pipeline, `regenerate-asset` contract, existing routes — all preserved.
- Every current asset (old markdown, old JSON, old image_url) keeps working via fallback.

---

## What's already in place (don't rebuild)

- `src/lib/assetSchemas.ts` — parser for all 12 asset types
- `src/components/visuals/AssetVisual.tsx` — visual renderers for color_system, font_system, brand_guidelines, brand_voice, launch_copy, product_hunt, social_post, founder_bio, presentation, template
- Generators in `supabase/functions/_shared/generators.ts` already emit strict JSON per type
- `AssetDetail` already dispatches to `AssetVisual` when a renderer exists (raw view hidden behind "Show source")

## Where it still falls short (fix in this slice)

1. **Generate page** shows a raw markdown/JSON preview card in the results panel, not the finished visual. First impression = "AI text" instead of "designed deliverable."
2. **Editor** (`/editor?id=…`) still opens a plain textarea for non-image assets. No inline inspector, no per-section edit surface, no structured save-back.
3. **Image-set assets** (icon, graphic, photo when multiple were generated in one asset) render as a single hero image with no gallery / grid / ZIP export.
4. **Brand context card** on Generate is siloed — the newly-analyzed Brand Intelligence isn't reused as a *header* on each asset the way the user expects.
5. **Empty / partial JSON** from older generations falls straight through to the raw view. Needs a graceful "regenerate as structured" affordance.

---

## Scope of this slice

### 1. Generate page — visual results
- Swap the raw content preview in `src/pages/Generate.tsx` for `<AssetVisual asset={...} />` for every non-image asset.
- Image assets: show the image (unchanged).
- Preserve everything else (progress, credit counter, retry, save-to-project, chat).

### 2. Editor — structured surfaces per type
- `src/pages/Editor.tsx`: when `hasVisualRenderer(asset)` is true, render `<AssetVisual>` as the main canvas and add a right-hand **Inspector** panel:
  - **color_system**: color pickers for primary/secondary/accent/semantic, neutrals slider, gradient editor. Writes back to `assets.content` (JSON).
  - **font_system**: font-family select (Google Fonts curated list from `LOGOTYPE_FONTS` reused), weight, scale sliders.
  - **brand_voice / launch_copy / product_hunt_copy / founder_bio / social_post**: per-card inline `contentEditable` text with autosave (debounced 800ms).
  - **brand_guidelines / presentation / template**: per-page/slide/variant left-hand navigator + inline editable body.
- Autosave all edits to `assets.content` (stringified JSON) and mirror the parsed form in `assets.meta.parsed` for fast reload.
- Existing plain textarea remains available as a "Raw" tab (safety net).

### 3. Image-set gallery
- Add `<ImageSetGrid>` visual for `graphic`, `icon`, `photo` assets where `meta.images: string[]` has 2+ entries (already how the generator returns batches).
- Grid + hover-zoom + per-image download + "Download all (ZIP)" using existing `src/lib/exporters/zipPack.ts`.
- Vectorize-to-SVG button per icon (reuses `src/lib/vectorize.ts`).

### 4. Brand Context header on every asset
- Add a compact `<BrandContextStrip>` at the top of `AssetDetail` and `Editor` when `asset.meta.brand_context` exists (product name, favicon, primary color chip, tone). Reinforces "this asset belongs to your brand," not to a generic prompt.

### 5. "Rebuild as visual" affordance
- When a parsed asset is missing required fields (older assets, half-broken JSON), show a single button: *"Regenerate as structured deliverable"* — calls existing `regenerate-asset` with a `structured=true` hint. No credit loop, no schema change.

---

## Files touched (additive)

**New**
- `src/components/visuals/ImageSetGrid.tsx`
- `src/components/visuals/BrandContextStrip.tsx`
- `src/components/editor/Inspector.tsx` (dispatch)
- `src/components/editor/inspectors/ColorInspector.tsx`
- `src/components/editor/inspectors/FontInspector.tsx`
- `src/components/editor/inspectors/CopyInspector.tsx` (voice/launch/PH/founder/social)
- `src/components/editor/inspectors/PagesInspector.tsx` (guidelines/deck/template)
- `src/lib/assetAutosave.ts` (debounced writer, versions snapshot before major edits)

**Edited**
- `src/pages/Generate.tsx` — render `<AssetVisual>` in results
- `src/pages/Editor.tsx` — dispatch to Inspector when visual renderer exists; keep textarea as Raw tab
- `src/pages/AssetDetail.tsx` — add `<BrandContextStrip>`, add "Regenerate as structured" fallback
- `src/components/visuals/AssetVisual.tsx` — register `ImageSetGrid`; export `parsedForAsset()` helper for editors
- `src/lib/exporters.ts` — no new formats; wire `zipPack.ts` into gallery export button

**Not touched**
- `supabase/functions/**` — no generator or DB change needed. Generators already emit the right shape.
- Routes, auth, billing, credits, DB schema — all untouched.

---

## Non-goals for this slice

- Slide-canvas editor with drag/drop shapes (that's the **Presentation** slice, next).
- PPTX layout regeneration (`pptx.ts` already ships).
- New asset types.
- Any prompt/generator rewrite.

---

## Risk & rollout

- All new surfaces are gated on `hasVisualRenderer(asset)` — assets that don't parse fall back to today's behavior.
- Autosave writes go through the existing versions snapshot flow — no data loss risk.
- Ship in one PR, verified per asset type by generating one sample each in preview and confirming: visual render ✓ inline edit ✓ save round-trips ✓ export unchanged ✓.

---

## Open questions

1. **Inspector layout**: right-hand panel (Looka-style, my default), or top toolbar (simpler on mobile)?
2. **Autosave vs explicit Save**: I want to default to debounced autosave with a versions snapshot on every 5th change. OK, or would you prefer an explicit Save button like the Logotype editor?
3. **Order of implementation** if this is too much for one pass: (a) Generate results → (b) Editor inspectors → (c) Image-set gallery → (d) BrandContextStrip → (e) Regenerate fallback. Ship (a)+(b) first if you want faster feedback.

Reply with answers (or "go — all of it, autosave, right panel") and I'll start.
