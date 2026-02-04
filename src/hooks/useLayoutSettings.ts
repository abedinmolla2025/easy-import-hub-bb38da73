import type { LayoutPlatform } from "@/lib/layout";

export type LayoutSettingRow = {
  id: string;
  layout_key: string;
  platform: string;
  order_index: number;
  section_key: string;
  visible: boolean;
  size: "compact" | "normal" | "large";
  settings: Record<string, any>;
};

export function useLayoutSettings(layoutKey: string, platform: LayoutPlatform) {
  // Return empty data since the admin_layout_settings table doesn't exist
  // This is a graceful fallback
  return {
    data: [] as LayoutSettingRow[],
    isLoading: false,
    isError: false,
    error: null,
  };
}
