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
      toast.success("SEO পেজ সেভ হয়েছে");
    },
    onError: () => toast.error("সেভ করতে ব্যর্থ"),
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
      toast.success("SEO পেজ মুছে ফেলা হয়েছে");
    },
    onError: () => toast.error("মুছতে ব্যর্থ"),
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
        toast.success("Google ও Bing কে সাইটম্যাপ আপডেট জানানো হয়েছে");
      } else if (data?.reason === "rate_limited") {
        toast.info("রেট লিমিট: ১০ মিনিট পর আবার চেষ্টা করুন");
      } else {
        toast.warning("কিছু সার্চ ইঞ্জিনে জানানো যায়নি");
      }
    },
    onError: () => toast.error("সার্চ ইঞ্জিন নোটিফিকেশন ব্যর্থ"),
  });
}
