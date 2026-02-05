import { Sparkles } from "lucide-react";

interface NamesPageHeaderProps {
  title: string;
  subtitle?: string;
}

export const NamesPageHeader = ({ title, subtitle }: NamesPageHeaderProps) => {
  return (
    <div className="relative text-center py-2">
      {/* Decorative lines */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-full max-w-xs flex items-center gap-2">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-yellow-400" />
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-yellow-400/50 to-yellow-400" />
        </div>
      </div>
      
      {/* Title with premium styling */}
      <div className="relative inline-flex items-center gap-2 px-4">
        <Sparkles className="w-4 h-4 text-yellow-400" />
        <h1 className="text-xl font-bold text-yellow-400 tracking-wide drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]">
          {title}
        </h1>
        <Sparkles className="w-4 h-4 text-yellow-400" />
      </div>
      
      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs text-white/70 mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
};
