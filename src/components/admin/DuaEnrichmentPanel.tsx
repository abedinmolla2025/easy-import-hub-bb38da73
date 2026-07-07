import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Square,
  ChevronDown,
  ChevronUp,
  Check,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BATCH_SIZE = 5;

type Stats = { total: number; pending: number; awaitingReview: number };
type PendingItem = {
  id: string;
  title: string | null;
  category: string | null;
  metadata: any;
};

export default function DuaEnrichmentPanel() {
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [processedTotal, setProcessedTotal] = useState(0);
  const [failedTotal, setFailedTotal] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const stopRef = useRef(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("enrich-dua-content", {
      body: { action: "stats" },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Stats লোড করা যায়নি", description: error.message, variant: "destructive" });
      return;
    }
    setStats(data as Stats);
  }, [toast]);

  const loadPending = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("enrich-dua-content", {
      body: { action: "list_pending" },
    });
    if (error) {
      toast({ title: "Pending list লোড হয়নি", description: error.message, variant: "destructive" });
      return;
    }
    setPending(((data as any)?.items ?? []) as PendingItem[]);
  }, [toast]);

  useEffect(() => {
    loadStats();
    loadPending();
  }, [loadStats, loadPending]);

  const start = useCallback(async () => {
    if (running) return;
    stopRef.current = false;
    setRunning(true);
    setProcessedTotal(0);
    setFailedTotal(0);
    setErrors([]);

    let pendingCount = stats?.pending ?? Infinity;
    let totalSoFar = 0;
    let failSoFar = 0;
    let backoffMs = 800;

    while (!stopRef.current && pendingCount > 0) {
      const { data, error } = await supabase.functions.invoke("enrich-dua-content", {
        body: { action: "process", batchSize: BATCH_SIZE },
      });
      if (error) {
        toast({ title: "Generation error", description: error.message, variant: "destructive" });
        break;
      }
      const res = data as { processed: number; failed: number; errors?: string[]; pending: number; done: boolean };
      totalSoFar += res.processed;
      failSoFar += res.failed;
      setProcessedTotal(totalSoFar);
      setFailedTotal(failSoFar);
      if (res.errors?.length) setErrors((prev) => [...res.errors!, ...prev].slice(0, 20));
      pendingCount = res.pending;
      setStats((s) => (s ? { ...s, pending: pendingCount } : s));
      if (res.done) break;
      const hitRateLimit = (res.errors ?? []).some((e) => e.includes("RATE_LIMIT"));
      backoffMs = hitRateLimit ? Math.min(backoffMs * 2, 20000) : Math.max(800, Math.floor(backoffMs / 2));
      await new Promise((r) => setTimeout(r, backoffMs));
    }

    setRunning(false);
    toast({
      title: stopRef.current ? "থামানো হয়েছে" : "Batch শেষ",
      description: `${totalSoFar} টি enriched, ${failSoFar} ব্যর্থ। Pending review কিউতে দেখুন।`,
    });
    loadStats();
    loadPending();
  }, [running, stats, toast, loadStats, loadPending]);

  const stop = useCallback(() => {
    stopRef.current = true;
  }, []);

  const approve = useCallback(
    async (id: string) => {
      const { error } = await supabase.functions.invoke("enrich-dua-content", {
        body: { action: "approve", id },
      });
      if (error) {
        toast({ title: "Approve failed", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Approved ✓" });
      setPending((p) => p.filter((x) => x.id !== id));
      loadStats();
    },
    [toast, loadStats],
  );

  const reject = useCallback(
    async (id: string) => {
      const { error } = await supabase.functions.invoke("enrich-dua-content", {
        body: { action: "reject", id },
      });
      if (error) {
        toast({ title: "Reject failed", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Rejected" });
      setPending((p) => p.filter((x) => x.id !== id));
      loadStats();
    },
    [toast, loadStats],
  );

  const total = stats?.total ?? 0;
  const pendingCount = stats?.pending ?? 0;
  const awaiting = stats?.awaitingReview ?? 0;
  const enrichedApproved = total - pendingCount - awaiting;
  const overallPct = total > 0 ? Math.round((enrichedApproved / total) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" /> Enrich Dua Content (Context + Virtue + FAQ)
        </CardTitle>
        <CardDescription>
          প্রতিটি দোয়ার জন্য <code>when_to_recite</code> (৪ ভাষা), <code>virtue</code>, <code>FAQ</code>, validated hadith/Quran reference ও related duas তৈরি করে।
          সব AI output <strong>pending review</strong> কিউতে যায় — আপনি approve করলে তবেই live হবে। বাতিল হলে overwrite হয় না।
          Batch size: {BATCH_SIZE}।
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{total}</p>
            <p className="text-xs text-muted-foreground">মোট দোয়া</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{enrichedApproved}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{awaiting}</p>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">এখনো enrich হয়নি</p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Overall Progress (approved)</span>
            <span>{overallPct}%</span>
          </div>
          <Progress value={overallPct} className="h-2" />
        </div>

        {running && (
          <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>
              এই সেশনে: <strong>{processedTotal}</strong> generated, <strong>{failedTotal}</strong> ব্যর্থ।
            </span>
          </div>
        )}

        {errors.length > 0 && (
          <details className="text-xs">
            <summary className="cursor-pointer text-destructive font-medium flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Error log ({errors.length})
            </summary>
            <ul className="mt-2 max-h-40 overflow-y-auto space-y-1 rounded border p-2">
              {errors.map((e, i) => (
                <li key={i} className="text-muted-foreground break-all">{e}</li>
              ))}
            </ul>
          </details>
        )}

        <div className="flex gap-2">
          {!running ? (
            <Button onClick={start} disabled={loading || pendingCount === 0} className="flex-1">
              <Sparkles className="mr-2 h-4 w-4" />
              {pendingCount === 0 ? "সব দোয়া enrich হয়ে গেছে" : `Enrich ${pendingCount} বাকি`}
            </Button>
          ) : (
            <Button onClick={stop} variant="destructive" className="flex-1">
              <Square className="mr-2 h-4 w-4" /> থামাও
            </Button>
          )}
          <Button onClick={() => { loadStats(); loadPending(); }} variant="outline" disabled={loading || running}>
            Refresh
          </Button>
        </div>

        {/* Pending review queue */}
        <div className="rounded-lg border">
          <div className="border-b bg-muted/30 px-3 py-2 text-sm font-medium flex items-center justify-between">
            <span>Pending Review Queue</span>
            <Badge variant="secondary">{pending.length}</Badge>
          </div>
          {pending.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              কোনো item review-এর অপেক্ষায় নেই।
            </div>
          ) : (
            <ul className="divide-y">
              {pending.map((item) => {
                const p = item.metadata?.enrichment_pending ?? {};
                const isOpen = expanded === item.id;
                return (
                  <li key={item.id} className="p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{item.title || "(untitled)"}</p>
                        <p className="text-xs text-muted-foreground">{item.category || "—"}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setExpanded(isOpen ? null : item.id)}>
                          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => reject(item.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={() => approve(item.id)}>
                          <Check className="h-4 w-4 mr-1" /> Approve
                        </Button>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="mt-3 space-y-2 rounded bg-muted/40 p-3 text-xs">
                        <Field label="When to recite (BN)" value={p.when_to_recite_bn} />
                        <Field label="Virtue (BN)" value={p.virtue_bn} />
                        <Field
                          label="Hadith reference"
                          value={p.hadith_reference || "(none — validated & dropped or not provided)"}
                        />
                        <Field label="Quran reference" value={p.quran_reference || "(none)"} />
                        <Field
                          label="Related dua IDs"
                          value={p.related_dua_ids?.length ? p.related_dua_ids.join(", ") : "(none matched)"}
                        />
                        {p.faq?.length > 0 && (
                          <div>
                            <p className="font-semibold mb-1">FAQ</p>
                            <ul className="space-y-1 pl-3">
                              {p.faq.map((f: any, i: number) => (
                                <li key={i}>
                                  <strong>Q:</strong> {f.q}
                                  <br />
                                  <strong>A:</strong> {f.a}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {!running && processedTotal + failedTotal > 0 && (
          <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>শেষ সেশন: {processedTotal} generated, {failedTotal} ব্যর্থ।</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="font-semibold">{label}</p>
      <p className="text-muted-foreground whitespace-pre-wrap break-words">{value || "—"}</p>
    </div>
  );
}