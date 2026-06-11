-- Rebuild Rocket around Assets. Wipes old rockets / rocket_assets data.

ALTER TABLE IF EXISTS public.credit_transactions DROP COLUMN IF EXISTS rocket_id;
DROP TABLE IF EXISTS public.rocket_assets CASCADE;
DROP TABLE IF EXISTS public.rockets CASCADE;

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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own projects" ON public.projects
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS projects_user_idx ON public.projects(user_id, created_at DESC);
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets TO authenticated;
GRANT ALL ON public.assets TO service_role;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own assets" ON public.assets
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS assets_user_idx ON public.assets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS assets_project_idx ON public.assets(project_id);
CREATE INDEX IF NOT EXISTS assets_type_idx ON public.assets(asset_type);
CREATE TRIGGER assets_updated_at BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE IF EXISTS public.credit_transactions
  ADD COLUMN IF NOT EXISTS asset_id uuid REFERENCES public.assets(id) ON DELETE SET NULL;
