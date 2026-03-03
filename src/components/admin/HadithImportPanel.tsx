import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Upload, FileJson, CheckCircle2, XCircle, AlertTriangle, Loader2, Database, Trash2, Merge } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

type HadithRecord = {
  id: string;
  chapter_id: number;
  hadith_number: number;
  arabic: string;
  bengali?: string;
  english?: string;
  hindi?: string;
};

type ValidationResult = {
  valid: HadithRecord[];
  errors: string[];
  duplicatesInFile: number;
  totalChapters: number;
};

type ImportSummary = {
  totalImported: number;
  totalSkipped: number;
  totalDuplicates: number;
  errors: string[];
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const BATCH_SIZE = 300;

const flattenIfNeeded = (data: unknown): unknown[] | null => {
  if (Array.isArray(data)) return data;
  // Support { book_1: [...], book_2: [...] } structure
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    const bookKeys = Object.keys(obj).filter((k) => /^book_\d+$/i.test(k));
    if (bookKeys.length > 0) {
      const sorted = bookKeys.sort((a, b) => parseInt(a.replace(/\D/g, "")) - parseInt(b.replace(/\D/g, "")));
      return sorted.flatMap((k) => (Array.isArray(obj[k]) ? obj[k] : []));
    }
  }
  return null;
};

const validateHadithArray = (data: unknown): ValidationResult => {
  const errors: string[] = [];

  const flat = flattenIfNeeded(data);
  if (!flat) {
    return { valid: [], errors: ["File must contain a JSON array or an object with book_N keys."], duplicatesInFile: 0, totalChapters: 0 };
  }

  const arr = flat;

  const seenIds = new Set<string>();
  const valid: HadithRecord[] = [];
  let duplicatesInFile = 0;
  const chapters = new Set<number>();

  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    const prefix = `Row ${i + 1}`;

    if (!item || typeof item !== "object") {
      errors.push(`${prefix}: Not an object.`);
      continue;
    }

    const { id, chapter_id, hadith_number, arabic } = item as Record<string, unknown>;

    if (typeof id !== "string" || !id.trim()) {
      errors.push(`${prefix}: Missing or invalid 'id' (string required).`);
      continue;
    }
    if (typeof chapter_id !== "number" || !Number.isInteger(chapter_id)) {
      errors.push(`${prefix}: Missing or invalid 'chapter_id' (integer required).`);
      continue;
    }
    if (typeof hadith_number !== "number" || !Number.isInteger(hadith_number)) {
      errors.push(`${prefix}: Missing or invalid 'hadith_number' (integer required).`);
      continue;
    }
    if (typeof arabic !== "string" || !arabic.trim()) {
      errors.push(`${prefix}: Missing or invalid 'arabic' (non-empty string required).`);
      continue;
    }

    if (seenIds.has(id)) {
      duplicatesInFile++;
      continue;
    }
    seenIds.add(id);
    chapters.add(chapter_id);

    valid.push({
      id: id.trim(),
      chapter_id,
      hadith_number,
      arabic: arabic.trim(),
      bengali: typeof (item as any).bengali === "string" ? (item as any).bengali : undefined,
      english: typeof (item as any).english === "string" ? (item as any).english : undefined,
      hindi: typeof (item as any).hindi === "string" ? (item as any).hindi : undefined,
    });
  }

  return { valid, errors: errors.slice(0, 50), duplicatesInFile, totalChapters: chapters.size };
};

