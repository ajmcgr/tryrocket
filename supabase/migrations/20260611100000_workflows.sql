-- Add workflow routing and image asset support
ALTER TABLE public.rockets
  ADD COLUMN IF NOT EXISTS workflow text NOT NULL DEFAULT 'brand';

ALTER TABLE public.rocket_assets
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS image_prompt text;

UPDATE public.rockets SET workflow = 'brand' WHERE workflow IS NULL;

INSERT INTO storage.buckets (id, name, public)
VALUES ('rocket-images', 'rocket-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "rocket-images public read" ON storage.objects;
CREATE POLICY "rocket-images public read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'rocket-images');

DROP POLICY IF EXISTS "rocket-images owner insert" ON storage.objects;
CREATE POLICY "rocket-images owner insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'rocket-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "rocket-images owner update" ON storage.objects;
CREATE POLICY "rocket-images owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'rocket-images' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'rocket-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "rocket-images owner delete" ON storage.objects;
CREATE POLICY "rocket-images owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'rocket-images' AND (storage.foldername(name))[1] = auth.uid()::text);
