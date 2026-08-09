-- Create Enum for Notification Channels
CREATE TYPE public.notification_channel AS ENUM ('push', 'in_app', 'email');

-- Create Table for Notification Content
CREATE TABLE public.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, -- 'dua', 'hadith', 'quran', 'story', 'history', 'event'
    title_bn TEXT NOT NULL,
    body_bn TEXT NOT NULL,
    source_reference TEXT, -- e.g., 'Sahih Bukhari 123'
    target_slug TEXT, -- slug of the content to open
    metadata JSONB DEFAULT '{}', -- stores specific triggers like 'morning', 'friday', 'ramadan'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create Table for Notification Logs/History (to track 60-day rotation)
CREATE TABLE public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.notification_templates(id),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status TEXT DEFAULT 'sent', -- 'sent', 'clicked', 'failed'
    user_id UUID REFERENCES auth.users(id), -- Optional for individual tracking
    metadata JSONB DEFAULT '{}'
);

-- Create Table for Islamic Historical Events
CREATE TABLE public.islamic_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hijri_day INTEGER,
    hijri_month INTEGER,
    gregorian_day INTEGER,
    gregorian_month INTEGER,
    event_name_bn TEXT NOT NULL,
    description_bn TEXT,
    importance_level INTEGER DEFAULT 1, -- 1-5 scale
    is_recurring BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS & Grants
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.islamic_events ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.notification_templates TO authenticated;
GRANT SELECT ON public.notification_templates TO anon;
GRANT ALL ON public.notification_templates TO service_role;

GRANT SELECT, INSERT ON public.notification_logs TO authenticated;
GRANT ALL ON public.notification_logs TO service_role;

GRANT SELECT ON public.islamic_events TO authenticated;
GRANT SELECT ON public.islamic_events TO anon;
GRANT ALL ON public.islamic_events TO service_role;

-- Policies
CREATE POLICY "Public read templates" ON public.notification_templates FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Public read events" ON public.islamic_events FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Users can see their logs" ON public.notification_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);

