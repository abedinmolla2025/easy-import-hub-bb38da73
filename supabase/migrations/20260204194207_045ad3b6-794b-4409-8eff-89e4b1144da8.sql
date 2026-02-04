-- Align admin_passcode_reset_tokens schema with admin-security backend expectations

ALTER TABLE public.admin_passcode_reset_tokens
  ADD COLUMN IF NOT EXISTS admin_email text,
  ADD COLUMN IF NOT EXISTS code_salt text,
  ADD COLUMN IF NOT EXISTS requested_ip text,
  ADD COLUMN IF NOT EXISTS requested_user_id uuid,
  ADD COLUMN IF NOT EXISTS used_at timestamptz;

-- Backfill admin_email for existing rows (tokens are ephemeral, but this keeps throttling consistent)
UPDATE public.admin_passcode_reset_tokens
SET admin_email = COALESCE(admin_email, 'admin@noor.app')
WHERE admin_email IS NULL;

-- If legacy column "ip" exists, copy it into requested_ip for existing rows
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_passcode_reset_tokens'
      AND column_name = 'ip'
  ) THEN
    UPDATE public.admin_passcode_reset_tokens
    SET requested_ip = COALESCE(requested_ip, ip)
    WHERE requested_ip IS NULL;
  END IF;
END;
$$;

-- If legacy column "used" exists, mark used_at for those rows
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_passcode_reset_tokens'
      AND column_name = 'used'
  ) THEN
    UPDATE public.admin_passcode_reset_tokens
    SET used_at = COALESCE(used_at, now())
    WHERE used_at IS NULL
      AND used = true;
  END IF;
END;
$$;

ALTER TABLE public.admin_passcode_reset_tokens
  ALTER COLUMN admin_email SET DEFAULT 'admin@noor.app',
  ALTER COLUMN admin_email SET NOT NULL;

-- Keep a sane default for expiry (matches backend behavior)
ALTER TABLE public.admin_passcode_reset_tokens
  ALTER COLUMN expires_at SET DEFAULT (now() + interval '10 minutes');

ALTER TABLE public.admin_passcode_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Helpful indexes for throttle + lookup (safe if table is small)
CREATE INDEX IF NOT EXISTS idx_admin_passcode_reset_tokens_throttle
  ON public.admin_passcode_reset_tokens (admin_email, requested_ip, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_passcode_reset_tokens_lookup
  ON public.admin_passcode_reset_tokens (admin_email, used_at, created_at DESC);