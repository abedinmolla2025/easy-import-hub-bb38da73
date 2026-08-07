-- Fix: notification_deliveries table uses `delivered_at` but the app code
-- (AdminNotificationsDiagnostics.tsx, send-push edge function, generated types)
-- expects a `created_at` column. Adding created_at with DEFAULT now() restores
-- the expected schema without breaking existing data.
ALTER TABLE public.notification_deliveries ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Backfill existing rows so ordering works for legacy deliveries.
UPDATE public.notification_deliveries
SET created_at = delivered_at
WHERE created_at IS NULL AND delivered_at IS NOT NULL;
