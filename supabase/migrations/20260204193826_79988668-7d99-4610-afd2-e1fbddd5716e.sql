-- Fix pgcrypto function resolution by qualifying calls to extensions schema

CREATE OR REPLACE FUNCTION public.set_admin_passcode(new_passcode text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  INSERT INTO admin_security_config (id, passcode_hash, updated_at)
  VALUES (1, extensions.crypt(new_passcode, extensions.gen_salt('bf'::text)), now())
  ON CONFLICT (id) DO UPDATE SET
    passcode_hash = extensions.crypt(new_passcode, extensions.gen_salt('bf'::text)),
    updated_at = now();
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_admin_passcode(new_passcode text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  UPDATE admin_security_config
  SET passcode_hash = extensions.crypt(new_passcode, extensions.gen_salt('bf'::text)),
      updated_at = now()
  WHERE id = 1;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_admin_passcode(_passcode text, _device_fingerprint text)
RETURNS TABLE(ok boolean, reason text, locked_until timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
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
  is_valid := (cfg_hash = extensions.crypt(_passcode, cfg_hash));

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

CREATE OR REPLACE FUNCTION public.is_recent_admin_passcode(_passcode text, _limit int DEFAULT 5)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
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
    IF rec.passcode_hash = extensions.crypt(_passcode, rec.passcode_hash) THEN
      RETURN true;
    END IF;
  END LOOP;

  RETURN false;
END;
$$;