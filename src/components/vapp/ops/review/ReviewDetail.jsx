"use client";

import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTransport } from "@/contexts/TransportContext";
import { getReviewAggregate } from "@/aggregates/review/get-review-aggregate";
import { vappReviewApi } from "@/lib/services/vapp/vapp-api-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, CheckCircle2, XCircle, MessageSquare, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import StatusBadge from "@/components/vapp/shared/StatusBadge";
import { PERMISSIONS, usePermissions, ConditionalButton } from "@/components/permissions";

// Format date helper
const formatDateTime = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

// Safe string renderer (prevents object rendering errors)
const safeRender = (value) => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object") {
    // Try to extract display_name or name
    if (value.display_name) return String(value.display_name);
    if (value.name) return String(value.name);
    if (value.id) return String(value.id);
    return "-";
  }
  return String(value);
};

/**
 * ReviewDetail Component
 * Displays full request details for review with decision actions
 */
export function ReviewDetail({ eventId, requestId }) {
  const { client } = useTransport();
  const { can } = usePermissions();
  const navigate = useNavigate();

  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Decision dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [needInfoDialogOpen, setNeedInfoDialogOpen] = useState(false);
  const [decisionReason, setDecisionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Create review aggregate
  const aggregate = useMemo(() => {
    if (!client || !eventId) return null;
    return getReviewAggregate(eventId, client);
  }, [client, eventId]);

  // Subscribe to review bundle state changes
  useEffect(() => {
    if (!aggregate?.review) return;

    const unsubscribe = aggregate.review.subscribe((state) => {
      if (state) {
        setBundle(state.bundle);
        setLoading(state.bundleLoading || false);
        setError(state.bundleError || null);
      }
    });

    return unsubscribe;
  }, [aggregate]);

  // Load review bundle
  useEffect(() => {
    if (!aggregate?.review || !eventId || !requestId) return;

    const loadBundle = async () => {
      try {
        // Check if client is available and connected
        if (!client) {
          setError("Transport client not available");
          setLoading(false);
          return;
        }

        await aggregate.review.getBundle(eventId, requestId);
      } catch (err) {
        console.error("Failed to load review bundle:", err);
        const errorMessage = err.message || "Failed to load review bundle";
        
        // Check if it's a connection error
        if (errorMessage.includes("Connection closed") || errorMessage.includes("WebSocket not connected")) {
          setError("Connection lost. Please refresh the page or check your network connection.");
        } else {
          setError(errorMessage);
        }
        
        toast.error(errorMessage);
      }
    };

    loadBundle();
  }, [aggregate, eventId, requestId, client]);

  // Decision handlers
  const handleApprove = async () => {
    if (!eventId || !requestId || !client) return;

    try {
      setSubmitting(true);
      const call = (method, payload) => client.call(method, payload);
      const result = await vappReviewApi.approve(call, eventId, requestId, decisionReason || null);

      if (result?.status === "fulfilled") {
        toast.success("Request approved successfully");
        setApproveDialogOpen(false);
        setDecisionReason("");
        navigate(`/events/${eventId}/vapp/ops/review/queue`);
      } else {
        const errorMsg = result?.response?.message || "Failed to approve request";
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = err?.message || "Failed to approve request";
      toast.error(errorMsg);
      console.error("Failed to approve request:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!eventId || !requestId || !client || !decisionReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    try {
      setSubmitting(true);
      const call = (method, payload) => client.call(method, payload);
      const result = await vappReviewApi.reject(call, eventId, requestId, decisionReason);

      if (result?.status === "fulfilled") {
        toast.success("Request rejected");
        setRejectDialogOpen(false);
        setDecisionReason("");
        navigate(`/events/${eventId}/vapp/ops/review/queue`);
      } else {
        const errorMsg = result?.response?.message || "Failed to reject request";
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = err?.message || "Failed to reject request";
      toast.error(errorMsg);
      console.error("Failed to reject request:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNeedInfo = async () => {
    if (!eventId || !requestId || !client || !decisionReason.trim()) {
      toast.error("Information request message is required");
      return;
    }

    try {
      setSubmitting(true);
      const call = (method, payload) => client.call(method, payload);
      const result = await vappReviewApi.needInfo(call, eventId, requestId, decisionReason);

      if (result?.status === "fulfilled") {
        toast.success("Information request sent");
        setNeedInfoDialogOpen(false);
        setDecisionReason("");
        // Reload bundle to show updated status
        if (aggregate?.review) {
          await aggregate.review.getBundle(eventId, requestId);
        }
      } else {
        const errorMsg = result?.response?.message || "Failed to request information";
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = err?.message || "Failed to request information";
      toast.error(errorMsg);
      console.error("Failed to request information:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const request = bundle?.request;
  const items = bundle?.items || [];
  const permits = bundle?.permits || [];
  const isReviewable = request && ["submitted", "under_review", "need_info"].includes(request.status);

  const src = request?.source_ref && typeof request.source_ref === "object" ? request.source_ref : {};
  const v2 = bundle?.v2_context && typeof bundle.v2_context === "object" ? bundle.v2_context : {};
  const srcVehicles = Array.isArray(src?.vehicles) ? src.vehicles : [];
  const primaryVehicle =
    srcVehicles[0] ||
    {
      vehicle_type_id: src?.vehicle_type_id || null,
      plate_number: src?.plate_number || null,
      driver_name: src?.driver_name || null,
      driver_phone: src?.driver_phone || null,
    };

  const resolveName = (entity) => {
    if (!entity) return "-";
    if (typeof entity === "string") return entity;
    return entity.display_name || entity.name || entity.code || entity.id || "-";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading review details...</span>
      </div>
    );
  }

  if (error || !request) {
    const isConnectionError = error?.includes("Connection") || error?.includes("Connection lost") || error?.includes("WebSocket not connected");
    
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to={`/events/${eventId}/vapp/ops/review/queue`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Review Queue
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-red-600 font-medium">{error || "Request not found"}</div>
              {isConnectionError && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    The connection to the server was lost. Please try:
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.reload()}
                    >
                      Refresh Page
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        setError(null);
                        setLoading(true);
                        try {
                          if (aggregate?.review) {
                            await aggregate.review.getBundle(eventId, requestId);
                          }
                        } catch (err) {
                          console.error("Retry failed:", err);
                          setError(err.message || "Failed to load review bundle");
                          setLoading(false);
                        }
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2">
            <Link to={`/events/${eventId}/vapp/ops/review/queue`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Review Queue
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Review Request</h1>
          <p className="text-sm text-gray-600 mt-1">Request ID: {request.id?.substring(0, 8)}...</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={request.status} />
        </div>
      </div>

      {/* Request Header Info */}
      <Card>
        <CardHeader>
          <CardTitle>Request Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-500">VLO Name</Label>
              <div className="font-medium">
                {safeRender(src?.vlo_name) ||
                  safeRender(request.requester_name || request.requester_email) ||
                  "-"}
              </div>
            </div>
            <div>
              <Label className="text-gray-500">Functional Area</Label>
              <div className="font-medium">
                {resolveName(v2?.functional_area) || safeRender(src?.functional_area_id) || "-"}
              </div>
            </div>
            <div>
              <Label className="text-gray-500">VLO Email</Label>
              <div className="text-sm">{safeRender(src?.vlo_email)}</div>
            </div>
            <div>
              <Label className="text-gray-500">VLO Phone</Label>
              <div className="text-sm">{safeRender(src?.vlo_contact_phone)}</div>
            </div>
            <div>
              <Label className="text-gray-500">Justification</Label>
              <div className="text-sm">{request.justification || "-"}</div>
            </div>
            <div>
              <Label className="text-gray-500">Submitted</Label>
              <div className="text-sm">{formatDateTime(request.submitted_at)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* v2: Requester Submitted Fields (source_ref) */}
      <Card>
        <CardHeader>
          <CardTitle>Requester Submitted Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-500">Sector</Label>
              <div className="text-sm font-medium">
                {resolveName(v2?.sector) || safeRender(src?.sector_id)}
              </div>
            </div>
            <div>
              <Label className="text-gray-500">Company</Label>
              <div className="text-sm">{safeRender(src?.company)}</div>
            </div>
            <div>
              <Label className="text-gray-500">Venue (Access Zone)</Label>
              <div className="text-sm font-medium">
                {resolveName(v2?.access_zone) || safeRender(src?.access_zone_id)}
              </div>
            </div>
            <div>
              <Label className="text-gray-500">Access / Parking Type</Label>
              <div className="text-sm font-medium">
                {resolveName(v2?.access_type) || safeRender(src?.access_type_id)}
              </div>
            </div>
            <div>
              <Label className="text-gray-500">Validity</Label>
              <div className="text-sm font-medium">
                {resolveName(v2?.validity) || safeRender(src?.validity_id)}
              </div>
            </div>
            <div>
              <Label className="text-gray-500">Importance</Label>
              <div className="text-sm font-medium">
                {resolveName(v2?.importance) || safeRender(src?.importance_id)}
              </div>
            </div>
          </div>

          <div className="rounded-md border p-3">
            <div className="text-sm font-medium mb-2">Vehicle</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-500">Vehicle Type</Label>
                <div className="text-sm font-medium">
                  {resolveName(v2?.vehicle_type) || safeRender(primaryVehicle?.vehicle_type_id)}
                </div>
              </div>
              <div>
                <Label className="text-gray-500">Plate Number</Label>
                <div className="text-sm font-mono">{safeRender(primaryVehicle?.plate_number)}</div>
              </div>
              <div>
                <Label className="text-gray-500">Driver Name</Label>
                <div className="text-sm">{safeRender(primaryVehicle?.driver_name)}</div>
              </div>
              <div>
                <Label className="text-gray-500">Driver Phone</Label>
                <div className="text-sm">{safeRender(primaryVehicle?.driver_phone)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Post-Approval Progress (Permits + lifecycle) */}
      {request.status === "approved" && (
        <Card>
          <CardHeader>
            <CardTitle>Post-Approval Progress</CardTitle>
            <CardDescription>
              Permits are generated/issued/distributed in the Permit Center (Domain D)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-500">Reviewed At</Label>
                <div className="text-sm">{formatDateTime(request.reviewed_at)}</div>
              </div>
              <div>
                <Label className="text-gray-500">Reviewed By</Label>
                <div className="text-sm font-mono">
                  {request.reviewed_by ? String(request.reviewed_by).slice(0, 8) : "-"}
                </div>
              </div>
              <div className="col-span-2">
                <Label className="text-gray-500">Decision Reason</Label>
                <div className="text-sm">{request.decision_reason || "-"}</div>
              </div>
            </div>

            {permits.length === 0 ? (
              <div className="rounded-md border p-4 text-sm text-muted-foreground">
                No permits generated yet for this request.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-sm font-medium">Generated Permits</div>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serial</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Lifecycle</TableHead>
                        <TableHead className="text-right">Open</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {permits.map((p) => {
                        const serial = p?.meta?.serial_number || p?.id?.slice(0, 8) || "-";
                        const lifecycleStage = p?.meta?.lifecycle?.stage || "-";
                        return (
                          <TableRow key={p.id}>
                            <TableCell className="font-mono text-sm">{serial}</TableCell>
                            <TableCell>
                              <StatusBadge status={p.status} />
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{String(lifecycleStage)}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button asChild variant="outline" size="sm">
                                <Link to={`/events/${eventId}/vapp/ops/permits/${p.id}`}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Decision Actions */}
      {isReviewable && (
        <Card>
          <CardHeader>
            <CardTitle>Decision Actions</CardTitle>
            <CardDescription>Review the request and make a decision</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <ConditionalButton
                permission={PERMISSIONS.VAPP.REVIEW.APPROVE}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setApproveDialogOpen(true);
                }}
                type="button"
                variant="default"
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </ConditionalButton>
              <ConditionalButton
                permission={PERMISSIONS.VAPP.REVIEW.REJECT}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setRejectDialogOpen(true);
                }}
                type="button"
                variant="destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </ConditionalButton>
              <ConditionalButton
                permission={PERMISSIONS.VAPP.REVIEW.NEED_INFO}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setNeedInfoDialogOpen(true);
                }}
                type="button"
                variant="outline"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Need Info
              </ConditionalButton>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Decision Dialogs */}
      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Request</DialogTitle>
            <DialogDescription>
              Approve this access request. Optional: Add approval notes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="approve-reason">Approval Notes (Optional)</Label>
              <Textarea
                id="approve-reason"
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                placeholder="Optional approval notes..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApproveDialogOpen(false);
                setDecisionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Reject this access request. Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">Rejection Reason *</Label>
              <Textarea
                id="reject-reason"
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setDecisionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={submitting || !decisionReason.trim()}
              variant="destructive"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Need Info Dialog */}
      <Dialog open={needInfoDialogOpen} onOpenChange={setNeedInfoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Information</DialogTitle>
            <DialogDescription>
              Request additional information from the requester.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="needinfo-message">Information Request Message *</Label>
              <Textarea
                id="needinfo-message"
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                placeholder="What information do you need from the requester?"
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNeedInfoDialogOpen(false);
                setDecisionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleNeedInfo}
              disabled={submitting || !decisionReason.trim()}
              variant="outline"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
