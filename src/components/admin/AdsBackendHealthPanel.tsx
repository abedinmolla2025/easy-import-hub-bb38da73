import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ControlsRow = {
  id: number;
  web_enabled: boolean;
  app_enabled: boolean;
  kill_switch: boolean;
  updated_at: string;
};

function boolBadgeVariant(value: boolean) {
  return value ? "default" : "secondary";
}

export function AdsBackendHealthPanel() {
  // Use mock data since database tables don't exist yet
  const controls: ControlsRow | null = null;

  return (
    <Card className="border-dashed border-border/70">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="text-sm">Ads Backend Health</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Quick sanity check for kill-switch + controls + recent tracking.
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
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
          <p className="text-sm text-muted-foreground">
            Ad tracking tables not configured. Set up admin_ad_controls and ad_events tables to enable full functionality.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
