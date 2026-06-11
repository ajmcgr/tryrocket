-- Asset versions + public share tokens

CREATE TABLE IF NOT EXISTS public.asset_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text,
  snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.asset_versions TO authenticated;
GRANT ALL ON public.asset_versions TO service_role;
ALTER TABLE public.asset_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own versions" ON public.asset_versions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS asset_versions_asset_idx ON public.asset_versions(asset_id, created_at DESC);

ALTER TABLE public.assets   ADD COLUMN IF NOT EXISTS share_token uuid UNIQUE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS share_token uuid UNIQUE;

CREATE OR REPLACE FUNCTION public.get_shared_asset(_token uuid)
RETURNS public.assets
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.assets WHERE share_token = _token LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_shared_asset(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_shared_project(_token uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'project', to_jsonb(p),
    'assets', COALESCE((
      SELECT jsonb_agg(to_jsonb(a) ORDER BY a.created_at DESC)
      FROM public.assets a WHERE a.project_id = p.id
    ), '[]'::jsonb)
  )
  FROM public.projects p WHERE p.share_token = _token LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_shared_project(uuid) TO anon, authenticated;
