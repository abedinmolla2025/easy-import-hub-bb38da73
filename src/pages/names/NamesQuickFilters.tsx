import { Button } from "@/components/ui/button";

export type QuickFilter = "all" | "boy" | "girl" | "unisex" | "quranic" | "popular" | "short";

export interface NamesQuickFiltersProps {
  active: QuickFilter;
  onChange: (filter: QuickFilter) => void;
}

const FILTERS: { value: QuickFilter; label: string }[] = [
  { value: "all", label: "সব" },
  { value: "boy", label: "ছেলে" },
  { value: "girl", label: "মেয়ে" },
  { value: "unisex", label: "ইউনিসেক্স" },
  { value: "quranic", label: "কুরআনিক" },
  { value: "popular", label: "জনপ্রিয়" },
  { value: "short", label: "ছোট নাম" },
];

export const NamesQuickFilters = ({ active, onChange }: NamesQuickFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => (
        <Button
          key={filter.value}
          variant={active === filter.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(filter.value)}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
};
