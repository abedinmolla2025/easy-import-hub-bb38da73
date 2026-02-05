-- Create admin_layout_settings table for storing layout configurations
CREATE TABLE public.admin_layout_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  layout_key TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'web',
  section_key TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  size TEXT NOT NULL DEFAULT 'normal',
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(layout_key, platform, section_key)
);

-- Enable RLS
ALTER TABLE public.admin_layout_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage layout settings
CREATE POLICY "Admins can manage layout settings"
ON public.admin_layout_settings
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Anyone can read layout settings (for home page to render)
CREATE POLICY "Anyone can read layout settings"
ON public.admin_layout_settings
FOR SELECT
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_admin_layout_settings_updated_at
BEFORE UPDATE ON public.admin_layout_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();