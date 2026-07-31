import { Button } from "@/components/ui/button";

export interface NamesAlphabetFilterProps {
  activeLetter: string | null;
  onChange: (letter: string | null) => void;
  counts?: Record<string, number>;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export const NamesAlphabetFilter = ({ activeLetter, onChange, counts }: NamesAlphabetFilterProps) => {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Alphabet letters - horizontally scrollable on mobile with better touch targets */}
      <div className="w-full overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1">
        <div className="flex items-center gap-1.5 min-w-max justify-center">
          <Button
            variant={activeLetter === null ? "default" : "ghost"}
            size="sm"
            className="h-9 min-w-[2.25rem] px-2 text-xs font-semibold"
            onClick={() => onChange(null)}
          >
            All
          </Button>
          {ALPHABET.map((letter) => {
            const count = counts?.[letter] ?? 0;
            const hasNames = !counts || count > 0;
            return (
              <Button
                key={letter}
                variant={activeLetter === letter ? "default" : "ghost"}
                size="sm"
                className="h-9 w-9 p-0 text-xs font-semibold"
                onClick={() => onChange(letter)}
                disabled={!hasNames}
              >
                {letter}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Active filter indicator with clear button */}
      {activeLetter && (
        <div className="flex items-center gap-2 text-sm text-[hsl(var(--dua-fg-muted))]">
          <span>Filtering by: <strong>{activeLetter}</strong></span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => onChange(null)}
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
};
