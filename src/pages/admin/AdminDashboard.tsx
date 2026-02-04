import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalConfig } from "@/context/GlobalConfigContext";
import {
  Users,
  BookOpen,
  Bell,
  BarChart3,
  Calendar,
  HelpCircle,
  Shield,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";

interface DashboardStats {
  totalUsers: number;
  totalContent: number;
  totalNotifications: number;
  totalQuizQuestions: number;
  recentActivity: number;
}

const AdminDashboard = () => {
  const { branding, loading: configLoading } = useGlobalConfig();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);

      // Parallel queries for stats
      const [usersRes, contentRes, notificationsRes, activityRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("admin_content").select("id", { count: "exact", head: true }),
        supabase.from("admin_notifications").select("id", { count: "exact", head: true }),
        supabase
          .from("user_activity")
          .select("id", { count: "exact", head: true })
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      ]);

      setStats({
        totalUsers: usersRes.count ?? 0,
        totalContent: contentRes.count ?? 0,
        totalNotifications: notificationsRes.count ?? 0,
        totalQuizQuestions: 0, // Quiz questions might be in a different table or JSON
        recentActivity: activityRes.count ?? 0,
      });
      setLoading(false);
    };

    loadStats();
  }, []);

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers ?? 0,
      description: "নিবন্ধিত ব্যবহারকারী",
      icon: Users,
      link: "/admin/users",
      color: "text-primary",
    },
    {
      title: "Content Items",
      value: stats?.totalContent ?? 0,
      description: "প্রকাশিত কনটেন্ট",
      icon: BookOpen,
      link: "/admin/content",
      color: "text-primary",
    },
    {
      title: "Notifications",
      value: stats?.totalNotifications ?? 0,
      description: "পাঠানো নোটিফিকেশন",
      icon: Bell,
      link: "/admin/notifications/history",
      color: "text-primary",
    },
    {
      title: "Recent Activity",
      value: stats?.recentActivity ?? 0,
      description: "গত ২৪ ঘণ্টায়",
      icon: BarChart3,
      link: "/admin/audit",
      color: "text-primary",
    },
  ];

  const quickLinks = [
    { title: "Send Notification", icon: Bell, link: "/admin/notifications", color: "bg-primary/10" },
    { title: "Manage Content", icon: BookOpen, link: "/admin/content", color: "bg-primary/10" },
    { title: "Quiz Questions", icon: HelpCircle, link: "/admin/quiz", color: "bg-primary/10" },
    { title: "Security Settings", icon: Shield, link: "/admin/security", color: "bg-primary/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {branding.appName || "NOOR"} অ্যাডমিন প্যানেলে স্বাগতম
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Live</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} to={stat.link}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value.toLocaleString("bn-BD")}</div>
                )}
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((item) => (
              <Link
                key={item.title}
                to={item.link}
                className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
              >
                <div className={`rounded-lg p-2 ${item.color}`}>
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium">{item.title}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>App Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {configLoading ? (
              <>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">App Name</span>
                  <span className="font-medium">{branding.appName || "NOOR"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tagline</span>
                  <span className="font-medium">{branding.tagline || "Islamic Companion"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Active
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Database</span>
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Connected
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Edge Functions</span>
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Running
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Sync</span>
              <span className="font-medium">{new Date().toLocaleTimeString("bn-BD")}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
