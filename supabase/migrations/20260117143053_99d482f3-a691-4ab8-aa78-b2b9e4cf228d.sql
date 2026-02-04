-- Add settings JSON blob to layout settings so each section can store per-section configuration
ALTER TABLE public.admin_layout_settings
ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Helpful index for querying/filtering by layout+platform
CREATE INDEX IF NOT EXISTS idx_admin_layout_settings_layout_platform
ON public.admin_layout_settings (layout_key, platform);

-- Optional: GIN index for future JSON queries (harmless even if unused)
CREATE INDEX IF NOT EXISTS idx_admin_layout_settings_settings_gin
ON public.admin_layout_settings USING GIN (settings);