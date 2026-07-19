# Finish: Workspace Isolation, Pro Gating, Trash Polish

## 1) Workspace Data Isolation

### Migration
Add `workspace_id uuid references workspaces(id) on delete cascade` to:
- `assets`
- `projects`
- `folders`
- `chats` (and/or `messages` if scoped per-chat only, chats sufficient)
- `notifications`
- `uploads` (if separate; otherwise covered by assets)

Steps per table:
1. `ALTER TABLE ... ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;`
2. Backfill: for each row, set `workspace_id` to the user's personal workspace (lookup by `user_id` → `workspace_members` where role='owner' and workspace type='personal', fallback to first membership).
3. `ALTER TABLE ... ALTER COLUMN workspace_id SET NOT NULL;`
4. `CREATE INDEX ... ON (workspace_id);`
5. Replace RLS SELECT/INSERT/UPDATE/DELETE policies to require `workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())` via a `public.is_workspace_member(_ws uuid)` SECURITY DEFINER function to avoid recursion.
6. Re-issue GRANTs (unchanged set).

### Frontend
- Add `useActiveWorkspaceId()` helper (already exists as `ensureActiveWorkspaceId`). Ensure every query calls `.eq("workspace_id", ws)`.
- Files to patch (based on prior work): `Dashboard.tsx`, `Designs.tsx` (or `Projects.tsx`), `Assets.tsx`, `SavedLogos.tsx`, `Trash.tsx`, `ProjectDetail.tsx`, `Generate.tsx` (chats + messages), `ChatsSidebar.tsx`, `NotificationsBell.tsx`, `Brand.tsx`, `Templates.tsx` save paths, `HomeHub.tsx` recents.
- All inserts already pass `workspace_id`; audit and add where missing.
- Subscribe to `workspace:changed` custom event → refetch lists.

## 2) Pro-only Workspace Gating

### Backend
- Edge function `get-subscription` (existing Stripe): return `{ plan: "free" | "pro" | "business" }`.
- New helper `useSubscription()` hook caches for session.

### UI
- `WorkspaceSwitcher.tsx`: disable "Create workspace" and "Invite members" when `plan === "free"`. Show lock icon + tooltip "Pro plan required" linking to `/pricing`.
- `Pricing.tsx` + `Index.tsx` marketing: move "Workspaces & multi-seat" bullet from Free → Pro column; FAQ update.
- Server-side guard: RLS on `workspaces` insert requires `has_pro_plan(auth.uid())` SECURITY DEFINER function that reads `subscriptions` table.

## 3) Trash Polish

`Trash.tsx`:
- Multi-select rows (checkbox + shift-click range).
- Bulk **Restore** and bulk **Delete forever** buttons in a sticky action bar.
- **Empty trash** button opens AlertDialog confirming permanent deletion of all items >0.
- Show "Auto-deletes in N days" per row based on `deleted_at + 30d`.

### Auto-purge
- Migration: add `pg_cron` job (or scheduled edge function) `purge-trash` that runs daily:
  ```sql
  DELETE FROM assets WHERE deleted_at < now() - interval '30 days';
  DELETE FROM projects WHERE deleted_at < now() - interval '30 days';
  ```
- If pg_cron unavailable, create Supabase scheduled edge function `purge-trash` with daily schedule.

## Technical notes
- Use one migration file per concern (isolation, pro-guard) to keep review sane.
- All new SECURITY DEFINER functions get `SET search_path = public`.
- Grant statements included for every altered table (existing grants persist through ADD COLUMN, but re-verify).
- Frontend query audit uses ripgrep: `rg "from\\(\"(assets|projects|folders|chats|notifications)\"\\)" src/` and confirm each call chains `.eq("workspace_id", ...)`.

## Out of scope (ask before doing)
- Migrating existing production rows where users have multiple workspaces (backfill assumes personal).
- Cross-workspace move/copy UI.
- Per-seat billing meter.
