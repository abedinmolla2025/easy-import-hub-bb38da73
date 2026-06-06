import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroAdam from "@/assets/stories/hero-adam.jpg";
import heroNuh from "@/assets/stories/hero-nuh.jpg";
import heroIbrahim from "@/assets/stories/hero-ibrahim.jpg";
import heroMusa from "@/assets/stories/hero-musa.jpg";
import heroYusuf from "@/assets/stories/hero-yusuf.jpg";

export type HeroSlide = {
  slug: string;
  title: string;
  description: string;
  image: string;
  alt: string;
};

export const FEATURED_HERO_SLIDES: HeroSlide[] = [
  {
    slug: "prophet-adam-story-islam",
    title: "Prophet Adam (AS)",
    description:
      "The first human and the first prophet — the story of creation, the test in Jannah, and Allah's mercy.",
    image: heroAdam,
    alt: "Misty sunrise over a green river valley symbolising the story of Prophet Adam",
  },
  {
    slug: "prophet-nuh-story-islam",
    title: "Prophet Nuh (AS)",
    description:
      "950 years of patient calling, the great flood, and the ark that carried the believers to safety.",
    image: heroNuh,
    alt: "Wooden ark on a stormy sea with rays of light breaking through clouds",
  },
  {
    slug: "prophet-ibrahim-story-islam",
    title: "Prophet Ibrahim (AS)",
    description:
      "The friend of Allah — his unwavering tawheed, the fire, the sacrifice, and the building of the Kaaba.",
    image: heroIbrahim,
    alt: "Desert dunes at golden sunset under a starry transitioning sky",
  },
  {
    slug: "prophet-musa-story-islam",
    title: "Prophet Musa (AS)",
    description:
      "Confronting Pharaoh, the parting of the sea, and receiving the Tawrah on Mount Tur.",
    image: heroMusa,
    alt: "Path of sand between towering walls of water under shafts of divine light",
  },
  {
    slug: "prophet-yusuf-story-islam",
    title: "Prophet Yusuf (AS)",
    description:
      "Ahsanul Qasas — the best of stories. Trial, patience, and rising from the well to the palace.",
    image: heroYusuf,
    alt: "Ancient Egyptian palace courtyard at sunset with palm trees and a stone well",
  },
];

const AUTOPLAY_MS = 5000;

export default function StoriesHeroSlider() {
  const slides = FEATURED_HERO_SLIDES;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const go = useCallback(
    (next: number) => setIndex(((next % slides.length) + slides.length) % slides.length),
    [slides.length],
  );
  const prev = useCallback(() => go(index - 1), [go, index]);
  const next = useCallback(() => go(index + 1), [go, index]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
    touchStartX.current = null;
  };

  return (
    <section
      aria-label="Featured Islamic stories"
      className="relative w-full overflow-hidden rounded-2xl shadow-xl bg-emerald-950 aspect-[3/4] sm:aspect-[16/10] md:aspect-[21/9] max-h-[620px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {slides.map((s, i) => {
        const active = i === index;
        return (
          <article
            key={s.slug}
            aria-hidden={!active}
            className={
              "absolute inset-0 transition-opacity duration-700 ease-out " +
              (active ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")
            }
          >
            <img
              src={s.image}
              alt={s.alt}
              width={1600}
              height={900}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={i === 0 ? "high" : "low"}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />
            <div className="absolute inset-x-0 bottom-0 p-5 md:p-10">
              <div className="max-w-2xl rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-5 md:p-7 text-white shadow-2xl">
                <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-emerald-200/90 mb-2">
                  <BookOpen className="h-3.5 w-3.5" /> Featured Story
                </span>
                <h2 className="text-2xl md:text-4xl font-bold leading-tight">{s.title}</h2>
                <p className="mt-2 text-sm md:text-base text-white/85 line-clamp-3">{s.description}</p>
                <Button asChild size="sm" className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white">
                  <Link to={`/stories/${s.slug}`} aria-label={`Read story: ${s.title}`}>
                    Read Story
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        );
      })}

      {/* Arrows */}
      <button
        type="button"
        aria-label="Previous slide"
        onClick={prev}
        className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur transition"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={next}
        className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur transition"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((s, i) => (
          <button
            key={s.slug}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            onClick={() => go(i)}
            className={
              "h-1.5 rounded-full transition-all " +
              (i === index ? "w-8 bg-white" : "w-3 bg-white/50 hover:bg-white/80")
            }
          />
        ))}
      </div>
    </section>
  );
}