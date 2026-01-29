"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { CheckCircle2, X, Loader2 } from "lucide-react";

/**
 * BulkActionsBar Component
 * Sticky bar that appears when requests are selected for bulk operations
 */
export function BulkActionsBar({
  selectedCount,
  reason,
  onReasonChange,
  onApprove,
  onClear,
  loading = false,
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background shadow-lg">
      <Card className="rounded-none border-0 border-t">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Selection Count */}
            <div className="flex items-center gap-2 font-medium">
              <span className="text-sm text-muted-foreground">
                {selectedCount} request{selectedCount !== 1 ? "s" : ""} selected
              </span>
            </div>

            {/* Reason Input */}
            <div className="flex-1 min-w-0">
              <Label htmlFor="bulk-reason" className="text-xs text-muted-foreground mb-1 block">
                Approval Reason (Optional)
              </Label>
              <Input
                id="bulk-reason"
                type="text"
                placeholder="Optional reason for approval..."
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)}
                disabled={loading}
                className="max-w-md"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClear}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button
                size="sm"
                onClick={onApprove}
                disabled={loading || selectedCount === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve Selected
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
