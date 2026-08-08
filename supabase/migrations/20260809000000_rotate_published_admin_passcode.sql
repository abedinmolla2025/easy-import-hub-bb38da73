-- Security hardening: rotate the passcode that was published in older migrations.
-- The generated random value is intentionally unknown; the owner must use the
-- verified email reset flow to choose a new passcode.
DO $$
BEGIN
  IF to_regclass('public.admin_security_config') IS NOT NULL THEN
    UPDATE public.admin_security_config
    SET passcode_hash = extensions.crypt(extensions.gen_random_uuid()::text, extensions.gen_salt('bf', 10)),
        updated_at = now()
    WHERE id = 1
      AND passcode_hash IS NOT NULL
      AND extensions.crypt('noor-admin-1234', passcode_hash) = passcode_hash;
  END IF;
END $$;

COMMENT ON TABLE public.admin_security_config IS
  'Admin security configuration. Published/default passcodes must never be retained; use the verified reset flow.';

REVOKE ALL ON FUNCTION public.verify_admin_passcode(text, text) FROM anon;
REVOKE ALL ON FUNCTION public.set_admin_passcode(text) FROM anon;
REVOKE ALL ON FUNCTION public.update_admin_passcode(text) FROM anon;
REVOKE ALL ON FUNCTION public.is_recent_admin_passcode(text, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.verify_admin_passcode(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_admin_passcode(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_admin_passcode(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_recent_admin_passcode(text, integer) TO service_role;
