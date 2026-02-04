-- Add explicit deny-all RLS policies to satisfy linter (tables should not be directly accessible)

DO $$ BEGIN
  -- admin_security_config
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_security_config' AND policyname='deny_all_admin_security_config'
  ) THEN
    CREATE POLICY deny_all_admin_security_config
    ON public.admin_security_config
    FOR ALL
    USING (false)
    WITH CHECK (false);
  END IF;

  -- admin_unlock_attempts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_unlock_attempts' AND policyname='deny_all_admin_unlock_attempts'
  ) THEN
    CREATE POLICY deny_all_admin_unlock_attempts
    ON public.admin_unlock_attempts
    FOR ALL
    USING (false)
    WITH CHECK (false);
  END IF;
END $$;