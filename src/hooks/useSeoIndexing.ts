import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type SeoPageRow = {
  id: string;
  path: string;
  title: string | null;
  description: string | null;
  canonical_url: string | null;
  robots: string | null;
  json_ld: any;
  changefreq: string | null;
  priority: number | null;
  created_at: string;
  updated_at: string;
};

export type SeoIndexLogRow = {
  id: string;
  action: string;
  target_url: string | null;
  status_code: number | null;
  success: boolean;
  metadata: any;
  created_at: string;
};

export function useSeoPages() {
  return useQuery({
    queryKey: ["seo-pages"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("seo_pages")
        .select("*")
        .order("path");
      if (error) throw error;
      return (data ?? []) as SeoPageRow[];
    },
  });
}

export function useSeoIndexLog(limit = 20) {
  return useQuery({
    queryKey: ["seo-index-log", limit],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("seo_index_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as SeoIndexLogRow[];
    },
  });
}

export function useUpsertSeoPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (page: Partial<SeoPageRow> & { path: string }) => {
      const { error } = await (supabase as any)
        .from("seo_pages")
        .upsert(page, { onConflict: "path" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seo-pages"] });
      toast.success("SEO page saved");
    },
    onError: () => toast.error("Failed to save"),
  });
}

export function useDeleteSeoPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("seo_pages")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seo-pages"] });
      toast.success("SEO page deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });
}

export function useNotifySearchEngines() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        "notify-search-engines",
        { method: "POST", body: {} }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["seo-index-log"] });
      if (data?.success) {
        toast.success("Google & Bing notified about sitemap update");
      } else if (data?.reason === "rate_limited") {
        toast.info("Rate limited: try again after 10 minutes");
      } else {
        toast.warning("Could not notify some search engines");
      }
    },
    onError: () => toast.error("Search engine notification failed"),
  });
}
