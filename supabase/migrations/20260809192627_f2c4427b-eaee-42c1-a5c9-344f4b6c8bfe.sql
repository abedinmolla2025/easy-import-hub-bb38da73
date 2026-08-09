SELECT * FROM public.get_next_smart_notification();
SELECT * FROM public.notification_logs ORDER BY sent_at DESC LIMIT 1;
SELECT count(*) FROM public.notification_logs;