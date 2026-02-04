-- Create admin_security_config table
CREATE TABLE IF NOT EXISTS public.admin_security_config (
  id integer PRIMARY KEY DEFAULT 1,
  admin_email text NOT NULL DEFAULT 'admin@noor.app',
  passcode_hash text,
  require_fingerprint boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Enable RLS
ALTER TABLE public.admin_security_config ENABLE ROW LEVEL SECURITY;

-- Only service role can access (edge functions use service role)
CREATE POLICY "Service role only" ON public.admin_security_config
  FOR ALL USING (false);

-- Create admin_passcode_history table for reuse prevention
CREATE TABLE IF NOT EXISTS public.admin_passcode_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passcode_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_passcode_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.admin_passcode_history
  FOR ALL USING (false);

-- Create admin_passcode_reset_tokens table
CREATE TABLE IF NOT EXISTS public.admin_passcode_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash text NOT NULL,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  used boolean NOT NULL DEFAULT false
);

ALTER TABLE public.admin_passcode_reset_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.admin_passcode_reset_tokens
  FOR ALL USING (false);

-- Create admin_unlock_attempts table for lockout tracking
CREATE TABLE IF NOT EXISTS public.admin_unlock_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_fingerprint text,
  ip text,
  success boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_unlock_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.admin_unlock_attempts
  FOR ALL USING (false);

-- Insert default config row
INSERT INTO public.admin_security_config (id, admin_email, require_fingerprint)
VALUES (1, 'admin@noor.app', false)
ON CONFLICT (id) DO NOTHING;

-- Create set_admin_passcode RPC function
CREATE OR REPLACE FUNCTION public.set_admin_passcode(new_passcode text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO admin_security_config (id, passcode_hash, updated_at)
  VALUES (1, crypt(new_passcode, gen_salt('bf')), now())
  ON CONFLICT (id) DO UPDATE SET
    passcode_hash = crypt(new_passcode, gen_salt('bf')),
    updated_at = now();
  RETURN true;
END;
$$;

-- Create update_admin_passcode RPC function
CREATE OR REPLACE FUNCTION public.update_admin_passcode(new_passcode text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE admin_security_config
  SET passcode_hash = crypt(new_passcode, gen_salt('bf')),
      updated_at = now()
  WHERE id = 1;
  RETURN true;
END;
$$;

-- Create verify_admin_passcode RPC function
CREATE OR REPLACE FUNCTION public.verify_admin_passcode(_passcode text, _device_fingerprint text)
RETURNS TABLE(ok boolean, reason text, locked_until timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cfg_hash text;
  attempt_count int;
  lockout_until timestamptz;
  is_valid boolean;
BEGIN
  -- Check for lockout (5 failed attempts in last 15 minutes)
  SELECT COUNT(*) INTO attempt_count
  FROM admin_unlock_attempts
  WHERE success = false
    AND created_at > now() - interval '15 minutes';

  IF attempt_count >= 5 THEN
    -- Find when the oldest failed attempt in window expires
    SELECT created_at + interval '15 minutes' INTO lockout_until
    FROM admin_unlock_attempts
    WHERE success = false
      AND created_at > now() - interval '15 minutes'
    ORDER BY created_at ASC
    LIMIT 1;

    RETURN QUERY SELECT false, 'locked_out'::text, lockout_until;
    RETURN;
  END IF;

  -- Get current passcode hash
  SELECT passcode_hash INTO cfg_hash
  FROM admin_security_config
  WHERE id = 1;

  IF cfg_hash IS NULL THEN
    RETURN QUERY SELECT false, 'not_configured'::text, NULL::timestamptz;
    RETURN;
  END IF;

  -- Verify passcode
  is_valid := (cfg_hash = crypt(_passcode, cfg_hash));

  -- Log attempt
  INSERT INTO admin_unlock_attempts (device_fingerprint, success)
  VALUES (_device_fingerprint, is_valid);

  IF is_valid THEN
    RETURN QUERY SELECT true, NULL::text, NULL::timestamptz;
  ELSE
    RETURN QUERY SELECT false, 'invalid_passcode'::text, NULL::timestamptz;
  END IF;
END;
$$;

-- Create is_recent_admin_passcode RPC function
CREATE OR REPLACE FUNCTION public.is_recent_admin_passcode(_passcode text, _limit int DEFAULT 5)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
BEGIN
  FOR rec IN 
    SELECT passcode_hash 
    FROM admin_passcode_history 
    ORDER BY created_at DESC 
    LIMIT _limit
  LOOP
    IF rec.passcode_hash = crypt(_passcode, rec.passcode_hash) THEN
      RETURN true;
    END IF;
  END LOOP;
  RETURN false;
END;
$$;