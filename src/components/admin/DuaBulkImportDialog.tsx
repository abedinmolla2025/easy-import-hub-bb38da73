import { useMemo, useRef, useState } from "react";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { exportAllDuasFromDbToJson } from "@/lib/exportDuasJson";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Columns3, Download, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ImportResult = {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  invalid: number;
  insertedIds?: string[];
  updatedIds?: string[];
};

const duaImportItemSchema = z
  .object({
    slug: z.string().trim().min(1).max(200).optional(),
    title: z.string().trim().min(1).max(200),
    title_arabic: z.string().trim().min(1).max(200).optional(),
    title_en: z.string().trim().min(1).max(200).optional(),
    title_hi: z.string().trim().min(1).max(200).optional(),
    title_ur: z.string().trim().min(1).max(200).optional(),

    content_arabic: z.string().trim().max(8000).optional(),
    content_bn: z.string().trim().max(8000).optional(),
    content_en: z.string().trim().max(8000).optional(),
    content_hi: z.string().trim().max(8000).optional(),
    content_ur: z.string().trim().max(8000).optional(),
    pronunciation: z.string().trim().max(2000).optional(),
    pronunciation_en: z.string().trim().max(2000).optional(),
    pronunciation_hi: z.string().trim().max(2000).optional(),
    pronunciation_ur: z.string().trim().max(2000).optional(),

    category: z.string().trim().max(100).optional(),

    source: z.string().trim().max(300).optional(),
    reference: z.string().trim().max(300).optional(),

    // Optional extras stored in metadata
    metadata_extra: z.record(z.any()).optional(),
  })
  .passthrough();

type DuaImportItem = z.infer<typeof duaImportItemSchema>;

/**
 * Normalize raw JSON entry to flat DuaImportItem.
 * Supports BOTH legacy flat format and new nested format
 * (pronunciation: { bn,en,hi,ur }, translation_bn/en, title_bn, social, hook, og_image_data).
 */
const normalizeRawItem = (raw: unknown): { item: Record<string, unknown> | null; format: "old" | "new" | "unknown" } => {
  if (!raw || typeof raw !== "object") return { item: null, format: "unknown" };
  const r = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  // Title (new format may use title_bn)
  const title =
    (typeof r.title === "string" && r.title) ||
    (typeof r.title_bn === "string" && (r.title_bn as string)) ||
    (typeof r.title_en === "string" && (r.title_en as string)) ||
    "";
  if (title) out.title = title;

  if (typeof r.title_arabic === "string") out.title_arabic = r.title_arabic;
  if (typeof r.title_en === "string") out.title_en = r.title_en;
  if (typeof r.title_hi === "string") out.title_hi = r.title_hi;
  if (typeof r.title_ur === "string") out.title_ur = r.title_ur;

  // Arabic body: new uses "arabic", old uses "content_arabic"
  if (typeof r.content_arabic === "string") out.content_arabic = r.content_arabic;
  else if (typeof r.arabic === "string") out.content_arabic = r.arabic;

  // Meaning/translation: new uses translation_bn/en, old uses content_bn/en/hi/ur
  if (typeof r.content_bn === "string") out.content_bn = r.content_bn;
  else if (typeof r.translation_bn === "string") out.content_bn = r.translation_bn;

  if (typeof r.content_en === "string") out.content_en = r.content_en;
  else if (typeof r.translation_en === "string") out.content_en = r.translation_en;

  if (typeof r.content_hi === "string") out.content_hi = r.content_hi;
  else if (typeof r.translation_hi === "string") out.content_hi = r.translation_hi;

  if (typeof r.content_ur === "string") out.content_ur = r.content_ur;
  else if (typeof r.translation_ur === "string") out.content_ur = r.translation_ur;

  // Pronunciation: new = nested object; old = flat strings
  let isNewPron = false;
  const pron = r.pronunciation;
  if (pron && typeof pron === "object" && !Array.isArray(pron)) {
    isNewPron = true;
    const p = pron as Record<string, unknown>;
    if (typeof p.bn === "string") out.pronunciation = p.bn;
    if (typeof p.en === "string") out.pronunciation_en = p.en;
    if (typeof p.hi === "string") out.pronunciation_hi = p.hi;
    if (typeof p.ur === "string") out.pronunciation_ur = p.ur;
  } else if (typeof pron === "string") {
    out.pronunciation = pron;
  }
  if (typeof r.pronunciation_en === "string" && !out.pronunciation_en) out.pronunciation_en = r.pronunciation_en;
  if (typeof r.pronunciation_hi === "string" && !out.pronunciation_hi) out.pronunciation_hi = r.pronunciation_hi;
  if (typeof r.pronunciation_ur === "string" && !out.pronunciation_ur) out.pronunciation_ur = r.pronunciation_ur;

  if (typeof r.slug === "string") out.slug = r.slug;
  if (typeof r.category === "string") out.category = r.category;
  if (typeof r.source === "string") out.source = r.source;
  else if (typeof r.source_type === "string") out.source = r.source_type;
  if (typeof r.reference === "string") out.reference = r.reference;

  // Capture optional extras for metadata
  const extras: Record<string, unknown> = {};
  for (const k of ["social", "hook", "og_image_data", "share_text", "emotion", "viral_score", "virtue", "virtue_reference", "authenticity", "audio_url", "difficulty", "time_required", "benefits", "when_to_recite_bn", "when_to_recite_en"]) {
    if (r[k] !== undefined && r[k] !== null) extras[k] = r[k];
  }
  if (Object.keys(extras).length) out.metadata_extra = extras;

  const format: "old" | "new" | "unknown" = isNewPron || r.translation_bn || r.translation_en || r.arabic || r.social || r.hook || r.og_image_data ? "new" : "old";
  return { item: out, format };
};

