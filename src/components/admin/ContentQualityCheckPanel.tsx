import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ShieldCheck, RefreshCw, AlertTriangle, Loader2, Eraser, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Kind = "hadith" | "dua";

interface Sample {
  id: string;
  title: string;
  updated_at: string | null;
  primary: string; // main generated text used for scoring
  secondary?: string; // e.g. lessons / benefits
  primaryLabel: string;
  secondaryLabel?: string;
}

interface Signals {
  words: number;
  chars: number;
  uniqueRatio: number; // 0..1 — lower = more repetitive
  bigramRepeat: number; // 0..1 — higher = more repetitive
  duplicateOf?: string; // sample id
  templatePhrases: string[];
  isFlagged: boolean;
  reasons: string[];
}

const TEMPLATE_PHRASES = [
  "as an ai",
  "i cannot",
  "i'm sorry",
  "language model",
  "in conclusion",
  "উপসংহারে",
  "একটি এআই",
  "আমি একটি",
  "উপরোক্ত",
  "নিম্নলিখিত হল",
];

const SAMPLE_SIZE = 20;

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[।.,!?'"“”‘’()\[\]{}]/g, "")
    .trim();

const scoreText = (text: string): Omit<Signals, "duplicateOf" | "isFlagged" | "reasons"> => {
  const clean = normalize(text || "");
  const words = clean ? clean.split(" ").filter(Boolean) : [];
  const unique = new Set(words);
  const uniqueRatio = words.length ? unique.size / words.length : 0;

  // bigram repetition
  const bigrams = new Map<string, number>();
  for (let i = 0; i < words.length - 1; i++) {
    const bg = `${words[i]} ${words[i + 1]}`;
    bigrams.set(bg, (bigrams.get(bg) ?? 0) + 1);
  }
  const totalBg = Math.max(1, words.length - 1);
  const repeatedBg = Array.from(bigrams.values()).filter((c) => c > 1).reduce((a, b) => a + b, 0);
  const bigramRepeat = repeatedBg / totalBg;

  const lower = (text || "").toLowerCase();
  const templatePhrases = TEMPLATE_PHRASES.filter((p) => lower.includes(p));

  return {
    words: words.length,
    chars: (text || "").length,
    uniqueRatio,
    bigramRepeat,
    templatePhrases,
  };
};

const evaluate = (samples: Array<{ sample: Sample; base: Omit<Signals, "duplicateOf" | "isFlagged" | "reasons"> }>): Map<string, Signals> => {
  const out = new Map<string, Signals>();
  const hashes = new Map<string, string>(); // normalized-text -> sample id

  for (const { sample, base } of samples) {
    const key = normalize(sample.primary).slice(0, 200);
    const duplicateOf = key.length > 30 && hashes.has(key) ? hashes.get(key) : undefined;
    if (key.length > 30 && !duplicateOf) hashes.set(key, sample.id);

    const reasons: string[] = [];
    if (base.words < 40) reasons.push(`Too short (${base.words} words)`);
    if (base.uniqueRatio > 0 && base.uniqueRatio < 0.45) reasons.push(`Low vocabulary diversity (${Math.round(base.uniqueRatio * 100)}%)`);
    if (base.bigramRepeat > 0.25) reasons.push(`Repetitive phrasing (${Math.round(base.bigramRepeat * 100)}%)`);
    if (base.templatePhrases.length) reasons.push(`AI/template phrases: ${base.templatePhrases.join(", ")}`);
    if (duplicateOf) reasons.push("Duplicate of another sample");
    if (!base.words) reasons.push("Empty content");

    out.set(sample.id, {
      ...base,
      duplicateOf,
      reasons,
      isFlagged: reasons.length > 0,
    });
  }
  return out;
};

export default function ContentQualityCheckPanel() {
  const { toast } = useToast();
  const [kind, setKind] = useState<Kind>("hadith");
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [clearingId, setClearingId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (kind === "hadith") {
        const { data, error } = await supabase
          .from("hadiths")
          .select("id, bengali, explanation_bn, lessons_bn, updated_at")
          .not("explanation_bn", "is", null)
          .order("updated_at", { ascending: false })
          .limit(SAMPLE_SIZE);
        if (error) throw error;
        setSamples(
          (data ?? []).map((r: any) => ({
            id: r.id,
            title: (r.bengali || "").slice(0, 80) || r.id.slice(0, 8),
            updated_at: r.updated_at,
            primary: r.explanation_bn ?? "",
            secondary: Array.isArray(r.lessons_bn) ? r.lessons_bn.join(" • ") : (r.lessons_bn ?? ""),
            primaryLabel: "explanation_bn",
            secondaryLabel: "lessons_bn",
          })),
        );
      } else {
        const { data, error } = await supabase
          .from("admin_content")
          .select("id, title, content, metadata, updated_at, content_type")
          .eq("content_type", "dua")
          .order("updated_at", { ascending: false })
          .limit(SAMPLE_SIZE * 2);
        if (error) throw error;
        const mapped = (data ?? [])
          .map((r: any) => {
            const meta = r.metadata ?? {};
            const explanation = meta.explanation_bn || meta.explanation || "";
            const benefits = Array.isArray(meta.benefits_bn)
              ? meta.benefits_bn.join(" • ")
              : Array.isArray(meta.benefits)
                ? meta.benefits.join(" • ")
                : "";
            return {
              id: r.id,
              title: (r.title || "").slice(0, 80) || r.id.slice(0, 8),
              updated_at: r.updated_at,
              primary: explanation,
              secondary: benefits,
              primaryLabel: "explanation",
              secondaryLabel: "benefits",
            } as Sample;
          })
          .filter((s) => s.primary && s.primary.length > 0)
          .slice(0, SAMPLE_SIZE);
        setSamples(mapped);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load samples";
      toast({ title: "Sample লোড ব্যর্থ", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [kind, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (autoRefresh) {
      timerRef.current = setInterval(() => load(), 15000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRefresh, load]);

  const scored = useMemo(() => {
    const withBase = samples.map((sample) => ({ sample, base: scoreText(sample.primary) }));
    return evaluate(withBase);
  }, [samples]);

  const flaggedCount = useMemo(
    () => Array.from(scored.values()).filter((s) => s.isFlagged).length,
    [scored],
  );

  const clearForRegen = useCallback(
    async (sample: Sample) => {
      if (!confirm("এই আইটেমের জেনারেটেড কন্টেন্ট মুছে ফেলা হবে যাতে ‘Run All Missing’ আবার তৈরি করে। চালিয়ে যাব?")) return;
      setClearingId(sample.id);
      try {
        if (kind === "hadith") {
          const { error } = await supabase
            .from("hadiths")
            .update({ explanation_bn: null, lessons_bn: null })
            .eq("id", sample.id);
          if (error) throw error;
        } else {
          // fetch existing metadata, strip explanation/benefits fields, write back
          const { data, error: fetchErr } = await supabase
            .from("admin_content")
            .select("metadata")
            .eq("id", sample.id)
            .single();
          if (fetchErr) throw fetchErr;
          const raw = data?.metadata;
          const meta: Record<string, unknown> =
            raw && typeof raw === "object" && !Array.isArray(raw) ? { ...(raw as Record<string, unknown>) } : {};
          delete meta.explanation_bn;
          delete meta.explanation;
          delete meta.benefits_bn;
          delete meta.benefits;
          const { error } = await supabase
            .from("admin_content")
            .update({ metadata: meta as any })
            .eq("id", sample.id);
          if (error) throw error;
        }
        toast({ title: "Cleared", description: "পরবর্তী ‘Run All Missing’-এ এটি আবার তৈরি হবে।" });
        setSamples((prev) => prev.filter((s) => s.id !== sample.id));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Clear failed";
        toast({ title: "ব্যর্থ", description: msg, variant: "destructive" });
      } finally {
        setClearingId(null);
      }
    },
    [kind, toast],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-primary" /> Quality Check
          {flaggedCount > 0 && (
            <Badge variant="destructive" className="ml-1">
              {flaggedCount} flagged
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          সাম্প্রতিক {SAMPLE_SIZE} জেনারেটেড নমুনা বিশ্লেষণ — শব্দসংখ্যা, ভোকাবুলারি ডাইভার্সিটি, ফ্রেজ পুনরাবৃত্তি, ডুপ্লিকেট ও টেমপ্লেট
          ফ্রেজ ডিটেকশন। “Run All Missing” চলাকালীন Auto-refresh অন করে রিয়েল-টাইমে মনিটর করো।
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={kind} onValueChange={(v) => setKind(v as Kind)}>
            <TabsList>
              <TabsTrigger value="hadith">Hadith</TabsTrigger>
              <TabsTrigger value="dua">Dua</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch id="qc-auto" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
              <Label htmlFor="qc-auto" className="text-xs">
                Auto-refresh (15s)
              </Label>
            </div>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
          </div>
        </div>

        <Tabs value={kind}>
          <TabsContent value={kind} className="mt-0">
            {samples.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground py-8 text-center">কোনো জেনারেটেড নমুনা এখনো পাওয়া যায়নি।</p>
            )}
            <ul className="space-y-3">
              {samples.map((s) => {
                const sig = scored.get(s.id);
                if (!sig) return null;
                return (
                  <li
                    key={s.id}
                    className={`rounded-lg border p-3 ${sig.isFlagged ? "border-destructive/60 bg-destructive/5" : "border-border"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {sig.isFlagged ? (
                            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                          )}
                          <p className="text-sm font-medium truncate">{s.title}</p>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {s.updated_at ? new Date(s.updated_at).toLocaleTimeString() : ""}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <Badge variant="outline" className="text-[10px]">{sig.words} words</Badge>
                          <Badge variant="outline" className="text-[10px]">unique {Math.round(sig.uniqueRatio * 100)}%</Badge>
                          <Badge variant="outline" className="text-[10px]">repeat {Math.round(sig.bigramRepeat * 100)}%</Badge>
                          {sig.duplicateOf && <Badge variant="destructive" className="text-[10px]">duplicate</Badge>}
                          {sig.templatePhrases.length > 0 && (
                            <Badge variant="destructive" className="text-[10px]">template</Badge>
                          )}
                        </div>
                        {sig.reasons.length > 0 && (
                          <ul className="text-xs text-destructive mb-2 list-disc list-inside">
                            {sig.reasons.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        )}
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground">
                            {s.primaryLabel} preview
                          </summary>
                          <p className="mt-1 whitespace-pre-wrap rounded bg-muted/40 p-2 text-foreground">
                            {s.primary || <em className="text-muted-foreground">empty</em>}
                          </p>
                          {s.secondary && (
                            <>
                              <p className="mt-2 text-muted-foreground">{s.secondaryLabel}</p>
                              <p className="mt-1 whitespace-pre-wrap rounded bg-muted/40 p-2 text-foreground">
                                {s.secondary}
                              </p>
                            </>
                          )}
                        </details>
                      </div>
                      {sig.isFlagged && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => clearForRegen(s)}
                          disabled={clearingId === s.id}
                          className="shrink-0"
                        >
                          {clearingId === s.id ? (
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          ) : (
                            <Eraser className="mr-2 h-3 w-3" />
                          )}
                          Clear & Regen
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}