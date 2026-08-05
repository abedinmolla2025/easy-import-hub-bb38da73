import { useMemo, useRef, useState } from "react";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { exportAllDuasFromDbToJson } from "@/lib/exportDuasJson";
import { exportOgImagesToZip, importOgImagesFromZip } from "@/lib/ogImageZipService";
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
import { Columns3, Download, Upload, Image as ImageIcon, FileArchive } from "lucide-react";
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
    hadith_reference: z.string().trim().max(1000).optional(),

    explanation_bn: z.string().trim().max(8000).optional(),
    explanation_en: z.string().trim().max(8000).optional(),
    explanation_hi: z.string().trim().max(8000).optional(),
    explanation_ur: z.string().trim().max(8000).optional(),

    benefits_bn: z.array(z.string()).optional(),
    benefits_en: z.array(z.string()).optional(),
    benefits_hi: z.array(z.string()).optional(),
    benefits_ur: z.array(z.string()).optional(),

    when_to_recite_bn: z.string().trim().max(4000).optional(),
    when_to_recite_en: z.string().trim().max(4000).optional(),
    when_to_recite_hi: z.string().trim().max(4000).optional(),
    when_to_recite_ur: z.string().trim().max(4000).optional(),

    // Optional: passthrough fields kept for metadata
    slug: z.string().trim().max(200).optional(),
    title_bn: z.string().trim().max(200).optional(),
    extras: z.record(z.any()).optional(),
  })
  .passthrough();

type DuaImportItem = z.infer<typeof duaImportItemSchema>;

const KNOWN_KEYS = new Set([
  "title","title_arabic","title_en","title_hi","title_ur","title_bn",
  "content_arabic","content_bn","content_en","content_hi","content_ur",
  "pronunciation","pronunciation_en","pronunciation_hi","pronunciation_ur",
  "category","source","reference","slug","extras",
  "hadith_reference",
  "explanation_bn", "explanation_en", "explanation_hi", "explanation_ur",
  "benefits_bn", "benefits_en", "benefits_hi", "benefits_ur",
  "when_to_recite_bn", "when_to_recite_en", "when_to_recite_hi", "when_to_recite_ur",
  "arabic","translation_bn","translation_en","translation_hi","translation_ur",
  "source_type",
]);

