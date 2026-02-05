import { cn } from "@/lib/utils";

export type QuickFilter = "all" | "boy" | "girl" | "unisex" | "quranic" | "popular" | "short";

export interface NamesQuickFiltersProps {
  active: QuickFilter;
  onChange: (filter: QuickFilter) => void;
}

const FILTERS: { value: QuickFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "boy", label: "Boy" },
  { value: "girl", label: "Girl" },
  { value: "unisex", label: "Unisex" },
  { value: "quranic", label: "Quranic" },
  { value: "popular", label: "Popular" },
  { value: "short", label: "Short" },
];

export const NamesQuickFilters = ({ active, onChange }: NamesQuickFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all",
            active === filter.value
              ? "bg-yellow-500 text-black shadow-md"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};
