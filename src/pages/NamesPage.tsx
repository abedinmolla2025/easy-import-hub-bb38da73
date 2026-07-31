import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { ComponentProps } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { NameCard, type NameCardModel } from "@/components/names/NameCard";
import { NameSharePreviewModal } from "@/components/names/NameSharePreviewModal";
import { NamesPageHeader } from "@/pages/names/NamesPageHeader";
import { NamesPageSearch } from "@/pages/names/NamesPageSearch";
import { NamesQuickFilters } from "@/pages/names/NamesQuickFilters";
import { NamesCardsGrid } from "@/pages/names/NamesCardsGrid";
import { NamesAlphabetFilter } from "@/pages/names/NamesAlphabetFilter";

type NameContentRow = {
  id: string;
  title: string;
  title_arabic: string | null;
  /** Bengali meaning */
  content: string | null;
  /** English meaning */
  content_en: string | null;
  /** Arabic meaning (optional/legacy) */
  content_arabic: string | null;
  category: string | null;
  metadata: unknown;
  created_at: string | null;
  order_index: number | null;
};

type NameMeta = {
  bn_name?: string;
  pronunciation?: string;
  gender?: string;
  source?: string;
  origin?: string;
  reference?: string;
};

const safeParseMeta = (meta: unknown): NameMeta => {
  if (!meta || typeof meta !== "object") return {};
  const m = meta as Record<string, unknown>;
  const pick = (k: string) => (typeof m[k] === "string" ? (m[k] as string) : undefined);
  return {
    bn_name: pick("bn_name"),
    pronunciation: pick("pronunciation"),
    gender: pick("gender"),
    source: pick("source"),
    origin: pick("origin"),
    reference: pick("reference"),
  };
};

const normalizeGender = (raw?: string) => {
  const g = (raw ?? "").trim().toLowerCase();
  if (!g) return "";
  if (g === "boy") return "male";
  if (g === "girl") return "female";
  if (g === "m") return "male";
  if (g === "f") return "female";
  if (g === "male" || g === "female" || g === "unisex") return g;
  return g; // fallback (custom values)
};

const PAGE_SIZE = 200;

type NamesPageResult = {
  rows: NameContentRow[];
  total: number | null;
  nextOffset: number | null;
};