export default function HadithImportPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [mode, setMode] = useState<"replace" | "merge">("merge");
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [existingCount, setExistingCount] = useState<number | null>(null);

  // Load existing count on mount-ish
  const loadExistingCount = useCallback(async () => {
    const { count } = await supabase.from("hadiths").select("*", { count: "exact", head: true });
    setExistingCount(count ?? 0);
  }, []);

  // On file select
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    setSummary(null);
    setValidation(null);
    setProgress(0);

    const f = e.target.files?.[0];
    if (!f) return;

    if (!f.name.endsWith(".json")) {
      toast({ title: "Invalid file type", description: "Only .json files are accepted.", variant: "destructive" });
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: `Max file size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`, variant: "destructive" });
      return;
    }

    setFile(f);

    try {
      const text = await f.text();
      const parsed = JSON.parse(text);
      const result = validateHadithArray(parsed);
      setValidation(result);
      await loadExistingCount();
    } catch {
      toast({ title: "Invalid JSON", description: "Could not parse the file as JSON.", variant: "destructive" });
      setFile(null);
    }
  }, [toast, loadExistingCount]);

  const startImport = useCallback(async () => {
    if (!validation || validation.valid.length === 0) return;

    setImporting(true);
    setProgress(0);
    setSummary(null);

    const records = validation.valid;
    const importErrors: string[] = [];
    let totalImported = 0;
    let totalSkipped = 0;
    let totalDuplicates = 0;

    try {
      // If replace mode, backup by deleting existing
      if (mode === "replace") {
        const { error: delError } = await supabase.from("hadiths").delete().eq("book_key", "bukhari");
        if (delError) {
          importErrors.push(`Failed to clear existing data: ${delError.message}`);
          setImporting(false);
          setSummary({ totalImported: 0, totalSkipped: 0, totalDuplicates: 0, errors: importErrors });
          return;
        }
      }

      // If merge, fetch existing IDs to skip duplicates
      let existingIds = new Set<string>();
      if (mode === "merge") {
        const { data: existingData } = await supabase.from("hadiths").select("id").eq("book_key", "bukhari");
        existingIds = new Set((existingData ?? []).map((r) => r.id));
      }

      const totalBatches = Math.ceil(records.length / BATCH_SIZE);

      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);

        // Filter out existing in merge mode
        const toInsert = mode === "merge"
          ? batch.filter((r) => {
              if (existingIds.has(r.id)) {
                totalDuplicates++;
                return false;
              }
              return true;
            })
          : batch;

        if (toInsert.length > 0) {
          const rows = toInsert.map((r) => ({
            id: r.id,
            chapter_id: r.chapter_id,
            hadith_number: r.hadith_number,
            arabic: r.arabic,
            bengali: r.bengali ?? null,
            english: r.english ?? null,
            hindi: r.hindi ?? null,
            book_key: "bukhari",
          }));

          const { error } = await supabase.from("hadiths").insert(rows);

          if (error) {
            importErrors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
            totalSkipped += toInsert.length;
          } else {
            totalImported += toInsert.length;
          }
        }

        const currentBatch = Math.floor(i / BATCH_SIZE) + 1;
        setProgress(Math.round((currentBatch / totalBatches) * 100));

        // Yield to prevent UI freeze
        await new Promise((r) => setTimeout(r, 10));
      }
    } catch (err) {
      importErrors.push(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
    }

    setSummary({ totalImported, totalSkipped, totalDuplicates, errors: importErrors });
    setImporting(false);

    // Clear cache and revalidate
    queryClient.invalidateQueries();
    await loadExistingCount();

    if (importErrors.length === 0) {
      toast({ title: "Import Complete", description: `${totalImported} hadiths imported successfully.` });
    } else {
      toast({ title: "Import finished with errors", description: `${totalImported} imported, ${importErrors.length} errors.`, variant: "destructive" });
    }
  }, [validation, mode, toast, queryClient, loadExistingCount]);

  const handleImportClick = () => {
    if (mode === "replace" && (existingCount ?? 0) > 0) {
      setConfirmReplace(true);
    } else {
      startImport();
    }
  };

  const resetAll = () => {
    setFile(null);
    setValidation(null);
    setSummary(null);
    setProgress(0);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Hadith Import</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload and import Sahih al-Bukhari JSON dataset into the database.
        </p>
      </div>

      {/* Step 1: Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4" /> Upload JSON File
          </CardTitle>
          <CardDescription>Select a .json file containing an array of hadith objects (max 50MB).</CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
            disabled={importing}
          />
          {file && (
            <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              <FileJson className="h-3.5 w-3.5" />
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Validation */}
      {validation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {validation.valid.length > 0 ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              Validation Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold text-foreground">{validation.valid.length}</p>
                <p className="text-xs text-muted-foreground">Valid Records</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold text-foreground">{validation.totalChapters}</p>
                <p className="text-xs text-muted-foreground">Chapters</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">{validation.duplicatesInFile}</p>
                <p className="text-xs text-muted-foreground">Duplicates in File</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold text-destructive">{validation.errors.length}</p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
            </div>

            {existingCount !== null && existingCount > 0 && (
              <div className="flex items-center gap-2 rounded-md bg-muted p-2 text-sm">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span>{existingCount} existing hadiths in database.</span>
              </div>
            )}

            {validation.errors.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer text-destructive font-medium">
                  Show validation errors ({validation.errors.length})
                </summary>
                <ul className="mt-2 max-h-40 overflow-y-auto space-y-1 rounded border p-2 text-xs">
                  {validation.errors.map((err, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <AlertTriangle className="h-3 w-3 mt-0.5 text-destructive shrink-0" />
                      {err}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Import Options */}
      {validation && validation.valid.length > 0 && !summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Import Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setMode("merge")}
                disabled={importing}
                className={`flex-1 rounded-lg border-2 p-4 text-left transition-colors ${
                  mode === "merge" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <Merge className="h-5 w-5 mb-1" />
                <p className="font-semibold text-sm">Merge</p>
                <p className="text-xs text-muted-foreground">Add new records, skip existing duplicates.</p>
              </button>
              <button
                type="button"
                onClick={() => setMode("replace")}
                disabled={importing}
                className={`flex-1 rounded-lg border-2 p-4 text-left transition-colors ${
                  mode === "replace" ? "border-destructive bg-destructive/5" : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <Trash2 className="h-5 w-5 mb-1 text-destructive" />
                <p className="font-semibold text-sm">Replace</p>
                <p className="text-xs text-muted-foreground">Delete all existing Bukhari data and import fresh.</p>
              </button>
            </div>

            {importing && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing... {progress}%
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <Button onClick={handleImportClick} disabled={importing} className="w-full">
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Start Import ({validation.valid.length} records)
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {summary.errors.length === 0 ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
              Import Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{summary.totalImported}</p>
                <p className="text-xs text-muted-foreground">Imported</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">{summary.totalDuplicates}</p>
                <p className="text-xs text-muted-foreground">Duplicates Skipped</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold text-muted-foreground">{summary.totalSkipped}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold text-destructive">{summary.errors.length}</p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
            </div>

            {summary.errors.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer text-destructive font-medium">
                  Show errors ({summary.errors.length})
                </summary>
                <ul className="mt-2 max-h-40 overflow-y-auto space-y-1 rounded border p-2 text-xs">
                  {summary.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </details>
            )}

            <Button variant="outline" onClick={resetAll} className="w-full">
              Import Another File
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Replace Confirmation */}
      <AlertDialog open={confirmReplace} onOpenChange={setConfirmReplace}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace Existing Dataset?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {existingCount} existing Bukhari hadiths and replace them with {validation?.valid.length ?? 0} new records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmReplace(false);
                startImport();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Replace All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
