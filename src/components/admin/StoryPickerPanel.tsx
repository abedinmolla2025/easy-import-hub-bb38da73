import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface StoryPickerItem {
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

interface StoryPickerPanelProps {
  onSelect: (item: StoryPickerItem) => void;
}

export default function StoryPickerPanel({ onSelect }: StoryPickerPanelProps) {
  const [search, setSearch] = useState("");

  const { data: stories, isLoading } = useQuery<StoryPickerItem[]>({
    queryKey: ["admin-notification-stories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_content")
        .select("id, title, title_en, subtitle, hook, slug, category, image_url, og_image_data, content_type")
        .eq("content_type", "story")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data as StoryPickerItem[]) ?? [];
    },
  });

  const filtered = (stories ?? []).filter((s) => {
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

  const resolveImageUrl = (item: StoryPickerItem): string | null => {
    const ogUrl =
      item.og_image_data?.url ||
      item.og_image_data?.og_image ||
      item.og_image_data?.og_image_url ||
      item.image_url ||
      null;
    if (ogUrl && ogUrl.startsWith("http")) return ogUrl;
    if (ogUrl) return `https://llicfiepatzgllmjhzbw.supabase.co/storage/v1/object/public/og-images/story-og/${ogUrl}`;
    return null;
  };

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Pick a Story</h3>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search stories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-7 h-8 text-sm"
        />
      </div>

      <ScrollArea className="h-[400px] pr-1">
        {isLoading ? (
          <p className="text-xs text-muted-foreground text-center py-6">Loading stories...</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            {search ? "No stories match your search." : "No published stories found."}
          </p>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((story) => {
              const imgUrl = resolveImageUrl(story);
              return (
                <button
                  key={story.id}
                  type="button"
                  onClick={() => onSelect(story)}
                  className="w-full flex items-start gap-2.5 rounded-md border border-border/60 bg-muted/20 px-2.5 py-2 text-left transition-colors hover:bg-muted/60 hover:border-primary/40"
                >
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={story.title || ""}
                      className="h-10 w-16 shrink-0 rounded object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-10 w-16 shrink-0 rounded bg-muted flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate leading-tight">{story.title || "Untitled"}</p>
                    {story.title_en && story.title_en !== story.title && (
                      <p className="text-[10px] text-muted-foreground truncate">{story.title_en}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      {story.category && (
                        <Badge variant="secondary" className="h-3.5 px-1.5 text-[9px] rounded-full">
                          {story.category}
                        </Badge>
                      )}
                      <Badge variant="outline" className="h-3.5 px-1.5 text-[9px] rounded-full">
                        /stories/{story.slug}
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
        Click a story to auto-fill title, message, thumbnail, and deep link.
      </p>
    </div>
  );
}
