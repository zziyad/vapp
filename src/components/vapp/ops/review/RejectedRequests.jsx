"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTransport } from "@/contexts/TransportContext";
import { vappAccessRequestApi } from "@/lib/services/vapp/vapp-api-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Rejected Requests Component
 * Displays list of rejected requests
 */
export function RejectedRequests({ eventId }) {
  const { client } = useTransport();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (!client || !eventId) return;

    const loadRejected = async () => {
      try {
        setLoading(true);
        const call = (method, payload) => client.call(method, payload);
        const result = await vappAccessRequestApi.list(call, {
          event_id: eventId,
          status: ["rejected"],
          limit: 100,
        });

        if (result?.status === "fulfilled" && result?.response) {
          setRequests(result.response.requests || []);
        } else {
          const errorMsg = result?.response?.message || "Failed to load requests";
          toast.error(errorMsg);
        }
      } catch (error) {
        console.error("Failed to load rejected requests:", error);
        toast.error("Failed to load requests");
      } finally {
        setLoading(false);
      }
    };

    loadRejected();
  }, [client, eventId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rejected Requests</h1>
        <p className="text-sm text-gray-600 mt-1">
          Requests that have been rejected
        </p>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Rejected ({requests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No rejected requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Functional Area</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Rejected</TableHead>
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
                        {request.functional_area_label || (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {request.decision_reason ? (
                          <p className="text-sm text-muted-foreground max-w-md truncate">
                            {request.decision_reason}
                          </p>
                        ) : (
                          <span className="text-muted-foreground">No reason provided</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {request.reviewed_at
                            ? new Date(request.reviewed_at).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/events/${eventId}/vapp/ops/review/${request.id}`}>
                            View Details
                            <ArrowRight className="h-4 w-4 ml-2" />
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
