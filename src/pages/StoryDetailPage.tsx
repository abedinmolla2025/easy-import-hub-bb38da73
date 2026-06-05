import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Clock,
  Quote,
  Share2,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/BottomNavigation";
import FooterSection from "@/components/FooterSection";
import {
  categoryLabel,
  estimateReadingMinutes,
  nextStory,
  plainExcerpt,
  relatedStories,
  splitStoryContent,
  useStories,
  type Story,
} from "@/lib/stories";
import { toast } from "@/hooks/use-toast";

const SITE = "https://noorapp.in";

export default function StoryDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { stories, loading } = useStories();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [slug]);

  const story = stories.find((s) => s.slug === slug);

  if (!loading && !story) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-semibold">Story not found</h1>
        <p className="text-muted-foreground mt-2">The story you’re looking for doesn’t exist.</p>
        <Button asChild className="mt-6"><Link to="/stories">Browse all stories</Link></Button>
      </div>
    );
  }

  if (!story) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const readingMin = estimateReadingMinutes(story.content_en);
  const url = `${SITE}/stories/${story.slug}`;
  const blocks = splitStoryContent(story.content_en);
  const related = relatedStories(stories, story);
  const next = nextStory(stories, story);
  const quranRefs = parseQuranReferences(story.reference);
  const morals = parseMorals(story.moral_en);

  const breadcrumbs = [
    { name: "Home", url: `${SITE}/` },
    { name: "Stories", url: `${SITE}/stories` },
    { name: categoryLabel(story.category), url: `${SITE}/stories/category/${story.category}` },
    { name: story.title_en, url },
  ];

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: story.title_en,
    description: story.seo.meta_description,
    inLanguage: ["en", "bn"],
    author: { "@type": "Organization", name: "NoorApp Editorial Team" },
    publisher: {
      "@type": "Organization",
      name: "NoorApp",
      url: SITE,
      logo: { "@type": "ImageObject", url: `${SITE}/logo.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    articleSection: categoryLabel(story.category),
    keywords: Array.isArray(story.seo.keywords) ? story.seo.keywords.join(", ") : story.seo.keywords,
    isBasedOn: story.source_name,
    citation: story.reference,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.name,
      item: b.url,
    })),
  };

  const handleShare = async () => {
    const shareData = {
      title: story.title_en,
      text: story.engagement?.share_caption || story.seo.meta_description,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied", description: "Story URL copied to clipboard." });
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Helmet>
        <title>{story.seo.title}</title>
        <meta name="description" content={story.seo.meta_description} />
        {story.seo.keywords && (
          <meta
            name="keywords"
            content={Array.isArray(story.seo.keywords) ? story.seo.keywords.join(", ") : story.seo.keywords}
          />
        )}
        <link rel="canonical" href={story.seo.canonical_url || url} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={story.seo.open_graph?.title || story.seo.title} />
        <meta property="og:description" content={story.seo.open_graph?.description || story.seo.meta_description} />
        <meta property="og:url" content={url} />
        <meta property="article:section" content={categoryLabel(story.category)} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={story.seo.title} />
        <meta name="twitter:description" content={story.seo.meta_description} />
        <link rel="alternate" hrefLang="en" href={url} />
        <link rel="alternate" hrefLang="bn" href={url} />
        <link rel="alternate" hrefLang="x-default" href={url} />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      {/* Header */}
      <header className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <nav aria-label="Breadcrumb" className="text-sm text-emerald-100/80 mb-3 flex flex-wrap items-center gap-1">
            <Link to="/" className="hover:text-white">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/stories" className="hover:text-white">Stories</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to={`/stories/category/${story.category}`} className="hover:text-white">
              {categoryLabel(story.category)}
            </Link>
          </nav>
          <Badge variant="secondary" className="mb-3">{categoryLabel(story.category)}</Badge>
          <h1 className="text-2xl md:text-4xl font-bold leading-tight">{story.title_en}</h1>
          {story.title_bn && (
            <p className="mt-2 text-lg md:text-xl text-emerald-50/90 font-[Noto_Sans_Bengali]">
              {story.title_bn}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-emerald-50/90">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {readingMin} min read</span>
            {story.source_name && (
              <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" /> {story.source_name}</span>
            )}
            <span className="flex items-center gap-1">By NoorApp Editorial Team</span>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button variant="secondary" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1" /> Share
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 grid lg:grid-cols-[1fr_320px] gap-8">
        {/* Main */}
        <article className="space-y-8">
          {/* Quran References */}
          {quranRefs.length > 0 && (
            <Card className="border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/10">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Quote className="h-4 w-4" /> Quran References
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {quranRefs.map((r) => <li key={r}>{r}</li>)}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Body */}
          <div className="prose prose-emerald max-w-none dark:prose-invert">
            {blocks.map((b, i) =>
              b.type === "h2" ? (
                <h2 key={i} className="text-xl md:text-2xl font-semibold mt-8 mb-3">{b.text}</h2>
              ) : (
                <p key={i} className="leading-relaxed mb-4 text-foreground/90">{b.text}</p>
              ),
            )}
          </div>

          {/* Bengali content collapsed below for readers */}
          {story.content_bn && (
            <details className="rounded-lg border bg-card p-4">
              <summary className="cursor-pointer font-medium font-[Noto_Sans_Bengali]">
                বাংলায় পড়ুন (Read in Bengali)
              </summary>
              <div className="mt-4 space-y-3 font-[Noto_Sans_Bengali] leading-relaxed">
                {splitStoryContent(story.content_bn).map((b, i) =>
                  b.type === "h2" ? (
                    <h3 key={i} className="text-lg font-semibold mt-4">{b.text}</h3>
                  ) : (
                    <p key={i}>{b.text}</p>
                  ),
                )}
              </div>
            </details>
          )}

          {/* Key Lessons / Moral */}
          {morals.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/40 dark:bg-amber-950/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-amber-600" /> Key Lessons
                </CardTitle>
                <CardDescription>What we can take from this story.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2">
                  {morals.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {story.source_name && (
                <p><span className="font-medium">Primary source:</span> {story.source_name}</p>
              )}
              {story.reference && (
                <p><span className="font-medium">Quran references:</span> {story.reference}</p>
              )}
              {story.source_detail && <p className="text-muted-foreground">{story.source_detail}</p>}
              <p className="text-muted-foreground pt-2 border-t">
                Reviewed by the NoorApp Editorial Team. Translations are summarized for general readers — please
                consult qualified scholars and the original Arabic Quran for in-depth study.
              </p>
            </CardContent>
          </Card>

          {/* Read next */}
          {next && (
            <Card className="border-emerald-200">
              <CardHeader>
                <CardDescription>Read next</CardDescription>
                <CardTitle className="text-xl">
                  <Link to={`/stories/${next.slug}`} className="hover:underline">{next.title_en}</Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{plainExcerpt(next.seo.meta_description)}</p>
                <Button asChild size="sm">
                  <Link to={`/stories/${next.slug}`}>Continue reading <ChevronRight className="h-4 w-4" /></Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </article>

        {/* Sidebar */}
        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Share this story</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <ShareLink href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}>Facebook</ShareLink>
              <ShareLink href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(story.title_en)}`}>X / Twitter</ShareLink>
              <ShareLink href={`https://api.whatsapp.com/send?text=${encodeURIComponent(story.title_en + " " + url)}`}>WhatsApp</ShareLink>
              <ShareLink href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(story.title_en)}`}>Telegram</ShareLink>
            </CardContent>
          </Card>

          {related.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Related stories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    to={`/stories/${r.slug}`}
                    className="block group"
                  >
                    <Badge variant="outline" className="text-xs">{categoryLabel(r.category)}</Badge>
                    <p className="mt-1 font-medium leading-snug group-hover:text-emerald-700">{r.title_en}</p>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Explore more</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><Link to={`/stories/category/${story.category}`} className="text-emerald-700 hover:underline">
                More {categoryLabel(story.category)} →
              </Link></p>
              <p><Link to="/stories" className="text-emerald-700 hover:underline">All Islamic stories →</Link></p>
              <p><Link to="/quran" className="text-emerald-700 hover:underline">Read the Quran →</Link></p>
              <p><Link to="/hadith" className="text-emerald-700 hover:underline">Browse Hadith →</Link></p>
              <p><Link to="/dua" className="text-emerald-700 hover:underline">Daily Duas →</Link></p>
            </CardContent>
          </Card>
        </aside>
      </div>

      <FooterSection platform="web" onNavigate={(path) => navigate(path)} />
      <BottomNavigation />
    </div>
  );
}

function ShareLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-full border px-3 py-1 text-xs hover:bg-muted"
    >
      {children}
    </a>
  );
}

function parseQuranReferences(ref?: string): string[] {
  if (!ref) return [];
  return ref.split(/[,;]/).map((r) => r.trim()).filter(Boolean);
}

function parseMorals(text?: string): string[] {
  if (!text) return [];
  // Split on numbered items "1.", bullets "-" or newlines
  const parts = text
    .split(/(?:\n+|(?:\d+\.\s)|(?:^|\s)-\s)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 6);
  return parts.length > 1 ? parts : text ? [text.trim()] : [];
}