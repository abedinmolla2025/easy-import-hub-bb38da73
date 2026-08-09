import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  Calendar, 
  History as HistoryIcon, 
  Zap, 
  Settings, 
  BarChart3,
  Clock,
  Sparkles,
  RefreshCw,
  Plus
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const SmartNotificationCenter = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const { data: stats } = useQuery({
    queryKey: ["notification-stats"],
    queryFn: async () => {
      const { data, count } = await supabase
        .from("notification_logs")
        .select("*", { count: "exact", head: true });
      return { totalSent: count || 0 };
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Smart Notification Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Intelligent engine for automated Islamic reminders
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1 bg-emerald-500/10 text-emerald-600 border-emerald-200">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Writer Active
          </Badge>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 mb-8">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Islamic History</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="scheduler" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Scheduler</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <HistoryIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Logs</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalSent || 0}</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.2%</div>
                <p className="text-xs text-muted-foreground">+0.5% optimization gain</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Next Event</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">10th Muharram</div>
                <p className="text-xs text-muted-foreground">In 3 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">142</div>
                <p className="text-xs text-muted-foreground">Across all categories</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Today's Notification</CardTitle>
                <CardDescription>Current automated queue for today</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex justify-between items-start mb-2">
                    <Badge>History</Badge>
                    <span className="text-xs text-muted-foreground">Sent at 7:00 AM</span>
                  </div>
                  <h3 className="font-bold">🕌 আসসালামু আলাইকুম!</h3>
                  <p className="text-sm mt-1">আজকের দিনে ইসলামের ইতিহাসে এক গুরুত্বপূর্ণ ঘটনা ঘটেছিল। বিস্তারিত জানতে শুনুন বা পড়ুন।</p>
                </div>
                <div className="p-4 border rounded-lg opacity-50">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline">Hadith</Badge>
                    <span className="text-xs text-muted-foreground">Pending 7:00 PM</span>
                  </div>
                  <h3 className="font-bold text-muted-foreground">🕌 আসসালামু আলাইকুম!</h3>
                  <p className="text-sm mt-1">মন খুব অস্থির লাগছে? আল্লাহর স্মরণে আজকের দোয়াটি পড়ুন।</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Pulse</CardTitle>
                <CardDescription>CTR per content category</CardDescription>
              </CardHeader>
              <CardContent className="h-[200px] flex items-end gap-4 justify-around">
                <div className="flex flex-col items-center gap-2 w-full">
                  <div className="bg-emerald-500 w-full rounded-t" style={{ height: '80%' }}></div>
                  <span className="text-[10px] font-bold">History</span>
                </div>
                <div className="flex flex-col items-center gap-2 w-full">
                  <div className="bg-emerald-400 w-full rounded-t" style={{ height: '60%' }}></div>
                  <span className="text-[10px] font-bold">Dua</span>
                </div>
                <div className="flex flex-col items-center gap-2 w-full">
                  <div className="bg-emerald-300 w-full rounded-t" style={{ height: '45%' }}></div>
                  <span className="text-[10px] font-bold">Hadith</span>
                </div>
                <div className="flex flex-col items-center gap-2 w-full">
                  <div className="bg-emerald-200 w-full rounded-t" style={{ height: '30%' }}></div>
                  <span className="text-[10px] font-bold">Story</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Islamic Historical Events</CardTitle>
              <CardDescription>Verified events used for smart priority notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground italic">History table viewer coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Other tab contents placeholders */}
        <TabsContent value="templates">
          <Card><CardHeader><CardTitle>Templates Library</CardTitle></CardHeader></Card>
        </TabsContent>
        <TabsContent value="scheduler">
          <Card><CardHeader><CardTitle>Time-based Rules</CardTitle></CardHeader></Card>
        </TabsContent>
        <TabsContent value="logs">
          <Card><CardHeader><CardTitle>Execution History</CardTitle></CardHeader></Card>
        </TabsContent>
        <TabsContent value="settings">
          <Card><CardHeader><CardTitle>Global Automation Settings</CardTitle></CardHeader></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmartNotificationCenter;
