-- One-time migration: purge stale web push subscriptions created under the
-- old Lovable Cloud VAPID key.
--
-- WHY: All existing web subscriptions (created Feb-Aug 2026) were generated
-- with the Lovable Cloud VAPID keypair. After migrating to Supabase the
-- edge function signs pushes with a DIFFERENT private key, so the push
-- service permanently rejects those subscriptions with HTTP 401. They can
-- never deliver again.
--
-- HOW IT IS SAFE: The client registration hook (useWebPushRegistration) now
-- runs a one-time automatic migration per browser:
--   1. Detects the old key hash / missing hash on next app open
--   2. Unsubscribes the dead browser subscription locally
--   3. Re-subscribes under the current Supabase VAPID public key
--   4. Inserts the fresh token into device_push_tokens immediately
--   5. Persists flag "noor_push_migration_v2" so this runs exactly once
--
-- Run this SQL ONCE in the Supabase SQL Editor. Users who reopen the app
-- re-register automatically; no one needs to clear browser data.
--
-- OPTIONAL (fully automatic, uncomment):
--   To prune only subscriptions we know are dead, the send-push edge
--   function already disables/removes tokens that fail with HTTP 401 or 403
--   (same as 404/410), so any stragglers self-heal on the next send.

-- One-time purge: every web token currently stored is Lovable-era.
-- Android/iOS tokens (if any) are unaffected.
UPDATE public.device_push_tokens
SET enabled = false
WHERE platform = 'web'
  AND enabled = true;

COMMENT ON TABLE public.device_push_tokens IS
  'One-time Lovable→Supabase VAPID migration purge executed (Aug 9, 2026). '
  || 'Old web tokens disabled; clients re-register automatically on next visit.';
