import raw from "./duaNotificationsVariants.json";

/** A single verified Bengali notification suggestion for a dua. */
export interface DuaVariant {
  tone: string;
  title: string; // <= 60 display chars (verified at generation)
  body: string;  // <= 120 display chars (verified at generation)
}

export interface DuaVariantEntry {
  title: string;
  content_type: "dua";
  tone: string;
  variants: DuaVariant[];
}

export type DuaVariantsMap = Record<string, DuaVariantEntry>;

export default raw as unknown as DuaVariantsMap;
