## Goal

Make every Rocket generation feel like a full agency deliverable instead of a short AI snippet. Nothing existing is removed — every change is additive in `supabase/functions/_shared/generators.ts` (prompts) and the editor/renderers that already display these asset types.

## Out of scope (explicit)

- No changes to: chat shell, projects, auth, billing, DB schema, routes, downloads, URL analysis, logo generation pipeline, regenerate flow, classifier router.
- No new asset_types — we re-use existing slugs so the editor, exports, projects, and downloads keep working as-is.

## Scope by asset

All text assets switch to a **structured, multi-section markdown deliverable** with the sections the user listed. The editor already renders markdown for these, so output stays editable.

1. **brand_guidelines** — full 16-section doc: Overview, Mission, Vision, Positioning, Audience, 2-3 Customer Personas, Personality, Values, Voice & Tone, Messaging Framework, Tagline Options, Elevator Pitch, Do's/Don'ts, Website/Social/Launch messaging examples.
2. **color_system** — JSON expanded to: primary, secondary, accent, success, warning, danger, full neutral_50…neutral_900 scale, 2-3 gradient suggestions, light-mode + dark-mode example mappings, accessibility notes, usage recommendations. (Existing renderer reads `primary/secondary/accent` — extra fields render as additional swatches; no schema break.)
3. **font_system** — JSON expanded to: display, heading, body, monospace fonts, full H1–H6 + body + small type scale (px + line-height), pair rationale, usage guidance, sample headline + body copy.
4. **brand_voice** — full copywriting guide: 4 Voice Pillars (description, why-it-fits, example), What We Say / Don't Say, and example copy for website, social, launch, email.
5. **launch_copy** — full launch package: tagline, one-liner, short/medium/long descriptions, website hero, 3 CTA variations, launch announcement, SEO title, SEO description.
6. **product_hunt_copy** — full PH package: tagline, short + full description, first comment, maker comment, launch tweet, FAQ (5 Q&A), 3 community-reply templates.
7. **social_post** (when count>1 or "content library" requested) — 50-post library organized: 10 launch / 10 founder / 10 educational / 10 growth / 5 announcements / 5 threads, each labeled with platform.
8. **founder_bio** — JSON expanded: x_bio, linkedin_headline, linkedin_about, short/medium/long bio, speaker bio, press bio.
9. **presentation** — full deck system. Prompt accepts deck type (pitch/investor/product/sales/media — inferred from user prompt, defaults to pitch). For each: slide structure, slide titles, recommended content per slide, visual guidance, layout notes.
10. **template** — expanded library covering Social (X, LinkedIn post, LinkedIn carousel, Instagram post, Instagram story, Threads), Launch (PH gallery, launch graphic, waitlist, changelog), Marketing (ads, newsletter banner, blog banner, sponsorship). Each rendered as an editable markdown template block.

Image-heavy categories (already multi-variant via the gallery pipeline — keep that, just enrich prompts):

11. **graphic** — when user asks for "graphics" / no specifier, fan out across hero, launch, background pattern, abstract illustration, product showcase, social. Single-graphic requests unchanged.
12. **icon** — when user asks for an "icon pack" / "icons", fan out to a consistent set (outline + filled variants + app icon concepts) using current concurrency. Single-icon requests unchanged. Cap honored.
13. **photo** — prepend a Photography Style Guide (lighting, composition, color grading, art direction) as the first asset, then generate example shots matching that guide.

## Technical details

All changes live in `supabase/functions/_shared/generators.ts`:

- Rewrite each `build()` to emit the expanded prompt above.
- For `color_system` / `font_system` / `founder_bio`, add new JSON keys but keep existing keys so the current editor renderer is backwards-compatible. Add a fallback in the renderer files only if a key is missing (defensive, no visual change for old data).
- For `graphic` / `icon` / `photo`, when the classifier returns count>1, inject category-rotation into the per-variant prompt (variant index → category) so the gallery shows a coherent set instead of 24 of the same thing.
- For `presentation`, parse deck-type keywords from the user prompt inside `build()` and adapt the outline accordingly.

No changes to:
- `supabase/functions/generate-asset/index.ts` (orchestration, retries, concurrency from last fix all preserved)
- `supabase/functions/regenerate-asset/index.ts`
- `_shared/workflows.ts`
- Editor routes/components — they already render markdown + JSON for these asset_types.

## Editor integration

The user's "Editor Integration" section (edit text/colors/fonts/logos/screenshots/layouts without regenerating) is already the existing Editor flow for every asset_type — these prompt expansions stay compatible with it. No editor rewrites in this pass. If the user wants the editor itself extended (e.g. a richer color-swatch editor for the new neutral scale), that's a follow-up.

## Verification

- After edits, deploy the edge function and run one generation per asset_type via the existing Generate page to confirm: (a) the function returns 200, (b) the editor renders the longer output without layout breakage, (c) JSON-shaped assets still parse.
- No DB migrations, no new env vars, no new dependencies.

## Risk

Low. All edits are prompt-string changes plus optional renderer fallbacks. Worst case: a section renders as plain markdown instead of a custom widget — still useful, still editable, still exportable.
