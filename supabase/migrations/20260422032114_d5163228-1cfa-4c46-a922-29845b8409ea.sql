-- Page visits table for real-time analytics
CREATE TABLE public.page_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  user_id uuid,
  path text NOT NULL,
  page_title text,
  referrer text,
  referrer_source text,
  country text,
  city text,
  region text,
  device_type text,
  browser text,
  os text,
  user_agent text,
  language text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX idx_page_visits_created_at ON public.page_visits (created_at DESC);
CREATE INDEX idx_page_visits_session ON public.page_visits (session_id, created_at DESC);
CREATE INDEX idx_page_visits_path ON public.page_visits (path, created_at DESC);
CREATE INDEX idx_page_visits_country ON public.page_visits (country, created_at DESC);

-- Enable RLS
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

-- Anyone can insert their own page visit (anonymous tracking)
CREATE POLICY "Anyone can insert page visits"
  ON public.page_visits
  FOR INSERT
  WITH CHECK (true);

-- Only admins can view analytics
CREATE POLICY "Admins can view all page visits"
  ON public.page_visits
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Enable realtime
ALTER TABLE public.page_visits REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.page_visits;