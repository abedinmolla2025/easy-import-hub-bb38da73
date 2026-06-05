import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { BookOpen, Search, Sparkles, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import BottomNavigation from "@/components/BottomNavigation";
import FooterSection from "@/components/FooterSection";
import {
  STORY_CATEGORIES,
  categoryLabel,
  estimateReadingMinutes,
  plainExcerpt,
  useStories,
  type Story,
} from "@/lib/stories";

const PAGE_SIZE = 9;
const SITE = "https://noorapp.in";

export default function StoriesPage() {
  const { stories, loading } = useStories();
  const [params, setParams] = useSearchParams();
  const q = (params.get("q") || "").trim();
  const activeCat = params.get("category") || "all";
  const page = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);
  const [searchInput, setSearchInput] = useState(q);

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of stories) map[s.category] = (map[s.category] || 0) + 1;
    return map;
  }, [stories]);

  const filtered = useMemo(() => {
    return stories.filter((s) => {
      if (activeCat !== "all" && s.category !== activeCat) return false;
      if (q) {
        const hay = `${s.title_en} ${s.title_bn} ${s.seo.meta_description}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [stories, activeCat, q]);

  const featured = stories[0];
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== "page") next.delete("page");
    setParams(next, { replace: true });
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Islamic Stories — Prophets, Sahaba & History",
    url: `${SITE}/stories`,
    description:
      "Authentic Islamic stories of the Prophets, the Sahaba, and key events in Islamic history — read in Bengali and English on NoorApp.",
    hasPart: stories.slice(0, 25).map((s) => ({
      "@type": "Article",
      headline: s.title_en,
      url: `${SITE}/stories/${s.slug}`,
    })),
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Helmet>
        <title>Islamic Stories — Prophets, Sahaba & History | NoorApp</title>
        <meta
          name="description"
          content="Read authentic Islamic stories: Prophets (peace be upon them), the Sahaba, and key events of Islamic history — in Bengali and English."
        />
        <link rel="canonical" href={`${SITE}/stories`} />
        <meta property="og:title" content="Islamic Stories — Prophets, Sahaba & History" />
        <meta
          property="og:description"
          content="Authentic Islamic stories of the Prophets, the Sahaba and Islamic history, in Bengali and English."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE}/stories`} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <nav aria-label="Breadcrumb" className="text-sm text-emerald-100/80 mb-3">
            <Link to="/" className="hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-white">Stories</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <BookOpen className="h-8 w-8" /> Islamic Stories
          </h1>
          <p className="mt-3 max-w-2xl text-emerald-50/90">
            Authentic stories of the Prophets (peace be upon them), the noble Sahaba, and pivotal events from
            Islamic history — sourced from the Quran, Sahih Hadith and classical works such as <em>Stories of
            the Prophets</em> by Ibn Kathir.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateParam("q", searchInput || null);
            }}
            className="mt-6 flex gap-2 max-w-xl"
            role="search"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search stories..."
                aria-label="Search Islamic stories"
                className="pl-9 bg-white text-foreground"
              />
            </div>
            <Button type="submit" variant="secondary">Search</Button>
          </form>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 space-y-10">
        {/* Featured */}
        {featured && activeCat === "all" && !q && safePage === 1 && (
          <section aria-labelledby="featured-heading">
            <h2 id="featured-heading" className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Featured Story
            </h2>
            <Card className="overflow-hidden border-emerald-200">
              <CardHeader>
                <Badge variant="secondary" className="w-fit">{categoryLabel(featured.category)}</Badge>
                <CardTitle className="text-2xl">
                  <Link to={`/stories/${featured.slug}`} className="hover:underline">
                    {featured.title_en}
                  </Link>
                </CardTitle>
                <CardDescription className="text-base">{featured.seo.meta_description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between flex-wrap gap-2 text-sm text-muted-foreground">
                  <span>{estimateReadingMinutes(featured.content_en)} min read · {featured.source_name}</span>
                  <Button asChild size="sm">
                    <Link to={`/stories/${featured.slug}`}>Read story <ChevronRight className="h-4 w-4" /></Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Categories */}
        <section aria-labelledby="cats-heading">
          <h2 id="cats-heading" className="text-xl font-semibold mb-3">Browse by category</h2>
          <div className="flex flex-wrap gap-2">
            <CategoryChip active={activeCat === "all"} onClick={() => updateParam("category", null)}>
              All ({stories.length})
            </CategoryChip>
            {Object.keys(STORY_CATEGORIES).map((key) => {
              const count = categoryCounts[key] || 0;
              if (!count) return null;
              return (
                <CategoryChip
                  key={key}
                  active={activeCat === key}
                  onClick={() => updateParam("category", key)}
                >
                  {categoryLabel(key)} ({count})
                </CategoryChip>
              );
            })}
          </div>
        </section>

        {/* Listing */}
        <section aria-labelledby="list-heading">
          <div className="flex items-baseline justify-between mb-3">
            <h2 id="list-heading" className="text-xl font-semibold">
              {q ? `Results for “${q}”` : activeCat === "all" ? "Latest Stories" : categoryLabel(activeCat)}
            </h2>
            <span className="text-sm text-muted-foreground">{filtered.length} stories</span>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Loading stories…</p>
          ) : pageItems.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">No stories found.</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((s) => (
                <StoryListCard key={s.slug} story={s} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent>
                {safePage > 1 && (
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => { e.preventDefault(); updateParam("page", String(safePage - 1)); }}
                    />
                  </PaginationItem>
                )}
                {Array.from({ length: totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={safePage === i + 1}
                      onClick={(e) => { e.preventDefault(); updateParam("page", String(i + 1)); }}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                {safePage < totalPages && (
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => { e.preventDefault(); updateParam("page", String(safePage + 1)); }}
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}
        </section>
      </div>

      <FooterSection />
      <BottomNavigation />
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full border px-3 py-1.5 text-sm transition " +
        (active
          ? "bg-emerald-600 text-white border-emerald-600"
          : "bg-background hover:bg-muted border-border")
      }
    >
      {children}
    </button>
  );
}

function StoryListCard({ story }: { story: Story }) {
  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader>
        <Badge variant="outline" className="w-fit text-xs">{categoryLabel(story.category)}</Badge>
        <CardTitle className="text-lg leading-snug">
          <Link to={`/stories/${story.slug}`} className="hover:text-emerald-700">
            {story.title_en}
          </Link>
        </CardTitle>
        <CardDescription>{plainExcerpt(story.seo.meta_description, 140)}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto text-xs text-muted-foreground flex items-center justify-between">
        <span>{estimateReadingMinutes(story.content_en)} min read</span>
        <Link to={`/stories/${story.slug}`} className="text-emerald-700 hover:underline">Read →</Link>
      </CardContent>
    </Card>
  );
}