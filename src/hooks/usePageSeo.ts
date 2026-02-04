import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PageSeoRow = {
  id: string;
  path: string;
  title: string | null;
  description: string | null;
  canonical_url: string | null;
  robots: string | null;
  json_ld: any | null;
  created_at: string;
  updated_at: string;
};

export function usePageSeo(pathname: string, enabled = true) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["page-seo", pathname],
    enabled: enabled && !!pathname,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("seo_pages")
        .select("*")
        .eq("path", pathname)
        .maybeSingle();

      if (error) throw error;
      return (data ?? null) as PageSeoRow | null;
    },
  });

  useEffect(() => {
    if (!enabled || !pathname) return;

    const channel = supabase
      .channel(`seo_pages:${pathname}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "seo_pages" },
        (payload) => {
          const row = payload.new as Partial<PageSeoRow> | null;
          if (row?.path && row.path !== pathname) return;
          queryClient.invalidateQueries({ queryKey: ["page-seo", pathname] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, pathname, queryClient]);

  return query;
}
