## Rocket /create Engine v2 — Visual-First Deliverables

This is a large additive upgrade. Before I start cutting code I want to confirm scope, sequencing, and a few decisions so we don't ship half a system. Everything below is **additive** — no existing route, table, edge function, generator, editor, export, or credit rule is removed or renamed.

---

## Guiding principle

Today every asset_type stores either `content` (markdown/JSON) or a single `image_url`. v2 introduces a **visual render layer** on top of that storage so the user never sees raw markdown/JSON in the final deliverable — they see designed pages, swatch cards, type specimens, slide thumbnails, icon grids, template canvases.

Storage stays the same. Renderers change. Editor gains structured-edit surfaces.

---

## Architecture (additive)

```text
        existing                          NEW v2 layer
   ┌──────────────────┐            ┌─────────────────────────┐
   │ generators.ts    │  content   │ assetSchemas.ts         │
   │ (already         │ ─────────▶ │ parse → typed object    │
   │  rich prompts)   │            │ (BrandGuidelines,       │
   └──────────────────┘            │  ColorSystem, FontSys,  │
                                   │  Voice, Deck, Icons,    │
                                   │  Templates, Photos…)    │
                                   └──────────┬──────────────┘
                                              │
                                   ┌──────────▼──────────────┐
                                   │ /components/visuals/*   │
                                   │ <BrandGuidelinesDoc/>   │
                                   │ <ColorSystemBoard/>     │
                                   │ <FontSpecimen/>         │
                                   │ <VoiceGuide/>           │
                                   │ <IconGrid/> <Deck/> …   │
                                   └──────────┬──────────────┘
                                              │
                                   ┌──────────▼──────────────┐
                                   │ AssetDetail / Editor    │
                                   │ render visual by type   │
                                   │ (markdown stays as      │
                                   │  fallback / "raw" tab)  │
                                   └─────────────────────────┘
```

- Generators already emit the structured content from the last pass. v2 makes that content **render visually** instead of as markdown/JSON.
- A small `assetSchemas.ts` parser normalizes generator output (markdown sections → typed object; JSON → typed object) and tolerates older assets so nothing breaks.
- Each asset_type gets a dedicated visual component. AssetDetail/Editor dispatches by `asset_type`.
- Exports plug into the existing `exporters.ts` — we add `pdf-multipage`, `pptx`, `svg-pack(zip)` per asset type, keeping current formats.

---

## Scope by asset_type (visual deliverable per type)

| asset_type          | New visual deliverable                                                                 | New export targets        |
|---------------------|----------------------------------------------------------------------------------------|---------------------------|
| brand_guidelines    | 16-page designed doc (cover + section pages), page-thumbnail gallery, per-page edit    | multi-page PDF            |
| color_system        | Swatch cards (hex/RGB/HSL/WCAG), gradient strip, light+dark UI mock, button samples    | PDF, ASE-style JSON, SVG  |
| font_system         | Specimen sheet (H1–H6 + body + caption), pairing block, weight ladder, sample para     | PDF                       |
| brand_voice         | Tone-spectrum sliders, voice-pillar cards, channel examples (web/email/social/founder) | PDF                       |
| launch_copy         | Editable copy cards (tagline/headlines/desc/CTA/SEO) in a board layout                 | PDF, MD (kept)            |
| product_hunt_copy   | PH-shaped preview cards (tagline, comments, tweet, FAQ accordion)                      | PDF                       |
| social_post         | Content-library board grouped by category, per-post platform-shaped preview cards      | PDF, CSV                  |
| founder_bio         | Profile cards per channel (X, LinkedIn, speaker, press) with copy-to-clipboard         | PDF                       |
| presentation        | Slide deck (12–14 slides) with thumbnail strip + slide canvas, uses existing slides app | PDF, PPTX                 |
| template            | Editable template canvases per channel (X / LinkedIn / IG / PH / banners / ads)        | PNG per template, PDF     |
| graphic / icon / photo | Already images. Add gallery grid, set-level cover, ZIP export of full set            | ZIP (set), SVG for icons  |

For each type the visual component reads the structured object and exposes inline edits (text, color, font, image replace) that write back to `assets.content` / `assets.meta` — same storage, richer surface.

---

## Editor (Looka-style, additive)

- New route `/editor/:assetId` is the existing Editor — extend it, don't replace it.
- Add a left **pages/items panel** (slides, brand-guideline pages, icon tiles, template variants).
- Add a right **inspector** (text, color picker, font picker, image replace).
- Inline editing on the visual component (contentEditable for copy, color-swatch click → picker).
- "Variations" button = call existing `regenerate-asset` with a section-scoped instruction.
- All edits autosave to `assets.content`/`assets.meta`. No schema changes required.

---

## What I will NOT touch

Chat, projects, auth, billing, credits, DB schema, routes for existing pages, current downloads, URL analysis, logo pipeline, classifier router, `regenerate-asset` contract, `generate-asset` orchestration/retries/concurrency.

---

## Sequencing (so we can ship + verify in chunks)

Because this is a multi-week build, I want to land it in vertical slices — each slice ships a visual deliverable + editor + export end-to-end before moving on. Suggested order (highest value first):

1. **Foundations**: `assetSchemas.ts` parser, visual dispatcher in `AssetDetail`/`Editor`, shared "designed page" primitives (Page, Section, SwatchCard, SpecimenRow, SlideThumb).
2. **Brand Guidelines** (multi-page doc + PDF export).
3. **Color System + Font System** (swatch board + specimen sheet, with editor inspectors).
4. **Presentation deck** (slide thumbnails + slide canvas + PDF/PPTX export, reusing the slides-app pattern).
5. **Icon set + Graphics + Photos** (gallery, ZIP export, SVG vectorize for icons via existing `vectorize.ts`).
6. **Templates** (editable canvases per channel).
7. **Brand Voice, Launch Copy, Product Hunt, Social, Founder** (card-board renderers + per-card copy/export).

Each slice ends with: type-check, generate one of that asset_type in preview, confirm visual render + edit + export, then move on.

---

## Technical notes (for engineers)

- New files: `src/lib/assetSchemas.ts`, `src/components/visuals/<Type>.tsx`, `src/components/editor/<Type>Inspector.tsx`, `src/lib/exporters/pdfMultipage.ts`, `src/lib/exporters/pptx.ts`, `src/lib/exporters/zipPack.ts`.
- Touched files: `src/pages/AssetDetail.tsx`, `src/pages/Editor.tsx`, `src/lib/exporters.ts` (register new formats), `src/lib/vectorize.ts` (reuse).
- No edge-function changes for slice 1–3. Slice 4+ may tweak `generators.ts` prompts to emit slightly more structured JSON for deck/icon set (still backwards compatible — old assets render via fallback).
- `pptxgenjs` will be added as a dep for slice 4.
- Raw markdown/JSON moves to a "Raw" tab in the editor (kept for power users + safety net), never the default view.

---

## Questions before I start

1. **Scope to ship now**: do you want me to land **all 7 slices** in this session (long, dense edits, higher risk), or start with slices **1–3** (foundations + Brand Guidelines + Color/Font) so you can see the new visual+editor flow end-to-end before I keep going?
2. **PPTX export**: OK to add `pptxgenjs` (~200KB client dep) so Presentation exports as a real .pptx? Otherwise I'll ship PDF-only for decks.
3. **Raw markdown/JSON view**: keep it as a hidden "Raw" tab in the editor (recommended, safest), or drop it entirely from the UI (riskier — relies fully on the new renderers)?
