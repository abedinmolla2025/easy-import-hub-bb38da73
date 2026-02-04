import * as React from "react";
import { MoreVertical, Plus, Download, RefreshCw } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type AdminPageActionsDropdownProps = {
  onCreate?: () => void;
  createLabel?: string;

  /** If provided and onExport is not, we'll export this as JSON */
  exportData?: unknown;
  exportFileName?: string;
  onExport?: () => void;
  exportLabel?: string;

  onRefresh?: () => void;
  refreshLabel?: string;

  align?: "start" | "center" | "end";
};

function downloadTextFile(filename: string, contents: string, mimeType = "application/json") {
  const blob = new Blob([contents], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

export function AdminPageActionsDropdown({
  onCreate,
  createLabel = "Create",
  exportData,
  exportFileName = "export",
  onExport,
  exportLabel = "Export",
  onRefresh,
  refreshLabel = "Refresh",
  align = "end",
}: AdminPageActionsDropdownProps) {
  const hasCreate = typeof onCreate === "function";
  const hasExport = typeof onExport === "function" || typeof exportData !== "undefined";
  const hasRefresh = typeof onRefresh === "function";

  const handleExport = React.useCallback(() => {
    if (onExport) return onExport();
    if (typeof exportData === "undefined") return;

    const safeName = exportFileName.endsWith(".json") ? exportFileName : `${exportFileName}.json`;
    const json = JSON.stringify(exportData, null, 2);
    downloadTextFile(safeName, json, "application/json");
  }, [exportData, exportFileName, onExport]);

  const handleRefresh = React.useCallback(() => {
    if (onRefresh) return onRefresh();
    window.location.reload();
  }, [onRefresh]);

  if (!hasCreate && !hasExport && !hasRefresh) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Page actions"
          className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        className="z-[100] min-w-[12rem] border-border bg-popover text-popover-foreground shadow-lg"
      >
        {hasCreate && (
          <DropdownMenuItem onClick={onCreate} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            {createLabel}
          </DropdownMenuItem>
        )}

        {hasCreate && hasExport && <DropdownMenuSeparator />}

        {hasExport && (
          <DropdownMenuItem onClick={handleExport} className="cursor-pointer">
            <Download className="mr-2 h-4 w-4" />
            {exportLabel}
          </DropdownMenuItem>
        )}

        {(hasCreate || hasExport) && hasRefresh && <DropdownMenuSeparator />}

        {hasRefresh && (
          <DropdownMenuItem onClick={handleRefresh} className="cursor-pointer">
            <RefreshCw className="mr-2 h-4 w-4" />
            {refreshLabel}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
