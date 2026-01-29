"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTransport } from "@/contexts/TransportContext";
import { vappAccessRequestApi } from "@/lib/services/vapp/vapp-api-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Eye, RefreshCw, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import StatusBadge from "@/components/vapp/shared/StatusBadge";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "need_info", label: "Need Info" },
];

/**
 * ReviewRequests Component
 * Displays review requests with status filtering (approved, rejected, need_info)
 */
export function ReviewRequests({ eventId }) {
  const { client } = useTransport();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // Load requests based on status filter
  const loadRequests = useCallback(async () => {
    if (!client || !eventId) return;

    try {
      setLoading(true);
      setError(null);

      const filters = {
        event_id: eventId,
        limit: 100,
      };

      // Status filter - can be single status or all
      if (statusFilter !== "all") {
        filters.status = [statusFilter];
      } else {
        // If "all", show approved, rejected, and need_info
        filters.status = ["approved", "rejected", "need_info"];
      }

      const call = (method, payload) => client.call(method, payload);
      const result = await vappAccessRequestApi.list(call, filters);

      if (result?.status === "fulfilled" && result?.response) {
        setRequests(result.response.requests || []);
      } else {
        const errorMsg = result?.response?.message || "Failed to load requests";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = err?.message || "Failed to load requests";
      setError(errorMsg);
      toast.error(errorMsg);
      console.error("Failed to load requests:", err);
    } finally {
      setLoading(false);
    }
  }, [client, eventId, statusFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return "✅";
      case "rejected":
        return "❌";
      case "need_info":
        return "⚠️";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Requests</h1>
          <p className="text-sm text-gray-600 mt-1">
            View approved, rejected, and requests needing information
          </p>
        </div>
        <Button onClick={loadRequests} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Status Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium">Status:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {statusFilter === "all"
              ? "All Review Requests"
              : STATUS_OPTIONS.find((opt) => opt.value === statusFilter)?.label}{" "}
            ({requests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No requests found for the selected status.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Functional Area</TableHead>
                    <TableHead>Reason/Message</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <Link
                          to={`/events/${eventId}/vapp/ops/review/${request.id}`}
                          className="font-mono text-sm text-primary hover:underline"
                        >
                          {request.id?.slice(0, 8)}...
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{getStatusIcon(request.status)}</span>
                          <StatusBadge status={request.status} />
                        </div>
                      </TableCell>
                      <TableCell>
                        {request.functional_area_label || (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {request.decision_reason ? (
                          <p className="text-sm text-muted-foreground max-w-md truncate">
                            {request.decision_reason}
                          </p>
                        ) : request.status === "approved" ? (
                          <span className="text-sm text-muted-foreground">No notes</span>
                        ) : (
                          <span className="text-muted-foreground">No reason provided</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {request.reviewed_at
                            ? new Date(request.reviewed_at).toLocaleDateString()
                            : request.updated_at
                            ? new Date(request.updated_at).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/events/${eventId}/vapp/ops/review/${request.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
