
-- Create device_push_tokens table for storing web & native push subscriptions
CREATE TABLE public.device_push_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'web',
  enabled BOOLEAN NOT NULL DEFAULT true,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(device_id, platform)
);

-- Enable RLS
ALTER TABLE public.device_push_tokens ENABLE ROW LEVEL SECURITY;

-- Anyone can insert their own token
CREATE POLICY "Anyone can insert push tokens"
  ON public.device_push_tokens
  FOR INSERT
  WITH CHECK (true);

-- Users can update their own tokens
CREATE POLICY "Users can update own push tokens"
  ON public.device_push_tokens
  FOR UPDATE
  USING (true);

-- Admins can read all tokens (for sending notifications)
CREATE POLICY "Admins can read all push tokens"
  ON public.device_push_tokens
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Users can read their own tokens
CREATE POLICY "Users can read own push tokens"
  ON public.device_push_tokens
  FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Trigger for updated_at
CREATE TRIGGER update_device_push_tokens_updated_at
  BEFORE UPDATE ON public.device_push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
