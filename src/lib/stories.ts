import storiesJson from "@/data/stories.json";

export type StoryCategory =
  | "prophets"
  | "sahaba"
  | "islamic_historical_events"
  | "inspirational"
  | "kids_friendly";

export type StoryLanguage = "en" | "bn" | "ur";

export interface StoryRecord {
  id: number;
  slug: string;
  image?: {
    url?: string;
  };
  seo?: {
    title?: string;
    meta_description?: string;
    keywords?: string[];
    slug?: string;
    canonical_url?: string;
    open_graph?: {
      "og:title"?: string;
      "og:description"?: string;
      "og:image"?: string;
      "og:url"?: string;
    };
  };
  category: StoryCategory;
  title_bn: string;
  title_en: string;
  title_ur: string;
  content_bn: string;
  content_en: string;
  content_ur: string;
  moral_bn: string;
  moral_en: string;
  moral_ur: string;
  source_name: string;
  reference: string;
  source_detail: string;
  scenes?: Array<{
    image?: {
      url?: string;
    };
  }>;
}

const categoryLabels: Record<StoryCategory, string> = {
  prophets: "Prophets",
  sahaba: "Sahaba",
  islamic_historical_events: "Historical Events",
  inspirational: "Inspirational",
  kids_friendly: "Kids Friendly",
};

const stories = storiesJson as StoryRecord[];

export function getAllStories(): StoryRecord[] {
  return stories;
}

export function getStoryBySlug(slug: string): StoryRecord | undefined {
  return stories.find((story) => story.slug === slug);
}

export function getNextStory(currentSlug: string): StoryRecord | undefined {
  const currentIndex = stories.findIndex((story) => story.slug === currentSlug);
  if (currentIndex === -1) return undefined;
  return stories[(currentIndex + 1) % stories.length];
}

export function getRelatedStories(currentSlug: string, limit = 4): StoryRecord[] {
  const currentStory = getStoryBySlug(currentSlug);
  if (!currentStory) return [];

  const sameCategory = stories.filter(
    (story) => story.slug !== currentSlug && story.category === currentStory.category,
  );

  if (sameCategory.length >= limit) {
    return sameCategory.slice(0, limit);
  }

  const fallback = stories.filter(
    (story) => story.slug !== currentSlug && story.category !== currentStory.category,
  );

  return [...sameCategory, ...fallback].slice(0, limit);
}

export function getStoriesByCategory(
  category: StoryCategory,
  options?: { excludeSlug?: string; limit?: number },
): StoryRecord[] {
  const { excludeSlug, limit = 4 } = options ?? {};
  return stories
    .filter((story) => story.category === category && story.slug !== excludeSlug)
    .slice(0, limit);
}

export function normalizeLanguage(value: unknown): StoryLanguage {
  if (value === "bn" || value === "ur" || value === "en") {
    return value;
  }
  return "en";
}

export function getStoryTitle(story: StoryRecord, language: StoryLanguage): string {
  if (language === "bn") return story.title_bn;
  if (language === "ur") return story.title_ur;
  return story.title_en;
}

export function getStoryContent(story: StoryRecord, language: StoryLanguage): string {
  if (language === "bn") return story.content_bn;
  if (language === "ur") return story.content_ur;
  return story.content_en;
}

export function getStoryMoral(story: StoryRecord, language: StoryLanguage): string {
  if (language === "bn") return story.moral_bn;
  if (language === "ur") return story.moral_ur;
  return story.moral_en;
}

export function getCategoryLabel(category: StoryCategory): string {
  return categoryLabels[category];
}

export function getPreviewText(content: string, wordCount = 36): string {
  const words = content.trim().split(/\s+/);
  if (words.length <= wordCount) return content;
  return `${words.slice(0, wordCount).join(" ")}...`;
}

export function toOgImage1200x630(url?: string): string | undefined {
  if (!url) return undefined;

  if (url.includes("source.unsplash.com/")) {
    return url.replace(/source\.unsplash\.com\/\d+x\d+\//, "source.unsplash.com/1200x630/");
  }

  if (url.includes("picsum.photos/")) {
    return url.replace(/picsum\.photos\/\d+\/\d+/, "picsum.photos/1200/630");
  }

  if (url.includes("via.placeholder.com/")) {
    return url.replace(/via\.placeholder\.com\/\d+x\d+/, "via.placeholder.com/1200x630");
  }

  return url.replace(/\b\d{2,4}x\d{2,4}\b/, "1200x630");
}

export function getStoryOgImage(story: StoryRecord): string {
  const seoImage = story.seo?.open_graph?.["og:image"];
  const heroImage = story.image?.url;
  const firstSceneImage = story.scenes?.[0]?.image?.url;

  return (
    toOgImage1200x630(seoImage) ??
    toOgImage1200x630(heroImage) ??
    toOgImage1200x630(firstSceneImage) ??
    "https://noorapp.in/assets/noorapp-islamic-stories-og-1200x630.jpg"
  );
}
