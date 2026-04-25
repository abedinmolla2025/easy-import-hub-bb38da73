-- Add new columns for SEO-friendly dua pages
ALTER TABLE public.admin_content
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS explanation_bn TEXT,
  ADD COLUMN IF NOT EXISTS benefits_bn TEXT[],
  ADD COLUMN IF NOT EXISTS when_to_recite_bn TEXT,
  ADD COLUMN IF NOT EXISTS hadith_reference TEXT;

-- Unique index on slug (allow nulls for non-dua content)
CREATE UNIQUE INDEX IF NOT EXISTS admin_content_slug_unique
  ON public.admin_content (slug)
  WHERE slug IS NOT NULL;

-- Slugify function: lowercase, ascii-safe, hyphenated
CREATE OR REPLACE FUNCTION public.slugify(input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  result TEXT;
BEGIN
  IF input IS NULL OR length(trim(input)) = 0 THEN
    RETURN NULL;
  END IF;
  result := lower(trim(input));
  -- replace non-alphanumeric with hyphen
  result := regexp_replace(result, '[^a-z0-9\u0980-\u09FF]+', '-', 'g');
  -- strip leading/trailing hyphens
  result := regexp_replace(result, '(^-+|-+$)', '', 'g');
  RETURN result;
END;
$$;

-- Trigger: auto-set slug for dua content if missing
CREATE OR REPLACE FUNCTION public.auto_set_dua_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  candidate TEXT;
  suffix INT := 1;
BEGIN
  IF lower(coalesce(NEW.content_type, '')) NOT IN ('dua') THEN
    RETURN NEW;
  END IF;

  IF NEW.slug IS NOT NULL AND length(trim(NEW.slug)) > 0 THEN
    RETURN NEW;
  END IF;

  base_slug := public.slugify(coalesce(NEW.title_en, NEW.title));
  IF base_slug IS NULL OR length(base_slug) = 0 THEN
    base_slug := 'dua-' || substr(NEW.id::text, 1, 8);
  END IF;

  candidate := base_slug;
  WHILE EXISTS (
    SELECT 1 FROM public.admin_content
    WHERE slug = candidate AND id <> NEW.id
  ) LOOP
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix;
  END LOOP;

  NEW.slug := candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_dua_slug ON public.admin_content;
CREATE TRIGGER trg_auto_dua_slug
  BEFORE INSERT OR UPDATE ON public.admin_content
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_dua_slug();

-- Backfill slugs for existing dua content
UPDATE public.admin_content
SET slug = slug  -- triggers the BEFORE UPDATE
WHERE lower(coalesce(content_type, '')) = 'dua' AND slug IS NULL;