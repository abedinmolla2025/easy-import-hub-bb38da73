-- Fix: 'Admins can manage notifications' was created as FOR ALL with only a
-- USING clause. Postgres applies USING to SELECT/UPDATE/DELETE but INSERT
-- checks require a matching WITH CHECK expression. With none, INSERT is
-- denied for everyone — which is why push notifications fail with
-- "new row violates row-level security policy".
-- Split into per-operation policies with proper WITH CHECK clauses.

DROP POLICY IF EXISTS "Admins can manage notifications" ON public.admin_notifications;

-- Read: admins see everything
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_notifications'
      AND policyname = 'Admins can read notifications'
  ) THEN
    CREATE POLICY "Admins can read notifications"
    ON public.admin_notifications
    FOR SELECT
    USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- Insert: admins can create notifications, validated columns
CREATE POLICY "Admins can insert notifications"
ON public.admin_notifications
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- Update: admins can modify notifications
CREATE POLICY "Admins can update notifications"
ON public.admin_notifications
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Delete: admins can delete notifications
CREATE POLICY "Admins can delete notifications"
ON public.admin_notifications
FOR DELETE
USING (public.is_admin(auth.uid()));

-- Public read of sent/scheduled notifications (keep existing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_notifications'
      AND policyname = 'Public can read sent/scheduled notifications'
  ) THEN
    CREATE POLICY "Public can read sent/scheduled notifications"
    ON public.admin_notifications
    FOR SELECT
    USING (
      (status IN ('sent','scheduled')
       AND (scheduled_at IS NULL OR scheduled_at <= now()))
    );
  END IF;
END $$;
