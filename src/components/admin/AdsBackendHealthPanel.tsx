import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ControlsRow = {
  id: number;
  web_enabled: boolean;
  app_enabled: boolean;
  kill_switch: boolean;
  updated_at: string;
};

type AdEventRow = {
  created_at: string;
  event_type: string;
  platform: string;
  placement: string;
};

function boolBadgeVariant(value: boolean) {
  return value ? "default" : "secondary";
}

export function AdsBackendHealthPanel() {
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ["ads-backend-health"],
    queryFn: async () => {
      const [controlsRes, eventsRes] = await Promise.all([
        supabase.from("admin_ad_controls").select("*").eq("id", 1).maybeSingle(),
        supabase
          .from("ad_events")
          .select("created_at,event_type,platform,placement")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      if (controlsRes.error) throw controlsRes.error;
      if (eventsRes.error) throw eventsRes.error;

      return {
        controls: (controlsRes.data ?? null) as ControlsRow | null,
        events: (eventsRes.data ?? []) as AdEventRow[],
      };
    },
    staleTime: 10_000,
  });

  const controls = data?.controls ?? null;
  const events = data?.events ?? [];

  const summary = useMemo(() => {
    const total = events.length;
    const impressions = events.filter((e) => e.event_type === "impression").length;
    const clicks = events.filter((e) => e.event_type === "click").length;
    const ctr = impressions ? (clicks / impressions) * 100 : 0;

    const byPlatform = events.reduce(
      (acc, e) => {
        const p = (e.platform || "unknown") as string;
        acc[p] = acc[p] ?? { impressions: 0, clicks: 0 };
        if (e.event_type === "impression") acc[p].impressions += 1;
        if (e.event_type === "click") acc[p].clicks += 1;
        return acc;
      },
      {} as Record<string, { impressions: number; clicks: number }>,
    );

    return { total, impressions, clicks, ctr, byPlatform };
  }, [events]);

  return (
    <Card className="border-dashed border-border/70">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="text-sm">Ads Backend Health</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Quick sanity check for kill-switch + controls + recent tracking.
          </p>
        </div>

        <button
          type="button"
          className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          onClick={() => refetch()}
          aria-label="Refresh ads backend health"
        >
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </CardHeader>

      <CardContent className="space-y-4">
        {error ? (
          <p className="text-sm text-destructive">Could not load ads health: {(error as any)?.message ?? "Unknown error"}</p>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Kill switch</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant={boolBadgeVariant(Boolean(controls?.kill_switch))}>
                    {controls?.kill_switch ? "ON" : "OFF"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">(blocks all ads)</span>
                </div>
              </div>

              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Web ads</p>
                <div className="mt-1">
                  <Badge variant={boolBadgeVariant(Boolean(controls?.web_enabled))}>
                    {controls?.web_enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>

              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">App ads</p>
                <div className="mt-1">
                  <Badge variant={boolBadgeVariant(Boolean(controls?.app_enabled))}>
                    {controls?.app_enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">Last 20 ad_events</p>
                <p className="text-xs text-muted-foreground">
                  {summary.total} events • {summary.impressions} impressions • {summary.clicks} clicks • CTR {summary.ctr.toFixed(1)}%
                </p>
              </div>

              {events.length === 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">No events yet. Trigger an ad impression/click to verify tracking.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(summary.byPlatform).map(([platform, v]) => {
                      const ctr = v.impressions ? (v.clicks / v.impressions) * 100 : 0;
                      return (
                        <Badge key={platform} variant="secondary">
                          {platform}: {v.clicks}/{v.impressions} ({ctr.toFixed(0)}%)
                        </Badge>
                      );
                    })}
                  </div>

                  <div className="max-h-56 overflow-auto rounded-md border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">Time</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Platform</TableHead>
                          <TableHead>Placement</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {events.map((e, idx) => (
                          <TableRow key={`${e.created_at}-${idx}`}>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(e.created_at).toLocaleTimeString()}
                            </TableCell>
                            <TableCell className="text-xs">
                              <Badge variant={e.event_type === "click" ? "default" : "secondary"}>{e.event_type}</Badge>
                            </TableCell>
                            <TableCell className="text-xs">{e.platform}</TableCell>
                            <TableCell className="text-xs">{e.placement}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {controls?.updated_at ? (
                    <p className="text-[11px] text-muted-foreground">
                      Controls updated: {new Date(controls.updated_at).toLocaleString()}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
