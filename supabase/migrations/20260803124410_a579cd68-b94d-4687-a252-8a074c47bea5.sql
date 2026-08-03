ALTER TABLE public.admin_content
  ADD COLUMN IF NOT EXISTS moral_bn TEXT,
  ADD COLUMN IF NOT EXISTS moral_en TEXT,
  ADD COLUMN IF NOT EXISTS moral_ur TEXT,
  ADD COLUMN IF NOT EXISTS source_name TEXT,
  ADD COLUMN IF NOT EXISTS source_detail TEXT,
  ADD COLUMN IF NOT EXISTS author TEXT,
  ADD COLUMN IF NOT EXISTS reading_time_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS related_stories TEXT[],
  ADD COLUMN IF NOT EXISTS navigation JSONB,
  ADD COLUMN IF NOT EXISTS engagement JSONB,
  ADD COLUMN IF NOT EXISTS growth JSONB;

CREATE INDEX IF NOT EXISTS admin_content_type_slug_idx ON public.admin_content (content_type, slug);
CREATE INDEX IF NOT EXISTS admin_content_featured_idx ON public.admin_content (content_type, is_featured);