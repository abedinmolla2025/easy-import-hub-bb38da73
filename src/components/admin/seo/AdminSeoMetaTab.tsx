import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Globe, Search, Share2, Loader2, ExternalLink } from "lucide-react";

export default function AdminSeoMetaTab() {
  const { data, loading, saving, save } = useAppSettings("seo");
  const [form, setForm] = useState(data ?? {});

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-6 pt-4">
        <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
          <CardContent className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-20 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  const handleChange = (key: string, value: string) => setForm((prev: any) => ({ ...prev, [key]: value }));
  const handleSave = () => save(form);

  const titleLength = form.title?.length ?? 0;
  const descLength = form.description?.length ?? 0;

  return (
    <div className="space-y-6 pt-4">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" /> Meta Tags</CardTitle>
            <CardDescription>সাইটের মেটা ট্যাগস কনফিগার করুন</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Site Title</Label>
              <Input id="title" value={form.title ?? ""} onChange={(e) => handleChange("title", e.target.value)} placeholder="NOOR - Islamic App" maxLength={70} />
              <p className={`text-xs ${titleLength > 60 ? "text-destructive" : "text-muted-foreground"}`}>{titleLength}/60 characters {titleLength > 60 && "(too long)"}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Meta Description</Label>
              <textarea id="description" value={form.description ?? ""} onChange={(e) => handleChange("description", e.target.value)} placeholder="Your Islamic companion..." className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" maxLength={200} />
              <p className={`text-xs ${descLength > 160 ? "text-destructive" : "text-muted-foreground"}`}>{descLength}/160 characters {descLength > 160 && "(too long)"}</p>
            </div>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}সেভ করুন</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Share2 className="h-5 w-5" /> Social Sharing</CardTitle>
            <CardDescription>সোশ্যাল মিডিয়ায় শেয়ার করার সেটিংস</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shareImageUrl">OG Image URL</Label>
              <Input id="shareImageUrl" value={form.shareImageUrl ?? ""} onChange={(e) => handleChange("shareImageUrl", e.target.value)} placeholder="https://example.com/og-image.jpg" />
              <p className="text-xs text-muted-foreground">Recommended size: 1200x630 pixels</p>
            </div>
            {form.shareImageUrl && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="overflow-hidden rounded-lg border">
                  <img src={form.shareImageUrl} alt="OG Image Preview" className="aspect-[1200/630] w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              </div>
            )}
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}সেভ করুন</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Search Engine Preview</CardTitle>
          <CardDescription>গুগলে আপনার সাইট কিভাবে দেখাবে</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-white p-4 dark:bg-background">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="h-4 w-4" /><span>noor.app</span><span>›</span><span>home</span>
              </div>
              <h3 className="text-lg font-medium text-blue-600 hover:underline">{form.title || "NOOR - Islamic App"}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{form.description || "Your Islamic companion for prayer times, Quran, duas and more..."}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>SEO Tools</CardTitle><CardDescription>দরকারী SEO টুলস</CardDescription></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "https://search.google.com/search-console", label: "Google Search Console" },
              { href: "https://developers.facebook.com/tools/debug/", label: "Facebook Debugger" },
              { href: "https://cards-dev.twitter.com/validator", label: "Twitter Card Validator" },
              { href: "https://metatags.io/", label: "Meta Tags Generator" },
            ].map((t) => (
              <a key={t.href} href={t.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border p-3 hover:bg-muted">
                <ExternalLink className="h-4 w-4" />{t.label}
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
