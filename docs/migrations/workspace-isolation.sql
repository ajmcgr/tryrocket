-- ============================================================================
-- Workspace Isolation + Pro Gating + Trash Auto-Purge
-- Run in Supabase SQL editor (or via `supabase db execute`). Idempotent.
-- ============================================================================

-- 1) Add workspace_id to core tables that currently lack it -------------------
ALTER TABLE public.assets       ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.projects     ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.chats        ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;
-- folders already has workspace_id per 20260713170000_design_folders.sql

CREATE INDEX IF NOT EXISTS assets_workspace_idx        ON public.assets(workspace_id);
CREATE INDEX IF NOT EXISTS projects_workspace_idx      ON public.projects(workspace_id);
CREATE INDEX IF NOT EXISTS chats_workspace_idx         ON public.chats(workspace_id);
CREATE INDEX IF NOT EXISTS notifications_workspace_idx ON public.notifications(workspace_id);

-- 2) Backfill existing rows into each user's personal workspace --------------
-- Assumes personal workspaces exist; if not, create them first.
INSERT INTO public.workspaces (id, name, owner_id)
SELECT gen_random_uuid(), 'Personal', u.id
FROM auth.users u
LEFT JOIN public.workspace_members m ON m.user_id = u.id
WHERE m.user_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.workspace_members (workspace_id, user_id, role)
SELECT w.id, w.owner_id, 'owner'
FROM public.workspaces w
LEFT JOIN public.workspace_members m ON m.workspace_id = w.id AND m.user_id = w.owner_id
WHERE m.user_id IS NULL
ON CONFLICT DO NOTHING;

WITH primary_ws AS (
  SELECT DISTINCT ON (owner_id) owner_id AS user_id, id AS workspace_id
  FROM public.workspaces
  ORDER BY owner_id, created_at ASC
)
UPDATE public.assets a SET workspace_id = p.workspace_id
FROM primary_ws p WHERE a.user_id = p.user_id AND a.workspace_id IS NULL;

WITH primary_ws AS (
  SELECT DISTINCT ON (owner_id) owner_id AS user_id, id AS workspace_id
  FROM public.workspaces ORDER BY owner_id, created_at ASC
)
UPDATE public.projects a SET workspace_id = p.workspace_id
FROM primary_ws p WHERE a.user_id = p.user_id AND a.workspace_id IS NULL;

WITH primary_ws AS (
  SELECT DISTINCT ON (owner_id) owner_id AS user_id, id AS workspace_id
  FROM public.workspaces ORDER BY owner_id, created_at ASC
)
UPDATE public.chats a SET workspace_id = p.workspace_id
FROM primary_ws p WHERE a.user_id = p.user_id AND a.workspace_id IS NULL;

WITH primary_ws AS (
  SELECT DISTINCT ON (owner_id) owner_id AS user_id, id AS workspace_id
  FROM public.workspaces ORDER BY owner_id, created_at ASC
)
UPDATE public.notifications a SET workspace_id = p.workspace_id
FROM primary_ws p WHERE a.user_id = p.user_id AND a.workspace_id IS NULL;

-- 3) Security-definer helpers -----------------------------------------------
CREATE OR REPLACE FUNCTION public.is_workspace_member(_workspace_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace_id AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.has_pro_plan(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND plan IN ('pro','business','enterprise')
      AND (status IS NULL OR status IN ('active','trialing'))
  );
$$;

-- 4) RLS policies: scope reads/writes to workspace members -------------------
-- Example for assets; repeat pattern for projects, chats, notifications, folders.
DROP POLICY IF EXISTS "assets_workspace_read"   ON public.assets;
DROP POLICY IF EXISTS "assets_workspace_write"  ON public.assets;
CREATE POLICY "assets_workspace_read" ON public.assets FOR SELECT TO authenticated
  USING (workspace_id IS NULL AND user_id = auth.uid()
      OR workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "assets_workspace_write" ON public.assets FOR ALL TO authenticated
  USING (workspace_id IS NULL AND user_id = auth.uid()
      OR workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid()))
  WITH CHECK (user_id = auth.uid());

-- 5) Pro-only workspace creation --------------------------------------------
CREATE OR REPLACE FUNCTION public.create_workspace(_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_id uuid;
BEGIN
  IF NOT public.has_pro_plan(auth.uid()) THEN
    RAISE EXCEPTION 'Pro plan required to create additional workspaces';
  END IF;
  INSERT INTO public.workspaces (name, owner_id) VALUES (_name, auth.uid()) RETURNING id INTO new_id;
  INSERT INTO public.workspace_members (workspace_id, user_id, role) VALUES (new_id, auth.uid(), 'owner');
  RETURN new_id;
END $$;

-- 6) Auto-purge trash > 30 days (cron via pg_cron or invoked from edge fn) ---
CREATE OR REPLACE FUNCTION public.purge_old_trash()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n1 int; n2 int;
BEGIN
  DELETE FROM public.assets   WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
  GET DIAGNOSTICS n1 = ROW_COUNT;
  DELETE FROM public.projects WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
  GET DIAGNOSTICS n2 = ROW_COUNT;
  RETURN n1 + n2;
END $$;

GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_pro_plan(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_workspace(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purge_old_trash() TO service_role;