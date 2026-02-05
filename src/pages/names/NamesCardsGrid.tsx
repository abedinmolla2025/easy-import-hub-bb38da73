import { Skeleton } from "@/components/ui/skeleton";
import { NameCard, type NameCardModel } from "@/components/names/NameCard";

interface NamesCardsGridProps {
  cards?: NameCardModel[];
  onSelect?: (name: NameCardModel) => void;
  isLoading?: boolean;
  isError?: boolean;
  hasResults?: boolean;
  stickyHeaderRaised?: boolean;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
}

export const NamesCardsGrid = ({
  cards,
  onSelect,
  isLoading = false,
  isError = false,
  hasResults = true,
  emptyStateTitle = "কোনো নাম পাওয়া যায়নি",
  emptyStateDescription = "অন্য ফিল্টার বা সার্চ চেষ্টা করুন",
}: NamesCardsGridProps) => {
  const items = cards ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="dua-card relative w-full overflow-hidden p-4 animate-pulse"
          >
            <div className="flex gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2 mt-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
              </div>
              <div className="shrink-0 w-[6.75rem] flex items-center justify-center">
                <Skeleton className="h-10 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive font-medium">নাম লোড করতে সমস্যা হয়েছে</p>
        <p className="text-muted-foreground text-sm mt-1">আবার চেষ্টা করুন</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground font-medium">{emptyStateTitle}</p>
        <p className="text-muted-foreground text-sm mt-1">{emptyStateDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((name) => (
        <NameCard
          key={name.id}
          name={name}
          onClick={() => onSelect?.(name)}
        />
      ))}
    </div>
  );
};
