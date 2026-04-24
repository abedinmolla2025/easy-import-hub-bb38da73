import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, ChevronRight } from "lucide-react";

import BottomNavigation from "@/components/BottomNavigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getHadithArticleBySlug, getRelatedHadith } from "@/lib/hadithArticles";
import NotFound from "@/pages/NotFound";

const SITE_ORIGIN = "https://noorapp.in";
const OG_IMAGE = `${SITE_ORIGIN}/og-bukhari.png`;

const LANGUAGE_TABS = [
  { value: "bn", label: "বাংলা" },
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी" },
  { value: "ur", label: "اردو" },
] as const;

export default function HadithArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const article = getHadithArticleBySlug(slug);

  if (!article) return <NotFound />;

  const canonical = `${SITE_ORIGIN}/hadith/${article.slug}`;
  const related = getRelatedHadith(article);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription,
    image: OG_IMAGE,
    url: canonical,
    inLanguage: "bn-BD",
    isPartOf: { "@type": "CreativeWork", name: "Sahih al-Bukhari" },
    citation: article.reference,
    publisher: { "@type": "Organization", name: "Noor", url: SITE_ORIGIN },
    mainEntityOfPage: canonical,
  };

  return (
    <main className="min-h-screen bg-background pb-24 text-foreground">
      <Helmet>
        <title>{article.seoTitle}</title>
        <meta name="description" content={article.metaDescription} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={article.seoTitle} />
        <meta property="og:description" content={article.metaDescription} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={OG_IMAGE} />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <article className="mx-auto max-w-3xl px-4 py-5 sm:px-6">
        <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/hadith" className="hover:text-primary">Hadith</Link>
          <ChevronRight className="h-3 w-3" />
          <span>{article.title}</span>
        </nav>

        <Link to="/hadith" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
          <ArrowLeft className="h-4 w-4" /> হাদিস তালিকায় ফিরে যান
        </Link>

        <header className="space-y-3 border-b border-border pb-5">
          <div className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            <BookOpen className="h-3.5 w-3.5" /> Sahih al-Bukhari
          </div>
          <h1 className="text-3xl font-bold leading-tight tracking-normal sm:text-4xl">{article.title}</h1>
          <p className="text-sm font-medium text-muted-foreground">{article.reference}</p>
        </header>

        <section className="mt-6 space-y-4" aria-labelledby="hadith-content">
          <h2 id="hadith-content" className="text-xl font-semibold">হাদিসের মূল বক্তব্য</h2>
          {article.arabic ? (
            <p dir="rtl" lang="ar" className="rounded-md border border-border bg-card p-4 text-right text-2xl leading-loose">
              {article.arabic}
            </p>
          ) : null}

          <Tabs defaultValue="bn" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {LANGUAGE_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
              ))}
            </TabsList>
            {LANGUAGE_TABS.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="rounded-md border border-border bg-card p-4">
                <p dir={tab.value === "ur" ? "rtl" : "ltr"} className="text-base leading-8 text-card-foreground">
                  {article.translations[tab.value]}
                </p>
              </TabsContent>
            ))}
          </Tabs>
        </section>

        <section className="mt-8 space-y-4" aria-labelledby="explanation">
          <h2 id="explanation" className="text-2xl font-bold">বাংলা ব্যাখ্যা ও প্রেক্ষাপট</h2>
          {article.explanation.map((paragraph) => (
            <p key={paragraph.slice(0, 32)} className="text-base leading-8 text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </section>

        <section className="mt-8 space-y-3" aria-labelledby="lessons">
          <h2 id="lessons" className="text-2xl font-bold">এই হাদিস থেকে শিক্ষা</h2>
          <ul className="list-disc space-y-2 pl-5 text-base leading-7 text-muted-foreground">
            {article.lessons.map((lesson) => <li key={lesson}>{lesson}</li>)}
          </ul>
        </section>

        <section className="mt-8 space-y-4" aria-labelledby="related-hadith">
          <h2 id="related-hadith" className="text-2xl font-bold">সম্পর্কিত হাদিস</h2>
          <div className="grid gap-3">
            {related.map((item) => (
              <Link key={item.slug} to={`/hadith/${item.slug}`} className="rounded-md border border-border bg-card p-4 transition-colors hover:bg-accent">
                <h3 className="font-semibold text-card-foreground">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.preview}</p>
              </Link>
            ))}
          </div>
        </section>
      </article>

      <BottomNavigation />
    </main>
  );
}
