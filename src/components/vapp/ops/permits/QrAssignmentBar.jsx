"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QrCode, X, Loader2 } from "lucide-react";

/**
 * QrAssignmentBar Component
 * Sticky bar that appears when permits are selected for QR code assignment
 */
export function QrAssignmentBar({
  selectedCount,
  onAssign,
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
                {selectedCount} permit{selectedCount !== 1 ? "s" : ""} selected
              </span>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

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
                onClick={onAssign}
                disabled={loading || selectedCount === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4 mr-2" />
                    Assign QR Codes
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
