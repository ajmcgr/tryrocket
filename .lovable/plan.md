
# Rocket V4 — UX & Product Architecture Upgrade

Additive evolution on top of the current codebase. No routes removed, no DB tables changed destructively, no API contract broken. Everything below layers on existing surfaces.

## Guiding rules (applied to every change)
- Preserve: auth, billing, credits, projects, assets, editor, URL analysis, logo gen, asset gen, sharing, export, existing routes, existing schemas.
- Language shift only in UI copy: "Results" → "Current Deliverable", "Generated Assets" → "Deliverables", "AI Output" → "Creative Direction".
- Left prompt panel stays. Chat stays attached to the active project.
- LLM keeps returning structured data; Rocket renders the visual (already true — extend, don't rewrite).

---

## Phase 1 — Studio Layout (biggest visible change, lowest risk)

New three-pane layout used by `/create` and a new `/studio/:projectId` view. Old `/create` behavior kept as default when no project is active.

```text
┌────────────┬──────────────────────────────┬────────────┐
│ Left       │ Center                       │ Right      │
│ Conversat. │ BrandContextStrip            │ Properties │
│ History    │ ─────────────────            │ Layers     │
│ Pinned     │ CurrentDeliverable (large)   │ Export     │
│ Uploads    │ VariationStrip (filmstrip)   │ Settings   │
│ Prompt     │ RelatedAssets (family)       │            │
└────────────┴──────────────────────────────┴────────────┘
```

Files (new):
- `src/components/studio/StudioLayout.tsx` — 3-pane shell, responsive collapse to current single-column on mobile.
- `src/components/studio/CurrentDeliverable.tsx` — wraps existing `AssetVisual` at large size + action bar (Open in Editor, Download, Export, Duplicate, Version History, Create Variation, Save).
- `src/components/studio/VariationStrip.tsx` — horizontal filmstrip of sibling assets (reuses sibling query already in `AssetDetail.tsx`). Click swaps `CurrentDeliverable`.
- `src/components/studio/RelatedAssetsRail.tsx` — grouped by category (Brand / Social / Launch / Marketing / Presentations / Website).
- `src/components/studio/RightInspector.tsx` — thin wrapper that shows Properties/Layers/Export tabs; when the asset is a canvas asset, delegates to existing editor panels.

Files (touched, additively):
- `src/pages/Generate.tsx` — mount inside `StudioLayout` when `?project=<id>` is present; unchanged otherwise.
- `src/components/AppShell.tsx` — no structural change; sidebar routes list already includes `/create`.

## Phase 2 — Persistent Brand Context

Brand Context already exists per-asset (`asset.meta.brand_context`) and is rendered by `BrandContextStrip`. Promote it to project scope.

- Add `src/lib/brandContext.ts`: `getProjectBrandContext(projectId)` and `setProjectBrandContext(projectId, ctx)` that read/write `projects.meta.brand_context` (json column already present — additive key).
- On any new generation inside a project, merge project context into the request payload (already partially wired; make it authoritative).
- `BrandContextStrip` gets a `scope="project"` variant pinned above `CurrentDeliverable`.
- Refresh button reuses the existing `scrape-url` edge function.

No migration required — uses the existing `meta jsonb` column.

## Phase 3 — Conversational refinement bound to project

Chat already persists per session in `Generate.tsx`. Bind it to project.

- Persist chat turns in `localStorage` keyed by `rocket:chat:<projectId>` (fallback to `rocket:chat:global`).
- Left panel gets: New Chat, Pinned toggle per thread, Uploads (existing upload path), Prompt (existing composer).
- Refinement prompts ("make icon smaller", "generate favicon", "dark version") route to the existing `regenerate-asset` / `rewrite-field` edge functions with the currently-selected `CurrentDeliverable` as target.
- No new backend.

## Phase 4 — Asset Family & Variation semantics

Assets already have `parent_id` / `family_id` fields in meta. Formalize:

- `src/lib/assetFamily.ts`: `getSiblings(assetId)`, `getFamily(rootId)`, `createVariation(assetId, overrides)`.
- "Create Variation" in `CurrentDeliverable` calls `regenerate-asset` with `mode: "variation"` and links `parent_id`.
- `VariationStrip` queries siblings; selecting one updates the URL `?asset=<id>` so refresh restores state.

## Phase 5 — Category grouping in Projects

- `src/pages/ProjectDetail.tsx`: group asset list by `meta.category` (Brand / Social / Launch / Marketing / Presentations / Website / Press). Fallback bucket "Other" for legacy assets. Ordering by category, not creation date.
- Add lightweight category chip picker on each asset card (updates `meta.category` inline via existing update path).

## Phase 6 — Copy & chrome polish

- Replace strings across `Generate.tsx`, `ProjectDetail.tsx`, `AssetDetail.tsx`, `Assets.tsx`: "Results"→"Current Deliverable", "Generated"→"Deliverable", "AI Output"→"Creative Direction".
- Increase preview sizes in center pane; reduce surrounding chrome padding.
- Keep existing motion; no new animation library.

## Phase 7 — "Create complete brand" macro (stretch)

- Add one button in Studio: "Generate full brand system" → sequentially triggers existing edge functions in this order: logo → logotype → color system → typography → icons → brand guidelines → social kit → launch kit → press kit → pitch deck.
- Uses `generate-asset` with the project's Brand Context. Each result appears in `RelatedAssetsRail` under its category as it completes.
- Progress shown in the left panel's "Generation progress" area.

---

## What is explicitly NOT changing
- No DB migrations (all new data goes into existing `meta jsonb` columns).
- No edge function contract changes (only new call sites).
- No route removals. `/create`, `/editor`, `/projects`, `/assets`, share/export routes all remain.
- No visual identity change (brand blue `#1676e3` stays).
- No auth/billing/credits touch.

## Rollout order (each shippable independently)
1. Studio layout scaffold + mount inside `/create` when `?project=` present.
2. Persistent project Brand Context + strip.
3. Current Deliverable + Variation Strip wired to existing sibling logic.
4. Project-scoped chat history.
5. Category grouping in ProjectDetail.
6. Copy polish pass.
7. Full-brand macro (stretch, only if credits allow).

## Credit-awareness note
User has ~58 credits remaining. Phases 1–5 are pure frontend refactor (no AI calls). Phase 7 is the only credit-consuming addition and is guarded behind explicit user click.
