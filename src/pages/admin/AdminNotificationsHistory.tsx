import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  status: string | null;
  target_platform: string;
  sent_at: string | null;
  created_at: string | null;
};

const statusColor = (s: string | null) => {
  if (s === "sent") return "default";
  if (s === "failed") return "destructive";
  if (s === "draft") return "secondary";
  return "outline";
};

const AdminNotificationsHistory = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-notifications-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_notifications")
        .select("id, title, message, status, target_platform, sent_at, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as NotificationRow[];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/notifications"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-2xl font-bold">Notification History</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : !data?.length ? (
            <div className="text-center py-8">
              <Send className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((n) => (
                <div key={n.id} className="flex items-start justify-between gap-4 p-3 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{n.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {n.sent_at
                        ? `Sent ${format(new Date(n.sent_at), "MMM d, yyyy h:mm a")}`
                        : n.created_at
                          ? `Created ${format(new Date(n.created_at), "MMM d, yyyy h:mm a")}`
                          : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={statusColor(n.status)}>{n.status ?? "unknown"}</Badge>
                    <span className="text-[10px] text-muted-foreground">{n.target_platform}</span>
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

export default AdminNotificationsHistory;
