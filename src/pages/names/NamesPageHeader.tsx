import { BookOpen } from "lucide-react";

interface NamesPageHeaderProps {
  title: string;
  subtitle?: string;
}

export const NamesPageHeader = ({ title, subtitle }: NamesPageHeaderProps) => {
  return (
    <div className="flex items-center gap-3">
      {/* Icon badge */}
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
        <BookOpen className="w-5 h-5 text-white" />
      </div>
      
      {/* Title & subtitle */}
      <div className="min-w-0 flex-1">
        <h1 className="text-lg font-bold text-white tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-white/70 mt-0.5 truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
