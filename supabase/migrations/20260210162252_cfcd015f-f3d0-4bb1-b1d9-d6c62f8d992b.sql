
-- Create media storage bucket for general uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('media', 'media', true, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Media files are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Admin-only upload
CREATE POLICY "Admins can upload media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media'
  AND public.is_admin(auth.uid())
);

-- Admin-only update
CREATE POLICY "Admins can update media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'media'
  AND public.is_admin(auth.uid())
);

-- Admin-only delete
CREATE POLICY "Admins can delete media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media'
  AND public.is_admin(auth.uid())
);