const fetchNamesPage = async (offset: number): Promise<NamesPageResult> => {
  const from = offset;
  const to = offset + PAGE_SIZE - 1;

  const query = (supabase as any)
    .from("admin_content")
    .select(
      "id,title,title_arabic,content,content_en,content_arabic,category,metadata,created_at,order_index,is_published,content_type",
      { count: "exact" },
    )
    .eq("content_type", "name")
    .eq("is_published", true)
    .order("order_index", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  const rows = ((data ?? []) as unknown as NameContentRow[]).filter(Boolean);
  const nextOffset = rows.length === PAGE_SIZE ? offset + PAGE_SIZE : null;

  return { rows, total: typeof count === "number" ? count : null, nextOffset };
};

const NamesPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [activeQuickFilter, setActiveQuickFilter] = useState<ComponentProps<typeof NamesQuickFilters>["active"]>(
    "beautiful"
  );
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [selected, setSelected] = useState<NameCardModel | null>(null);
  const [stickyHeaderRaised, setStickyHeaderRaised] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const mainRef = useRef<HTMLElement>(null);

  const selectedId = searchParams.get("name");

  useEffect(() => {
    const onScroll = () => {
      // Keep it subtle: raise the glass header slightly once the page is scrolled.
      setStickyHeaderRaised(window.scrollY > 8);
      setShowBackToTop(window.scrollY > 500);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const namesQuery = useInfiniteQuery({
    queryKey: ["public-names"],
    queryFn: ({ pageParam }) => fetchNamesPage(typeof pageParam === "number" ? pageParam : 0),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    staleTime: 60_000,
  });

  const allRows = useMemo(() => {
    const pages = namesQuery.data?.pages ?? [];
    return pages.flatMap((p) => p.rows);
  }, [namesQuery.data]);

  const totalCount = namesQuery.data?.pages?.[0]?.total ?? null;

  const filteredBase = useMemo(() => {
    const query = q.trim().toLowerCase();

    const list = allRows ?? [];
    const quickFiltered = list.filter((n) => {
      const meta = safeParseMeta(n.metadata);
      // Gender is primarily stored in metadata, but some datasets store it in `category`.
      const categoryRaw = (n.category ?? "").trim();
      const g = normalizeGender(meta.gender) || normalizeGender(categoryRaw);
      const category = categoryRaw.toLowerCase();
      const title = (n.title ?? "").trim();

      if (activeQuickFilter === "all") return true;
      if (activeQuickFilter === "boy") return g === "male";
      if (activeQuickFilter === "girl") return g === "female";
      if (activeQuickFilter === "unisex") return g === "unisex";
      if (activeQuickFilter === "quranic") return category === "quranic";
      if (activeQuickFilter === "popular") return category === "popular";
      if (activeQuickFilter === "short") return title.length > 0 && title.length <= 5;
      if (activeQuickFilter === "beautiful") {
        const fullMeta = n.metadata as Record<string, unknown> | null;
        if (!fullMeta) return false;
        const meaningCategories = (fullMeta.meaning_categories || []) as string[];
        const categoryTags = (fullMeta.category_tags || []) as string[];
        const allTags = [
          ...meaningCategories.map(t => t.toLowerCase()),
          ...categoryTags.map(t => t.toLowerCase()),
          (n.category ?? "").toLowerCase(),
        ];
        return allTags.some(tag => tag.includes("beauty"));
      }
      return true;
    });

    if (!query) return quickFiltered;

    return quickFiltered.filter((n) => {
      const meta = safeParseMeta(n.metadata);
      const parts = [
        n.title,
        n.title_arabic ?? "",
        meta.bn_name ?? "",
        meta.pronunciation ?? "",
        meta.gender ?? "",
        n.content ?? "",
        n.content_en ?? "",
        n.category ?? "",
        meta.source ?? "",
        meta.origin ?? "",
        meta.reference ?? "",
      ];
      return parts.join(" ").toLowerCase().includes(query);
    });
  }, [q, activeQuickFilter, allRows]);

  const alphabetCounts = useMemo<Record<string, number>>(() => {
    const out: Record<string, number> = {};
    for (const n of filteredBase ?? []) {
      const t = (n.title ?? "").trim();
      const first = t ? t[0]!.toUpperCase() : "";
      if (first >= "A" && first <= "Z") out[first] = (out[first] ?? 0) + 1;
    }
    return out;
  }, [filteredBase]);

  const filtered = useMemo(() => {
    const base = filteredBase;
    if (!activeLetter) return base;
    return (base ?? []).filter((n) => {
      const t = (n.title ?? "").trim();
      const first = t ? t[0]!.toUpperCase() : "";
      return first === activeLetter;
    });
  }, [activeLetter, filteredBase]);

  const cards = useMemo<NameCardModel[]>(() => {
    return (filtered ?? []).map((n) => {
      const meta = safeParseMeta(n.metadata);
      return {
        id: n.id,
        title: (n.title ?? "").trim(),
        title_arabic: n.title_arabic,
        bn_name: meta.bn_name,
        meaning_bn: n.content,
        meaning_en: n.content_en,
        meaning_ar: n.content_arabic,
        gender: meta.gender?.trim() || null,
        category: n.category,
        origin: meta.origin,
        source: meta.source,
      };
    });
  }, [filtered]);

  const cardById = useMemo(() => {
    const m = new Map<string, NameCardModel>();
    for (const c of cards) m.set(c.id, c);
    return m;
  }, [cards]);

  // Sync modal from URL so browser back closes it step-by-step
  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }

    const found = cardById.get(selectedId) ?? null;
    setSelected(found);
  }, [selectedId, cardById]);

  const openCard = (n: NameCardModel) => {
    setSearchParams({ name: n.id }, { replace: false });
  };

  const closeModal = () => {
    // Prefer history unwind (so it behaves exactly like pressing Back)
    if (selectedId) {
      navigate(-1);
      return;
    }
    setSelected(null);
  };

  return (
    <div className="min-h-screen dua-page pb-20">
      <header className="sticky top-0 z-40 border-b dua-header">
        <div className="mx-auto w-full max-w-none px-3 py-3 md:px-6 xl:px-10">
          <NamesPageHeader
            title="Islamic Names"
            subtitle={
              namesQuery.isLoading
                ? "Loading…"
                : `${filtered.length} results • ${totalCount ?? allRows.length} total`
            }
          />

          <div className="mt-3">
            <NamesPageSearch value={q} onChange={setQ} />
          </div>

          <div className="mt-2">
            <NamesQuickFilters active={activeQuickFilter} onChange={setActiveQuickFilter} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-none px-3 py-4 md:px-6 xl:px-10">
        <div className="mb-3">
          <NamesAlphabetFilter activeLetter={activeLetter} counts={alphabetCounts} onChange={setActiveLetter} />
        </div>
        <NamesCardsGrid
          isLoading={namesQuery.isLoading}
          isError={namesQuery.isError}
          hasResults={!namesQuery.isLoading && !namesQuery.isError && filtered.length > 0}
          stickyHeaderRaised={stickyHeaderRaised}
          cards={cards}
          onSelect={openCard}
          emptyStateTitle={activeLetter ? "কোনো নাম পাওয়া যায়নি" : undefined}
          emptyStateDescription={activeLetter ? "এই অক্ষরে কোনো নাম পাওয়া যায়নি" : undefined}
        />

        {!namesQuery.isLoading && !namesQuery.isError && namesQuery.hasNextPage ? (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => namesQuery.fetchNextPage()}
              disabled={namesQuery.isFetchingNextPage}
              className="dua-card px-5 py-3 text-sm font-medium text-[hsl(var(--dua-fg))] transition-all hover:shadow-card disabled:opacity-60"
            >
              {namesQuery.isFetchingNextPage ? "লোড হচ্ছে…" : "আরও নাম লোড করুন"}
            </button>
          </div>
        ) : null}

        {/* SEO internal link */}
        <section className="sr-only" aria-hidden="true">
          <p>
            Looking for baby names? Browse our curated collection of <a href="https://noorapp.in/baby-names">Muslim Baby Names for Boys and Girls</a> with Arabic script and meanings.
          </p>
        </section>
      </main>

      <NameSharePreviewModal open={!!selected} onOpenChange={(o) => !o && closeModal()} name={selected} />

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-24 right-4 z-50 h-10 w-10 rounded-full bg-[hsl(var(--dua-accent))] text-black shadow-lg transition-all hover:scale-110 flex items-center justify-center"
          aria-label="Back to top"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
        </button>
      )}
    </div>
  );
};

export default NamesPage;
