import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Clock,
  Languages,
  Quote,
  Share2,
  Sparkles,
  Facebook,
  Twitter,
  MessageCircle,
  Send,
  Link2,
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
import ogStoriesDefault from "@/assets/stories/og-stories-default.jpg";
import heroAdam from "@/assets/stories/hero-adam.jpg";
import heroNuh from "@/assets/stories/hero-nuh.jpg";
import heroIbrahim from "@/assets/stories/hero-ibrahim.jpg";
import heroMusa from "@/assets/stories/hero-musa.jpg";
import heroYusuf from "@/assets/stories/hero-yusuf.jpg";

const SITE = "https://noorapp.in";

const STORY_OG_IMAGES: Record<string, string> = {
  "prophet-adam-story-islam": heroAdam,
  "prophet-nuh-story-islam": heroNuh,
  "prophet-ibrahim-story-islam": heroIbrahim,
  "prophet-musa-story-islam": heroMusa,
  "prophet-yusuf-story-islam": heroYusuf,
};

function absoluteUrl(path: string): string {
  if (!path) return `${SITE}${ogStoriesDefault}`;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE}${path.startsWith("/") ? "" : "/"}${path}`;
}

function cacheBustUrl(url: string, version: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${encodeURIComponent(version)}`;
}

export default function StoryDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { stories, loading } = useStories();
  const navigate = useNavigate();
  const [lang, setLang] = useState<"en" | "bn">("bn");

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
  const blocks = splitStoryContent(lang === "bn" ? story.content_bn : story.content_en);
  const related = relatedStories(stories, story);
  const next = nextStory(stories, story);
  const quranRefs = parseQuranReferences(story.reference);
  const morals = parseMorals(lang === "bn" ? story.moral_bn : story.moral_en);
  const ogImagePath = story.og_image_url || STORY_OG_IMAGES[story.slug] || ogStoriesDefault;
  const ogImageBase = absoluteUrl(ogImagePath);
  const ogImage = story.updated_at ? cacheBustUrl(ogImageBase, story.updated_at) : ogImageBase;
  
  // Construct Viral Bengali Share Text
  const storyTitle = story.title_bn || story.title_en;
  const viralShareText = `🌟 ${storyTitle}\n\nএই হৃদয়স্পর্শী ইসলামিক গল্পটি পড়ে আমার খুব ভালো লেগেছে। আপনিও পড়ুন এবং অন্যদের সাথে শেয়ার করে সদকা-এ-জারিয়ার সওয়াব হাসিল করুন। 🤲✨\n\nপড়ুন এখানে: ${url}`;

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(viralShareText)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(viralShareText)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(viralShareText)}`,
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    toast({ title: "লিংক কপি হয়েছে", description: "গল্পের লিংকটি কপি করা হয়েছে।" });
  };

  const handleNativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: storyTitle,
          text: viralShareText,
          url: url,
        });
      } else {
        copyToClipboard();
      }
    } catch (err) {
      console.log("Share failed", err);
    }
  };

  const breadcrumbs = [
    { name: "Home", url: `${SITE}/` },
    { name: "Stories", url: `${SITE}/stories` },
    { name: categoryLabel(story.category), url: `${SITE}/stories/category/${story.category}` },
    { name: lang === "bn" ? story.title_bn : story.title_en, url },
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
    image: { "@type": "ImageObject", url: ogImage, width: 1200, height: 630 },
    datePublished: "2024-01-01",
    dateModified: new Date().toISOString().slice(0, 10),
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
        <meta property="og:site_name" content="NoorApp" />
        <meta property="og:locale" content="bn_BD" />
        <meta property="og:locale:alternate" content="en_US" />
        <meta property="og:title" content={story.seo.open_graph?.title || story.seo.title} />
        <meta property="og:description" content={story.seo.open_graph?.description || story.seo.meta_description} />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:secure_url" content={ogImage} />
        <meta property="og:image:type" content={/\.png(?:\?|$)/i.test(ogImage) ? "image/png" : /\.webp(?:\?|$)/i.test(ogImage) ? "image/webp" : "image/jpeg"} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={story.title_en} />
        <meta property="article:section" content={categoryLabel(story.category)} />
        <meta property="article:author" content="NoorApp Editorial Team" />
        {Array.isArray(story.seo.keywords) &&
          story.seo.keywords.slice(0, 6).map((k) => (
            <meta key={k} property="article:tag" content={k} />
          ))}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@noorapp" />
        <meta name="twitter:title" content={story.seo.open_graph?.title || story.seo.title} />
        <meta name="twitter:description" content={story.seo.open_graph?.description || story.seo.meta_description} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:image:alt" content={story.title_en} />
        <meta name="pinterest:description" content={story.seo.open_graph?.description || story.seo.meta_description} />
        <meta name="pinterest:media" content={ogImage} />
        <meta name="thumbnail" content={ogImage} />
        <meta itemProp="image" content={ogImage} />
        <meta itemProp="name" content={story.seo.open_graph?.title || story.seo.title} />
        <meta itemProp="description" content={story.seo.open_graph?.description || story.seo.meta_description} />
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
          <h1 className="text-2xl md:text-4xl font-bold leading-tight">
            {lang === "bn" ? story.title_bn : story.title_en}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-emerald-50/90">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {readingMin} min read</span>
            {story.source_name && (
              <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" /> {story.source_name}</span>
            )}
            <span className="flex items-center gap-1">By NoorApp Editorial Team</span>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            {story.content_bn && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setLang((prev) => (prev === "en" ? "bn" : "en"));
                }}
                className="font-[Noto_Sans_Bengali]"
              >
                <Languages className="h-4 w-4 mr-1" /> {lang === "en" ? "বাংলায় পড়ুন" : "Read in English"}
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={handleNativeShare}>
              <Share2 className="h-4 w-4 mr-1" /> Share
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 grid lg:grid-cols-[1fr_320px] gap-8">
        {/* Main */}
        <article className="space-y-8">
          {/* Story Image */}
          <div className="rounded-xl overflow-hidden shadow-lg border border-border">
            <img 
              src={ogImage} 
              alt={story.title_en} 
              className="w-full aspect-video object-cover"
            />
          </div>

          {/* Social Share Buttons - Top */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Share2 className="h-4 w-4" /> এই গল্পটি শেয়ার করুন:
            </p>
            <div className="flex flex-wrap gap-2">
              <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white gap-2">
                  <Facebook className="h-4 w-4" /> Facebook
                </Button>
              </a>
              <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="bg-[#25D366] hover:bg-[#25D366]/90 text-white gap-2">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </Button>
              </a>
              <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="bg-[#1DA1F2] hover:bg-[#1DA1F2]/90 text-white gap-2">
                  <Twitter className="h-4 w-4" /> Twitter
                </Button>
              </a>
              <a href={shareLinks.telegram} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="bg-[#0088cc] hover:bg-[#0088cc]/90 text-white gap-2">
                  <Send className="h-4 w-4" /> Telegram
                </Button>
              </a>
              <Button size="sm" variant="outline" onClick={copyToClipboard} className="gap-2">
                <Link2 className="h-4 w-4" /> Copy Link
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className={`space-y-4 leading-relaxed ${lang === "bn" ? "font-[Noto_Sans_Bengali]" : "prose prose-emerald max-w-none dark:prose-invert"}`}>
            {blocks.map((b, i) =>
              b.type === "h2" ? (
                <h2 key={i} className="text-xl md:text-2xl font-semibold mt-8 mb-3 text-emerald-800 dark:text-emerald-400 border-l-4 border-emerald-500 pl-3">
                  {b.text}
                </h2>
              ) : (
                <p key={i} className="mb-4 text-foreground/90 text-lg">
                  {b.text}
                </p>
              ),
            )}
            
            {lang === "bn" && story.moral_bn && (
              <div className="mt-8 p-6 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border-l-4 border-emerald-600 shadow-sm">
                <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-400 mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5" /> এই গল্পের শিক্ষা:
                </h3>
                <p className="text-lg text-emerald-900 dark:text-emerald-100 italic">
                  {story.moral_bn}
                </p>
              </div>
            )}
          </div>

          {/* Social Share Buttons - Bottom */}
          <Card className="border-emerald-100 bg-emerald-50/30 dark:bg-emerald-950/10">
            <CardContent className="py-6 text-center">
              <h3 className="text-lg font-semibold mb-4 flex items-center justify-center gap-2">
                <Share2 className="h-5 w-5 text-emerald-600" /> ভালো কথা ছড়িয়ে দেওয়াও একটি সদকা!
              </h3>
              <div className="flex flex-wrap justify-center gap-3">
                <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="border-[#1877F2] text-[#1877F2] hover:bg-[#1877F2] hover:text-white rounded-full px-6">
                    <Facebook className="h-4 w-4 mr-2" /> Facebook
                  </Button>
                </a>
                <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white rounded-full px-6">
                    <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
                  </Button>
                </a>
                <Button variant="outline" onClick={copyToClipboard} className="rounded-full px-6">
                  <Link2 className="h-4 w-4 mr-2" /> Copy Link
                </Button>
              </div>
            </CardContent>
          </Card>

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

          {/* Related Stories */}
          {related.length > 0 && (
            <section className="pt-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-600" /> আরও পড়ুন
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {related.map((s) => (
                  <Link key={s.slug} to={`/stories/${s.slug}`}>
                    <Card className="h-full hover:shadow-md transition-shadow overflow-hidden group">
                      <div className="aspect-video overflow-hidden">
                        <img 
                          src={s.og_image_url || ogStoriesDefault} 
                          alt={s.title_en} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <CardHeader className="p-4">
                        <CardTitle className="text-base group-hover:text-emerald-700">
                          {lang === "bn" ? s.title_bn : s.title_en}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>

        {/* Sidebar */}
        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">About this Story</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Source</p>
                <p className="font-medium">{story.source_name || "Classical Islamic Sources"}</p>
              </div>
              {story.source_detail && (
                <div>
                  <p className="text-muted-foreground mb-1">Details</p>
                  <p>{story.source_detail}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground mb-1">Category</p>
                <Link to={`/stories/category/${story.category}`}>
                  <Badge variant="secondary" className="hover:bg-emerald-100">{categoryLabel(story.category)}</Badge>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Next Story Card */}
          {next && (
            <Card className="bg-emerald-900 text-white border-none overflow-hidden relative">
              <div className="absolute top-0 right-0 p-3 opacity-20">
                <Sparkles className="h-12 w-12" />
              </div>
              <CardHeader>
                <CardDescription className="text-emerald-200">পরবর্তী গল্প</CardDescription>
                <CardTitle className="text-lg leading-tight">
                  {lang === "bn" ? next.title_bn : next.title_en}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild variant="secondary" size="sm" className="w-full">
                  <Link to={`/stories/${next.slug}`}>পড়তে থাকুন</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      <FooterSection platform="web" onNavigate={(path) => navigate(path)} />
      <BottomNavigation />
    </div>
  );
}

function parseQuranReferences(ref?: string): string[] {
  if (!ref) return [];
  return ref.split(";").map((r) => r.trim()).filter(Boolean);
}

function parseMorals(moral?: string): string[] {
  if (!moral) return [];
  return moral.split("\n").map((m) => m.trim()).filter(Boolean);
}
