
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_channel') THEN
        CREATE TYPE public.notification_channel AS ENUM ('push', 'in_app', 'email');
    END IF;
END $$;

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
    user_id UUID REFERENCES auth.users(id),
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

GRANT SELECT ON public.notification_templates TO authenticated, anon;
GRANT ALL ON public.notification_templates TO service_role;
GRANT SELECT, INSERT ON public.notification_logs TO authenticated;
GRANT ALL ON public.notification_logs TO service_role;
GRANT SELECT ON public.islamic_events TO authenticated, anon;
GRANT ALL ON public.islamic_events TO service_role;

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.islamic_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read templates') THEN
        CREATE POLICY "Public read templates" ON public.notification_templates FOR SELECT TO authenticated, anon USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read events') THEN
        CREATE POLICY "Public read events" ON public.islamic_events FOR SELECT TO authenticated, anon USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can see their logs') THEN
        CREATE POLICY "Users can see their logs" ON public.notification_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
    END IF;
END $$;
