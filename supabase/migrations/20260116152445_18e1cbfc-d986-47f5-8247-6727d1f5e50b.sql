-- Utilities to avoid JS-side hashing in backend function

CREATE OR REPLACE FUNCTION public.is_recent_admin_passcode(_passcode text, _limit int DEFAULT 5)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_passcode_history h
    ORDER BY h.created_at DESC
    LIMIT GREATEST(1, LEAST(COALESCE(_limit, 5), 20))
  )
  AND EXISTS (
    SELECT 1
    FROM (
      SELECT passcode_hash
      FROM public.admin_passcode_history
      ORDER BY created_at DESC
      LIMIT GREATEST(1, LEAST(COALESCE(_limit, 5), 20))
    ) x
    WHERE extensions.crypt(_passcode, x.passcode_hash) = x.passcode_hash
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_recent_admin_passcode(text, int) TO anon, authenticated;
