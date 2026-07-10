# Backend migrations pass

Six migrations, sequenced smallest → largest so each ships independently and you can stop at any point. Every new `public` table gets explicit GRANTs + RLS + policies. All role checks use the existing `has_role()` security-definer pattern.

## Recommended order

1. Trash & restore (low risk, high user value)
2. Server-side gallery likes (replaces localStorage — cheap win)
3. Share-link password protection
4. Comments on assets (+ realtime)
5. Referral credits
6. Workspaces / multi-seat (biggest — ship last, own PR)

I'll do 1–5 in one pass. Workspaces gets its own pass afterward because it touches nearly every existing table (project ownership moves from `user_id` → `workspace_id`).

---

## 1. Trash & restore

- Add `deleted_at timestamptz` to `assets` and `projects`.
- Update RLS `SELECT` policies to filter `deleted_at IS NULL` by default; add a separate policy allowing owners to read their own trashed rows.
- Frontend: soft-delete instead of hard-delete in `Assets.tsx` / `ProjectDetail.tsx`, new `/trash` route with Restore + Delete forever, 30-day auto-purge via a scheduled edge function (`purge-trash`, runs daily).

## 2. Server-side gallery likes

- New `public.gallery_likes (id, asset_id, user_id, created_at)` with unique `(asset_id, user_id)`.
- GRANTs: `SELECT` to anon (public counts), `INSERT/DELETE` to authenticated (own rows only).
- RLS: anyone reads, users write/delete their own.
- `like_count` computed via view or `count()` on read; migrate `Gallery.tsx` off localStorage.

## 3. Share-link password protection

- New `public.share_tokens (id, asset_id, token, password_hash nullable, expires_at nullable, created_by, created_at)`.
- GRANTs: `SELECT` to anon (token lookup by exact match), full CRUD to owner via RLS.
- New edge function `verify-share-token` checks password (bcrypt) and returns a short-lived signed cookie/JWT. Public share route requires it when `password_hash` is set.

## 4. Comments on assets

- New `public.asset_comments (id, asset_id, user_id, body, parent_id nullable, created_at, updated_at, deleted_at)`.
- GRANTs standard authenticated; RLS: read if you can read the parent asset (via `has_asset_access()` security-definer), write your own.
- Enable Realtime on the table; frontend adds a comments panel on `AssetDetail.tsx`.

## 5. Referral credits

- New `public.referral_codes (code PK, owner_user_id, created_at)` and `public.referral_events (id, code, referred_user_id, credited_amount, created_at)`.
- Trigger on `auth.users` insert: if `raw_user_meta_data->>'ref'` matches an active code, insert a `referral_events` row and add credits to both users via existing credit-ledger insert.
- Frontend: settings page shows the user's code + share link + count of successful referrals.

## 6. Workspaces / multi-seat (SEPARATE PASS)

Large. Rough shape:
- `workspaces`, `workspace_members (workspace_id, user_id, role)`, `workspace_invites`.
- Add `workspace_id` to `projects`, `assets`, `credits_ledger`; backfill each user's rows into a personal workspace.
- New `has_workspace_role()` security-definer; rewrite every project/asset RLS policy against it.
- Invite flow via edge function + email.
- UI: workspace switcher in header, members page, seat billing on Pricing.

I'll present a follow-up plan for this once 1–5 are merged.

---

## Technical notes

- All migrations follow the required order: `CREATE TABLE` → `GRANT` → `ENABLE RLS` → `CREATE POLICY`.
- No policy references its own table (avoids infinite recursion); cross-table checks go through `SECURITY DEFINER` functions like the existing `has_role`.
- Passwords for share tokens hashed with `crypt()` / `pgcrypto` (already enabled by Supabase) so verification can happen in an edge function without exposing hashes to clients.
- Referral credit grants use the same ledger insert path Stripe webhooks use, so balances stay consistent.

## What I need from you

- OK to proceed with steps 1–5 in this pass.
- Confirm the referral bonus amount (default I'll use: **100 credits to referred user on signup, 100 to referrer on referred user's first paid purchase**). Tell me if you want different numbers.
