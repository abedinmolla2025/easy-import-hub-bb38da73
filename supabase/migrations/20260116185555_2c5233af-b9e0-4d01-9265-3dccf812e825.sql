-- 1) Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  image_url text NULL,
  deep_link text NULL,
  target_platform text NOT NULL DEFAULT 'all',
  scheduled_at timestamptz NULL,
  sent_at timestamptz NULL,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_at ON public.notifications(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can manage notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notifications'
      AND policyname = 'Admins can manage notifications'
  ) THEN
    CREATE POLICY "Admins can manage notifications"
    ON public.notifications
    FOR ALL
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END $$;

-- 2) Delivery logs per token (success/failure per token)
CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  token_id uuid NULL REFERENCES public.device_push_tokens(id) ON DELETE SET NULL,
  platform text NOT NULL,
  status text NOT NULL, -- sent | failed
  error_code text NULL,
  error_message text NULL,
  provider_message_id text NULL,
  delivered_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification_id ON public.notification_deliveries(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_platform ON public.notification_deliveries(platform);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status ON public.notification_deliveries(status);

ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notification_deliveries'
      AND policyname = 'Admins can read delivery logs'
  ) THEN
    CREATE POLICY "Admins can read delivery logs"
    ON public.notification_deliveries
    FOR SELECT
    USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- 3) Extend device_push_tokens for web + user_id
ALTER TABLE public.device_push_tokens
  ADD COLUMN IF NOT EXISTS user_id uuid NULL;

-- Allow web platform in addition to android/ios
-- (No CHECK constraint; we enforce via RLS WITH CHECK below.)

-- Ensure token uniqueness per platform
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'device_push_tokens_platform_token_uniq'
  ) THEN
    ALTER TABLE public.device_push_tokens
      ADD CONSTRAINT device_push_tokens_platform_token_uniq UNIQUE (platform, token);
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_device_push_tokens_platform ON public.device_push_tokens(platform);
CREATE INDEX IF NOT EXISTS idx_device_push_tokens_user_id ON public.device_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_push_tokens_enabled ON public.device_push_tokens(enabled);

-- Update trigger to keep updated_at fresh
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_device_push_tokens_updated_at'
  ) THEN
    CREATE TRIGGER set_device_push_tokens_updated_at
    BEFORE UPDATE ON public.device_push_tokens
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- Tighten/replace INSERT policy to include web + optional user_id binding
-- Drop old policy if present (name from existing schema: "Public can register push tokens")
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'device_push_tokens'
      AND policyname = 'Public can register push tokens'
  ) THEN
    DROP POLICY "Public can register push tokens" ON public.device_push_tokens;
  END IF;
END $$;

CREATE POLICY "Public can register push tokens"
ON public.device_push_tokens
FOR INSERT
WITH CHECK (
  (platform = ANY (ARRAY['android'::text, 'ios'::text, 'web'::text]))
  AND (length(token) >= 20 AND length(token) <= 512)
  AND (device_id IS NULL OR (length(device_id) >= 8 AND length(device_id) <= 128))
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- keep existing admin policies if they exist; otherwise add them
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'device_push_tokens'
      AND policyname = 'Admins can read push tokens'
  ) THEN
    CREATE POLICY "Admins can read push tokens"
    ON public.device_push_tokens
    FOR SELECT
    USING (public.is_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'device_push_tokens'
      AND policyname = 'Admins can update push tokens'
  ) THEN
    CREATE POLICY "Admins can update push tokens"
    ON public.device_push_tokens
    FOR UPDATE
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'device_push_tokens'
      AND policyname = 'Admins can delete push tokens'
  ) THEN
    CREATE POLICY "Admins can delete push tokens"
    ON public.device_push_tokens
    FOR DELETE
    USING (public.is_admin(auth.uid()));
  END IF;
END $$;