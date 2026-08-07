-- Harden RLS for push-notification tables.
-- Problem: device_push_tokens was emptied (likely by a manual DELETE in SQL
-- Editor or an overly broad DELETE policy). Goal:
--   * Regular (non-admin) users can only INSERT tokens and delete/replace
--     their OWN device token via a controlled RPC helper — never a broad
--     client-side DELETE on the table.
--   * Admins can read tokens but cannot delete or update them directly;
--     the send-push / prayer edge functions use service_role and bypass RLS
--     (so admin-triggered sends still work).
--   * delivery logs are append-only: only the service role inserts, admins read.
-- Service role (edge functions) is unaffected by RLS, so nothing functional
-- breaks.

-------------------------------------------------------------------------
-- 1) device_push_tokens
-------------------------------------------------------------------------
-- a) Replace the old INSERT policy with a validated version.
DROP POLICY IF EXISTS "Public can register push tokens" ON public.device_push_tokens;

CREATE POLICY "Public can register push tokens"
ON public.device_push_tokens
FOR INSERT
WITH CHECK (
  (platform = ANY (ARRAY['android'::text, 'ios'::text, 'web'::text]))
  AND (length(token) >= 20 AND length(token) <= 2048)
  AND (device_id IS NULL OR (length(device_id) >= 8 AND length(device_id) <= 128))
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- b) Admins keep SELECT access (no change).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'device_push_tokens'
      AND policyname = 'Admins can read push tokens'
  ) THEN
    CREATE POLICY "Admins can read push tokens"
    ON public.device_push_tokens
    FOR SELECT
    USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- c) Remove broad admin UPDATE/DELETE. Token lifecycle (enable/disable on
--    404/410 failures, last_seen updates, etc.) is handled by edge functions
--    running as service_role, which bypass RLS entirely.
DROP POLICY IF EXISTS "Admins can update push tokens" ON public.device_push_tokens;
DROP POLICY IF EXISTS "Admins can delete push tokens" ON public.device_push_tokens;

-- d) Users may only ever remove a token via this controlled RPC. It deletes
--    AT MOST one row matching the caller's own device_id + platform.
CREATE OR REPLACE FUNCTION public.delete_own_push_token(p_device_id text, p_platform text)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int := 0;
BEGIN
  -- Reject suspicious inputs early.
  IF p_device_id IS NULL
     OR length(p_device_id) < 8 OR length(p_device_id) > 128
     OR p_platform NOT IN ('android', 'ios', 'web')
  THEN
    RETURN 0;
  END IF;

  DELETE FROM public.device_push_tokens
  WHERE device_id = p_device_id
    AND platform = p_platform
  RETURNING 1 INTO v_count;

  RETURN v_count;
END;
$$;

-- Only authenticated sessions (anonymous or real) may call it; the function
-- itself limits the delete to the caller-supplied device_id so other users'
-- tokens can never be touched from the client.
GRANT EXECUTE ON FUNCTION public.delete_own_push_token(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_own_push_token(text, text) TO anon;

-------------------------------------------------------------------------
-- 2) notification_deliveries (append-only log)
-------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notification_deliveries'
      AND policyname = 'Admins can read delivery logs'
  ) THEN
    CREATE POLICY "Admins can read delivery logs"
    ON public.notification_deliveries
    FOR SELECT
    USING (public.is_admin(auth.uid()));
  END IF;
END $$;
-- No INSERT/UPDATE/DELETE policies for normal roles: only service_role
-- (edge functions) can write to this log.
