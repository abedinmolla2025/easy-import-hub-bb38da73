import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Wifi } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AdminNotificationsDiagnostics = () => {
  // Health check
  const healthQuery = useQuery({
    queryKey: ["push-health"],
    queryFn: async () => {
      const res = await supabase.functions.invoke("send-push", {
        body: { action: "health" },
      });
      return res.data as { ok?: boolean } | null;
    },
    retry: false,
  });

  // Token count
  const tokensQuery = useQuery({
    queryKey: ["push-tokens-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("device_push_tokens")
        .select("id", { count: "exact", head: true })
        .eq("enabled", true)
        .eq("platform", "web");
      if (error) throw error;
      return count ?? 0;
    },
  });

  // Recent deliveries
  const deliveriesQuery = useQuery({
    queryKey: ["push-deliveries-recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_deliveries")
        .select("id, status, platform, browser, error_code, error_message, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const refetchAll = () => {
    healthQuery.refetch();
    tokensQuery.refetch();
    deliveriesQuery.refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/notifications"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-2xl font-bold">Diagnostics</h1>
        </div>
        <Button variant="outline" size="sm" onClick={refetchAll}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Health */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Edge Function</CardTitle>
          </CardHeader>
          <CardContent>
            {healthQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Checking...</p>
            ) : healthQuery.data?.ok ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium text-sm">Healthy</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                <span className="font-medium text-sm">Unreachable</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Token count */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Web Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">
                {tokensQuery.isLoading ? "..." : tokensQuery.data}
              </span>
              <span className="text-xs text-muted-foreground">active subscriptions</span>
            </div>
          </CardContent>
        </Card>

        {/* Success rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Delivery Stats</CardTitle>
          </CardHeader>
          <CardContent>
            {deliveriesQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (() => {
              const d = deliveriesQuery.data ?? [];
              const sent = d.filter(x => x.status === "sent").length;
              const failed = d.filter(x => x.status === "failed").length;
              return (
                <div className="flex gap-3 text-sm">
                  <span className="text-green-600 font-medium">✓ {sent} sent</span>
                  <span className="text-destructive font-medium">✗ {failed} failed</span>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Recent deliveries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Delivery Logs</CardTitle>
          <CardDescription>Last 20 delivery attempts</CardDescription>
        </CardHeader>
        <CardContent>
          {deliveriesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : !(deliveriesQuery.data?.length) ? (
            <p className="text-sm text-muted-foreground text-center py-6">No delivery logs yet. Send a notification first.</p>
          ) : (
            <div className="space-y-2">
              {deliveriesQuery.data.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-3 p-2 rounded border text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant={d.status === "sent" ? "default" : "destructive"} className="text-[10px]">
                      {d.status}
                    </Badge>
                    <span className="text-muted-foreground">{d.platform}</span>
                    {d.browser && <span className="text-muted-foreground">• {d.browser}</span>}
                  </div>
                  <div className="text-right shrink-0">
                    {d.error_message && (
                      <p className="text-destructive truncate max-w-[200px]" title={d.error_message}>
                        {d.error_code ?? "err"}: {d.error_message.slice(0, 50)}
                      </p>
                    )}
                    <p className="text-muted-foreground">
                      {new Date(d.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNotificationsDiagnostics;
