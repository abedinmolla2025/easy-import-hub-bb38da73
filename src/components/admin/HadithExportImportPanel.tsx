import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Loader2, CheckCircle2, XCircle, AlertTriangle, StopCircle, FileJson, ShieldCheck } from "lucide-react";

// Whitelist of columns the importer is allowed to update. Anything else in the
// uploaded JSON is silently ignored so we cannot accidentally corrupt schema.
// `id` and `slug` are matcher keys, never patched.
const UPDATABLE_FIELDS = [
  "arabic",
  "bengali",
  "english",
  "hindi",
  "urdu",
  "chapter_id",
  "hadith_number",
  "book_key",
  "topic_bn",
  "explanation_bn",
  "lessons_bn",
  // Future enrichment fields — added to allowlist so they flow through as soon
  // as the columns exist. Rows silently no-op if a column is missing.
  "summary_bn",
  "keywords_bn",
  "benefits_bn",
] as const;

type UpdatableField = (typeof UPDATABLE_FIELDS)[number];

type ImportRecord = Record<string, unknown> & { id?: string; slug?: string };

type LogEntry = { level: "info" | "warn" | "error"; message: string; at: string };

type ImportStats = {
  total: number;
  valid: number;
  skipped: number;
  failed: number;
  updated: number;
};

const BATCH_SIZE = 150;
const PAGE_SIZE = 1000;

function todayStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function fetchAllHadiths(
  onProgress?: (loaded: number) => void,
): Promise<Record<string, unknown>[]> {
  const all: Record<string, unknown>[] = [];
  let from = 0;
  // paginate to bypass the default row limit
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase
      .from("hadiths")
      .select("*")
      .order("book_key", { ascending: true })
      .order("hadith_number", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as Record<string, unknown>[]));
    onProgress?.(all.length);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

async function fetchIdSlugIndex(): Promise<{
  ids: Set<string>;
  slugToId: Map<string, string>;
}> {
  const ids = new Set<string>();
  const slugToId = new Map<string, string>();
  let from = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase
      .from("hadiths")
      .select("id, slug")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const row of data as { id: string; slug: string | null }[]) {
      ids.add(row.id);
      if (row.slug) slugToId.set(row.slug, row.id);
    }
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return { ids, slugToId };
}

function buildUpdatePayload(record: ImportRecord): Partial<Record<UpdatableField, unknown>> {
  const payload: Partial<Record<UpdatableField, unknown>> = {};
  for (const key of UPDATABLE_FIELDS) {
    if (!(key in record)) continue;
    const value = record[key];
    // Preserve semantics: skip undefined / null so we never wipe existing data.
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim().length === 0) continue;
    payload[key] = value;
  }
  return payload;
}

