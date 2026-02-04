import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Name {
  id: string;
  title: string;
  title_arabic?: string | null;
  meaning_bn?: string | null;
  meaning_en?: string | null;
  gender?: string | null;
  category?: string | null;
}

interface NamesCardsGridProps {
  names?: Name[];
  cards?: Name[];
  onNameClick?: (name: Name) => void;
  onSelect?: (name: Name) => void;
  isLoading?: boolean;
  isError?: boolean;
  hasResults?: boolean;
  stickyHeaderRaised?: boolean;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
}

export const NamesCardsGrid = ({ 
  names, 
  cards, 
  onNameClick, 
  onSelect,
  isLoading = false,
  isError = false,
  hasResults = true,
  emptyStateTitle = "No names found.",
  emptyStateDescription = "Try adjusting your search or filters.",
}: NamesCardsGridProps) => {
  const items = cards ?? names ?? [];
  const handleClick = onSelect ?? onNameClick;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Failed to load names. Please try again.</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-foreground font-medium">{emptyStateTitle}</p>
        <p className="text-muted-foreground text-sm mt-1">{emptyStateDescription}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map((name) => (
        <Card
          key={name.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleClick?.(name)}
        >
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground">{name.title}</h3>
            {name.title_arabic && (
              <p className="text-sm text-muted-foreground font-arabic">{name.title_arabic}</p>
            )}
            {(name.meaning_bn || name.meaning_en) && (
              <p className="text-sm text-muted-foreground truncate mt-1">
                {name.meaning_bn || name.meaning_en}
              </p>
            )}
            {name.gender && (
              <span className="inline-block text-xs bg-muted px-2 py-0.5 rounded mt-2 capitalize">
                {name.gender}
              </span>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
