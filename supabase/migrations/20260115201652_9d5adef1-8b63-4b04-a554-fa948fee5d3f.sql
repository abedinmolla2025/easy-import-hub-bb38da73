-- Create helper RPC to rotate admin passcode securely (bcrypt via pgcrypto)
-- Hashing is done in the database using crypt() + gen_salt('bf').

CREATE OR REPLACE FUNCTION public.update_admin_passcode(new_passcode text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF new_passcode IS NULL OR length(trim(new_passcode)) < 6 OR length(new_passcode) > 128 THEN
    RETURN false;
  END IF;

  UPDATE public.admin_security_config
  SET passcode_hash = crypt(new_passcode, gen_salt('bf', 10)),
      updated_at = now()
  WHERE id = 1;

  RETURN true;
END;
$$;

-- Lock down execution; only the backend service role should call this.
REVOKE ALL ON FUNCTION public.update_admin_passcode(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_admin_passcode(text) TO service_role;
