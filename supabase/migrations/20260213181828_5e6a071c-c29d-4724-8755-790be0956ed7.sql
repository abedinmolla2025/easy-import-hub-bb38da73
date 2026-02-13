ALTER TABLE public.admin_notifications ADD COLUMN IF NOT EXISTS icon_url TEXT;
ALTER TABLE public.admin_notifications ADD COLUMN IF NOT EXISTS badge_url TEXT;