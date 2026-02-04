import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSettings } from "@/hooks/useAppSettings";
import {
  Palette,
  Globe,
  Settings2,
  LayoutGrid,
  Image,
  Loader2,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────────
   Branding Tab
───────────────────────────────────────────────────────────────────────────── */
function BrandingTab() {
  const { data, loading, saving, save } = useAppSettings("branding");
  const [form, setForm] = useState(data ?? {});

  // Sync when data loads
  if (!loading && data && Object.keys(form).length === 0 && Object.keys(data).length > 0) {
    setForm(data);
  }

  if (loading) return <SettingsSkeleton />;

  const handleChange = (key: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" /> Branding
        </CardTitle>
        <CardDescription>অ্যাপের নাম, লোগো এবং ব্র্যান্ডিং কনফিগার করুন</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="appName">App Name</Label>
            <Input
              id="appName"
              value={form.appName ?? ""}
              onChange={(e) => handleChange("appName", e.target.value)}
              placeholder="NOOR"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={form.tagline ?? ""}
              onChange={(e) => handleChange("tagline", e.target.value)}
              placeholder="Your Islamic Companion"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              value={form.logoUrl ?? ""}
              onChange={(e) => handleChange("logoUrl", e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="iconUrl">Icon URL</Label>
            <Input
              id="iconUrl"
              value={form.iconUrl ?? ""}
              onChange={(e) => handleChange("iconUrl", e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="faviconUrl">Favicon URL</Label>
            <Input
              id="faviconUrl"
              value={form.faviconUrl ?? ""}
              onChange={(e) => handleChange("faviconUrl", e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="mb-3 text-sm font-medium">App Name Typography</h4>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="fontFamily">Font Family</Label>
              <Input
                id="fontFamily"
                value={form.fontFamily ?? ""}
                onChange={(e) => handleChange("fontFamily", e.target.value)}
                placeholder="Inter, system-ui"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fontSize">Font Size</Label>
              <Input
                id="fontSize"
                type="number"
                value={form.fontSize ?? ""}
                onChange={(e) => handleChange("fontSize", Number(e.target.value))}
                placeholder="24"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fontWeight">Font Weight</Label>
              <Input
                id="fontWeight"
                value={form.fontWeight ?? ""}
                onChange={(e) => handleChange("fontWeight", e.target.value)}
                placeholder="700"
              />
            </div>
          </div>
        </div>

        <Button onClick={() => save(form)} disabled={saving} className="mt-4">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          সেভ করুন
        </Button>
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Theme Tab
───────────────────────────────────────────────────────────────────────────── */
function ThemeTab() {
  const { data, loading, saving, save } = useAppSettings("theme");
  const [form, setForm] = useState(data ?? {});

  if (!loading && data && Object.keys(form).length === 0 && Object.keys(data).length > 0) {
    setForm(data);
  }

  if (loading) return <SettingsSkeleton />;

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" /> Theme
        </CardTitle>
        <CardDescription>অ্যাপের কালার এবং থিম কনফিগার করুন</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary Color (HSL)</Label>
            <Input
              id="primaryColor"
              value={form.primaryColor ?? ""}
              onChange={(e) => handleChange("primaryColor", e.target.value)}
              placeholder="158 64% 35%"
            />
            <p className="text-xs text-muted-foreground">Format: H S% L%</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Secondary Color (HSL)</Label>
            <Input
              id="secondaryColor"
              value={form.secondaryColor ?? ""}
              onChange={(e) => handleChange("secondaryColor", e.target.value)}
              placeholder="210 40% 96%"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="accentColor">Accent Color (HSL)</Label>
            <Input
              id="accentColor"
              value={form.accentColor ?? ""}
              onChange={(e) => handleChange("accentColor", e.target.value)}
              placeholder="45 93% 47%"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="borderRadius">Border Radius</Label>
            <Input
              id="borderRadius"
              value={form.borderRadius ?? ""}
              onChange={(e) => handleChange("borderRadius", e.target.value)}
              placeholder="0.5rem"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fontFamily">Font Family</Label>
            <Input
              id="fontFamily"
              value={form.fontFamily ?? ""}
              onChange={(e) => handleChange("fontFamily", e.target.value)}
              placeholder="Inter, sans-serif"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultMode">Default Mode</Label>
            <select
              id="defaultMode"
              value={form.defaultMode ?? "light"}
              onChange={(e) => handleChange("defaultMode", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>

        <Button onClick={() => save(form)} disabled={saving} className="mt-4">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          সেভ করুন
        </Button>
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SEO Tab
───────────────────────────────────────────────────────────────────────────── */
function SeoTab() {
  const { data, loading, saving, save } = useAppSettings("seo");
  const [form, setForm] = useState(data ?? {});

  if (!loading && data && Object.keys(form).length === 0 && Object.keys(data).length > 0) {
    setForm(data);
  }

  if (loading) return <SettingsSkeleton />;

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" /> SEO
        </CardTitle>
        <CardDescription>সার্চ ইঞ্জিন অপ্টিমাইজেশন সেটিংস</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Site Title</Label>
          <Input
            id="title"
            value={form.title ?? ""}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="NOOR - Islamic App"
          />
          <p className="text-xs text-muted-foreground">60 characters max recommended</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Meta Description</Label>
          <textarea
            id="description"
            value={form.description ?? ""}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Your Islamic companion for prayer times, Quran, duas..."
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground">160 characters max recommended</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="shareImageUrl">Share Image URL (OG Image)</Label>
          <Input
            id="shareImageUrl"
            value={form.shareImageUrl ?? ""}
            onChange={(e) => handleChange("shareImageUrl", e.target.value)}
            placeholder="https://..."
          />
          <p className="text-xs text-muted-foreground">Recommended: 1200x630 pixels</p>
        </div>

        <Button onClick={() => save(form)} disabled={saving} className="mt-4">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          সেভ করুন
        </Button>
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   System Tab
───────────────────────────────────────────────────────────────────────────── */
function SystemTab() {
  const { data, loading, saving, save } = useAppSettings("system");
  const [form, setForm] = useState(data ?? {});

  if (!loading && data && Object.keys(form).length === 0 && Object.keys(data).length > 0) {
    setForm(data);
  }

  if (loading) return <SettingsSkeleton />;

  const handleToggle = (key: string, value: boolean) => {
    const updated = { ...form, [key]: value };
    setForm(updated);
    save(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" /> System
        </CardTitle>
        <CardDescription>সিস্টেম এবং অ্যাপ সেটিংস</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Maintenance Mode</Label>
            <p className="text-sm text-muted-foreground">অ্যাপকে মেইনটেন্যান্স মোডে রাখুন</p>
          </div>
          <Switch
            checked={form.maintenanceMode ?? false}
            onCheckedChange={(v) => handleToggle("maintenanceMode", v)}
            disabled={saving}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Show Ads</Label>
            <p className="text-sm text-muted-foreground">অ্যাপে বিজ্ঞাপন দেখান</p>
          </div>
          <Switch
            checked={form.showAds ?? false}
            onCheckedChange={(v) => handleToggle("showAds", v)}
            disabled={saving}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Force Update</Label>
            <p className="text-sm text-muted-foreground">ইউজারদের আপডেট করতে বাধ্য করুন</p>
          </div>
          <Switch
            checked={form.forceUpdate ?? false}
            onCheckedChange={(v) => handleToggle("forceUpdate", v)}
            disabled={saving}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Modules Tab
───────────────────────────────────────────────────────────────────────────── */
function ModulesTab() {
  const { data, loading, saving, save } = useAppSettings("modules");
  const [form, setForm] = useState(data ?? {});

  if (!loading && data && Object.keys(form).length === 0 && Object.keys(data).length > 0) {
    setForm(data);
  }

  if (loading) return <SettingsSkeleton />;

  const handleToggle = (key: string, value: boolean) => {
    const updated = { ...form, [key]: value };
    setForm(updated);
    save(updated);
  };

  const modules = [
    { key: "prayerTimes", label: "Prayer Times", description: "নামাজের সময়সূচী মডিউল" },
    { key: "quran", label: "Quran", description: "কুরআন রিডার মডিউল" },
    { key: "duas", label: "Duas", description: "দোয়া সংগ্রহ মডিউল" },
    { key: "hadith", label: "Hadith", description: "হাদিস মডিউল" },
    { key: "calendar", label: "Islamic Calendar", description: "ইসলামিক ক্যালেন্ডার" },
    { key: "quiz", label: "Quiz", description: "ইসলামিক কুইজ মডিউল" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5" /> Modules
        </CardTitle>
        <CardDescription>অ্যাপের বিভিন্ন মডিউল চালু/বন্ধ করুন</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {modules.map((mod) => (
          <div key={mod.key} className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{mod.label}</Label>
              <p className="text-sm text-muted-foreground">{mod.description}</p>
            </div>
            <Switch
              checked={(form as any)[mod.key] ?? true}
              onCheckedChange={(v) => handleToggle(mod.key, v)}
              disabled={saving}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Skeleton
───────────────────────────────────────────────────────────────────────────── */
function SettingsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4" />
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────────────────────── */
const AdminSettings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">অ্যাপ্লিকেশনের সকল সেটিংস কনফিগার করুন</p>
      </div>

      <Tabs defaultValue="branding" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 gap-2 sm:grid-cols-5">
          <TabsTrigger value="branding" className="gap-1.5">
            <Image className="h-4 w-4" />
            <span className="hidden sm:inline">Branding</span>
          </TabsTrigger>
          <TabsTrigger value="theme" className="gap-1.5">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Theme</span>
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-1.5">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">SEO</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-1.5">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">System</span>
          </TabsTrigger>
          <TabsTrigger value="modules" className="gap-1.5">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Modules</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding">
          <BrandingTab />
        </TabsContent>
        <TabsContent value="theme">
          <ThemeTab />
        </TabsContent>
        <TabsContent value="seo">
          <SeoTab />
        </TabsContent>
        <TabsContent value="system">
          <SystemTab />
        </TabsContent>
        <TabsContent value="modules">
          <ModulesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
