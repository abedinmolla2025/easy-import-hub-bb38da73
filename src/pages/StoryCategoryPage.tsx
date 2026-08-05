import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BottomNavigation from "@/components/BottomNavigation";
import FooterSection from "@/components/FooterSection";
import {
  STORY_CATEGORIES,
  categoryLabel,
  estimateReadingMinutes,
  plainExcerpt,
  useStories,
} from "@/lib/stories";

const SITE = "https://noorapp.in";

export default function StoryCategoryPage() {
  const { category } = useParams<{ category: string }>();
  const { stories, loading } = useStories();
  const navigate = useNavigate();

  const cat = category || "";
  const meta = STORY_CATEGORIES[cat];
  const items = stories.filter((s) => s.category === cat);
  const url = `${SITE}/stories/category/${cat}`;
  const label = categoryLabel(cat);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${label} — Islamic Stories`,
    url,
    description: meta?.description || `Authentic Islamic stories in the ${label} category.`,
    hasPart: items.map((s) => ({
      "@type": "Article",
      headline: s.title_en,
      url: `${SITE}/stories/${s.slug}`,
    })),
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Helmet>
        <title>{label} — Islamic Stories | NoorApp</title>
        <meta name="description" content={meta?.description || `Read authentic ${label.toLowerCase()} on NoorApp.`} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={`${label} — Islamic Stories`} />
        <meta property="og:description" content={meta?.description || ""} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <header className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <nav aria-label="Breadcrumb" className="text-sm text-emerald-100/80 mb-3 flex items-center gap-1">
            <Link to="/" className="hover:text-white">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/stories" className="hover:text-white">Stories</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">{label}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold">{label}</h1>
          {meta?.description && <p className="mt-2 text-emerald-50/90 max-w-2xl">{meta.description}</p>}
          <p className="mt-3 text-sm text-emerald-100/80">{items.length} stories</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <p className="text-muted-foreground">Loading stories…</p>
        ) : items.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">No stories in this category.</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((s) => {
              const thumbnail = s.og_image_url || "/assets/stories/og-stories-default.jpg";
              return (
                <Card key={s.slug} className="h-full flex flex-col hover:shadow-md transition-shadow overflow-hidden">
                  <div className="aspect-video w-full overflow-hidden bg-muted">
                    <Link to={`/stories/${s.slug}`}>
                      <img 
                        src={thumbnail} 
                        alt={s.title_en}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                        loading="lazy"
                      />
                    </Link>
                  </div>
                  <CardHeader className="pt-4">
                    <Badge variant="outline" className="w-fit text-xs">{categoryLabel(s.category)}</Badge>
                    <CardTitle className="text-lg leading-snug mt-2">
                      <Link to={`/stories/${s.slug}`} className="hover:text-emerald-700">{s.title_en}</Link>
                    </CardTitle>
                    <CardDescription>{plainExcerpt(s.seo.meta_description, 140)}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto text-xs text-muted-foreground flex items-center justify-between">
                    <span>{estimateReadingMinutes(s.content_en)} min read</span>
                    <Link to={`/stories/${s.slug}`} className="text-emerald-700 hover:underline">Read →</Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <FooterSection platform="web" onNavigate={(path) => navigate(path)} />
      <BottomNavigation />
    </div>
  );
}