const normalizeItem = (raw: any): any => {
  if (!raw || typeof raw !== "object") return raw;
  const r = raw as Record<string, any>;

  let pBn: string | undefined;
  let pEn: string | undefined;
  let pHi: string | undefined;
  let pUr: string | undefined;
  if (typeof r.pronunciation === "string") {
    pBn = r.pronunciation;
  } else if (r.pronunciation && typeof r.pronunciation === "object") {
    pBn = r.pronunciation.bn;
    pEn = r.pronunciation.en;
    pHi = r.pronunciation.hi;
    pUr = r.pronunciation.ur;
  }
  pEn = r.pronunciation_en ?? pEn;
  pHi = r.pronunciation_hi ?? pHi;
  pUr = r.pronunciation_ur ?? pUr;

  const title =
    r.title ??
    r.title_bn ??
    r.title_en ??
    r.title_arabic ??
    r.title_ur ??
    r.title_hi;

  const extras: Record<string, any> = {};
  for (const k of Object.keys(r)) {
    if (!KNOWN_KEYS.has(k)) extras[k] = r[k];
  }

  return {
    title,
    title_arabic: r.title_arabic,
    title_en: r.title_en,
    title_hi: r.title_hi,
    title_ur: r.title_ur,
    title_bn: r.title_bn,
    slug: r.slug,
    content_arabic: r.content_arabic ?? r.arabic,
    content_bn: r.content_bn ?? r.translation_bn,
    content_en: r.content_en ?? r.translation_en,
    content_hi: r.content_hi ?? r.translation_hi,
    content_ur: r.content_ur ?? r.translation_ur,
    pronunciation: pBn,
    pronunciation_en: pEn,
    pronunciation_hi: pHi,
    pronunciation_ur: pUr,
    category: r.category,
    source: r.source ?? r.source_type,
    reference: r.reference,
    hadith_reference: r.hadith_reference,
    explanation_bn: r.explanation_bn,
    explanation_en: r.explanation_en,
    explanation_hi: r.explanation_hi,
    explanation_ur: r.explanation_ur,
    benefits_bn: r.benefits_bn,
    benefits_en: r.benefits_en,
    benefits_hi: r.benefits_hi,
    benefits_ur: r.benefits_ur,
    when_to_recite_bn: r.when_to_recite_bn,
    when_to_recite_en: r.when_to_recite_en,
    when_to_recite_hi: r.when_to_recite_hi,
    when_to_recite_ur: r.when_to_recite_ur,
    extras: Object.keys(extras).length ? extras : undefined,
  };
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
  const [isExportingImages, setIsExportingImages] = useState(false);
  const [isImportingImages, setIsImportingImages] = useState(false);
  const [imageImportProgress, setImageImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [rawItems, setRawItems] = useState<unknown[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const [duplicateMode, setDuplicateMode] = useState<"skip" | "update">("skip");

  const [previewOnlyDuplicates, setPreviewOnlyDuplicates] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageZipInputRef = useRef<HTMLInputElement | null>(null);

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

  const parsed = useMemo(() => {
    const valid: DuaImportItem[] = [];
    const duplicatesExisting: DuaImportItem[] = [];
    const duplicatesInFile: DuaImportItem[] = [];
    const invalid: string[] = [];
    const seen = new Set<string>();

    rawItems.forEach((item, idx) => {
      const normalized = normalizeItem(item);
      const res = duaImportItemSchema.safeParse(normalized);
      if (!res.success) {
        const reason = res.error.issues
          .slice(0, 2)
          .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
          .join("; ");
        invalid.push(`Row ${idx + 1}: ${reason || "invalid format"}`);
        return;
      }

      const it = res.data;
      const key = makeKey(it.title, it.title_arabic);

      if (seen.has(key)) {
        duplicatesInFile.push(it);
        return;
      }

      if (existingKeys.has(key)) {
        duplicatesExisting.push(it);
        return;
      }

      seen.add(key);
      valid.push(it);
    });

    return {
      valid,
      duplicatesExisting,
      duplicatesInFile,
      duplicates: [...duplicatesExisting, ...duplicatesInFile],
      invalid,
    };
  }, [rawItems, existingKeys]);

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
    setImageImportProgress(null);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
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

  const handleExportOgImages = async () => {
    try {
      setIsExportingImages(true);
      const res = await exportOgImagesToZip();
      toast({ title: "Images Exported", description: `${res.total} টি OG ইমেজ ডাউনলোড হয়েছে` });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Image export failed";
      toast({ title: "Export failed", description: msg, variant: "destructive" });
    } finally {
      setIsExportingImages(false);
    }
  };

  const handleImportOgImages = async (file: File | null) => {
    if (!file || !canEdit) return;
    try {
      setIsImportingImages(true);
      setImageImportProgress({ current: 0, total: 0 });
      const res = await importOgImagesFromZip(file, {
        onProgress: (current, total) => setImageImportProgress({ current, total })
      });
      toast({ title: "Images Imported", description: `${res.total} টি OG ইমেজ আপলোড হয়েছে` });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Image import failed";
      toast({ title: "Import failed", description: msg, variant: "destructive" });
    } finally {
      setIsImportingImages(false);
      setImageImportProgress(null);
      if (imageZipInputRef.current) imageZipInputRef.current.value = "";
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

    setIsImporting(true);
    let inserted = 0;
    let updated = 0;
    const insertedIds: string[] = [];
    const updatedIds: string[] = [];

    try {
      const toInsert = parsed.valid;
      const toUpdate = duplicateMode === "update" ? parsed.duplicatesExisting : [];

      if (toInsert.length) {
        const chunks = chunk(toInsert, 50);
        for (const c of chunks) {
          const rows = c.map((it) => ({
            content_type: "dua",
            title: it.title,
            title_arabic: it.title_arabic,
            title_en: it.title_en,
            title_hi: it.title_hi,
            title_ur: it.title_ur,
            content_arabic: it.content_arabic,
            content: it.content_bn,
            content_en: it.content_en,
            content_hi: it.content_hi,
            content_ur: it.content_ur,
            content_pronunciation: it.pronunciation,
            content_pronunciation_en: it.pronunciation_en,
            content_pronunciation_hi: it.pronunciation_hi,
            content_pronunciation_ur: it.pronunciation_ur,
            category: it.category,
            slug: it.slug,
            source_type: it.source_type,
            reference: it.reference,
            hadith_reference: it.hadith_reference,
            explanation_bn: it.explanation_bn,
            explanation_en: it.explanation_en,
            explanation_hi: it.explanation_hi,
            explanation_ur: it.explanation_ur,
            benefits_bn: it.benefits_bn,
            benefits_en: it.benefits_en,
            benefits_hi: it.benefits_hi,
            benefits_ur: it.benefits_ur,
            when_to_recite_bn: it.when_to_recite_bn,
            when_to_recite_en: it.when_to_recite_en,
            when_to_recite_hi: it.when_to_recite_hi,
            when_to_recite_ur: it.when_to_recite_ur,
            subtitle: it.subtitle,
            authenticity: it.authenticity,
            difficulty: it.difficulty,
            time_required: it.time_required,
            hook: it.hook,
            share_text: it.share_text,
            virtue: it.virtue,
            virtue_reference: it.virtue_reference,
            viral_score: it.viral_score,
            audio_url: it.audio_url,
            emotion: it.emotion,
            user_intents: it.user_intents,
            recommendation_tags: it.recommendation_tags,
            recommended_moments: it.recommended_moments,
            semantic_entities: it.semantic_entities,
            normalized_surah_names: it.normalized_surah_names,
            related_duas: it.related_duas,
            hook_variants: it.hook_variants,
            social: it.social,
            og_image_data: it.og_image_data,
            seo: it.seo,
            quran_meta: it.quran_meta,
            category_hierarchy: it.category_hierarchy,
            faq: it.faq,
            search_aliases: it.search_aliases,
            image_url: it.image_url,
            metadata: {
              source: it.source,
              ...it.extras,
            },
          }));
          const { data, error } = await supabase.from("admin_content").insert(rows).select("id");
          if (error) throw error;
          inserted += rows.length;
          if (data) insertedIds.push(...data.map((r) => r.id));
        }
      }

      if (toUpdate.length) {
        for (const it of toUpdate) {
          const { data, error } = await supabase
            .from("admin_content")
            .update({
              title_en: it.title_en,
              title_hi: it.title_hi,
              title_ur: it.title_ur,
              content_arabic: it.content_arabic,
              content: it.content_bn,
              content_en: it.content_en,
              content_hi: it.content_hi,
              content_ur: it.content_ur,
              content_pronunciation: it.pronunciation,
              content_pronunciation_en: it.pronunciation_en,
              content_pronunciation_hi: it.pronunciation_hi,
              content_pronunciation_ur: it.pronunciation_ur,
              category: it.category,
              source_type: it.source_type,
              reference: it.reference,
              hadith_reference: it.hadith_reference,
              explanation_bn: it.explanation_bn,
              explanation_en: it.explanation_en,
              explanation_hi: it.explanation_hi,
              explanation_ur: it.explanation_ur,
              benefits_bn: it.benefits_bn,
              benefits_en: it.benefits_en,
              benefits_hi: it.benefits_hi,
              benefits_ur: it.benefits_ur,
              when_to_recite_bn: it.when_to_recite_bn,
              when_to_recite_en: it.when_to_recite_en,
              when_to_recite_hi: it.when_to_recite_hi,
              when_to_recite_ur: it.when_to_recite_ur,
              subtitle: it.subtitle,
              authenticity: it.authenticity,
              difficulty: it.difficulty,
              time_required: it.time_required,
              hook: it.hook,
              share_text: it.share_text,
              virtue: it.virtue,
              virtue_reference: it.virtue_reference,
              viral_score: it.viral_score,
              audio_url: it.audio_url,
              emotion: it.emotion,
              user_intents: it.user_intents,
              recommendation_tags: it.recommendation_tags,
              recommended_moments: it.recommended_moments,
              semantic_entities: it.semantic_entities,
              normalized_surah_names: it.normalized_surah_names,
              related_duas: it.related_duas,
              hook_variants: it.hook_variants,
              social: it.social,
              og_image_data: it.og_image_data,
              seo: it.seo,
              quran_meta: it.quran_meta,
              category_hierarchy: it.category_hierarchy,
              faq: it.faq,
              search_aliases: it.search_aliases,
              image_url: it.image_url,
              metadata: {
                source: it.source,
                ...it.extras,
              },
            })
            .eq("content_type", "dua")
            .eq("title", it.title)
            .select("id")
            .maybeSingle();

          if (error) throw error;
          if (data) {
            updated++;
            updatedIds.push(data.id);
          }
        }
      }

      const res: ImportResult = {
        total: rawItems.length,
        inserted,
        updated,
        skipped: parsed.duplicatesInFile.length + (duplicateMode === "skip" ? parsed.duplicatesExisting.length - updated : 0),
        invalid: parsed.invalid.length,
        insertedIds,
        updatedIds,
      };

      toast({
        title: "Import complete",
        description: `${inserted} inserted, ${updated} updated`,
      });
      onImported?.(res);
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
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between pr-8">
            <div>
              <DialogTitle className="text-xl">Bulk Import/Export Duas</DialogTitle>
              <DialogDescription>JSON ফরম্যাটে দোয়া ইমপোর্ট বা এক্সপোর্ট করুন</DialogDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                ref={imageZipInputRef}
                className="hidden"
                accept=".zip"
                onChange={(e) => handleImportOgImages(e.target.files?.[0] || null)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => imageZipInputRef.current?.click()}
                disabled={isImportingImages || !canEdit}
                className="gap-2"
              >
                <FileArchive className="h-4 w-4" />
                {isImportingImages ? `Importing...` : "Import OG Images (ZIP)"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportOgImages}
                disabled={isExportingImages}
                className="gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                {isExportingImages ? "Exporting..." : "Export OG Images (ZIP)"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportAllFromDb}
                disabled={isExportingAll}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {isExportingAll ? "Exporting..." : "Export All JSON"}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {rawItems.length === 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">JSON Input (Array of objects)</Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handlePickFile} className="gap-2">
                    <Upload className="h-4 w-4" /> Load File
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".json"
                    onChange={(e) => handleFileSelected(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
              <Textarea
                placeholder="Paste your JSON here..."
                className="min-h-[300px] font-mono text-xs"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
              />
              {errors.length > 0 && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
                  <p className="font-semibold mb-1">Parsing Errors:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-primary/5 border-primary/20">
                  <p className="text-sm text-muted-foreground">Total in File</p>
                  <p className="text-2xl font-bold">{rawItems.length}</p>
                </Card>
                <Card className="p-4 bg-green-500/5 border-green-500/20">
                  <p className="text-sm text-muted-foreground">New Items</p>
                  <p className="text-2xl font-bold text-green-600">{parsed.valid.length}</p>
                </Card>
                <Card className="p-4 bg-amber-500/5 border-amber-500/20">
                  <p className="text-sm text-muted-foreground">Duplicates</p>
                  <p className="text-2xl font-bold text-amber-600">{parsed.duplicates.length}</p>
                </Card>
                <Card className="p-4 bg-destructive/5 border-destructive/20">
                  <p className="text-sm text-muted-foreground">Invalid</p>
                  <p className="text-2xl font-bold text-destructive">{parsed.invalid.length}</p>
                </Card>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-6">
                  <div className="space-y-1">
                    <Label className="text-xs uppercase text-muted-foreground">Duplicate Strategy</Label>
                    <Select
                      value={duplicateMode}
                      onValueChange={(v: any) => setDuplicateMode(v)}
                    >
                      <SelectTrigger className="w-[180px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">Skip Existing</SelectItem>
                        <SelectItem value="update">Update Existing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <Switch
                      id="preview-duplicates"
                      checked={previewOnlyDuplicates}
                      onCheckedChange={setPreviewOnlyDuplicates}
                    />
                    <Label htmlFor="preview-duplicates" className="text-sm cursor-pointer">
                      Show Duplicates Only
                    </Label>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Columns3 className="h-4 w-4" /> Columns
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={visibleCols.content_bn}
                      onCheckedChange={(v) => setVisibleCols(prev => ({ ...prev, content_bn: !!v }))}
                    >
                      Content (BN)
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={visibleCols.content_en}
                      onCheckedChange={(v) => setVisibleCols(prev => ({ ...prev, content_en: !!v }))}
                    >
                      Content (EN)
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={visibleCols.pron_bn}
                      onCheckedChange={(v) => setVisibleCols(prev => ({ ...prev, pron_bn: !!v }))}
                    >
                      Pronunciation (BN)
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Title (BN/AR)</TableHead>
                      {visibleCols.content_bn && <TableHead>Content (BN)</TableHead>}
                      {visibleCols.content_en && <TableHead>Content (EN)</TableHead>}
                      <TableHead className="w-24 text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewList.slice(0, 50).map((item, idx) => {
                      const key = makeKey(item.title, item.title_arabic);
                      const isDup = existingKeys.has(key);
                      return (
                        <TableRow key={idx}>
                          <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                          <TableCell>
                            <div className="font-medium">{item.title}</div>
                            {item.title_arabic && (
                              <div className="text-xs text-muted-foreground font-arabic mt-0.5" dir="rtl">
                                {item.title_arabic}
                              </div>
                            )}
                          </TableCell>
                          {visibleCols.content_bn && (
                            <TableCell className="max-w-xs truncate text-xs">
                              {item.content_bn}
                            </TableCell>
                          )}
                          {visibleCols.content_en && (
                            <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                              {item.content_en}
                            </TableCell>
                          )}
                          <TableCell className="text-center">
                            {isDup ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                DUPLICATE
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800 border border-green-200">
                                NEW
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {previewList.length > 50 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground italic bg-muted/20">
                          Showing first 50 of {previewList.length} items...
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/20">
          <Button variant="ghost" onClick={() => handleClose(false)} disabled={isImporting}>
            Cancel
          </Button>
          {rawItems.length === 0 ? (
            <Button onClick={parseFiles} disabled={isParsing || !jsonInput.trim()}>
              {isParsing ? "Parsing..." : "Analyze JSON"}
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setRawItems([])} disabled={isImporting}>
                Back to Input
              </Button>
              <Button onClick={doImport} disabled={isImporting || !canEdit}>
                {isImporting ? "Importing..." : `Import ${previewList.length} Items`}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
