
-- SEO pages table for dynamic sitemap & per-page SEO metadata
CREATE TABLE public.seo_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT,
  canonical_url TEXT,
  robots TEXT DEFAULT 'index,follow',
  json_ld JSONB,
  changefreq TEXT DEFAULT 'weekly',
  priority NUMERIC(2,1) DEFAULT 0.8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read seo_pages" ON public.seo_pages
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage seo_pages" ON public.seo_pages
  FOR ALL USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Trigger to auto-update updated_at
CREATE TRIGGER update_seo_pages_updated_at
  BEFORE UPDATE ON public.seo_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- SEO index log for tracking pings and rate limiting
CREATE TABLE public.seo_index_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL, -- 'google_ping', 'bing_ping', 'indexnow'
  target_url TEXT,
  status_code INTEGER,
  success BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_index_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage seo_index_log" ON public.seo_index_log
  FOR ALL USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Enable realtime for seo_pages so admin UI stays in sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.seo_pages;

-- Seed static pages
INSERT INTO public.seo_pages (path, title, changefreq, priority) VALUES
  ('/', 'NOOR - ইসলামিক অ্যাপ', 'daily', 1.0),
  ('/quran', 'কুরআন পড়ুন', 'weekly', 0.9),
  ('/prayer-times', 'নামাজের সময়সূচী', 'daily', 0.9),
  ('/dua', 'দোয়া সমূহ', 'weekly', 0.8),
  ('/bukhari', 'সহীহ বুখারী হাদিস', 'weekly', 0.8),
  ('/quiz', 'ইসলামিক কুইজ', 'daily', 0.7),
  ('/99-names', 'আল্লাহর ৯৯ নাম', 'monthly', 0.7),
  ('/baby-names', 'মুসলিম শিশুর নাম', 'weekly', 0.8),
  ('/names', 'ইসলামিক নাম অর্থসহ', 'weekly', 0.7),
  ('/calendar', 'ইসলামিক ক্যালেন্ডার', 'daily', 0.7),
  ('/qibla', 'কিবলা দিকনির্দেশক', 'monthly', 0.6),
  ('/tasbih', 'তাসবিহ কাউন্টার', 'monthly', 0.6),
  ('/prayer-guide', 'নামাজ শিক্ষা গাইড', 'monthly', 0.7),
  ('/privacy-policy', 'প্রাইভেসি পলিসি', 'yearly', 0.3),
  ('/terms', 'শর্তাবলী', 'yearly', 0.3),
  ('/about', 'আমাদের সম্পর্কে', 'monthly', 0.4),
  ('/contact', 'যোগাযোগ', 'monthly', 0.4)
ON CONFLICT (path) DO NOTHING;