export default function HadithExportImportPanel() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef(false);

  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const pushLog = useCallback((level: LogEntry["level"], message: string) => {
    setLogs((prev) => [
      ...prev.slice(-499),
      { level, message, at: new Date().toISOString().slice(11, 19) },
    ]);
  }, []);

  // ---------- EXPORT ----------
  const runExport = useCallback(async () => {
    setExporting(true);
    setExportProgress(0);
    try {
      const rows = await fetchAllHadiths((loaded) => setExportProgress(loaded));
      downloadJson(`hadiths-export-${todayStamp()}.json`, rows);
      toast({
        title: "Export ready",
        description: `${rows.length} hadiths downloaded.`,
      });
    } catch (err) {
      toast({
        title: "Export failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  }, [toast]);

  // ---------- IMPORT ----------
  const runImport = useCallback(
    async (file: File) => {
      cancelRef.current = false;
      setImporting(true);
      setProgress(0);
      setLogs([]);
      setStats(null);

      const local: ImportStats = { total: 0, valid: 0, skipped: 0, failed: 0, updated: 0 };

      try {
        pushLog("info", `Reading ${file.name} (${(file.size / 1024).toFixed(1)} KB)…`);
        const text = await file.text();
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          throw new Error("Invalid JSON — file could not be parsed.");
        }
        const raw = Array.isArray(parsed) ? parsed : (parsed as { hadiths?: unknown })?.hadiths;
        if (!Array.isArray(raw)) {
          throw new Error("JSON must be an array of hadith objects (or { hadiths: [...] }).");
        }
        local.total = raw.length;
        setStats({ ...local });
        pushLog("info", `Parsed ${raw.length} records.`);

        // Backup current DB before mutating
        pushLog("info", "Creating pre-import backup…");
        const backup = await fetchAllHadiths();
        downloadJson(`hadiths-backup-${todayStamp()}.json`, backup);
        pushLog("info", `Backup downloaded (${backup.length} rows).`);

        // Build id/slug index for matching
        pushLog("info", "Indexing existing rows…");
        const { ids, slugToId } = await fetchIdSlugIndex();
        pushLog("info", `Indexed ${ids.size} existing hadiths.`);

        // Resolve target id + payload per record
        type Prepared = { id: string; payload: Partial<Record<UpdatableField, unknown>> };
        const prepared: Prepared[] = [];
        for (let i = 0; i < raw.length; i++) {
          const rec = raw[i] as ImportRecord;
          if (!rec || typeof rec !== "object") {
            local.skipped++;
            pushLog("warn", `Row ${i + 1}: not an object, skipped.`);
            continue;
          }
          let targetId: string | undefined;
          if (typeof rec.id === "string" && ids.has(rec.id)) {
            targetId = rec.id;
          } else if (typeof rec.slug === "string" && slugToId.has(rec.slug)) {
            targetId = slugToId.get(rec.slug);
          }
          if (!targetId) {
            local.skipped++;
            pushLog("warn", `Row ${i + 1}: no matching id/slug in DB, skipped.`);
            continue;
          }
          const payload = buildUpdatePayload(rec);
          if (Object.keys(payload).length === 0) {
            local.skipped++;
            pushLog("warn", `Row ${i + 1} (${targetId}): no updatable fields, skipped.`);
            continue;
          }
          prepared.push({ id: targetId, payload });
          local.valid++;
        }
        setStats({ ...local });
        pushLog("info", `${prepared.length} records ready to update.`);

        // Batch updates
        const totalBatches = Math.ceil(prepared.length / BATCH_SIZE) || 1;
        for (let b = 0; b < totalBatches; b++) {
          if (cancelRef.current) {
            pushLog("warn", "Import cancelled by user.");
            break;
          }
          const batch = prepared.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);

          const runBatch = async () =>
            Promise.all(
              batch.map((item) =>
                supabase
                  .from("hadiths")
                  .update(item.payload as never)
                  .eq("id", item.id)
                  .then((res) => ({ item, res })),
              ),
            );

          let results: Awaited<ReturnType<typeof runBatch>>;
          try {
            results = await runBatch();
          } catch (err) {
            pushLog(
              "warn",
              `Batch ${b + 1} threw (${err instanceof Error ? err.message : String(err)}). Retrying once…`,
            );
            try {
              results = await runBatch();
            } catch (err2) {
              local.failed += batch.length;
              pushLog(
                "error",
                `Batch ${b + 1} failed permanently: ${err2 instanceof Error ? err2.message : String(err2)}`,
              );
              setStats({ ...local });
              setProgress(Math.round(((b + 1) / totalBatches) * 100));
              continue;
            }
          }

          const failedItems: typeof batch = [];
          for (const { item, res } of results) {
            if (res.error) {
              failedItems.push(item);
            } else {
              local.updated++;
            }
          }

          if (failedItems.length > 0) {
            pushLog(
              "warn",
              `Batch ${b + 1}: ${failedItems.length}/${batch.length} rows failed, retrying…`,
            );
            const retry = await Promise.all(
              failedItems.map((item) =>
                supabase
                  .from("hadiths")
                  .update(item.payload as never)
                  .eq("id", item.id)
                  .then((res) => ({ item, res })),
              ),
            );
            for (const { item, res } of retry) {
              if (res.error) {
                local.failed++;
                pushLog("error", `Row ${item.id}: ${res.error.message}`);
              } else {
                local.updated++;
              }
            }
          }

          setStats({ ...local });
          setProgress(Math.round(((b + 1) / totalBatches) * 100));
          // Yield to keep UI responsive
          await new Promise((r) => setTimeout(r, 10));
        }

        pushLog(
          "info",
          `Done. Updated ${local.updated}, skipped ${local.skipped}, failed ${local.failed}.`,
        );
        toast({
          title: cancelRef.current ? "Import cancelled" : "Import finished",
          description: `${local.updated} updated · ${local.skipped} skipped · ${local.failed} failed`,
        });
      } catch (err) {
        pushLog("error", err instanceof Error ? err.message : String(err));
        toast({
          title: "Import failed",
          description: err instanceof Error ? err.message : String(err),
          variant: "destructive",
        });
      } finally {
        setImporting(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [pushLog, toast],
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void runImport(f);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileJson className="h-4 w-4" /> Hadith JSON Export &amp; Enrichment Import
        </CardTitle>
        <CardDescription>
          Export the full dataset, enrich externally, then re-import to update only the fields you
          include. Records are matched by <code>id</code> (fallback <code>slug</code>); missing
          fields are never overwritten.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Export Hadith JSON</p>
              <p className="text-xs text-muted-foreground">
                Downloads <code>hadiths-export-{todayStamp()}.json</code> — every row, every field,
                UTF-8.
              </p>
            </div>
            <Button onClick={runExport} disabled={exporting}>
              {exporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting… {exportProgress}
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export JSON
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Import */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Import Enriched Hadith JSON</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Auto-backup runs before any write. Update-only, no inserts, no deletes.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                onChange={onFileChange}
                disabled={importing}
                className="hidden"
                id="hadith-import-file"
              />
              <Button
                variant="outline"
                disabled={importing}
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose JSON…
              </Button>
              {importing && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    cancelRef.current = true;
                  }}
                >
                  <StopCircle className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {(importing || stats) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}
                <span>Progress: {progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                  <Stat label="Total" value={stats.total} />
                  <Stat label="Valid" value={stats.valid} tone="info" />
                  <Stat label="Updated" value={stats.updated} tone="success" />
                  <Stat label="Skipped" value={stats.skipped} tone="warn" />
                  <Stat label="Failed" value={stats.failed} tone="danger" />
                </div>
              )}
            </div>
          )}

          {logs.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer font-medium">
                Import log ({logs.length})
              </summary>
              <ul className="mt-2 max-h-64 overflow-y-auto space-y-1 rounded border bg-muted/30 p-2 font-mono">
                {logs.map((l, i) => (
                  <li
                    key={i}
                    className={
                      l.level === "error"
                        ? "text-destructive"
                        : l.level === "warn"
                          ? "text-amber-600"
                          : "text-muted-foreground"
                    }
                  >
                    <span className="opacity-60">[{l.at}]</span>{" "}
                    {l.level === "error" ? (
                      <XCircle className="inline h-3 w-3 mr-1" />
                    ) : l.level === "warn" ? (
                      <AlertTriangle className="inline h-3 w-3 mr-1" />
                    ) : null}
                    {l.message}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "info" | "success" | "warn" | "danger";
}) {
  const color =
    tone === "success"
      ? "text-green-600"
      : tone === "warn"
        ? "text-amber-600"
        : tone === "danger"
          ? "text-destructive"
          : tone === "info"
            ? "text-primary"
            : "text-foreground";
  return (
    <div className="rounded-lg border p-2">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}