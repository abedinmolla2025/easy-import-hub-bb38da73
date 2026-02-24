
-- Create public bucket for app files (APKs etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('app-files', 'app-files', true, 104857600)
ON CONFLICT (id) DO NOTHING;

-- Allow public read
CREATE POLICY "Public can read app files"
ON storage.objects FOR SELECT
USING (bucket_id = 'app-files');

-- Admins can manage
CREATE POLICY "Admins can manage app files"
ON storage.objects FOR ALL
USING (bucket_id = 'app-files' AND public.is_admin(auth.uid()))
WITH CHECK (bucket_id = 'app-files' AND public.is_admin(auth.uid()));
