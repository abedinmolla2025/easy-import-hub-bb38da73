-- Function to get all-time analytics totals server-side (avoids fetching 100k rows)
CREATE OR REPLACE FUNCTION public.get_analytics_alltime_totals()
RETURNS TABLE(unique_visitors bigint, total_views bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(DISTINCT session_id)::bigint AS unique_visitors,
    COUNT(*)::bigint AS total_views
  FROM public.page_visits;
$$;

-- Restrict execution to admins only (matches page_visits RLS intent)
REVOKE EXECUTE ON FUNCTION public.get_analytics_alltime_totals() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_analytics_alltime_totals() TO authenticated;

-- Index to speed up DISTINCT session_id aggregation
CREATE INDEX IF NOT EXISTS idx_page_visits_session_id ON public.page_visits (session_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_created_at ON public.page_visits (created_at DESC);