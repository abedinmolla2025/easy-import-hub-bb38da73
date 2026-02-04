import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface NamesPageSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const NamesPageSearch = ({ value, onChange, placeholder = "Search names..." }: NamesPageSearchProps) => {
  return (
    <div className="relative mb-4">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
};
