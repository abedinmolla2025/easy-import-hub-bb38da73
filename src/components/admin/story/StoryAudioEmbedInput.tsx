import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertCircle, Copy, Check } from "lucide-react";
import { useState } from "react";

interface StoryAudioEmbedInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function StoryAudioEmbedInput({ value, onChange }: StoryAudioEmbedInputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isValidEmbedCode = (value || "").includes("soundcloud.com") && (value || "").includes("iframe");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>SoundCloud Embed Code (HTML iframe)</Label>
        {value && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="h-7 gap-1 rounded-full px-2 text-xs"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" /> Copy
              </>
            )}
          </Button>
        )}
      </div>

      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Paste your SoundCloud embed code here. Example:\n<iframe width="100%" height="300" scrolling="no" frameborder="no" allow="autoplay; encrypted-media" src="https://w.soundcloud.com/player/?url=..."></iframe>`}
        rows={4}
        className="font-mono text-xs"
      />

      <div className="space-y-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 text-sm">
        <div className="flex gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="space-y-1 text-blue-900 dark:text-blue-200">
            <p className="font-medium">How to get SoundCloud embed code:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Upload your audio to SoundCloud</li>
              <li>Click "Share" button</li>
              <li>Select "Embed" tab</li>
              <li>Copy the iframe code</li>
              <li>Paste it here</li>
            </ol>
          </div>
        </div>
      </div>

      {value && !isValidEmbedCode && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-900 dark:text-amber-200">
          ⚠️ This doesn't look like a valid SoundCloud embed code. Make sure it contains `iframe` and `soundcloud.com`.
        </div>
      )}

      {value && isValidEmbedCode && (
        <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-3 text-xs text-green-900 dark:text-green-200">
          ✓ Valid SoundCloud embed code detected!
        </div>
      )}
    </div>
  );
}
