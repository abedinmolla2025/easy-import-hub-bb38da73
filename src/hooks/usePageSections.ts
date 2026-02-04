import type { LayoutPlatform } from "@/lib/layout";

export type PageBuilderPlatform = "web" | "app";

export type PageSectionRow = {
  id: string;
  page: string;
  section_key: string;
  title: string;
  position: number;
  visible: boolean;
  settings: Record<string, any>;
  platform: "web" | "app" | "all";
};

function mapLayoutPlatformToPageBuilderPlatform(p: LayoutPlatform): PageBuilderPlatform {
  // LayoutPlatform in this codebase is already "web" | "app"
  return p;
}

export function usePageSections(page: string, layoutPlatform: LayoutPlatform) {
  const platform = mapLayoutPlatformToPageBuilderPlatform(layoutPlatform);
  
  // Return empty data since the admin_page_sections table doesn't exist
  // This is a graceful fallback
  return { 
    loading: false, 
    rows: [] as PageSectionRow[], 
    error: null, 
    platform 
  };
}
