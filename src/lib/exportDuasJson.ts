import { supabase } from "@/integrations/supabase/client";

export type ExportedDuaRow = {
  title: string;
  title_arabic?: string;
  title_en?: string;
  title_hi?: string;
  title_ur?: string;

  content_arabic?: string;
  content_bn?: string;
  content_en?: string;
  content_hi?: string;
  content_ur?: string;

  pronunciation?: string;
  pronunciation_en?: string;
  pronunciation_hi?: string;
  pronunciation_ur?: string;

  category?: string;
  slug?: string;
  
  // New rich fields
  source_type?: string;
  reference?: string;
  hadith_reference?: string;
  explanation_bn?: string;
  explanation_en?: string;
  explanation_hi?: string;
  explanation_ur?: string;
  benefits_bn?: string;
  benefits_en?: string;
  benefits_hi?: string;
  benefits_ur?: string;
  when_to_recite_bn?: string;
  when_to_recite_en?: string;
  when_to_recite_hi?: string;
  when_to_recite_ur?: string;
  subtitle?: string;
  authenticity?: string;
  difficulty?: string;
  time_required?: string;
  hook?: string;
  share_text?: string;
  virtue?: string;
  virtue_reference?: string;
  viral_score?: number;
  audio_url?: string;
  emotion?: string[];
  user_intents?: string[];
  recommendation_tags?: string[];
  recommended_moments?: string[];
  semantic_entities?: string[];
  normalized_surah_names?: string[];
  related_duas?: string[];
  hook_variants?: string[];
  social?: any;
  og_image_data?: any;
  seo?: any;
  quran_meta?: any;
  category_hierarchy?: any;
  faq?: any;
  search_aliases?: any;
  image_url?: string;
  
  // Legacy metadata fields (kept for compatibility)
  source?: string;
  extras?: any;
};

const downloadJson = (filename: string, data: unknown) => {
  const content = JSON.stringify(data, null, 2);
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

/**
 * Exports ALL "dua" items from the database to a downloadable JSON file.
 */
export async function exportAllDuasFromDbToJson(opts?: {
  filename?: string;
  pageSize?: number;
}): Promise<{ total: number }> {
  const filename = opts?.filename ?? "duas-all.json";
  const pageSize = Math.max(100, Math.min(opts?.pageSize ?? 1000, 1000));

  const out: ExportedDuaRow[] = [];
  let from = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from("admin_content")
      .select("*")
      .eq("content_type", "dua")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const rows = (data ?? []) as any[];

    for (const r of rows) {
      out.push({
        title: (r.title ?? "").trim(),
        title_arabic: r.title_arabic ?? undefined,
        title_en: r.title_en ?? undefined,
        title_hi: r.title_hi ?? undefined,
        title_ur: r.title_ur ?? undefined,

        content_arabic: r.content_arabic ?? undefined,
        content_bn: r.content ?? undefined,
        content_en: r.content_en ?? undefined,
        content_hi: r.content_hi ?? undefined,
        content_ur: r.content_ur ?? undefined,

        pronunciation: r.content_pronunciation ?? undefined,
        pronunciation_en: r.content_pronunciation_en ?? undefined,
        pronunciation_hi: r.content_pronunciation_hi ?? undefined,
        pronunciation_ur: r.content_pronunciation_ur ?? undefined,

        category: r.category ?? undefined,
        slug: r.slug ?? undefined,
        
        source_type: r.source_type ?? undefined,
        reference: r.reference ?? undefined,
        hadith_reference: r.hadith_reference ?? undefined,
        explanation_bn: r.explanation_bn ?? undefined,
        explanation_en: r.explanation_en ?? undefined,
        explanation_hi: r.explanation_hi ?? undefined,
        explanation_ur: r.explanation_ur ?? undefined,
        benefits_bn: r.benefits_bn ?? undefined,
        benefits_en: r.benefits_en ?? undefined,
        benefits_hi: r.benefits_hi ?? undefined,
        benefits_ur: r.benefits_ur ?? undefined,
        when_to_recite_bn: r.when_to_recite_bn ?? undefined,
        when_to_recite_en: r.when_to_recite_en ?? undefined,
        when_to_recite_hi: r.when_to_recite_hi ?? undefined,
        when_to_recite_ur: r.when_to_recite_ur ?? undefined,
        subtitle: r.subtitle ?? undefined,
        authenticity: r.authenticity ?? undefined,
        difficulty: r.difficulty ?? undefined,
        time_required: r.time_required ?? undefined,
        hook: r.hook ?? undefined,
        share_text: r.share_text ?? undefined,
        virtue: r.virtue ?? undefined,
        virtue_reference: r.virtue_reference ?? undefined,
        viral_score: r.viral_score ?? undefined,
        audio_url: r.audio_url ?? undefined,
        emotion: r.emotion ?? undefined,
        user_intents: r.user_intents ?? undefined,
        recommendation_tags: r.recommendation_tags ?? undefined,
        recommended_moments: r.recommended_moments ?? undefined,
        semantic_entities: r.semantic_entities ?? undefined,
        normalized_surah_names: r.normalized_surah_names ?? undefined,
        related_duas: r.related_duas ?? undefined,
        hook_variants: r.hook_variants ?? undefined,
        social: r.social ?? undefined,
        og_image_data: r.og_image_data ?? undefined,
        seo: r.seo ?? undefined,
        quran_meta: r.quran_meta ?? undefined,
        category_hierarchy: r.category_hierarchy ?? undefined,
        faq: r.faq ?? undefined,
        search_aliases: r.search_aliases ?? undefined,
        image_url: r.image_url ?? undefined,
        
        source: r.metadata?.source,
        extras: r.metadata,
      });
    }

    if (rows.length < pageSize) break;
    from += pageSize;
  }

  downloadJson(filename, out);
  return { total: out.length };
}
