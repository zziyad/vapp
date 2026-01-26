"use client";

import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTransport } from "@/contexts/TransportContext";
import { vappDashboardApi } from "@/lib/services/vapp/vapp-api-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClipboardList, FileCheck, QrCode, Search } from "lucide-react";
import { usePermissions, PERMISSIONS } from "@/components/permissions";

export function OpsDashboard({ eventId }) {
  const { client, wsConnected } = useTransport();
  const { can } = usePermissions();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    review: {
      pending: 0,
      needInfo: 0,
    },
    permits: {
      approvedNotGenerated: 0,
      generatedNotPrinted: 0,
      printedNotIssued: 0,
      issued: 0,
    },
    checkpoint: {
      todayVerified: 0,
      denied: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const isLoadingRef = useRef(false);

  const canReview = can(PERMISSIONS.VAPP.REVIEW.READ);
  const canListPermits = can(PERMISSIONS.VAPP.PERMIT.LIST);

  useEffect(() => {
    if (!wsConnected || !eventId || !client?.wsTransport || isLoadingRef.current) return;

    const call = client.wsTransport.call.bind(client.wsTransport);

    const loadStats = async () => {
      isLoadingRef.current = true;
      try {
        setLoading(true);
        const result = await vappDashboardApi.stats(call, eventId);
        const s = result?.response || {};

        setStats((prev) => ({
          ...prev,
          review: canReview ? (s.review || prev.review) : prev.review,
          permits: canListPermits ? (s.permits || prev.permits) : prev.permits,
          checkpoint: s.checkpoint || prev.checkpoint,
        }));
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    };

    loadStats();
  }, [wsConnected, eventId, client, canReview, canListPermits]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/events/${eventId}/vapp/ops/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Operations Console</h1>
        <p className="text-sm text-gray-600 mt-1">
          Review, approve, and manage permits
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Global Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search by request ID, permit serial, plate number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {can(PERMISSIONS.VAPP.REVIEW.READ) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Review Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Review</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {loading ? "..." : stats.review.pending}
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/events/${eventId}/vapp/ops/review/queue`}>
                        View Queue
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-yellow-200">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Need Info</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {loading ? "..." : stats.review.needInfo}
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/events/${eventId}/vapp/ops/review/need-info`}>
                        View Queue
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {canListPermits && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Permit Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-purple-200">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Approved (Not Generated)</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {loading ? "..." : stats.permits.approvedNotGenerated}
                  </p>
                  <Button asChild variant="ghost" size="sm" className="mt-2">
                    <Link to={`/events/${eventId}/vapp/ops/permits/generate`}>
                      Generate
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              <Card className="border-blue-200">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Generated (Not Printed)</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {loading ? "..." : stats.permits.generatedNotPrinted}
                  </p>
                  <Button asChild variant="ghost" size="sm" className="mt-2">
                    <Link to={`/events/${eventId}/vapp/ops/permits/print`}>
                      Print
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              <Card className="border-orange-200">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Printed (Not Issued)</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {loading ? "..." : stats.permits.printedNotIssued}
                  </p>
                  <Button asChild variant="ghost" size="sm" className="mt-2">
                    <Link to={`/events/${eventId}/vapp/ops/permits/issue`}>
                      Issue
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              <Card className="border-green-200">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Issued (Active)</p>
                  <p className="text-2xl font-bold text-green-600">
                    {loading ? "..." : stats.permits.issued}
                  </p>
                  <Button asChild variant="ghost" size="sm" className="mt-2">
                    <Link to={`/events/${eventId}/vapp/ops/permits`}>
                      View All
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {(can(PERMISSIONS.VAPP.CHECKPOINT?.VERIFY) || can("vapp.checkpoint.verify")) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Checkpoint Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-green-200">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Today Verified</p>
                  <p className="text-2xl font-bold text-green-600">
                    {loading ? "..." : stats.checkpoint.todayVerified}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-red-200">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Today Denied</p>
                  <p className="text-2xl font-bold text-red-600">
                    {loading ? "..." : stats.checkpoint.denied}
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="mt-4">
              <Button asChild>
                <Link to={`/events/${eventId}/vapp/ops/checkpoint/verify`}>
                  <QrCode className="h-4 w-4 mr-2" />
                  Verify Permit
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
