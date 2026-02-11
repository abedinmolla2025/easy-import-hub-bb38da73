import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSeoPages, useSeoIndexLog, useNotifySearchEngines } from "@/hooks/useSeoIndexing";
import { Activity, Globe, Loader2, Send, CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";

export default function AdminSeoIndexingTab() {
  const { data: pages } = useSeoPages();
  const { data: logs, isLoading: logsLoading } = useSeoIndexLog(30);
  const notifyMutation = useNotifySearchEngines();

  const indexableCount = (pages ?? []).filter((p) => !(p.robots ?? "").toLowerCase().includes("noindex")).length;

  const lastGoogle = logs?.find((l) => l.action === "google_ping");
  const lastBing = logs?.find((l) => l.action === "bing_ping");

  const sitemapUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sitemap`;

  return (
    <div className="space-y-4 pt-4">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{indexableCount}</div>
            <p className="text-xs text-muted-foreground">Indexable pages</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              {lastGoogle ? (
                lastGoogle.success ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-destructive" />
              ) : <Clock className="h-5 w-5 text-muted-foreground" />}
              <span className="text-sm font-medium">Google</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {lastGoogle ? formatDistanceToNow(new Date(lastGoogle.created_at), { addSuffix: true, locale: enUS }) : "Never pinged"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              {lastBing ? (
                lastBing.success ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-destructive" />
              ) : <Clock className="h-5 w-5 text-muted-foreground" />}
              <span className="text-sm font-medium">Bing</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {lastBing ? formatDistanceToNow(new Date(lastBing.created_at), { addSuffix: true, locale: enUS }) : "Never pinged"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5" /> Notify Search Engines</CardTitle>
          <CardDescription>Notify Google & Bing about sitemap updates (rate limit: once per 10 minutes)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={() => notifyMutation.mutate()} disabled={notifyMutation.isPending}>
            {notifyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Globe className="mr-2 h-4 w-4" />
            Ping Now
          </Button>
          <div className="flex items-center gap-2">
            <a href={sitemapUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ExternalLink className="h-3 w-3" /> View Sitemap
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Log history */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Indexing Log</CardTitle>
          <CardDescription>Recent search engine notifications</CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : !logs?.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">No logs yet</p>
          ) : (
            <div className="divide-y rounded-md border max-h-[400px] overflow-auto">
              {logs.map((l) => (
                <div key={l.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    {l.success ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-destructive" />}
                    <Badge variant="outline" className="text-xs">{l.action}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {l.status_code && <span>HTTP {l.status_code}</span>}
                    <span>{formatDistanceToNow(new Date(l.created_at), { addSuffix: true, locale: enUS })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
