-- Push notification device tokens (FCM/APNs)

-- Timestamp helper (idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE IF NOT EXISTS public.device_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  platform text NOT NULL, -- 'android' | 'ios'
  device_id text NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.device_push_tokens ENABLE ROW LEVEL SECURITY;

-- Public can register a token (no login required)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'device_push_tokens'
      AND policyname = 'Public can register push tokens'
  ) THEN
    CREATE POLICY "Public can register push tokens"
    ON public.device_push_tokens
    FOR INSERT
    TO public
    WITH CHECK (
      platform = ANY (ARRAY['android','ios'])
      AND length(token) BETWEEN 20 AND 512
      AND (device_id IS NULL OR length(device_id) BETWEEN 8 AND 128)
    );
  END IF;
END $$;

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
    USING (is_admin(auth.uid()));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'device_push_tokens'
      AND policyname = 'Admins can update push tokens'
  ) THEN
    CREATE POLICY "Admins can update push tokens"
    ON public.device_push_tokens
    FOR UPDATE
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'device_push_tokens'
      AND policyname = 'Admins can delete push tokens'
  ) THEN
    CREATE POLICY "Admins can delete push tokens"
    ON public.device_push_tokens
    FOR DELETE
    USING (is_admin(auth.uid()));
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_device_push_tokens_updated_at ON public.device_push_tokens;
CREATE TRIGGER update_device_push_tokens_updated_at
BEFORE UPDATE ON public.device_push_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_device_push_tokens_platform ON public.device_push_tokens(platform);
CREATE INDEX IF NOT EXISTS idx_device_push_tokens_enabled ON public.device_push_tokens(enabled);
CREATE INDEX IF NOT EXISTS idx_device_push_tokens_last_seen_at ON public.device_push_tokens(last_seen_at);
