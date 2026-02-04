import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Droplets,
  Power,
  PowerOff,
  Plus,
  Sparkles,
  Settings,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { SplashScreensManager } from "@/components/admin/SplashScreensManager";
import { SplashTemplateGallery } from "@/components/admin/SplashTemplateGallery";
import { LottieSplashUploader } from "@/components/admin/LottieSplashUploader";
import { CapacitorSplashViewer } from "@/components/admin/CapacitorSplashViewer";
import { CapacitorIconsViewer } from "@/components/admin/CapacitorIconsViewer";
import type { SplashTemplate } from "@/lib/splashTemplates";

type BrandingSettings = {
  appName?: string;
  logoUrl?: string;
  lottieSplashUrl?: string;
  splashEnabled?: boolean;
  splashDuration?: number;
  splashFadeOut?: number;
};

function useBrandingSettings() {
  return useQuery({
    queryKey: ["app-settings", "branding"],
    queryFn: async (): Promise<BrandingSettings> => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("setting_value")
        .eq("setting_key", "branding")
        .maybeSingle();

      if (error) throw error;
      return (data?.setting_value as BrandingSettings) ?? {};
    },
  });
}

const AdminSplashScreens = () => {
  const queryClient = useQueryClient();
  const { data: branding, isLoading } = useBrandingSettings();
  const [localBranding, setLocalBranding] = useState<BrandingSettings>({});
  const [activeTab, setActiveTab] = useState("scheduled");

  // Merge remote + local
  const mergedBranding = { ...branding, ...localBranding };

  const saveMutation = useMutation({
    mutationFn: async (newBranding: BrandingSettings) => {
      const { error } = await supabase.from("app_settings").upsert({
        setting_key: "branding",
        setting_value: newBranding,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      toast.success("Settings saved");
    },
    onError: (err: any) => {
      toast.error(`Failed to save: ${err.message}`);
    },
  });

  const handleBrandingUpdate = (updater: (prev: BrandingSettings) => BrandingSettings) => {
    setLocalBranding((prev) => {
      const updated = updater({ ...mergedBranding, ...prev });
      // Auto-save
      saveMutation.mutate(updated);
      return updated;
    });
  };

  const handleSelectTemplate = (template: SplashTemplate) => {
    // Create a new splash screen from template
    const today = new Date().toISOString().split("T")[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Save to localStorage (matching SplashScreensManager format)
    const STORAGE_KEY = "noor_splash_screens";
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    const newSplash = {
      id: crypto.randomUUID(),
      title: template.name,
      lottie_url: template.lottieUrl,
      duration: template.duration,
      fade_out_duration: template.fadeOutDuration,
      start_date: today,
      end_date: nextMonth.toISOString().split("T")[0],
      is_active: true,
      priority: 0,
      platform: "both",
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, newSplash]));
    toast.success(`Added "${template.name}" splash screen`);

    // Force re-render by switching tabs
    setActiveTab("scheduled");
    setTimeout(() => setActiveTab("scheduled"), 50);
  };

  // Generate mock capacitor splash data for demo
  const mockSplashes = [
    { platform: "ios", orientation: "portrait", name: "Default-Portrait", url: "/placeholder.svg" },
    { platform: "ios", orientation: "landscape", name: "Default-Landscape", url: "/placeholder.svg" },
    { platform: "android", orientation: "portrait", name: "splash-port-hdpi", url: "/placeholder.svg" },
    { platform: "android", orientation: "landscape", name: "splash-land-hdpi", url: "/placeholder.svg" },
  ];

  // Mock icons data
  const mockIcons = [
    { platform: "ios", name: "icon-20", url: "/favicon.ico" },
    { platform: "ios", name: "icon-29", url: "/favicon.ico" },
    { platform: "android", name: "ic_launcher-hdpi", url: "/favicon.ico" },
    { platform: "android", name: "ic_launcher-mdpi", url: "/favicon.ico" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const splashEnabled = mergedBranding.splashEnabled !== false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Splash Screens</h1>
          <p className="text-sm text-muted-foreground">
            Manage animated splash screens for web and mobile apps
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SplashTemplateGallery onSelectTemplate={handleSelectTemplate} />
        </div>
      </div>

      {/* Global Status */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`h-3 w-3 rounded-full ${
                splashEnabled ? "bg-green-500 animate-pulse" : "bg-muted-foreground"
              }`}
            />
            <div>
              <p className="font-medium">
                {splashEnabled ? "Splash Screens Enabled" : "Splash Screens Disabled"}
              </p>
              <p className="text-xs text-muted-foreground">
                {splashEnabled
                  ? "Users will see splash screens on app load"
                  : "No splash screens will be shown"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {splashEnabled ? (
              <Badge variant="default" className="gap-1">
                <Power className="h-3 w-3" />
                Enabled
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <PowerOff className="h-3 w-3" />
                Disabled
              </Badge>
            )}
            <Switch
              checked={splashEnabled}
              onCheckedChange={(checked) =>
                handleBrandingUpdate((prev) => ({ ...prev, splashEnabled: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scheduled" className="gap-2">
            <Sparkles className="h-4 w-4 hidden sm:block" />
            Scheduled
          </TabsTrigger>
          <TabsTrigger value="lottie" className="gap-2">
            <Droplets className="h-4 w-4 hidden sm:block" />
            Lottie
          </TabsTrigger>
          <TabsTrigger value="capacitor" className="gap-2">
            <Smartphone className="h-4 w-4 hidden sm:block" />
            Mobile
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4 hidden sm:block" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="mt-6">
          <SplashScreensManager />
        </TabsContent>

        <TabsContent value="lottie" className="mt-6 space-y-6">
          <LottieSplashUploader
            branding={mergedBranding}
            setBranding={handleBrandingUpdate}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Start Guide</CardTitle>
              <CardDescription>
                How to add a Lottie animated splash screen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border p-4 text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    1
                  </div>
                  <p className="text-sm font-medium">Get Animation</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Download a .json file from{" "}
                    <a
                      href="https://lottiefiles.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      LottieFiles.com
                    </a>
                  </p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    2
                  </div>
                  <p className="text-sm font-medium">Upload</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Click "Upload Lottie JSON" and select your file
                  </p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    3
                  </div>
                  <p className="text-sm font-medium">Done!</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Animation plays automatically on app load
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capacitor" className="mt-6 space-y-6">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <Smartphone className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Capacitor Native Splash Screens</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  These are static images used by Capacitor for native iOS/Android apps.
                  They show before your web content loads.
                </p>
              </div>
            </div>
          </div>

          <CapacitorSplashViewer splashes={mockSplashes} />
          <CapacitorIconsViewer icons={mockIcons} />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Splash Screen Settings</CardTitle>
              <CardDescription>
                Configure global splash screen behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Duration (ms)</label>
                  <input
                    type="number"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={mergedBranding.splashDuration ?? 3000}
                    onChange={(e) =>
                      handleBrandingUpdate((prev) => ({
                        ...prev,
                        splashDuration: parseInt(e.target.value) || 3000,
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    How long the splash screen displays (default: 3000ms)
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Fade Out Duration (ms)</label>
                  <input
                    type="number"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={mergedBranding.splashFadeOut ?? 500}
                    onChange={(e) =>
                      handleBrandingUpdate((prev) => ({
                        ...prev,
                        splashFadeOut: parseInt(e.target.value) || 500,
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Fade out animation duration (default: 500ms)
                  </p>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Global Splash Toggle</p>
                    <p className="text-sm text-muted-foreground">
                      Enable or disable all splash screens at once
                    </p>
                  </div>
                  <Switch
                    checked={splashEnabled}
                    onCheckedChange={(checked) =>
                      handleBrandingUpdate((prev) => ({ ...prev, splashEnabled: checked }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSplashScreens;
