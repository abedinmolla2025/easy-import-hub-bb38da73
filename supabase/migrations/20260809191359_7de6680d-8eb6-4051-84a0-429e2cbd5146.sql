-- 1. Function: Smart Content Selection & Rotation
CREATE OR REPLACE FUNCTION public.get_next_smart_notification()
RETURNS TABLE (
    template_id UUID,
    title TEXT,
    body TEXT,
    category TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_template_id UUID;
BEGIN
    -- Content Selection Priority:
    -- 1. Today's Islamic Event (Priority 1)
    -- 2. Friday Special (if today is Friday)
    -- 3. Rotation (Dua > Hadith > Story > Quran)
    
    SELECT t.id, t.title_bn, t.body_bn, t.category
    INTO v_template_id, title, body, category
    FROM public.notification_templates t
    LEFT JOIN public.notification_logs l ON l.template_id = t.id 
        AND l.sent_at > (now() - interval '60 days')
    WHERE t.is_active = true
      AND l.id IS NULL
    ORDER BY 
        CASE 
            WHEN t.category = 'history' THEN 1
            WHEN t.category = 'friday' AND extract(dow from now() AT TIME ZONE 'Asia/Kolkata') = 5 THEN 2
            WHEN t.category = 'dua' THEN 3
            WHEN t.category = 'hadith' THEN 4
            WHEN t.category = 'story' THEN 5
            ELSE 6
        END,
        random()
    LIMIT 1;

    IF v_template_id IS NOT NULL THEN
        -- Log delivery for 60-day rotation tracking
        INSERT INTO public.notification_logs (template_id, status)
        VALUES (v_template_id, 'sent');
        
        template_id := v_template_id;
        RETURN NEXT;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_next_smart_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_smart_notification() TO service_role;

-- 2. Scheduler Configuration (pg_cron)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Morning 7:00 AM IST
SELECT cron.schedule('morning-reminder', '0 7 * * *', 'SELECT public.get_next_smart_notification()');
-- Friday 11:30 AM IST
SELECT cron.schedule('friday-reminder', '30 11 * * 5', 'SELECT public.get_next_smart_notification()');
-- Evening 7:00 PM IST
SELECT cron.schedule('evening-reminder', '0 19 * * *', 'SELECT public.get_next_smart_notification()');
-- Night 9:30 PM IST
SELECT cron.schedule('night-reminder', '30 21 * * *', 'SELECT public.get_next_smart_notification()');
