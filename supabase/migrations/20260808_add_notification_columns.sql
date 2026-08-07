-- Add missing columns to admin_notifications for push notifications
-- Fixes: "Could not find the 'deep_link' column of 'admin_notifications' in the schema cache"

ALTER TABLE public.admin_notifications ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.admin_notifications ADD COLUMN IF NOT EXISTS target_platform TEXT DEFAULT 'all';
ALTER TABLE public.admin_notifications ADD COLUMN IF NOT EXISTS deep_link TEXT;

-- Helpful index for deep_link lookups
CREATE INDEX IF NOT EXISTS idx_admin_notifications_deep_link ON public.admin_notifications (deep_link);
