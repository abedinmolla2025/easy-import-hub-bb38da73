
-- Create user_notification_preferences table
CREATE TABLE public.user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  latitude NUMERIC NOT NULL DEFAULT 0,
  longitude NUMERIC NOT NULL DEFAULT 0,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  calculation_method TEXT NOT NULL DEFAULT 'MWL',
  enabled_prayers JSONB NOT NULL DEFAULT '{"fajr":true,"dhuhr":true,"asr":true,"maghrib":true,"isha":true}'::jsonb,
  notification_offset INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(device_id)
);

-- Create prayer_notification_log table
CREATE TABLE public.prayer_notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preference_id UUID REFERENCES public.user_notification_preferences(id) ON DELETE CASCADE NOT NULL,
  prayer_name TEXT NOT NULL,
  prayer_time TIMESTAMPTZ NOT NULL,
  prayer_date DATE NOT NULL,
  notification_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_notification_log ENABLE ROW LEVEL SECURITY;

-- RLS: Allow anyone to insert/update their own device preferences (no auth required for anonymous PWA users)
CREATE POLICY "Anyone can manage their device preferences"
  ON public.user_notification_preferences
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can read notification logs"
  ON public.prayer_notification_log
  FOR SELECT
  USING (true);

CREATE POLICY "Service can insert notification logs"
  ON public.prayer_notification_log
  FOR INSERT
  WITH CHECK (true);

-- Auto-update updated_at
CREATE TRIGGER update_notification_prefs_updated_at
  BEFORE UPDATE ON public.user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
