-- Seed initial admin security configuration if missing
DO $$
DECLARE
  v_hash text;
BEGIN
  -- Create initial config row
  INSERT INTO public.admin_security_config (id, admin_email, passcode_hash, require_fingerprint, failed_attempts, locked_until, updated_at)
  VALUES (
    1,
    'admin@noor.app',
    extensions.crypt('noor-admin-1234', extensions.gen_salt('bf', 10)),
    false,
    0,
    NULL,
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Seed passcode history with the current hash (only if history is empty)
  SELECT passcode_hash INTO v_hash
  FROM public.admin_security_config
  WHERE id = 1;

  IF v_hash IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.admin_passcode_history) THEN
    INSERT INTO public.admin_passcode_history (passcode_hash, created_at)
    VALUES (v_hash, now());
  END IF;
END $$;

-- Ensure RLS is enabled on admin tables (safe if already enabled)
ALTER TABLE public.admin_security_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_passcode_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_unlock_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;