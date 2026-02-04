import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Users, BookOpen, Bell, TrendingUp, Activity } from "lucide-react";

export default function AdminReports() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-reports-stats'],
    queryFn: async () => {
      const [usersResult, contentResult, notificationsResult, quizResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('admin_content').select('id', { count: 'exact', head: true }),
        supabase.from('admin_notifications').select('id', { count: 'exact', head: true }),
        supabase.from('quiz_questions').select('id', { count: 'exact', head: true }),
      ]);

      return {
        totalUsers: usersResult.count || 0,
        totalContent: contentResult.count || 0,
        totalNotifications: notificationsResult.count || 0,
        totalQuizQuestions: quizResult.count || 0,
      };
    },
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      description: "Registered users",
      color: "text-blue-500",
    },
    {
      title: "Content Items",
      value: stats?.totalContent ?? 0,
      icon: BookOpen,
      description: "Duas, names & articles",
      color: "text-green-500",
    },
    {
      title: "Notifications",
      value: stats?.totalNotifications ?? 0,
      icon: Bell,
      description: "Total sent",
      color: "text-purple-500",
    },
    {
      title: "Quiz Questions",
      value: stats?.totalQuizQuestions ?? 0,
      icon: TrendingUp,
      description: "Active questions",
      color: "text-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of NOOR app statistics and activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? "..." : stat.value.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Recent Activity</CardTitle>
          </div>
          <CardDescription>Latest admin actions</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-sm">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.resource_type && `${activity.resource_type} • `}
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No recent activity to display
            </p>
          )}
        </CardContent>
      </Card>

      {/* Placeholder Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <CardTitle>User Growth</CardTitle>
            </div>
            <CardDescription>New user registrations over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Chart visualization coming soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Content Performance</CardTitle>
            </div>
            <CardDescription>Most viewed content items</CardDescription>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Chart visualization coming soon
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
