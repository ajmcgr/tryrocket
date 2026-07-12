CREATE OR REPLACE FUNCTION public.create_workspace(_name text)
RETURNS public.workspaces
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  created_workspace public.workspaces;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF COALESCE(btrim(_name), '') = '' THEN
    RAISE EXCEPTION 'Workspace name is required';
  END IF;

  INSERT INTO public.workspaces (name, owner_id, is_personal)
  VALUES (btrim(_name), auth.uid(), false)
  RETURNING * INTO created_workspace;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (created_workspace.id, auth.uid(), 'owner')
  ON CONFLICT DO NOTHING;

  RETURN created_workspace;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_workspace(text) TO authenticated;

NOTIFY pgrst, 'reload schema';
