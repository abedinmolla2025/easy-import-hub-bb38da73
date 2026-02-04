-- Phase-1: Layout Control

CREATE TABLE IF NOT EXISTS public.admin_layout_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_key text NOT NULL,
  section_key text NOT NULL,
  platform text NOT NULL, -- 'web' | 'app'
  visible boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  size text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL,
  CONSTRAINT admin_layout_settings_unique UNIQUE (layout_key, section_key, platform)
);

CREATE INDEX IF NOT EXISTS idx_admin_layout_settings_layout_platform_order
  ON public.admin_layout_settings (layout_key, platform, order_index);

ALTER TABLE public.admin_layout_settings ENABLE ROW LEVEL SECURITY;

-- Public can only read visible sections (app filters platform client-side)
DO $$ BEGIN
  CREATE POLICY "Public can read visible layout settings"
  ON public.admin_layout_settings
  FOR SELECT
  USING (visible = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admins can read all
DO $$ BEGIN
  CREATE POLICY "Admins can read all layout settings"
  ON public.admin_layout_settings
  FOR SELECT
  USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admins can manage
DO $$ BEGIN
  CREATE POLICY "Admins can insert layout settings"
  ON public.admin_layout_settings
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update layout settings"
  ON public.admin_layout_settings
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete layout settings"
  ON public.admin_layout_settings
  FOR DELETE
  USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- updated_at trigger
DROP TRIGGER IF EXISTS update_admin_layout_settings_updated_at ON public.admin_layout_settings;
CREATE TRIGGER update_admin_layout_settings_updated_at
BEFORE UPDATE ON public.admin_layout_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Version history (limited)
CREATE TABLE IF NOT EXISTS public.admin_layout_settings_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_key text NOT NULL,
  platform text NOT NULL,
  snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_layout_versions_layout_platform_created
  ON public.admin_layout_settings_versions (layout_key, platform, created_at DESC);

ALTER TABLE public.admin_layout_settings_versions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Admins can read layout setting versions"
  ON public.admin_layout_settings_versions
  FOR SELECT
  USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can insert layout setting versions"
  ON public.admin_layout_settings_versions
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Keep only last 5 versions per (layout_key, platform)
CREATE OR REPLACE FUNCTION public.trim_admin_layout_versions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.admin_layout_settings_versions v
  WHERE v.layout_key = NEW.layout_key
    AND v.platform = NEW.platform
    AND v.id IN (
      SELECT id
      FROM public.admin_layout_settings_versions
      WHERE layout_key = NEW.layout_key
        AND platform = NEW.platform
      ORDER BY created_at DESC
      OFFSET 5
    );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trim_admin_layout_versions ON public.admin_layout_settings_versions;
CREATE TRIGGER trg_trim_admin_layout_versions
AFTER INSERT ON public.admin_layout_settings_versions
FOR EACH ROW
EXECUTE FUNCTION public.trim_admin_layout_versions();

-- Realtime updates to clients
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_layout_settings;