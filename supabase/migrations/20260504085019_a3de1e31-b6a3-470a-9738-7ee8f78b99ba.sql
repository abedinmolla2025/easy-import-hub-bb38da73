-- Add multilingual explanation, benefits, when_to_recite columns to admin_content
ALTER TABLE public.admin_content
  ADD COLUMN IF NOT EXISTS explanation_en TEXT,
  ADD COLUMN IF NOT EXISTS explanation_hi TEXT,
  ADD COLUMN IF NOT EXISTS explanation_ur TEXT,
  ADD COLUMN IF NOT EXISTS benefits_en TEXT[],
  ADD COLUMN IF NOT EXISTS benefits_hi TEXT[],
  ADD COLUMN IF NOT EXISTS benefits_ur TEXT[],
  ADD COLUMN IF NOT EXISTS when_to_recite_en TEXT,
  ADD COLUMN IF NOT EXISTS when_to_recite_hi TEXT,
  ADD COLUMN IF NOT EXISTS when_to_recite_ur TEXT;