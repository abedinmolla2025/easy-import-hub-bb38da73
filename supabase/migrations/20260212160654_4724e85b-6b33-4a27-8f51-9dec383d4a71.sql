
-- Add missing columns to admin_notifications for push functionality
ALTER TABLE public.admin_notifications
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS deep_link TEXT,
  ADD COLUMN IF NOT EXISTS target_platform TEXT NOT NULL DEFAULT 'all';

-- Create notification_deliveries table for delivery logging
CREATE TABLE public.notification_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL,
  token_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  provider_message_id TEXT,
  error_code TEXT,
  error_message TEXT,
  subscription_endpoint TEXT,
  endpoint_host TEXT,
  browser TEXT,
  stage TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notification deliveries"
  ON public.notification_deliveries
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Index for fast lookups
CREATE INDEX idx_notification_deliveries_notif_id ON public.notification_deliveries(notification_id);
