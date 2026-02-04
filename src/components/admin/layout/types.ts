import type { Json } from "@/integrations/supabase/types";

export type UiSize = "compact" | "normal" | "large";

export type StyleVariant = "default" | "soft" | "glass";

export type SectionSettings = {
  gridColumns?: number;
  adPlacement?: string;
  styleVariant?: StyleVariant;
} & Record<string, Json>;

export type UiSection = {
  section_key: string;
  label: string;
  visible: boolean;
  order_index: number;
  size: UiSize;
  settings: SectionSettings;
};
