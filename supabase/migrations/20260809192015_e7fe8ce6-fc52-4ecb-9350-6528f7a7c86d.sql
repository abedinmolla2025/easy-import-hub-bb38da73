-- Scheduling via the public API of pg_cron if possible, or direct select if permitted
-- We skip the DELETE step which requires direct table access often not granted to anon/authenticated/service_role in some setups

SELECT cron.schedule('smart-morning', '0 7 * * *', 'SELECT net.http_post(''https://llicfiepatzgllmjhzbw.supabase.co/functions/v1/smart-notification-worker'', ''{}'', ''{}'', ''{"Content-Type": "application/json"}'')');
SELECT cron.schedule('smart-friday', '30 11 * * 5', 'SELECT net.http_post(''https://llicfiepatzgllmjhzbw.supabase.co/functions/v1/smart-notification-worker'', ''{}'', ''{}'', ''{"Content-Type": "application/json"}'')');
SELECT cron.schedule('smart-evening', '0 19 * * *', 'SELECT net.http_post(''https://llicfiepatzgllmjhzbw.supabase.co/functions/v1/smart-notification-worker'', ''{}'', ''{}'', ''{"Content-Type": "application/json"}'')');
SELECT cron.schedule('smart-night', '30 21 * * *', 'SELECT net.http_post(''https://llicfiepatzgllmjhzbw.supabase.co/functions/v1/smart-notification-worker'', ''{}'', ''{}'', ''{"Content-Type": "application/json"}'')');
