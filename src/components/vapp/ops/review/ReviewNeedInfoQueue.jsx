"use client";

import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTransport } from "@/contexts/TransportContext";
import { vappAccessRequestApi } from "@/lib/services/vapp/vapp-api-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight } from "lucide-react";
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
 * Review Need Info Queue Component
 * Displays requests that need information (ops view)
 */
export function ReviewNeedInfoQueue({ eventId }) {
  const { client } = useTransport();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (!client || !eventId) return;

    const loadNeedInfo = async () => {
      try {
        setLoading(true);
        const call = (method, payload) => client.call(method, payload);
        const result = await vappAccessRequestApi.list(call, {
          event_id: eventId,
          status: ["need_info"],
          limit: 100,
        });

        if (result?.status === "fulfilled" && result?.response) {
          setRequests(result.response.requests || []);
        } else {
          const errorMsg = result?.response?.message || "Failed to load requests";
          toast.error(errorMsg);
        }
      } catch (error) {
        console.error("Failed to load need info requests:", error);
        toast.error("Failed to load requests");
      } finally {
        setLoading(false);
      }
    };

    loadNeedInfo();
  }, [client, eventId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Need Info Queue</h1>
        <p className="text-sm text-gray-600 mt-1">
          Requests waiting for requester response
        </p>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            Need Info ({requests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No requests need information at this time.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Functional Area</TableHead>
                    <TableHead>Message</TableHead>
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
                          <span className="text-muted-foreground">No message</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {request.updated_at
                            ? new Date(request.updated_at).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm">
                          <Link to={`/events/${eventId}/vapp/ops/review/${request.id}`}>
                            Review
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
