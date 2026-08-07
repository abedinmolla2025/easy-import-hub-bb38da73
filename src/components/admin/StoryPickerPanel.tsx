import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, HandHeart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface ContentPickerItem {
  id: string;
  title: string;
  title_en?: string | null;
  subtitle?: string | null;
  hook?: string | null;
  slug: string;
  category?: string | null;
  image_url?: string | null;
  og_image_data?: any;
  content_type?: string;
}

type PickerTab = "story" | "dua";

interface StoryPickerPanelProps {
  onSelect: (item: ContentPickerItem) => void;
}

export default function StoryPickerPanel({ onSelect }: StoryPickerPanelProps) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<PickerTab>("story");

  const { data: content, isLoading } = useQuery<ContentPickerItem[]>({
    queryKey: ["admin-notification-content-picker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_content")
        .select("id, title, title_en, subtitle, hook, slug, category, image_url, og_image_data, content_type")
        .in("content_type", ["story", "dua"])
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return (data as ContentPickerItem[]) ?? [];
    },
  });

  const filtered = (content ?? []).filter((s) => {
    if (s.content_type !== tab) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const hay = [
      s.title,
      s.title_en,
      s.subtitle,
      s.hook,
      s.slug,
      s.category,
      s.og_image_data?.title?.bn,
      s.og_image_data?.title?.en,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });

  const resolveImageUrl = (item: ContentPickerItem): string | null => {
    const ogUrl =
      item.og_image_data?.url ||
      item.og_image_data?.og_image ||
      item.og_image_data?.og_image_url ||
      item.image_url ||
      null;
    if (ogUrl && ogUrl.startsWith("http")) return ogUrl;
    if (ogUrl) {
      const folder = item.content_type === "dua" ? "dua-og" : "story-og";
      return `https://llicfiepatzgllmjhzbw.supabase.co/storage/v1/object/public/og-images/${folder}/${ogUrl}`;
    }
    return null;
  };

  const storyCount = (content ?? []).filter((c) => c.content_type === "story").length;
  const duaCount = (content ?? []).filter((c) => c.content_type === "dua").length;

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Pick Content</h3>
        </div>
      </div>

      {/* Tabs for Story / Dua */}
      <div className="flex gap-1 mb-3 rounded-md bg-muted p-1">
        <button
          type="button"
          onClick={() => {
            setTab("story");
            setSearch("");
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium transition-colors ${
            tab === "story" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="h-3 w-3" />
          Story ({storyCount})
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("dua");
            setSearch("");
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium transition-colors ${
            tab === "dua" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <HandHeart className="h-3 w-3" />
          Dua ({duaCount})
        </button>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder={`Search ${tab === "story" ? "stories" : "duas"}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-7 h-8 text-sm"
        />
      </div>

      <ScrollArea className="h-[380px] pr-1">
        {isLoading ? (
          <p className="text-xs text-muted-foreground text-center py-6">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            {search ? "No matches found." : `No published ${tab === "story" ? "stories" : "duas"} found.`}
          </p>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((item) => {
              const imgUrl = resolveImageUrl(item);
              const routePrefix = item.content_type === "dua" ? "/dua" : "/stories";
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item)}
                  className="w-full flex items-start gap-2.5 rounded-md border border-border/60 bg-muted/20 px-2.5 py-2 text-left transition-colors hover:bg-muted/60 hover:border-primary/40"
                >
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={item.title || ""}
                      className="h-10 w-16 shrink-0 rounded object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-10 w-16 shrink-0 rounded bg-muted flex items-center justify-center">
                      {item.content_type === "dua" ? (
                        <HandHeart className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate leading-tight">{item.title || "Untitled"}</p>
                    {item.title_en && item.title_en !== item.title && (
                      <p className="text-[10px] text-muted-foreground truncate">{item.title_en}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      {item.category && (
                        <Badge variant="secondary" className="h-3.5 px-1.5 text-[9px] rounded-full">
                          {item.category}
                        </Badge>
                      )}
                      <Badge variant="outline" className="h-3.5 px-1.5 text-[9px] rounded-full">
                        {routePrefix}/{item.slug}
                      </Badge>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <p className="text-[10px] text-muted-foreground mt-2">
        Click a {tab === "story" ? "story" : "dua"} to auto-fill title, message, thumbnail, and deep link.
      </p>
    </div>
  );
}
