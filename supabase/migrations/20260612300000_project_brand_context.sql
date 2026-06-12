ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS brand_context jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS source_url text;
