-- Fix: use existing helper function is_admin(auth.uid()) and has_role(auth.uid(), 'super_admin'::public.app_role)

CREATE TABLE IF NOT EXISTS public.celebrate_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NULL,
  body TEXT NULL,
  media_type TEXT NULL, -- 'image' | 'gif'
  media_path TEXT NULL,
  link_url TEXT NULL,
  cta_text TEXT NULL,
  target_platform TEXT NOT NULL DEFAULT 'all', -- 'all' | 'web' | 'app'
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NULL,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.celebrate_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Celebrate posts are publicly readable when active" ON public.celebrate_posts;
CREATE POLICY "Celebrate posts are publicly readable when active"
ON public.celebrate_posts
FOR SELECT
USING (starts_at <= now() AND expires_at > now());

DROP POLICY IF EXISTS "Admins can insert celebrate posts" ON public.celebrate_posts;
CREATE POLICY "Admins can insert celebrate posts"
ON public.celebrate_posts
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update celebrate posts" ON public.celebrate_posts;
CREATE POLICY "Admins can update celebrate posts"
ON public.celebrate_posts
FOR UPDATE
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete celebrate posts" ON public.celebrate_posts;
CREATE POLICY "Admins can delete celebrate posts"
ON public.celebrate_posts
FOR DELETE
USING (is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.celebrate_posts_before_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := COALESCE(NEW.starts_at, now()) + interval '12 hours';
  END IF;

  IF NEW.target_platform IS NULL OR btrim(NEW.target_platform) = '' THEN
    NEW.target_platform := 'all';
  END IF;

  IF NEW.target_platform NOT IN ('all', 'web', 'app') THEN
    RAISE EXCEPTION 'Invalid target_platform: %', NEW.target_platform;
  END IF;

  IF NEW.expires_at <= NEW.starts_at THEN
    RAISE EXCEPTION 'expires_at must be after starts_at';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_celebrate_posts_before_write ON public.celebrate_posts;
CREATE TRIGGER trg_celebrate_posts_before_write
BEFORE INSERT OR UPDATE ON public.celebrate_posts
FOR EACH ROW
EXECUTE FUNCTION public.celebrate_posts_before_write();

CREATE INDEX IF NOT EXISTS idx_celebrate_posts_active
ON public.celebrate_posts (starts_at DESC, expires_at DESC);

-- Storage bucket for celebrate media
INSERT INTO storage.buckets (id, name, public)
VALUES ('celebrate', 'celebrate', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for celebrate media
DROP POLICY IF EXISTS "Celebrate media is publicly accessible" ON storage.objects;
CREATE POLICY "Celebrate media is publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'celebrate');

-- Admin write for celebrate media
DROP POLICY IF EXISTS "Admins can upload celebrate media" ON storage.objects;
CREATE POLICY "Admins can upload celebrate media"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'celebrate' AND is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update celebrate media" ON storage.objects;
CREATE POLICY "Admins can update celebrate media"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'celebrate' AND is_admin(auth.uid()))
WITH CHECK (bucket_id = 'celebrate' AND is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete celebrate media" ON storage.objects;
CREATE POLICY "Admins can delete celebrate media"
ON storage.objects
FOR DELETE
USING (bucket_id = 'celebrate' AND is_admin(auth.uid()));
