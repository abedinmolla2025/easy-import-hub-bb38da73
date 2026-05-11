import { Link } from "@tanstack/react-router";
import { RelatedStories } from "@/components/story/RelatedStories";
import { ShareButtons } from "@/components/story/ShareButtons";
import { StoryAdSlot } from "@/components/story/StoryAdSlot";
import { StoryContent } from "@/components/story/StoryContent";
import { StoryHero } from "@/components/story/StoryHero";
import {
  getLocalizedContent,
  getLocalizedSummary,
  getLocalizedTitle,
  getStoryDateModified,
  getStoryDatePublished,
  getStoryImage,
  getStoryLessons,
  getStoryReadTime,
  type IslamicStory,
  type StoryLanguage,
} from "@/lib/islamic-stories";

interface StoryDetailPageProps {
  story: IslamicStory;
  language: StoryLanguage;
  relatedStories: IslamicStory[];
  previousStory?: IslamicStory;
  nextStory?: IslamicStory;
  canonicalUrl: string;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function StoryDetailPage({
  story,
  language,
  relatedStories,
  previousStory,
  nextStory,
  canonicalUrl,
}: StoryDetailPageProps) {
  const content = getLocalizedContent(story, language);
  const lessons = getStoryLessons(story);
  const title = getLocalizedTitle(story, language);
  const summary = getLocalizedSummary(story, language);
  const datePublished = getStoryDatePublished(story);
  const dateModified = getStoryDateModified(story);

  return (
    <main className="min-h-screen bg-background px-4 py-6 md:px-8 md:py-10">
      <article
        className="mx-auto w-full max-w-4xl space-y-5 md:space-y-6"
        dir={language === "ur" ? "rtl" : "ltr"}
        itemScope
        itemType="https://schema.org/Article"
      >
        <header>
          <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span className="mx-1">/</span>
            <Link to="/stories" search={{ lang: language }} className="hover:text-foreground">Stories</Link>
            <span className="mx-1">/</span>
            <span className="text-foreground">{title}</span>
          </nav>

          <StoryHero
            title={title}
            subtitle={language === "bn" ? story.title_en : story.title_bn}
            imageUrl={getStoryImage(story)}
            category={story.category.replace(/_/g, " ")}
            readTime={getStoryReadTime(story)}
          />

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              By <span itemProp="author" className="text-foreground">NoorApp</span>
            </span>
            <span>
              Published{" "}
              <time dateTime={datePublished} itemProp="datePublished">
                {formatDate(datePublished)}
              </time>
            </span>
            <span>
              Updated{" "}
              <time dateTime={dateModified} itemProp="dateModified">
                {formatDate(dateModified)}
              </time>
            </span>
            <span>· {getStoryReadTime(story)}</span>
          </div>
        </header>

        <StoryAdSlot slot="after-hero" />

        <section aria-labelledby="story-body-heading" itemProp="articleBody">
          <h2 id="story-body-heading" className="sr-only">
            Story
          </h2>
          <StoryContent content={content} scenes={story.scenes} />
        </section>

        <StoryAdSlot slot="mid-content" />

        {lessons.length > 0 && (
          <section aria-labelledby="lessons-heading" className="space-y-3 rounded-lg border border-border bg-card p-5 md:p-6">
            <h2 id="lessons-heading" className="text-sm font-semibold uppercase tracking-wide text-primary">
              Key Lessons
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-card-foreground md:text-base">
              {lessons.map((lesson) => (
                <li key={lesson}>{lesson}</li>
              ))}
            </ul>
          </section>
        )}

        {(story.reference || story.source_name || story.source_detail) && (
          <section aria-labelledby="references-heading" className="space-y-2 rounded-lg border border-border bg-card p-5 md:p-6">
            <h2 id="references-heading" className="text-sm font-semibold uppercase tracking-wide text-primary">
              Quran &amp; Hadith References
            </h2>
            {story.source_name && (
              <p className="text-sm text-card-foreground">
                <span className="font-semibold">Source:</span> {story.source_name}
              </p>
            )}
            {story.reference && (
              <p className="text-sm text-card-foreground">
                <span className="font-semibold">Reference:</span> {story.reference}
              </p>
            )}
            {story.source_detail && (
              <p className="text-sm leading-7 text-muted-foreground">{story.source_detail}</p>
            )}
          </section>
        )}

        <ShareButtons title={title} url={canonicalUrl} description={summary} />

        <StoryAdSlot slot="before-related" />

        <aside aria-label="Related stories">
          <RelatedStories stories={relatedStories} language={language} />
        </aside>

        <nav aria-label="Story pagination" className="grid gap-3 rounded-lg border border-border bg-card p-5 md:grid-cols-2 md:p-6">
          {previousStory ? (
            <Link
              to="/stories/$slug"
              params={{ slug: previousStory.slug }}
              search={{ lang: language }}
              rel="prev"
              className="rounded-md border border-input bg-background p-3 text-sm text-card-foreground transition-colors hover:bg-accent"
            >
              ← {getLocalizedTitle(previousStory, language)}
            </Link>
          ) : (
            <div />
          )}

          {nextStory && (
            <Link
              to="/stories/$slug"
              params={{ slug: nextStory.slug }}
              search={{ lang: language }}
              rel="next"
              className="rounded-md border border-input bg-background p-3 text-right text-sm text-card-foreground transition-colors hover:bg-accent"
            >
              {getLocalizedTitle(nextStory, language)} →
            </Link>
          )}
        </nav>

        <footer className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
          <p>
            Published by <span className="font-semibold text-foreground">NoorApp</span> ·{" "}
            <a href="https://noorapp.in" className="hover:text-foreground">noorapp.in</a> · All
            content is based on the Qur'an and authentic Islamic sources.
          </p>
        </footer>

        <meta itemProp="headline" content={title} />
        <meta itemProp="description" content={summary} />
        <meta itemProp="image" content={getStoryImage(story)} />
        <meta itemProp="mainEntityOfPage" content={canonicalUrl} />
      </article>
    </main>
  );
}
