-- Re-applying tables and function, skipping pg_cron if it fails due to permissions
-- (Wait: The previous migration likely failed early at the 'DELETE FROM cron.job' line)

CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    title_bn TEXT NOT NULL,
    body_bn TEXT NOT NULL,
    source_reference TEXT,
    target_slug TEXT,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.notification_templates(id),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status TEXT DEFAULT 'sent',
    user_id UUID,
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.islamic_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hijri_day INTEGER,
    hijri_month INTEGER,
    gregorian_day INTEGER,
    gregorian_month INTEGER,
    event_name_bn TEXT NOT NULL,
    description_bn TEXT,
    importance_level INTEGER DEFAULT 1,
    is_recurring BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON public.notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON public.notification_templates(category);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.islamic_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read templates' AND tablename = 'notification_templates') THEN
        CREATE POLICY "Public read templates" ON public.notification_templates FOR SELECT TO authenticated, anon USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read events' AND tablename = 'islamic_events') THEN
        CREATE POLICY "Public read events" ON public.islamic_events FOR SELECT TO authenticated, anon USING (true);
    END IF;
END $$;

GRANT ALL ON public.notification_templates TO service_role;
GRANT SELECT ON public.notification_templates TO authenticated, anon;
GRANT ALL ON public.notification_logs TO service_role;
GRANT ALL ON public.islamic_events TO service_role;
GRANT SELECT ON public.islamic_events TO authenticated, anon;

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
            ELSE 5
        END,
        random()
    LIMIT 1;

    IF v_template_id IS NOT NULL THEN
        INSERT INTO public.notification_logs (template_id, status)
        VALUES (v_template_id, 'sent');
        template_id := v_template_id;
        RETURN NEXT;
    END IF;
END;
$$;
