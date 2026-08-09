-- Create notification_templates table if not exists
DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notification_templates') THEN
        CREATE TABLE public.notification_templates (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            category text NOT NULL,
            title_bn text NOT NULL,
            body_bn text NOT NULL,
            metadata jsonb DEFAULT '{}'::jsonb,
            created_at timestamptz DEFAULT now()
        );
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_templates TO authenticated;
        GRANT ALL ON public.notification_templates TO service_role;
        ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create islamic_events table if not exists
DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'islamic_events') THEN
        CREATE TABLE public.islamic_events (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            hijri_day integer NOT NULL,
            hijri_month integer NOT NULL,
            event_name_bn text NOT NULL,
            description_bn text,
            importance_level integer DEFAULT 1,
            created_at timestamptz DEFAULT now()
        );
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.islamic_events TO authenticated;
        GRANT ALL ON public.islamic_events TO service_role;
        ALTER TABLE public.islamic_events ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Populate notification_templates
INSERT INTO public.notification_templates (category, title_bn, body_bn, metadata)
SELECT 
    'dua',
    'Dua Reminder #' || n,
    E'🕌 আসসালামু আলাইকুম!\n\nরাসূলুল্লাহ (সা.) বলেছেন, দোয়া হলো ইবাদতের মূল। আজকের দোয়া:\n\nআপনার জন্য নির্বাচিত বিশেষ দোয়া টি পড়তে অ্যাপটি ওপেন করুন। (নমুনা #' || n || E')',
    jsonb_build_object('rotation_index', n-1)
FROM generate_series(1, 300) n;

INSERT INTO public.notification_templates (category, title_bn, body_bn, metadata)
SELECT 
    'hadith',
    'Hadith Reminder #' || n,
    E'🕌 আসসালামু আলাইকুম!\n\nহৃদয় প্রশান্ত করতে আজকের একটি মূল্যবান হাদিস পড়ুন:\n\nআপনার জন্য নির্বাচিত বিশেষ হাদিস টি পড়তে অ্যাপটি ওপেন করুন। (নমুনা #' || n || E')',
    jsonb_build_object('rotation_index', n-1)
FROM generate_series(1, 300) n;

INSERT INTO public.notification_templates (category, title_bn, body_bn, metadata)
SELECT 
    'story',
    'Story Reminder #' || n,
    E'🕌 আসসালামু আলাইকুম!\n\nঈমানদীপ্ত একটি সত্য ঘটনা আমাদের জীবন বদলে দিতে পারে:\n\nআপনার জন্য নির্বাচিত বিশেষ ঘটনা টি পড়তে অ্যাপটি ওপেন করুন। (নমুনা #' || n || E')',
    jsonb_build_object('rotation_index', n-1)
FROM generate_series(1, 300) n;

INSERT INTO public.notification_templates (category, title_bn, body_bn, metadata)
SELECT 
    'quran',
    'Quran Reminder #' || n,
    E'🕌 আসসালামু আলাইকুম!\n\nকুরআন মাজীদের এই আয়াতটি আজ আমাদের পথ দেখাবে ইনশাআল্লাহ:\n\nআপনার জন্য নির্বাচিত বিশেষ কুরআন টি পড়তে অ্যাপটি ওপেন করুন। (নমুনা #' || n || E')',
    jsonb_build_object('rotation_index', n-1)
FROM generate_series(1, 150) n;

INSERT INTO public.notification_templates (category, title_bn, body_bn, metadata)
SELECT 
    'friday',
    'Friday Reminder #' || n,
    E'🕌 আসসালামু আলাইকুম!\n\nআজ পবিত্র জুমু''আহ। বরকতময় এই দিনে কিছু আমল ও দোয়া:\n\nআপনার জন্য নির্বাচিত বিশেষ জুমু''আহ আমল টি পড়তে অ্যাপটি ওপেন করুন। (নমুনা #' || n || E')',
    jsonb_build_object('rotation_index', n-1)
FROM generate_series(1, 100) n;

-- Populate islamic_events
INSERT INTO public.islamic_events (hijri_day, hijri_month, event_name_bn, description_bn, importance_level)
VALUES 
    (10, 1, 'আশুরা', 'কারবালার ঐতিহাসিক ঘটনা ও মুসা (আ.) এর মুক্তি।', 5),
    (12, 3, 'ঈদে মিলাদুন্নবী', 'নবী মুহাম্মদ (সা.) এর পবিত্র জন্ম ও ওফাত দিবস।', 5),
    (27, 7, 'মি''রাজুন্নবী', 'নবী (সা.) এর ঊর্ধ্বাকাশে গমন ও পাঁচ ওয়াক্ত নামাজ ফরজ হওয়া।', 5),
    (15, 8, 'শবে বরাত', 'ভাগ্য রজনী ও ইবাদতের বিশেষ রাত।', 5),
    (1, 10, 'ঈদুল ফিতর', 'রমজানের শেষে আনন্দের উৎসব।', 5),
    (10, 12, 'ঈদুল আজহা', 'কুরবানি ও ত্যাগের মহিমায় ভাস্বর দিন।', 5),
    (9, 12, 'আরাফাহর দিন', 'হজের মূল রুকন ও ক্ষমার শ্রেষ্ঠ দিন।', 5);