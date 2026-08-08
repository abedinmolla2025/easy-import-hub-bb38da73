import raw from "./storyNotificationsVariants.json";

/** A single verified Bengali notification suggestion for a story. */
export interface StoryVariant {
  tone: string;
  title: string; // <= 60 display chars (verified at generation)
  body: string;  // <= 120 display chars (verified at generation)
}

export interface StoryVariantEntry {
  title: string;
  tone: string;
  variants: StoryVariant[];
}

export type StoryVariantsMap = Record<string, StoryVariantEntry>;

export default raw as unknown as StoryVariantsMap;
