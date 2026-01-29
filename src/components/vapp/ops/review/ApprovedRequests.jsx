"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTransport } from "@/contexts/TransportContext";
import { vappAccessRequestApi } from "@/lib/services/vapp/vapp-api-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight } from "lucide-react";
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
 * Approved Requests Component
 * Displays list of approved requests
 */
export function ApprovedRequests({ eventId }) {
  const { client } = useTransport();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (!client || !eventId) return;

    const loadApproved = async () => {
      try {
        setLoading(true);
        const call = (method, payload) => client.call(method, payload);
        const result = await vappAccessRequestApi.list(call, {
          event_id: eventId,
          status: ["approved"],
          limit: 100,
        });

        if (result?.status === "fulfilled" && result?.response) {
          setRequests(result.response.requests || []);
        } else {
          const errorMsg = result?.response?.message || "Failed to load requests";
          toast.error(errorMsg);
        }
      } catch (error) {
        console.error("Failed to load approved requests:", error);
        toast.error("Failed to load requests");
      } finally {
        setLoading(false);
      }
    };

    loadApproved();
  }, [client, eventId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approved Requests</h1>
        <p className="text-sm text-gray-600 mt-1">
          Requests that have been approved and are ready for permit generation
        </p>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Approved ({requests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No approved requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Functional Area</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Approved</TableHead>
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
                        <Badge variant="outline">
                          {request.items_count || 0} item{request.items_count !== 1 ? "s" : ""}
                        </Badge>
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
                            View
                            <ArrowRight className="ml-2 h-4 w-4" />
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
