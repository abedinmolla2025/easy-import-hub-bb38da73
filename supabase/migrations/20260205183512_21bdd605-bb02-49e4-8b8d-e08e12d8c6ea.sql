-- Add missing pronunciation columns for multilingual support
ALTER TABLE public.admin_content 
ADD COLUMN IF NOT EXISTS content_pronunciation_en text,
ADD COLUMN IF NOT EXISTS content_pronunciation_hi text,
ADD COLUMN IF NOT EXISTS content_pronunciation_ur text;