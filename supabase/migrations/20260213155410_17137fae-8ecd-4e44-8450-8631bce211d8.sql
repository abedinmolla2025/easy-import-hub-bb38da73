
-- Add missing columns to admin_notifications that the code references
ALTER TABLE public.admin_notifications
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ticker_style jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ticker_active boolean DEFAULT false;
