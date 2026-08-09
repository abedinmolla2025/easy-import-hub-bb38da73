-- Select next two notifications to verify rotation
SELECT * FROM public.get_next_smart_notification();
SELECT * FROM public.get_next_smart_notification();

-- Fetch the logs for the two tests
SELECT l.template_id, t.title_bn, l.sent_at 
FROM public.notification_logs l
JOIN public.notification_templates t ON l.template_id = t.id
ORDER BY l.sent_at DESC 
LIMIT 2;

-- Final log count
SELECT count(*) FROM public.notification_logs;