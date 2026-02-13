import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, History as HistoryIcon, Zap, BookOpen, Moon, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAdmin } from "@/contexts/AdminContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type TargetPlatform = "all" | "android" | "ios" | "web";

type NotificationTemplate = {
  id: string;
  name: string;
  title: string;
  body: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "prayer" | "daily" | "special";
};

const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: "prayer-reminder",
    name: "Prayer Reminder",
    title: "🕌 Time for Prayer",
    body: "Don't forget to pray. May Allah accept your prayers.",
    icon: Moon,
    category: "prayer",
  },
  {
    id: "daily-dua",
    name: "Daily Dua",
    title: "📿 Today's Dua",
    body: "Start your day with a beautiful dua. Open NOOR to read today's dua.",
    icon: BookOpen,
    category: "daily",
  },
  {
    id: "quran-reminder",
    name: "Quran Reminder",
    title: "📖 Read Quran",
    body: "Take a moment to read and reflect on the Holy Quran.",
    icon: BookOpen,
    category: "daily",
  },
  {
    id: "friday-blessing",
    name: "Jummah Mubarak",
    title: "🕋 Jummah Mubarak!",
    body: "May this blessed Friday bring you peace and blessings.",
    icon: Star,
    category: "special",
  },
  {
    id: "ramadan-reminder",
    name: "Ramadan Reminder",
    title: "🌙 Ramadan Kareem",
    body: "May this holy month bring you closer to Allah.",
    icon: Moon,
    category: "special",
  },
];

const AdminNotifications = () => {
  const { user } = useAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [deepLink, setDeepLink] = useState("");
  const [targetPlatform, setTargetPlatform] = useState<TargetPlatform>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const createNotificationMutation = useMutation({
    mutationFn: async (data: { title: string; message: string; status: string }) => {
      // 1. Insert into DB
      const { data: inserted, error } = await supabase.from('admin_notifications').insert([{
        title: data.title,
        message: data.message,
        status: data.status,
        target_platform: targetPlatform,
        created_by: user?.id,
        image_url: imageUrl.trim() || null,
        deep_link: deepLink.trim() || null,
      }]).select('id').single();
      if (error) throw error;

      // 2. If sending now, call send-push edge function
      if (data.status === "sent" && inserted?.id) {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (!token) throw new Error("Not authenticated");

        const res = await supabase.functions.invoke("send-push", {
          body: { notificationId: inserted.id, platform: targetPlatform },
        });

        if (res.error) {
          throw new Error(res.error.message || "Failed to send push notification");
        }

        return res.data;
      }

      return inserted;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['in-app-notifications'] });

      if (variables.status === "sent") {
        const totals = data?.totals;
        toast({
          title: "Push notification sent!",
          description: totals
            ? `Sent: ${totals.sent}, Failed: ${totals.failed}, Total targets: ${totals.targets}`
            : "Notification queued for delivery",
        });
      } else {
        toast({ title: "Notification saved as draft" });
      }
      setTitle("");
      setMessage("");
      setImageUrl("");
      setDeepLink("");
      setSelectedTemplate(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send notification", description: error.message, variant: "destructive" });
    },
  });

  const handleTemplateSelect = (templateId: string) => {
    const template = NOTIFICATION_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setTitle(template.title);
      setMessage(template.body);
      setSelectedTemplate(templateId);
    }
  };

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      toast({ title: "Please fill in both title and message", variant: "destructive" });
      return;
    }
    createNotificationMutation.mutate({
      title: title.trim(),
      message: message.trim(),
      status: "sent",
    });
  };

  const handleSaveDraft = () => {
    if (!title.trim() || !message.trim()) {
      toast({ title: "Please fill in both title and message", variant: "destructive" });
      return;
    }
    createNotificationMutation.mutate({
      title: title.trim(),
      message: message.trim(),
      status: "draft",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Send Notification</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and send push notifications to NOOR users
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/notifications/history">
              <HistoryIcon className="h-4 w-4 mr-2" />
              History
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/notifications/diagnostics">
              <Zap className="h-4 w-4 mr-2" />
              Diagnostics
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Templates */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Quick Templates</CardTitle>
            <CardDescription>Click to use a pre-made template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {NOTIFICATION_TEMPLATES.map((template) => {
              const Icon = template.icon;
              return (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedTemplate === template.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{template.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {template.body}
                  </p>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Compose */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Compose Notification</CardTitle>
            <CardDescription>Create your custom notification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Notification title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">{title.length}/100 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Notification message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">{message.length}/500 characters</p>
            </div>

            <div className="space-y-2">
              <Label>Target Platform</Label>
              <Select value={targetPlatform} onValueChange={(v) => setTargetPlatform(v as TargetPlatform)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="android">Android Only</SelectItem>
                  <SelectItem value="ios">iOS Only</SelectItem>
                  <SelectItem value="web">Web Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL (optional)</Label>
              <Input
                id="imageUrl"
                placeholder="https://example.com/image.png"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Shown as a rich image in the notification</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deepLink">Deep Link (optional)</Label>
              <Input
                id="deepLink"
                placeholder="/quran or /dua"
                value={deepLink}
                onChange={(e) => setDeepLink(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">In-app route to open when notification is tapped</p>
            </div>
            {(title || message) && (
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground mb-2">Preview</p>
                <div className="bg-background rounded-lg p-3 shadow-sm border">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Moon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{title || "Title"}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {message || "Message preview will appear here..."}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {targetPlatform === "all" ? "All" : targetPlatform.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            <Alert>
              <AlertDescription className="text-xs">
                Notifications will be sent to all subscribed users on the selected platform(s).
              </AlertDescription>
            </Alert>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={createNotificationMutation.isPending}
              >
                Save as Draft
              </Button>
              <Button
                onClick={handleSend}
                disabled={createNotificationMutation.isPending || !title.trim() || !message.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                {createNotificationMutation.isPending ? "Sending..." : "Send Now"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminNotifications;
