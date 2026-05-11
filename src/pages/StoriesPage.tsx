import { useMemo, useState } from "react";
import { LanguageSwitch } from "@/components/stories/language-switch";
import { StoryCard } from "@/components/story/StoryCard";
import { StoryHero } from "@/components/story/StoryHero";
import {
  getAllIslamicStories,
  getLocalizedSummary,
  getLocalizedTitle,
  getStoryReadTime,
  getStoryImage,
  type StoryLanguage,
} from "@/lib/islamic-stories";

interface StoriesPageProps {
  language: StoryLanguage;
}

const PAGE_SIZE = 9;

const COPY: Record<StoryLanguage, {
  eyebrow: string;
  title: string;
  subtitle: string;
  search: string;
  allCategories: string;
  loadMore: string;
}> = {
  en: {
    eyebrow: "NoorApp Stories",
    title: "Islamic Stories Collection",
    subtitle: "Bengali Islamic stories, lessons and inspiration based on the Qur'an and authentic sources.",
    search: "Search stories...",
    allCategories: "All categories",
    loadMore: "Load more stories",
  },
  bn: {
    eyebrow: "NOORAPP STORIES",
    title: "ইসলামিক গল্পসম্ভার",
    subtitle: "কুরআন ও সহীহ সূত্রভিত্তিক বাংলা ইসলামিক গল্প, শিক্ষা ও অনুপ্রেরণা।",
    search: "গল্প খুঁজুন...",
    allCategories: "সব ক্যাটাগরি",
    loadMore: "আরও গল্প দেখুন",
  },
  ur: {
    eyebrow: "NOORAPP STORIES",
    title: "اسلامی کہانیاں",
    subtitle: "قرآن اور صحیح ذرائع پر مبنی اسلامی کہانیاں، اسباق اور تحریک۔",
    search: "کہانی تلاش کریں...",
    allCategories: "تمام زمرے",
    loadMore: "مزید کہانیاں",
  },
};

export function StoriesPage({ language }: StoriesPageProps) {
  const allStories = getAllIslamicStories();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const t = COPY[language];
  const dir = language === "ur" ? "rtl" : "ltr";

  const categories = useMemo(() => {
    return ["all", ...Array.from(new Set(allStories.map((story) => story.category)))];
  }, [allStories]);

  const filteredStories = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return allStories.filter((story) => {
      const inCategory = selectedCategory === "all" || story.category === selectedCategory;
      const title = getLocalizedTitle(story, language).toLowerCase();
      const summary = getLocalizedSummary(story, language).toLowerCase();
      const matchesSearch = q.length === 0 || title.includes(q) || summary.includes(q);
      return inCategory && matchesSearch;
    });
  }, [allStories, language, searchTerm, selectedCategory]);

  const featuredStory = filteredStories[0] ?? allStories[0];
  const visibleStories = filteredStories.slice(0, visibleCount);

  return (
    <main className="min-h-screen bg-background px-4 py-6 md:px-8 md:py-10" dir={dir}>
      <section className="mx-auto w-full max-w-6xl space-y-6 md:space-y-8">
        <header className="story-header-panel">
          <div>
            <p className="story-eyebrow">{t.eyebrow}</p>
            <h1 className="story-title-display">{t.title}</h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">{t.subtitle}</p>
          </div>
          <LanguageSwitch currentLanguage={language} />
        </header>

        <section className="space-y-4 rounded-lg border border-border bg-card p-4 md:p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder={t.search}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <select
              value={selectedCategory}
              onChange={(event) => {
                setSelectedCategory(event.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? t.allCategories : category.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        </section>

        {featuredStory && (
          <StoryHero
            title={getLocalizedTitle(featuredStory, language)}
            subtitle={getLocalizedSummary(featuredStory, language)}
            imageUrl={getStoryImage(featuredStory)}
            category={featuredStory.category.replace(/_/g, " ")}
            readTime={getStoryReadTime(featuredStory)}
          />
        )}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleStories.map((story) => (
            <StoryCard key={story.slug} story={story} language={language} />
          ))}
        </section>

        {visibleCount < filteredStories.length && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t.loadMore}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
