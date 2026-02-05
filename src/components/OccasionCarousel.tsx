import { useMemo } from "react";
import { useActiveOccasions } from "@/hooks/useOccasions";
import type { LayoutPlatform } from "@/lib/layout";
import { OccasionHtmlCard } from "@/components/OccasionHtmlCard";

export function OccasionCarousel({ platform }: { platform: LayoutPlatform }) {
  const effective = platform === "app" ? "app" : "web";
  const { data, isLoading } = useActiveOccasions(effective);

  const item = useMemo(() => (data ?? [])[0] ?? null, [data]);

  // Don't show skeleton during loading - just return null
  // This prevents the blank card appearance during initial load
  if (isLoading || !item) return null;

  return (
    <OccasionHtmlCard
      occasionId={item.id}
      title={item.title}
      subtitle={(item as any).subtitle ?? item.message}
      htmlCode={(item as any).html_code}
      cssCode={(item as any).css_code ?? item.card_css}
      containerClassName={item.container_class_name}
    />
  );
}
