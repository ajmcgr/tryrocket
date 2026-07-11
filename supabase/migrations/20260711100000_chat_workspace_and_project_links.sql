DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'workspaces'
  ) THEN
    EXECUTE 'ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL';
  ELSE
    EXECUTE 'ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS workspace_id uuid';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'projects'
  ) THEN
    EXECUTE 'ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL';
  ELSE
    EXECUTE 'ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS project_id uuid';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS chats_workspace_idx ON public.chats(workspace_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS chats_project_idx ON public.chats(project_id, updated_at DESC);

NOTIFY pgrst, 'reload schema';
