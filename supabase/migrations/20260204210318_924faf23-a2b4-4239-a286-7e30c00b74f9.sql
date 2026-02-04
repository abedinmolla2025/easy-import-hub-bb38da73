-- Create admin_occasions table for Islamic occasions management
CREATE TABLE public.admin_occasions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  message TEXT NOT NULL,
  dua_text TEXT,
  html_code TEXT,
  css_code TEXT,
  image_url TEXT,
  card_css TEXT,
  container_class_name TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  platform TEXT NOT NULL DEFAULT 'both' CHECK (platform IN ('web', 'app', 'both')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_occasions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage occasions"
ON public.admin_occasions
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Anyone can view active occasions"
ON public.admin_occasions
FOR SELECT
USING (
  is_active = true 
  AND start_date <= now() 
  AND end_date >= now()
);

-- Create trigger for updated_at
CREATE TRIGGER update_admin_occasions_updated_at
BEFORE UPDATE ON public.admin_occasions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();