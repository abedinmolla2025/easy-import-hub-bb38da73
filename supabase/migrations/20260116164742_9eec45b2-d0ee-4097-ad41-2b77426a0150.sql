-- Per-page SEO settings
CREATE TABLE IF NOT EXISTS public.seo_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  title text,
  description text,
  canonical_url text,
  robots text,
  json_ld jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

-- Ensure one row per route path
CREATE UNIQUE INDEX IF NOT EXISTS seo_pages_path_unique ON public.seo_pages (path);

ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;

-- Public read (SEO must be readable client-side)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'seo_pages' AND policyname = 'Public can read per-page SEO'
  ) THEN
    CREATE POLICY "Public can read per-page SEO"
    ON public.seo_pages
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Admin manage
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'seo_pages' AND policyname = 'Admins can manage per-page SEO'
  ) THEN
    CREATE POLICY "Admins can manage per-page SEO"
    ON public.seo_pages
    FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));
  END IF;
END $$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at_seo_pages ON public.seo_pages;
CREATE TRIGGER set_updated_at_seo_pages
BEFORE UPDATE ON public.seo_pages
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.seo_pages;