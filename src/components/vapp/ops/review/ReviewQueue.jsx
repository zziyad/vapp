"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTransport } from "@/contexts/TransportContext";
import { getReviewAggregate } from "@/aggregates/review/get-review-aggregate";
import { getConfigAggregate } from "@/aggregates/config/get-config-aggregate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Eye, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import StatusBadge from "@/components/vapp/shared/StatusBadge";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActionsBar } from "./BulkActionsBar";
import { vappReviewApi } from "@/lib/services/vapp/vapp-api-service";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "need_info", label: "Need Info" },
];

/**
 * ReviewQueue Component
 * Displays reviewable access requests with filters and actions
 */
export function ReviewQueue({ eventId }) {
  const { client } = useTransport();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [functionalAreaFilter, setFunctionalAreaFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Filter options
  const [functionalAreas, setFunctionalAreas] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  // Bulk selection state
  const [selectedRequests, setSelectedRequests] = useState(new Set());
  const [bulkApproving, setBulkApproving] = useState(false);
  const [bulkApproveReason, setBulkApproveReason] = useState("");

  // Create review aggregate
  const reviewAggregate = useMemo(() => {
    if (!client || !eventId) return null;
    return getReviewAggregate(eventId, client);
  }, [client, eventId]);

  // Create config aggregate for functional areas
  const configAggregate = useMemo(() => {
    if (!client || !eventId) return null;
    return getConfigAggregate(eventId, client);
  }, [client, eventId]);

  // Subscribe to review queue state changes
  useEffect(() => {
    if (!reviewAggregate?.review) return;

    const unsubscribe = reviewAggregate.review.subscribe((state) => {
      if (state) {
        setRequests(state.queue?.requests || []);
        setTotal(state.queue?.total || 0);
        setLoading(state.queueLoading || false);
        setError(state.queueError || null);
      }
    });

    return unsubscribe;
  }, [reviewAggregate]);

  // Load filter options (functional areas)
  useEffect(() => {
    if (!configAggregate?.functionalArea || !eventId) return;

    const loadFilterOptions = async () => {
      try {
        setLoadingFilters(true);
        // Load functional areas without limit parameter (backend may not support it)
        await configAggregate.functionalArea.list(eventId).catch((err) => {
          console.warn("Failed to load functional areas for filter:", err);
          return [];
        });
      } catch (err) {
        console.error("Failed to load filter options:", err);
      } finally {
        setLoadingFilters(false);
      }
    };

    loadFilterOptions();

    const unsubscribe = configAggregate.functionalArea.subscribe((state) => {
      if (state?.list) {
        const faList = Array.isArray(state.list) ? state.list : [];
        const filtered = faList.filter((x) => x && x.is_deleted !== true && x.is_active !== false);
        // Only update if the list actually changed (prevent infinite loops)
        setFunctionalAreas((prev) => {
          if (prev.length === filtered.length && 
              prev.every((p, i) => p.id === filtered[i]?.id)) {
            return prev; // Return previous if unchanged
          }
          return filtered;
        });
      }
    });

    return unsubscribe;
  }, [configAggregate, eventId]);

  // Load review queue
  const loadQueue = useCallback(async () => {
    if (!reviewAggregate?.review || !eventId) return;

    try {
      const filters = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
      };

      // Status filter
      if (statusFilter !== "all") {
        filters.status = [statusFilter];
      }

      // Functional area filter
      if (functionalAreaFilter && functionalAreaFilter !== "all") {
        filters.functional_area_id = functionalAreaFilter;
      }

      await reviewAggregate.review.listQueue(eventId, filters);
    } catch (err) {
      console.error("Failed to load review queue:", err);
      toast.error(err.message || "Failed to load review queue");
    }
  }, [reviewAggregate, eventId, statusFilter, functionalAreaFilter, page, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    // Clear selection when filters change
    setSelectedRequests(new Set());
  }, [statusFilter, functionalAreaFilter]);

  // Load queue when filters or page changes
  useEffect(() => {
    if (!reviewAggregate?.review || !eventId) return;
    loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, functionalAreaFilter, page, eventId]);

  // Filtered requests (client-side search)
  const filteredRequests = useMemo(() => {
    let filtered = requests || [];

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((req) => {
        const id = req.id?.toLowerCase() || "";
        const requesterName = req.requester_name?.toLowerCase() || "";
        const faName = req.functional_area_label?.toLowerCase() || "";
        return (
          id.includes(searchLower) ||
          requesterName.includes(searchLower) ||
          faName.includes(searchLower)
        );
      });
    }

    return filtered;
  }, [requests, search]);

  const totalPages = Math.ceil(total / pageSize);

  // Selection handlers
  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      setSelectedRequests(new Set(filteredRequests.map((r) => r.id)));
    } else {
      setSelectedRequests(new Set());
    }
  }, [filteredRequests]);

  const handleSelectRequest = useCallback((requestId, checked) => {
    setSelectedRequests((prev) => {
      const newSelected = new Set(prev);
      if (checked) {
        newSelected.add(requestId);
      } else {
        newSelected.delete(requestId);
      }
      return newSelected;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedRequests(new Set());
    setBulkApproveReason("");
  }, []);

  // Bulk approve handler
  const handleBulkApprove = async () => {
    if (selectedRequests.size === 0 || !client) return;

    setBulkApproving(true);
    try {
      const call = (method, payload) => client.call(method, payload);
      const result = await vappReviewApi.bulkApprove(
        call,
        eventId,
        Array.from(selectedRequests),
        bulkApproveReason || null
      );

      if (result?.status === "fulfilled") {
        const { summary, results } = result.response;
        // Show success message
        toast.success(
          `Approved ${summary.succeeded} of ${summary.total} request${summary.total !== 1 ? "s" : ""}${summary.failed > 0 ? ` (${summary.failed} failed)` : ""}`
        );

        // Show individual failures if any
        const failures = results.filter((r) => r.status === "error");
        if (failures.length > 0) {
          failures.forEach((f) => {
            toast.error(`Request ${f.request_id?.slice(0, 8)}... failed: ${f.error}`);
          });
        }

        // Clear selection and reload queue
        setSelectedRequests(new Set());
        setBulkApproveReason("");
        await loadQueue();
      } else {
        toast.error(result?.response?.message || "Bulk approval failed");
      }
    } catch (err) {
      toast.error(err.message || "Bulk approval failed");
      console.error("Failed to bulk approve:", err);
    } finally {
      setBulkApproving(false);
    }
  };

  // Check if all visible requests are selected
  const allSelected = useMemo(() => {
    return filteredRequests.length > 0 && filteredRequests.every((r) => selectedRequests.has(r.id));
  }, [filteredRequests, selectedRequests]);

  const someSelected = useMemo(() => {
    return filteredRequests.some((r) => selectedRequests.has(r.id));
  }, [filteredRequests, selectedRequests]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Queue</h1>
          <p className="text-sm text-gray-600 mt-1">
            Review and decide on access requests
          </p>
        </div>
        <Button onClick={loadQueue} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by ID, requester, functional area..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="w-[180px]">
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Status
          </label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
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

        <div className="w-[200px]">
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Functional Area
          </label>
          <Select
            value={functionalAreaFilter || "all"}
            onValueChange={(value) => {
              setFunctionalAreaFilter(value);
            }}
            disabled={loadingFilters}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingFilters ? "Loading..." : "All Functional Areas"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Functional Areas</SelectItem>
              {functionalAreas.length > 0 ? (
                functionalAreas.map((fa) => (
                  <SelectItem key={fa.id} value={String(fa.id)}>
                    {fa.display_name || fa.name}
                  </SelectItem>
                ))
              ) : (
                !loadingFilters && (
                  <SelectItem value="all" disabled>
                    No functional areas available
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        {(functionalAreaFilter !== "all" || statusFilter !== "all") && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFunctionalAreaFilter("all");
              setStatusFilter("all");
              setPage(1);
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      {/* Requests Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  aria-label="Select all requests"
                />
              </TableHead>
              <TableHead>Request ID</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Functional Area</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Loading requests...
                </TableCell>
              </TableRow>
            ) : filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No requests found
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => (
                <TableRow
                  key={request.id}
                  className={selectedRequests.has(request.id) ? "bg-muted/50" : ""}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedRequests.has(request.id)}
                      onChange={(e) => handleSelectRequest(request.id, e.target.checked)}
                      aria-label={`Select request ${request.id}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {request.id?.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {request.requester_name || "-"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {request.requester_email || ""}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{request.functional_area_label || "-"}</TableCell>
                  <TableCell>
                    <StatusBadge status={request.status} />
                  </TableCell>
                  <TableCell>
                    {request.submitted_at
                      ? new Date(request.submitted_at).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/events/${eventId}/vapp/ops/review/${request.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of{" "}
            {total} requests
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedRequests.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedRequests.size}
          reason={bulkApproveReason}
          onReasonChange={setBulkApproveReason}
          onApprove={handleBulkApprove}
          onClear={handleClearSelection}
          loading={bulkApproving}
        />
      )}

      {/* Add bottom padding when bulk actions bar is visible */}
      {selectedRequests.size > 0 && <div className="h-24" />}
    </div>
  );
}
