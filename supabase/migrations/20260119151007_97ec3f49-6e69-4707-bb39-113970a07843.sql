-- Create user notification preferences table
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  device_id TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  calculation_method TEXT NOT NULL DEFAULT 'MWL',
  enabled_prayers JSONB NOT NULL DEFAULT '{"fajr":true,"dhuhr":true,"asr":true,"maghrib":true,"isha":true}'::jsonb,
  notification_offset INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_notification_preferences_device_check CHECK (
    (length(device_id) >= 8) AND (length(device_id) <= 128)
  ),
  CONSTRAINT user_notification_preferences_lat_check CHECK (
    (latitude >= -90) AND (latitude <= 90)
  ),
  CONSTRAINT user_notification_preferences_lng_check CHECK (
    (longitude >= -180) AND (longitude <= 180)
  ),
  CONSTRAINT user_notification_preferences_offset_check CHECK (
    (notification_offset >= -60) AND (notification_offset <= 60)
  )
);

-- Enable RLS
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view own notification preferences"
ON public.user_notification_preferences
FOR SELECT
USING (
  (user_id IS NULL AND auth.uid() IS NULL) OR 
  (auth.uid() = user_id)
);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own notification preferences"
ON public.user_notification_preferences
FOR INSERT
WITH CHECK (
  ((user_id IS NULL) OR (auth.uid() = user_id))
  AND calculation_method IN ('MWL', 'ISNA', 'Egypt', 'Makkah', 'Karachi', 'Tehran', 'Jafari')
);

-- Users can update their own preferences
CREATE POLICY "Users can update own notification preferences"
ON public.user_notification_preferences
FOR UPDATE
USING (
  (user_id IS NULL AND auth.uid() IS NULL) OR 
  (auth.uid() = user_id)
)
WITH CHECK (
  ((user_id IS NULL) OR (auth.uid() = user_id))
  AND calculation_method IN ('MWL', 'ISNA', 'Egypt', 'Makkah', 'Karachi', 'Tehran', 'Jafari')
);

-- Users can delete their own preferences
CREATE POLICY "Users can delete own notification preferences"
ON public.user_notification_preferences
FOR DELETE
USING (
  (user_id IS NULL AND auth.uid() IS NULL) OR 
  (auth.uid() = user_id)
);

-- Admins can view all preferences
CREATE POLICY "Admins can view all notification preferences"
ON public.user_notification_preferences
FOR SELECT
USING (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_user_notification_preferences_updated_at
BEFORE UPDATE ON public.user_notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_user_notification_preferences_enabled ON public.user_notification_preferences(enabled) WHERE enabled = true;
CREATE INDEX idx_user_notification_preferences_device ON public.user_notification_preferences(device_id);

-- Create table to track sent prayer notifications (prevent duplicates)
CREATE TABLE IF NOT EXISTS public.prayer_notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preference_id UUID NOT NULL REFERENCES public.user_notification_preferences(id) ON DELETE CASCADE,
  prayer_name TEXT NOT NULL,
  prayer_time TIMESTAMPTZ NOT NULL,
  prayer_date DATE NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notification_id UUID REFERENCES public.notifications(id) ON DELETE SET NULL,
  CONSTRAINT prayer_notification_log_prayer_check CHECK (
    prayer_name IN ('fajr', 'dhuhr', 'asr', 'maghrib', 'isha')
  )
);

-- Enable RLS
ALTER TABLE public.prayer_notification_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view prayer notification logs"
ON public.prayer_notification_log
FOR SELECT
USING (is_admin(auth.uid()));

-- Create index for duplicate prevention (using date column)
CREATE UNIQUE INDEX idx_prayer_notification_log_unique 
ON public.prayer_notification_log(preference_id, prayer_name, prayer_date);

-- Create index for cleanup queries
CREATE INDEX idx_prayer_notification_log_sent_at ON public.prayer_notification_log(sent_at);