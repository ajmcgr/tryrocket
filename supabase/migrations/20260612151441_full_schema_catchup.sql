-- Catch-up migration: ensure projects, assets, asset_versions, email_verifications
-- all exist with proper grants/RLS, and force PostgREST to reload its schema cache.
-- Safe to re-run.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DO $$ BEGIN
  CREATE TYPE public.asset_type AS ENUM (
    'logo','brand_guidelines','color_system','font_system','brand_voice',
    'graphic','icon','photo','template',
    'launch_copy','product_hunt_copy','social_post','founder_bio',
    'presentation','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  cover_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS share_token uuid UNIQUE;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users manage own projects" ON public.projects
    FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS projects_user_idx ON public.projects(user_id, created_at DESC);
DROP TRIGGER IF EXISTS projects_updated_at ON public.projects;
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  asset_type public.asset_type NOT NULL DEFAULT 'other',
  title text NOT NULL DEFAULT 'Untitled',
  content text,
  image_url text,
  thumbnail_url text,
  prompt text,
  source_url text,
  editor_state jsonb,
  meta jsonb,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS share_token uuid UNIQUE;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets TO authenticated;
GRANT ALL ON public.assets TO service_role;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users manage own assets" ON public.assets
    FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS assets_user_idx ON public.assets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS assets_project_idx ON public.assets(project_id);
CREATE INDEX IF NOT EXISTS assets_type_idx ON public.assets(asset_type);
DROP TRIGGER IF EXISTS assets_updated_at ON public.assets;
CREATE TRIGGER assets_updated_at BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

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
DO $$ BEGIN
  CREATE POLICY "Users manage own versions" ON public.asset_versions
    FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS asset_versions_asset_idx ON public.asset_versions(asset_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.email_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.email_verifications TO service_role;
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS email_verifications_token_hash_idx ON public.email_verifications(token_hash);
CREATE INDEX IF NOT EXISTS email_verifications_user_idx ON public.email_verifications(user_id, created_at DESC);

ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;

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

UPDATE public.profiles p
SET email_verified = true,
    email_verified_at = COALESCE(p.email_verified_at, now())
FROM auth.users u
WHERE u.id = p.user_id
  AND COALESCE(u.raw_app_meta_data->>'provider', 'email') <> 'email'
  AND p.email_verified = false;

NOTIFY pgrst, 'reload schema';
