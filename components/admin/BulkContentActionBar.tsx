import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type BulkContentAction = "submit_for_review" | "publish" | "unpublish";

export type BulkStatusBreakdown = {
  draft: number;
  in_review: number;
  published: number;
  other: number;
};

type Props = {
  selectedCount: number;
  filteredCount: number;
  statusBreakdown?: BulkStatusBreakdown;
  canEdit: boolean;
  canApprove: boolean;
  onSelectAllFiltered: () => void;
  onClearSelection: () => void;
  onRequestAction: (action: BulkContentAction) => void;
};

export function BulkContentActionBar({
  selectedCount,
  filteredCount,
  statusBreakdown,
  canEdit,
  canApprove,
  onSelectAllFiltered,
  onClearSelection,
  onRequestAction,
}: Props) {
  if (selectedCount === 0) return null;

  const showBreakdown =
    !!statusBreakdown &&
    (statusBreakdown.draft > 0 ||
      statusBreakdown.in_review > 0 ||
      statusBreakdown.published > 0 ||
      statusBreakdown.other > 0);

  return (
    <div className="sticky top-2 z-40 rounded-xl border border-border bg-background/95 p-3 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="text-sm font-medium">Selected: {selectedCount}</div>

          {showBreakdown ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {statusBreakdown!.draft > 0 ? (
                <Badge variant="secondary" className="whitespace-nowrap">
                  Draft {statusBreakdown!.draft}
                </Badge>
              ) : null}
              {statusBreakdown!.in_review > 0 ? (
                <Badge variant="outline" className="whitespace-nowrap">
                  In review {statusBreakdown!.in_review}
                </Badge>
              ) : null}
              {statusBreakdown!.published > 0 ? (
                <Badge variant="default" className="whitespace-nowrap">
                  Published {statusBreakdown!.published}
                </Badge>
              ) : null}
              {statusBreakdown!.other > 0 ? (
                <Badge variant="outline" className="whitespace-nowrap">
                  Other {statusBreakdown!.other}
                </Badge>
              ) : null}
            </div>
          ) : null}

          {selectedCount < filteredCount && (
            <Button type="button" variant="outline" size="sm" onClick={onSelectAllFiltered}>
              Select all (filtered: {filteredCount})
            </Button>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={onClearSelection}>
            Clear
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canEdit}
            onClick={() => onRequestAction("submit_for_review")}
          >
            Submit for Review
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!canApprove}
            onClick={() => onRequestAction("publish")}
          >
            Publish Now
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canApprove}
            onClick={() => onRequestAction("unpublish")}
          >
            Unpublish
          </Button>
        </div>
      </div>
    </div>
  );
}
