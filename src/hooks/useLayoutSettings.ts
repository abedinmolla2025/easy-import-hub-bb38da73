import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LayoutPlatform } from "@/lib/layout";

export type LayoutSettingRow = {
  id: string;
  layout_key: string;
  platform: string;
  order_index: number;
  section_key: string;
  visible: boolean;
  size: "compact" | "normal" | "large";
  settings: Record<string, unknown>;
};

export function useLayoutSettings(layoutKey: string, platform: LayoutPlatform) {
  return useQuery({
    queryKey: ["layout-settings", layoutKey, platform],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_layout_settings")
        .select("*")
        .eq("layout_key", layoutKey)
        .eq("platform", platform)
        .order("order_index", { ascending: true });

      if (error) {
        console.error("Failed to fetch layout settings:", error);
        return [];
      }

      return (data ?? []) as LayoutSettingRow[];
    },
    staleTime: 1000 * 60, // 1 minute
  });
}
