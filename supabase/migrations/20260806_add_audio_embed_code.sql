-- Add audio_embed_code column to admin_content table for storing SoundCloud iframe embed codes
ALTER TABLE public.admin_content
ADD COLUMN audio_embed_code TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.admin_content.audio_embed_code IS 'HTML iframe embed code for audio player (e.g., SoundCloud embed)';
