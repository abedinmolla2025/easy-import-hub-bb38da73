import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export interface CategoryItem {
  id: string;
  name: string;
  nameBn: string;
  icon: string;
  color: string;
  bgColor: string;
  count: number;
}

interface NamesCategoriesProps {
  onSelect: (category: string | null) => void;
  activeCategory: string | null;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: "beauty",
    name: "Beauty",
    nameBn: "সৌন্দর্য",
    icon: "🌸",
    color: "text-pink-600",
    bgColor: "bg-pink-50 hover:bg-pink-100 border-pink-200",
    count: 348,
  },
  {
    id: "virtue",
    name: "Virtue",
    nameBn: "গুণ",
    icon: "⭐",
    color: "text-amber-600",
    bgColor: "bg-amber-50 hover:bg-amber-100 border-amber-200",
    count: 336,
  },
  {
    id: "quranic",
    name: "Quranic",
    nameBn: "কুরআনিক",
    icon: "📖",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200",
    count: 582,
  },
  {
    id: "prophets-family",
    name: "Prophets",
    nameBn: "নবী পরিবার",
    icon: "🌙",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200",
    count: 114,
  },
  {
    id: "sahabi",
    name: "Sahabi",
    nameBn: "সাহাবী",
    icon: "🤝",
    color: "text-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100 border-blue-200",
    count: 109,
  },
  {
    id: "nature",
    name: "Nature",
    nameBn: "প্রকৃতি",
    icon: "🌿",
    color: "text-green-600",
    bgColor: "bg-green-50 hover:bg-green-100 border-green-200",
    count: 76,
  },
  {
    id: "strength",
    name: "Strength",
    nameBn: "শক্তি",
    icon: "💪",
    color: "text-red-600",
    bgColor: "bg-red-50 hover:bg-red-100 border-red-200",
    count: 39,
  },
  {
    id: "faith",
    name: "Faith",
    nameBn: "ঈমান",
    icon: "🕌",
    color: "text-teal-600",
    bgColor: "bg-teal-50 hover:bg-teal-100 border-teal-200",
    count: 52,
  },
  {
    id: "wisdom",
    name: "Wisdom",
    nameBn: "জ্ঞান",
    icon: "📚",
    color: "text-purple-600",
    bgColor: "bg-purple-50 hover:bg-purple-100 border-purple-200",
    count: 52,
  },
  {
    id: "light",
    name: "Light",
    nameBn: "আলো",
    icon: "✨",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 hover:bg-yellow-100 border-yellow-200",
    count: 46,
  },
  {
    id: "love",
    name: "Love",
    nameBn: "ভালোবাসা",
    icon: "💝",
    color: "text-rose-600",
    bgColor: "bg-rose-50 hover:bg-rose-100 border-rose-200",
    count: 30,
  },
  {
    id: "peace",
    name: "Peace",
    nameBn: "শান্তি",
    icon: "☮️",
    color: "text-cyan-600",
    bgColor: "bg-cyan-50 hover:bg-cyan-100 border-cyan-200",
    count: 26,
  },
];

export const NamesCategories = ({ onSelect, activeCategory }: NamesCategoriesProps) => {
  return (
    <div className="w-full">
      {/* Section Title */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[hsl(var(--dua-fg))]">
            Categories
          </h2>
          <p className="text-sm text-[hsl(var(--dua-fg-muted))]">
            অর্থ অনুযায়ী নাম খুঁজুন
          </p>
        </div>
        {activeCategory && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-sm font-medium text-[hsl(var(--dua-accent))] hover:underline"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect(isActive ? null : cat.id)}
              className={cn(
                "relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200",
                "active:scale-95",
                isActive
                  ? `${cat.bgColor} ${cat.color} border-[hsl(var(--dua-accent))] shadow-md ring-2 ring-[hsl(var(--dua-accent)/0.2)]`
                  : `bg-white/80 border-gray-100 hover:border-[hsl(var(--dua-accent)/0.3)] hover:shadow-sm`
              )}
            >
              {/* Icon */}
              <span className="text-2xl mb-1">{cat.icon}</span>
              {/* Name */}
              <span className={cn(
                "text-xs font-semibold leading-tight text-center",
                isActive ? cat.color : "text-[hsl(var(--dua-fg))]"
              )}>
                {cat.name}
              </span>
              {/* Bengali name */}
              <span className="text-[10px] text-[hsl(var(--dua-fg-muted))] font-bangla mt-0.5 text-center">
                {cat.nameBn}
              </span>
              {/* Count badge */}
              <span className={cn(
                "mt-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full",
                isActive
                  ? "bg-white/80 text-[hsl(var(--dua-accent))]"
                  : "bg-gray-100 text-gray-500"
              )}>
                {cat.count}
              </span>
              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[hsl(var(--dua-accent))]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
