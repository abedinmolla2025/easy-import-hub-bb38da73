import storiesJson from "@/data/islamic_stories.json";
import imgProphets from "@/assets/stories/prophets.jpg";
import imgHistory from "@/assets/stories/islamic-history.jpg";
import imgEvents from "@/assets/stories/islamic_historical_events.jpg";
import imgSahaba from "@/assets/stories/sahaba.jpg";
import imgInspirational from "@/assets/stories/inspirational.jpg";
import imgKids from "@/assets/stories/kids_friendly.jpg";

const CATEGORY_IMAGES: Record<string, string> = {
  prophets: imgProphets,
  "islamic-history": imgHistory,
  islamic_historical_events: imgEvents,
  sahaba: imgSahaba,
  inspirational: imgInspirational,
  kids_friendly: imgKids,
};

export type StoryLanguage = "en" | "bn" | "ur";

export interface IslamicStory {
  id: number;
  slug: string;
  category: string;
  title_bn: string;
  title_en: string;
  title_ur?: string;
  content_bn: string;
  content_en?: string;
  content_ur?: string;
  moral_bn?: string;
  moral_en?: string;
  moral_ur?: string;
  summary_bn?: string;
  lessons?: string[];
  read_time?: string;
  image_url?: string;
  scenes?: Array<{ heading: string; image_url: string; caption?: string }>;
  date_published?: string;
  date_modified?: string;
  reference?: string;
  source_name?: string;
  source_detail?: string;
  seo?: {
    title?: string;
    meta_description?: string;
    canonical_url?: string;
    keywords?: string[];
    open_graph?: {
      "og:title"?: string;
      "og:description"?: string;
      "og:image"?: string;
      "og:url"?: string;
    };
  };
  navigation?: {
    next_story?: { title?: string; slug?: string };
    related_stories?: Array<{ title?: string; slug?: string }>;
    category_link?: string;
  };
}

const stories = storiesJson as IslamicStory[];

export function getAllIslamicStories(): IslamicStory[] {
  return stories;
}

export function getIslamicStoryBySlug(slug: string): IslamicStory | undefined {
  return stories.find((story) => story.slug === slug);
}

export function normalizeStoryLanguage(value: unknown): StoryLanguage {
  if (value === "bn" || value === "ur" || value === "en") return value;
  return "bn";
}

export function getLocalizedTitle(story: IslamicStory, language: StoryLanguage): string {
  if (language === "en") return story.title_en;
  if (language === "ur") return story.title_ur ?? story.title_bn;
  return story.title_bn;
}

export function getLocalizedContent(story: IslamicStory, language: StoryLanguage): string {
  if (language === "en") return story.content_en ?? story.content_bn;
  if (language === "ur") return story.content_ur ?? story.content_bn;
  return story.content_bn;
}

export function getStoryImage(story: IslamicStory): string {
  return (
    story.image_url ??
    CATEGORY_IMAGES[story.category] ??
    story.seo?.open_graph?.["og:image"] ??
    imgInspirational
  );
}

export function getStorySummaryBn(story: IslamicStory): string {
  if (story.summary_bn?.trim()) return story.summary_bn.trim();
  const text = story.content_bn.replace(/\s+/g, " ").trim();
  const words = text.split(" ");
  return words.slice(0, 34).join(" ") + (words.length > 34 ? "..." : "");
}

export function getLocalizedSummary(story: IslamicStory, language: StoryLanguage): string {
  const content = getLocalizedContent(story, language).replace(/\s+/g, " ").trim();
  const words = content.split(" ");
  const limit = language === "en" ? 40 : 34;
  return words.slice(0, limit).join(" ") + (words.length > limit ? "..." : "");
}

export function getStoryReadTime(story: IslamicStory): string {
  if (story.read_time?.trim()) return story.read_time;
  const wordCount = story.content_bn.trim().split(/\s+/).length;
  const minutes = Math.max(2, Math.ceil(wordCount / 180));
  return `${minutes} min read`;
}

export function getStoryLessons(story: IslamicStory): string[] {
  if (Array.isArray(story.lessons) && story.lessons.length > 0) {
    return story.lessons;
  }

  const moral = story.moral_bn?.trim();
  if (!moral) return [];

  return moral
    .split(/[।.!?]/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 4);
}

export function getRelatedStories(current: IslamicStory, limit = 3): IslamicStory[] {
  const byNavigation = (current.navigation?.related_stories ?? [])
    .map((entry) => getIslamicStoryBySlug(entry.slug ?? ""))
    .filter((story): story is IslamicStory => story !== undefined && story.slug !== current.slug);

  if (byNavigation.length >= limit) return byNavigation.slice(0, limit);

  const categoryMatches = stories.filter(
    (story) => story.slug !== current.slug && story.category === current.category,
  );

  const combined = [...byNavigation, ...categoryMatches].filter(
    (story, index, arr) => arr.findIndex((item) => item.slug === story.slug) === index,
  );

  return combined.slice(0, limit);
}

export function getPreviousAndNextStory(currentSlug: string): {
  previousStory?: IslamicStory;
  nextStory?: IslamicStory;
} {
  const currentIndex = stories.findIndex((story) => story.slug === currentSlug);
  if (currentIndex === -1) return {};

  const previousStory = stories[(currentIndex - 1 + stories.length) % stories.length];
  const navNextSlug = stories[currentIndex].navigation?.next_story?.slug;
  const navNext = navNextSlug ? getIslamicStoryBySlug(navNextSlug) : undefined;
  const nextStory = navNext ?? stories[(currentIndex + 1) % stories.length];

  return { previousStory, nextStory };
}

export function getStoryCanonicalUrl(story: IslamicStory): string {
  return story.seo?.canonical_url ?? `https://noorapp.in/stories/${story.slug}`;
}

const DEFAULT_DATE = "2025-01-01T00:00:00.000Z";

export function getStoryDatePublished(story: IslamicStory): string {
  return story.date_published ?? DEFAULT_DATE;
}

export function getStoryDateModified(story: IslamicStory): string {
  return story.date_modified ?? story.date_published ?? DEFAULT_DATE;
}
