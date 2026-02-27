
-- Update verify_admin_passcode to count failures PER DEVICE instead of globally.
-- This prevents mobile network/IP changes from causing false lockouts.
CREATE OR REPLACE FUNCTION public.verify_admin_passcode(_passcode text, _device_fingerprint text)
 RETURNS TABLE(ok boolean, reason text, locked_until timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  cfg_hash text;
  attempt_count int;
  lockout_until timestamptz;
  is_valid boolean;
BEGIN
  -- Check for lockout PER DEVICE FINGERPRINT (10 failed attempts in last 15 minutes)
  -- Increased from 5 to 10 to reduce false positives on mobile networks
  SELECT COUNT(*) INTO attempt_count
  FROM admin_unlock_attempts
  WHERE success = false
    AND device_fingerprint = _device_fingerprint
    AND created_at > now() - interval '15 minutes';

  IF attempt_count >= 10 THEN
    -- Find when the oldest failed attempt in window expires
    SELECT created_at + interval '15 minutes' INTO lockout_until
    FROM admin_unlock_attempts
    WHERE success = false
      AND device_fingerprint = _device_fingerprint
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

  -- Log attempt with device fingerprint
  INSERT INTO admin_unlock_attempts (device_fingerprint, success)
  VALUES (_device_fingerprint, is_valid);

  IF is_valid THEN
    -- On success, clear old failed attempts for this device (reduce noise)
    DELETE FROM admin_unlock_attempts
    WHERE device_fingerprint = _device_fingerprint
      AND success = false
      AND created_at < now() - interval '1 minute';

    RETURN QUERY SELECT true, NULL::text, NULL::timestamptz;
  ELSE
    RETURN QUERY SELECT false, 'invalid_passcode'::text, NULL::timestamptz;
  END IF;
END;
$function$;