const makeKey = (title: string, titleArabic?: string) =>
  `${title.trim().toLowerCase()}||${(titleArabic ?? "").trim().toLowerCase()}`;

const chunk = <T,>(arr: T[], size: number) => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

export function DuaBulkImportDialog({
  open,
  onOpenChange,
  canEdit,
  existingKeys,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  existingKeys: Set<string>;
  onImported?: (result: ImportResult) => void;
}) {
  const { toast } = useToast();

  const [jsonInput, setJsonInput] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [rawItems, setRawItems] = useState<unknown[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const [duplicateMode, setDuplicateMode] = useState<"skip" | "update">("skip");

  const [previewOnlyDuplicates, setPreviewOnlyDuplicates] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [visibleCols, setVisibleCols] = useState({
    content_bn: true,
    content_en: true,
    content_hi: false,
    content_ur: false,
    pron_bn: true,
    pron_en: true,
    pron_hi: false,
    pron_ur: false,
  });

  const exampleJson = `[
  {
    "title": "সকালের দোয়া",
    "title_arabic": "دعاء الصباح",
    "title_en": "Morning Dua",
    "title_hi": "सुबह की दुआ",
    "title_ur": "صبح کی دعا",
    "content_arabic": "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ",
    "pronunciation": "আস্‌বাহনা ওয়া আস্‌বাহাল মুলকু লিল্লাহ, ওয়ালহামদু লিল্লাহ",
    "pronunciation_en": "Asbahna wa asbahal mulku lillah, walhamdu lillah",
    "pronunciation_hi": "असबहना वा असबहल मुल्कु लिल्लाह, वलहम्दु लिल्लाह",
    "pronunciation_ur": "اصبحنا و اصبح الملک للہ، والحمد للہ",
    "content_bn": "আমরা সকালে উপনীত হয়েছি এবং এই সময়ে সমস্ত সার্বভৌমত্ব আল্লাহর...",
    "content_en": "We have reached the morning and at this very time all sovereignty belongs to Allah...",
    "content_hi": "हम सुबह तक पहुँच गए हैं और इस समय सारी बादशाहत अल्लाह की है...",
    "content_ur": "ہم نے صبح کی ہے اور اس وقت ساری بادشاہت اللہ کی ہے...",
    "category": "Morning",
    "source": "Hisnul Muslim",
    "reference": "(optional)"
  }
]`;

  const parsed = useMemo(() => {
    const valid: DuaImportItem[] = [];
    const duplicatesExisting: DuaImportItem[] = [];
    const duplicatesInFile: DuaImportItem[] = [];
    const invalid: string[] = [];
    const seen = new Set<string>();
    const seenSlugs = new Set<string>();
    const formatCounts = { old: 0, new: 0, unknown: 0 };

    rawItems.forEach((item, idx) => {
      const { item: normalized, format } = normalizeRawItem(item);
      formatCounts[format] += 1;
      if (!normalized) {
        invalid.push(`Row ${idx + 1}: not an object`);
        console.warn(`[DuaImport] Row ${idx + 1} skipped: not an object`, item);
        return;
      }
      const res = duaImportItemSchema.safeParse(normalized);
      if (!res.success) {
        const reason = res.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
        invalid.push(`Row ${idx + 1}: ${reason || "invalid format"}`);
        console.warn(`[DuaImport] Row ${idx + 1} invalid (${format}):`, reason, normalized);
        return;
      }

      const it = res.data;

      // Slug-based dedup wins when slug is present
      if (it.slug) {
        if (seenSlugs.has(it.slug)) {
          duplicatesInFile.push(it);
          console.info(`[DuaImport] Row ${idx + 1} duplicate slug in file: ${it.slug}`);
          return;
        }
        seenSlugs.add(it.slug);
      }

      const key = makeKey(it.title, it.title_arabic);

      if (seen.has(key)) {
        duplicatesInFile.push(it);
        return;
      }

      if (existingKeys.has(key)) {
        duplicatesExisting.push(it);
        console.info(`[DuaImport] Row ${idx + 1} matches existing (title/arabic): ${it.title}`);
        return;
      }

      seen.add(key);
      valid.push(it);
      console.debug(`[DuaImport] Row ${idx + 1} OK [${format}] mapped:`, {
        slug: it.slug, title: it.title,
        pronunciation: !!it.pronunciation, pronunciation_en: !!it.pronunciation_en,
        extras: it.metadata_extra ? Object.keys(it.metadata_extra) : [],
      });
    });

    console.info(`[DuaImport] Parsed ${rawItems.length} rows. Format counts:`, formatCounts,
      `Valid: ${valid.length}, DupExisting: ${duplicatesExisting.length}, DupInFile: ${duplicatesInFile.length}, Invalid: ${invalid.length}`);

    return {
      valid,
      duplicatesExisting,
      duplicatesInFile,
      duplicates: [...duplicatesExisting, ...duplicatesInFile],
      invalid,
    };
  }, [rawItems, existingKeys]);

  const skippedEstimate = useMemo(() => {
    // UI-friendly count: what will be skipped due to duplicates (before running import)
    return parsed.duplicatesInFile.length + (duplicateMode === "skip" ? parsed.duplicatesExisting.length : 0);
  }, [duplicateMode, parsed.duplicatesExisting.length, parsed.duplicatesInFile.length]);

  const previewList = useMemo(() => {
    if (previewOnlyDuplicates) return parsed.duplicates;
    return duplicateMode === "update" ? [...parsed.valid, ...parsed.duplicatesExisting] : parsed.valid;
  }, [duplicateMode, parsed.duplicates, parsed.duplicatesExisting, parsed.valid, previewOnlyDuplicates]);

  const reset = () => {
    setJsonInput("");
    setRawItems([]);
    setErrors([]);
    setIsParsing(false);
    setIsImporting(false);
    setDuplicateMode("skip");
    setPreviewOnlyDuplicates(false);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const handleExportJson = () => {
    const content = (jsonInput.trim().length ? jsonInput : exampleJson).trim();
    const blob = new Blob([content], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "duas.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportAllFromDb = async () => {
    try {
      setIsExportingAll(true);
      const filename = `duas-all-${new Date().toISOString().slice(0, 10)}.json`;
      const res = await exportAllDuasFromDbToJson({ filename });
      toast({ title: "Exported", description: `${res.total} দুয়া ডাউনলোড হয়েছে` });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Export failed";
      toast({ title: "Export failed", description: msg, variant: "destructive" });
    } finally {
      setIsExportingAll(false);
    }
  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (file: File | null) => {
    if (!file) return;
    try {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: "Max 10MB", variant: "destructive" });
        return;
      }
      const text = await file.text();
      JSON.parse(text);
      setJsonInput(text);
      setRawItems([]);
      setErrors([]);
      toast({ title: "Loaded", description: file.name });
    } catch (e) {
      toast({ title: "Invalid JSON file", variant: "destructive" });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const parseFiles = async () => {
    const hasText = jsonInput.trim().length > 0;
    if (!hasText) {
      toast({ title: "JSON দিন (paste)", variant: "destructive" });
      return;
    }

    setIsParsing(true);
    setErrors([]);

    try {
      const all: unknown[] = [];
      const json = JSON.parse(jsonInput);
      if (!Array.isArray(json)) throw new Error("JSON must be an array");
      all.push(...json);

      setRawItems(all);
      toast({ title: "Parsed", description: `${all.length} items পাওয়া গেছে` });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to parse JSON";
      setErrors([msg]);
      toast({ title: "Parse failed", description: msg, variant: "destructive" });
    } finally {
      setIsParsing(false);
    }
  };

  const doImport = async () => {
    if (!canEdit) {
      toast({
        title: "No permission",
        description: "আপনার content edit করার permission নেই",
        variant: "destructive",
      });
      return;
    }

    const canInsert = parsed.valid.length > 0;
    const canUpdate = duplicateMode === "update" && parsed.duplicatesExisting.length > 0;

    if (!canInsert && !canUpdate) {
      toast({ title: "Import করার মতো item নেই", variant: "destructive" });
      return;
    }

    const normalize = (v: string) => v.trim().toLowerCase();
    const keyOf = (t: string, a?: string | null) => `${normalize(t)}||${normalize(a ?? "")}`;

    const quote = (v: string) => `"${v.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;

    const buildOrFilter = (items: DuaImportItem[]) =>
      items
        .map((it) => {
          const t = quote(it.title.trim());
          const a = (it.title_arabic ?? "").trim();
          const aPart = a ? `title_arabic.eq.${quote(a)}` : "title_arabic.is.null";
          return `and(title.eq.${t},${aPart})`;
        })
        .join(",");

    setIsImporting(true);
    try {
      const insertedIds: string[] = [];
      const updatedIds: string[] = [];

      // ---- Slug-based path (safe update / insert) ----
      // Split valid + duplicatesExisting items into "with slug" vs "without slug".
      const allCandidates = [...parsed.valid, ...parsed.duplicatesExisting];
      const withSlug = allCandidates.filter((it) => !!it.slug);
      const slugList = Array.from(new Set(withSlug.map((it) => it.slug as string)));

      const slugToRow = new Map<string, { id: string; metadata: any }>();
      if (slugList.length) {
        for (const part of chunk(slugList, 200)) {
          const { data, error } = await supabase
            .from("admin_content")
            .select("id, slug, metadata")
            .eq("content_type", "dua")
            .in("slug", part);
          if (error) throw error;
          (data ?? []).forEach((row: any) => {
            if (row?.slug) slugToRow.set(row.slug, { id: row.id, metadata: row.metadata });
          });
        }
      }

      const handledSlugs = new Set<string>();
      let slugUpdated = 0;
      let slugInserted = 0;

      for (const it of withSlug) {
        const slug = it.slug as string;
        const extras = (it as any).metadata_extra as Record<string, unknown> | undefined;
        const hit = slugToRow.get(slug);

        if (hit) {
          // SAFE UPDATE: only pronunciation + metadata. Never overwrite content/title/arabic.
          const baseMeta = hit.metadata && typeof hit.metadata === "object" ? { ...(hit.metadata as any) } : {};
          if (extras) Object.assign(baseMeta, extras);
          if (it.source?.trim()) baseMeta.source = it.source.trim();
          if (it.reference?.trim()) baseMeta.reference = it.reference.trim();

          const payload: Record<string, unknown> = { metadata: Object.keys(baseMeta).length ? baseMeta : null };
          if (it.pronunciation?.trim()) payload.content_pronunciation = it.pronunciation.trim();
          if (it.pronunciation_en?.trim()) payload.content_pronunciation_en = it.pronunciation_en.trim();
          if (it.pronunciation_hi?.trim()) payload.content_pronunciation_hi = it.pronunciation_hi.trim();
          if (it.pronunciation_ur?.trim()) payload.content_pronunciation_ur = it.pronunciation_ur.trim();

          const { error: updErr } = await supabase.from("admin_content").update(payload).eq("id", hit.id);
          if (updErr) {
            console.error(`[DuaImport] Failed to update slug=${slug}`, updErr);
            continue;
          }
          slugUpdated += 1;
          updatedIds.push(String(hit.id));
          handledSlugs.add(slug);
          console.info(`[DuaImport] Updated existing slug=${slug}`);
        } else {
          // INSERT new row from slug-based item
          const meta: Record<string, unknown> = { ...(extras ?? {}) };
          if (it.source?.trim()) meta.source = it.source.trim();
          if (it.reference?.trim()) meta.reference = it.reference.trim();

          const row = {
            content_type: "dua",
            slug,
            title: it.title.trim(),
            title_arabic: it.title_arabic?.trim() || null,
            title_en: it.title_en?.trim() || null,
            title_hi: it.title_hi?.trim() || null,
            title_ur: it.title_ur?.trim() || null,
            content_arabic: it.content_arabic?.trim() || null,
            content: it.content_bn?.trim() || null,
            content_en: it.content_en?.trim() || null,
            content_hi: it.content_hi?.trim() || null,
            content_ur: it.content_ur?.trim() || null,
            content_pronunciation: it.pronunciation?.trim() || null,
            content_pronunciation_en: it.pronunciation_en?.trim() || null,
            content_pronunciation_hi: it.pronunciation_hi?.trim() || null,
            content_pronunciation_ur: it.pronunciation_ur?.trim() || null,
            category: it.category?.trim() || null,
            metadata: Object.keys(meta).length ? meta : null,
            status: "draft",
            is_published: false,
          };
          const { data: insData, error: insErr } = await supabase.from("admin_content").insert(row).select("id").single();
          if (insErr) {
            console.error(`[DuaImport] Failed to insert slug=${slug}`, insErr);
            continue;
          }
          if (insData?.id) insertedIds.push(String(insData.id));
          slugInserted += 1;
          handledSlugs.add(slug);
          console.info(`[DuaImport] Inserted new slug=${slug}`);
        }
      }

      // Remaining candidates (no slug) — fall through to legacy logic below.
      const validNoSlug = parsed.valid.filter((it) => !it.slug || !handledSlugs.has(it.slug));
      const dupExistingNoSlug = parsed.duplicatesExisting.filter((it) => !it.slug || !handledSlugs.has(it.slug));

      // 1) Insert new items
      if (validNoSlug.length) {
        const rows = validNoSlug.map((it) => {
          const meta: Record<string, string> = {};
          if (it.source?.trim()) meta.source = it.source.trim();
          if (it.reference?.trim()) meta.reference = it.reference.trim();

          return {
            content_type: "dua",
            title: it.title.trim(),
            title_arabic: it.title_arabic?.trim() || null,
            title_en: it.title_en?.trim() || null,
            title_hi: it.title_hi?.trim() || null,
            title_ur: it.title_ur?.trim() || null,
            content_arabic: it.content_arabic?.trim() || null,
            content: it.content_bn?.trim() || null,
            content_en: it.content_en?.trim() || null,
            content_hi: it.content_hi?.trim() || null,
            content_ur: it.content_ur?.trim() || null,
            content_pronunciation: it.pronunciation?.trim() || null,
            content_pronunciation_en: it.pronunciation_en?.trim() || null,
            content_pronunciation_hi: it.pronunciation_hi?.trim() || null,
            content_pronunciation_ur: it.pronunciation_ur?.trim() || null,
            category: it.category?.trim() || null,
            metadata: Object.keys(meta).length ? meta : null,
            status: "draft",
            is_published: false,
          };
        });

        for (const part of chunk(rows, 200)) {
          const { data, error } = await supabase.from("admin_content").insert(part).select("id");
          if (error) throw error;
          for (const row of (data ?? []) as any[]) {
            if (row?.id) insertedIds.push(String(row.id));
          }
        }
      }

      // 2) Update duplicates (existing rows)
      let updated = 0;
      let notFound = 0;

      if (duplicateMode === "update" && dupExistingNoSlug.length) {
        for (const group of chunk(dupExistingNoSlug, 25)) {
          const orFilter = buildOrFilter(group);
          const { data, error } = await supabase
            .from("admin_content")
            .select("id,title,title_arabic,metadata")
            .eq("content_type", "dua")
            .or(orFilter);

          if (error) throw error;

          const byKey = new Map<string, { id: string; metadata: unknown }>();
          (data ?? []).forEach((row: any) => {
            byKey.set(keyOf(row.title, row.title_arabic), { id: row.id, metadata: row.metadata });
          });

          // Update sequentially to avoid bursts
          for (const it of group) {
            const hit = byKey.get(keyOf(it.title, it.title_arabic ?? null));
            if (!hit) {
              notFound += 1;
              continue;
            }

            const baseMeta = hit.metadata && typeof hit.metadata === "object" ? { ...(hit.metadata as any) } : {};
            if (it.source?.trim()) baseMeta.source = it.source.trim();
            if (it.reference?.trim()) baseMeta.reference = it.reference.trim();

            const payload = {
              title: it.title.trim(),
              title_arabic: it.title_arabic?.trim() || null,
              title_en: it.title_en?.trim() || null,
              title_hi: it.title_hi?.trim() || null,
              title_ur: it.title_ur?.trim() || null,
              content_arabic: it.content_arabic?.trim() || null,
              content: it.content_bn?.trim() || null,
              content_en: it.content_en?.trim() || null,
              content_hi: it.content_hi?.trim() || null,
              content_ur: it.content_ur?.trim() || null,
              content_pronunciation: it.pronunciation?.trim() || null,
              content_pronunciation_en: it.pronunciation_en?.trim() || null,
              content_pronunciation_hi: it.pronunciation_hi?.trim() || null,
              content_pronunciation_ur: it.pronunciation_ur?.trim() || null,
              category: it.category?.trim() || null,
              metadata: Object.keys(baseMeta).length ? baseMeta : null,
              // keep draft/unpublished to match existing import behavior
              status: "draft",
              is_published: false,
            };

            const { error: updateError } = await supabase
              .from("admin_content")
              .update(payload)
              .eq("id", hit.id);
            if (updateError) throw updateError;
            updated += 1;
            updatedIds.push(String(hit.id));
          }
        }
      }

      const skipped = parsed.duplicatesInFile.length + (duplicateMode === "skip" ? parsed.duplicatesExisting.length : 0) + notFound;

      const result: ImportResult = {
        total: rawItems.length,
        inserted: validNoSlug.length + slugInserted,
        updated: updated + slugUpdated,
        skipped,
        invalid: parsed.invalid.length,
        insertedIds,
        updatedIds,
      };

      toast({
        title: "Import done",
        description: `Inserted ${result.inserted}, updated ${result.updated}, skipped ${result.skipped}, invalid ${result.invalid}`,
      });

      onImported?.(result);
      handleClose(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Import failed";
      toast({ title: "Import failed", description: msg, variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import — Dua (JSON)</DialogTitle>
          <DialogDescription>
            JSON paste করুন, তারপর Preview দেখে Import করুন। Duplicate হলে Skip/Update হবে (mode অনুযায়ী)।
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            aria-hidden="true"
            tabIndex={-1}
            style={{ display: "none" }}
            onChange={(e) => handleFileSelected(e.target.files?.[0] ?? null)}
          />

          <div className="space-y-2">
            <Label>JSON Format Example:</Label>
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">{exampleJson}</pre>
          </div>

          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Label htmlFor="dua-json-input">Paste JSON data:</Label>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handlePickFile}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import JSON file
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportAllFromDb}
                  disabled={isExportingAll || isParsing || isImporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExportingAll ? "Exporting…" : "Export All (DB)"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleExportJson}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Template
                </Button>
              </div>
            </div>
            <Textarea
              id="dua-json-input"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={10}
              placeholder="Paste JSON data here..."
              className="font-mono text-sm"
            />
          </div>

          {errors.length ? (
            <Card className="p-3 text-sm">
              <p className="font-medium">Errors</p>
              <ul className="mt-2 list-disc pl-5 text-muted-foreground">
                {errors.slice(0, 5).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </Card>
          ) : null}

          {rawItems.length ? (
            <Card className="p-3 text-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span>Total: {rawItems.length}</span>
                  <span className="text-foreground">New: {parsed.valid.length}</span>
                  <span className="text-foreground">Dup existing: {parsed.duplicatesExisting.length}</span>
                  <span className="text-muted-foreground">Dup in file: {parsed.duplicatesInFile.length}</span>
                  <span className="text-muted-foreground">Skipped (dup): {skippedEstimate}</span>
                  <span className="text-destructive">Invalid: {parsed.invalid.length}</span>
                </div>

                <div className="w-full sm:w-[220px]">
                  <Select value={duplicateMode} onValueChange={(v) => setDuplicateMode(v as any)}>
                    <SelectTrigger aria-label="Duplicate mode">
                      <SelectValue placeholder="Duplicate mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">Duplicates: Skip</SelectItem>
                      <SelectItem value="update">Duplicates: Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          ) : null}

          {previewList.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label>Preview ({previewList.length} items):</Label>
                <div className="flex items-center gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        <Columns3 className="h-4 w-4 mr-2" />
                        Columns
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Show/Hide columns</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={visibleCols.content_bn}
                        onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, content_bn: Boolean(v) }))}
                      >
                        Content (BN)
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={visibleCols.content_en}
                        onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, content_en: Boolean(v) }))}
                      >
                        Content (EN)
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={visibleCols.content_hi}
                        onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, content_hi: Boolean(v) }))}
                      >
                        Content (HI)
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={visibleCols.content_ur}
                        onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, content_ur: Boolean(v) }))}
                      >
                        Content (UR)
                      </DropdownMenuCheckboxItem>

                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={visibleCols.pron_bn}
                        onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, pron_bn: Boolean(v) }))}
                      >
                        Pron (BN)
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={visibleCols.pron_en}
                        onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, pron_en: Boolean(v) }))}
                      >
                        Pron (EN)
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={visibleCols.pron_hi}
                        onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, pron_hi: Boolean(v) }))}
                      >
                        Pron (HI)
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={visibleCols.pron_ur}
                        onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, pron_ur: Boolean(v) }))}
                      >
                        Pron (UR)
                      </DropdownMenuCheckboxItem>

                      <DropdownMenuSeparator />
                      <div className="px-2 py-1.5 flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          onClick={() =>
                            setVisibleCols({
                              content_bn: true,
                              content_en: true,
                              content_hi: false,
                              content_ur: false,
                              pron_bn: true,
                              pron_en: true,
                              pron_hi: false,
                              pron_ur: false,
                            })
                          }
                        >
                          Basic
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          onClick={() =>
                            setVisibleCols({
                              content_bn: true,
                              content_en: true,
                              content_hi: true,
                              content_ur: true,
                              pron_bn: true,
                              pron_en: true,
                              pron_hi: true,
                              pron_ur: true,
                            })
                          }
                        >
                          All
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div className="w-[220px]">
                    <Select value={duplicateMode} onValueChange={(v) => setDuplicateMode(v as any)}>
                      <SelectTrigger aria-label="Duplicate mode">
                        <SelectValue placeholder="Duplicate mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">Duplicates: Skip</SelectItem>
                        <SelectItem value="update">Duplicates: Update</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                    <p className="text-sm font-medium">Only duplicates</p>
                    <Switch checked={previewOnlyDuplicates} onCheckedChange={setPreviewOnlyDuplicates} />
                  </div>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg max-h-60 overflow-y-auto">
                <Table className="min-w-[980px] text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Title</TableHead>
                      <TableHead className="whitespace-nowrap">Arabic (Dua)</TableHead>
                      {visibleCols.content_bn ? <TableHead className="whitespace-nowrap">Content (BN)</TableHead> : null}
                      {visibleCols.content_en ? <TableHead className="whitespace-nowrap">Content (EN)</TableHead> : null}
                      {visibleCols.content_hi ? <TableHead className="whitespace-nowrap">Content (HI)</TableHead> : null}
                      {visibleCols.content_ur ? <TableHead className="whitespace-nowrap">Content (UR)</TableHead> : null}
                      {visibleCols.pron_bn ? <TableHead className="whitespace-nowrap">Pron (BN)</TableHead> : null}
                      {visibleCols.pron_en ? <TableHead className="whitespace-nowrap">Pron (EN)</TableHead> : null}
                      {visibleCols.pron_hi ? <TableHead className="whitespace-nowrap">Pron (HI)</TableHead> : null}
                      {visibleCols.pron_ur ? <TableHead className="whitespace-nowrap">Pron (UR)</TableHead> : null}
                      <TableHead className="whitespace-nowrap">Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewList.slice(0, 20).map((it, idx) => (
                      <TableRow key={`${it.title}-${idx}`}>
                        <TableCell className="font-medium whitespace-nowrap">{it.title}</TableCell>
                          <TableCell className="min-w-[320px] font-arabic">{it.content_arabic ?? ""}</TableCell>
                        {visibleCols.content_bn ? <TableCell className="min-w-[320px]">{it.content_bn ?? ""}</TableCell> : null}
                        {visibleCols.content_en ? <TableCell className="min-w-[320px]">{it.content_en ?? ""}</TableCell> : null}
                        {visibleCols.content_hi ? <TableCell className="min-w-[320px]">{it.content_hi ?? ""}</TableCell> : null}
                        {visibleCols.content_ur ? <TableCell className="min-w-[320px]">{it.content_ur ?? ""}</TableCell> : null}
                        {visibleCols.pron_bn ? <TableCell className="min-w-[220px]">{it.pronunciation ?? ""}</TableCell> : null}
                        {visibleCols.pron_en ? <TableCell className="min-w-[220px]">{it.pronunciation_en ?? ""}</TableCell> : null}
                        {visibleCols.pron_hi ? <TableCell className="min-w-[220px]">{it.pronunciation_hi ?? ""}</TableCell> : null}
                        {visibleCols.pron_ur ? <TableCell className="min-w-[220px]">{it.pronunciation_ur ?? ""}</TableCell> : null}
                        <TableCell className="whitespace-nowrap">{it.category ?? ""}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button type="button" variant="secondary" onClick={parseFiles} disabled={isParsing || isImporting || jsonInput.trim().length === 0}>
            {isParsing ? "Previewing…" : "Preview"}
          </Button>
          <Button type="button" onClick={doImport} disabled={isImporting || isParsing || !rawItems.length}>
            {isImporting ? "Importing…" : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
