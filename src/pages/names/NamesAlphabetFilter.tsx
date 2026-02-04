import { Button } from "@/components/ui/button";

export interface NamesAlphabetFilterProps {
  activeLetter: string | null;
  onChange: (letter: string | null) => void;
  counts?: Record<string, number>;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export const NamesAlphabetFilter = ({ activeLetter, onChange, counts }: NamesAlphabetFilterProps) => {
  return (
    <div className="flex flex-wrap gap-1 justify-center">
      <Button
        variant={activeLetter === null ? "default" : "ghost"}
        size="sm"
        className="h-8 min-w-[2rem] p-0"
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
            className="h-8 w-8 p-0"
            onClick={() => onChange(letter)}
            disabled={!hasNames}
          >
            {letter}
          </Button>
        );
      })}
    </div>
  );
};
