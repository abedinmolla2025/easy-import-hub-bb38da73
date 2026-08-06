-- Add audio_trailer_url column to admin_content table for storing 30s trailer audio links
ALTER TABLE public.admin_content
ADD COLUMN audio_trailer_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.admin_content.audio_trailer_url IS 'Direct URL to a 30s audio trailer (e.g., .mp3 link) for social sharing';
