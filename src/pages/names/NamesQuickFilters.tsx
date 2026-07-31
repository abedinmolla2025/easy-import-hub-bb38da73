import { cn } from "@/lib/utils";

export type QuickFilter = "all" | "boy" | "girl" | "unisex" | "quranic" | "popular" | "short" | "beautiful";

export interface NamesQuickFiltersProps {
  active: QuickFilter;
  onChange: (filter: QuickFilter) => void;
}

const FILTERS: { value: QuickFilter; label: string; icon: string }[] = [
  { value: "all", label: "All", icon: "" },
  { value: "boy", label: "Boy", icon: "♂️" },
  { value: "girl", label: "Girl", icon: "♀️" },
  { value: "unisex", label: "Unisex", icon: "⚧" },
  { value: "beautiful", label: "Beautiful", icon: "🌸" },
  { value: "quranic", label: "Quranic", icon: "📖" },
  { value: "popular", label: "Popular", icon: "⭐" },
  { value: "short", label: "Short", icon: "✂️" },
];

export const NamesQuickFilters = ({ active, onChange }: NamesQuickFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5",
            active === filter.value
              ? "bg-yellow-500 text-black shadow-md"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          )}
        >
          {filter.icon && <span className="text-xs">{filter.icon}</span>}
          {filter.label}
        </button>
      ))}
    </div>
  );
};
