import { useEffect, useState } from "react";

export type StoryNavRef = { title: string; slug: string };

export type Story = {
  id: number;
  slug: string;
  category: string;
  title_bn: string;
  title_en: string;
  title_ur?: string;
  content_bn: string;
  content_en: string;
  content_ur?: string;
  moral_bn?: string;
  moral_en?: string;
  moral_ur?: string;
  source_name?: string;
  reference?: string;
  source_detail?: string;
  seo: {
    title: string;
    meta_description: string;
    keywords?: string[] | string;
    slug?: string;
    canonical_url?: string;
    open_graph?: Record<string, string>;
  };
  navigation?: {
    next_story?: StoryNavRef;
    related_stories?: StoryNavRef[];
    category_link?: string;
  };
  ads?: unknown;
  engagement?: { share_caption?: string; cta?: string };
  growth?: {
    read_next?: StoryNavRef;
    related?: StoryNavRef[];
    category?: string;
  };
};

export const STORY_CATEGORIES: Record<string, { label: string; description: string }> = {
  prophets: {
    label: "Stories of the Prophets",
    description: "Lives, struggles and lessons of the Anbiya (peace be upon them).",
  },
  sahaba: {
    label: "Companions of the Prophet",
    description: "Faith and sacrifice of the Sahaba (may Allah be pleased with them).",
  },
  islamic_historical_events: {
    label: "Islamic Historical Events",
    description: "Pivotal moments that shaped Islamic civilization.",
  },
  "islamic-history": {
    label: "Islamic History",
    description: "Stories from Islamic history.",
  },
  inspirational: {
    label: "Inspirational Stories",
    description: "Faith-filled stories that strengthen the heart.",
  },
  kids_friendly: {
    label: "Stories for Kids",
    description: "Easy, engaging Islamic stories for young readers.",
  },
};

export function categoryLabel(slug: string): string {
  return STORY_CATEGORIES[slug]?.label ?? slug.replace(/[_-]/g, " ");
}

export function categorySlug(raw: string): string {
  return raw;
}

let cache: Story[] | null = null;
let pending: Promise<Story[]> | null = null;

export async function loadStories(): Promise<Story[]> {
  if (cache) return cache;
  if (pending) return pending;
  pending = fetch("/stories.json", { cache: "force-cache" })
    .then((r) => r.json() as Promise<Story[]>)
    .then((data) => {
      cache = data;
      pending = null;
      return data;
    })
    .catch(async (err) => {
      pending = null;
      // Fallback to bundled copy
      const mod = await import("@/data/stories.json");
      cache = mod.default as unknown as Story[];
      return cache;
    });
  return pending;
}

export function useStories() {
  const [stories, setStories] = useState<Story[] | null>(cache);
  const [loading, setLoading] = useState(!cache);
  useEffect(() => {
    if (cache) return;
    let active = true;
    loadStories().then((d) => {
      if (!active) return;
      setStories(d);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);
  return { stories: stories ?? [], loading };
}

export function estimateReadingMinutes(text: string): number {
  const words = (text || "").trim().split(/\s+/).length;
  return Math.max(2, Math.round(words / 200));
}

export function plainExcerpt(text: string, max = 180): string {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max - 1) + "…" : clean;
}

/**
 * Split content that uses bare section headings (e.g. "Beginning", "The Test")
 * separated by blank lines into paragraphs/headings for rendering.
 */
export function splitStoryContent(content: string): Array<{ type: "h2" | "p"; text: string }> {
  const blocks = (content || "")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  return blocks.map((b) => {
    const isHeading = b.length < 80 && !/[।.!?]$/.test(b) && b.split(/\s+/).length <= 10;
    return { type: isHeading ? ("h2" as const) : ("p" as const), text: b };
  });
}

export function relatedStories(all: Story[], story: Story, limit = 3): Story[] {
  const refs = story.navigation?.related_stories ?? story.growth?.related ?? [];
  const bySlug = new Map(all.map((s) => [s.slug, s]));
  const out: Story[] = [];
  for (const r of refs) {
    const s = bySlug.get(r.slug);
    if (s && s.slug !== story.slug) out.push(s);
    if (out.length >= limit) return out;
  }
  // Fill remaining from same category
  for (const s of all) {
    if (out.length >= limit) break;
    if (s.slug === story.slug) continue;
    if (s.category === story.category && !out.find((o) => o.slug === s.slug)) out.push(s);
  }
  return out;
}

export function nextStory(all: Story[], story: Story): Story | null {
  const ref = story.navigation?.next_story ?? story.growth?.read_next;
  if (ref) {
    const found = all.find((s) => s.slug === ref.slug);
    if (found) return found;
  }
  const idx = all.findIndex((s) => s.slug === story.slug);
  return idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;
}