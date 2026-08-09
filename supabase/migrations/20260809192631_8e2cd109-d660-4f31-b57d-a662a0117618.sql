SELECT * FROM public.get_next_smart_notification();
SELECT l.*, t.title_bn 
FROM public.notification_logs l
JOIN public.notification_templates t ON l.template_id = t.id
ORDER BY l.sent_at DESC 
LIMIT 1;
SELECT count(*) FROM public.notification_logs;