"use client";

import { useState, useEffect, useMemo } from "react";
import { useTransport } from "@/contexts/TransportContext";
import { vappAccessRequestApi, vappPermitApi } from "@/lib/services/vapp/vapp-api-service";
import { getConfigAggregate } from "@/aggregates/config/get-config-aggregate";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import StatusBadge from "@/components/vapp/shared/StatusBadge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QrCodeDisplay } from "@/components/vapp/permit/QrCodeDisplay";

// Date formatting helper
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

// Safe render helper
const safeRender = (value) => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object") {
    if (value.display_name) return String(value.display_name);
    if (value.name) return String(value.name);
    if (value.id) return String(value.id);
    return "-";
  }
  return String(value);
};

/**
 * RequestDetailsDrawer Component
 * Shows comprehensive request details in a dialog
 */
export function RequestDetailsDrawer({ open, onClose, requestId, eventId }) {
  const { client } = useTransport();
  const [request, setRequest] = useState(null);
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Config data for resolving IDs to names
  const configAggregate = useMemo(() => {
    if (!client || !eventId) return null;
    return getConfigAggregate(eventId, client);
  }, [client, eventId]);
  
  const [sectors, setSectors] = useState([]);
  const [functionalAreas, setFunctionalAreas] = useState([]);
  const [accessZones, setAccessZones] = useState([]);
  const [accessTypes, setAccessTypes] = useState([]);
  const [validities, setValidities] = useState([]);
  const [importances, setImportances] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);

  // Parse source_ref
  const sourceRef = useMemo(() => {
    if (!request?.source_ref) return {};
    const src = request.source_ref;
    if (typeof src === "object") return src;
    if (typeof src === "string") {
      try {
        const parsed = JSON.parse(src);
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch {
        return {};
      }
    }
    return {};
  }, [request?.source_ref]);

  // Create lookup maps for resolving IDs to names
  const sectorsMap = useMemo(() => {
    const map = new Map();
    sectors.forEach(s => map.set(s.id, s));
    return map;
  }, [sectors]);

  const functionalAreasMap = useMemo(() => {
    const map = new Map();
    functionalAreas.forEach(fa => map.set(fa.id, fa));
    return map;
  }, [functionalAreas]);

  const accessZonesMap = useMemo(() => {
    const map = new Map();
    accessZones.forEach(az => map.set(az.id, az));
    return map;
  }, [accessZones]);

  const accessTypesMap = useMemo(() => {
    const map = new Map();
    accessTypes.forEach(at => map.set(at.id, at));
    return map;
  }, [accessTypes]);

  const validitiesMap = useMemo(() => {
    const map = new Map();
    validities.forEach(v => map.set(v.id, v));
    return map;
  }, [validities]);

  const importancesMap = useMemo(() => {
    const map = new Map();
    importances.forEach(i => map.set(i.id, i));
    return map;
  }, [importances]);

  const vehicleTypesMap = useMemo(() => {
    const map = new Map();
    vehicleTypes.forEach(vt => map.set(vt.id, vt));
    return map;
  }, [vehicleTypes]);

  // Helper to resolve ID to name
  const resolveName = (id, map) => {
    if (!id) return "-";
    const entity = map.get(id);
    if (!entity) return id;
    return entity.display_name || entity.name || entity.code || id;
  };

  // Load config data
  useEffect(() => {
    if (!open || !configAggregate || !eventId) return;

    const loadConfig = async () => {
      try {
        const [
          sectorsList,
          functionalAreasList,
          accessZonesList,
          accessTypesList,
          validitiesList,
          importancesList,
          vehicleTypesList,
        ] = await Promise.all([
          configAggregate.sector.list(eventId).catch(() => []),
          configAggregate.functionalArea.list(eventId).catch(() => []),
          configAggregate.accessZone.list(eventId).catch(() => []),
          configAggregate.accessType.list(eventId).catch(() => []),
          configAggregate.validity.list(eventId).catch(() => []),
          configAggregate.importance.list().catch(() => []),
          configAggregate.vehicleType.list(eventId).catch(() => []),
        ]);

        setSectors(Array.isArray(sectorsList) ? sectorsList : []);
        setFunctionalAreas(Array.isArray(functionalAreasList) ? functionalAreasList : []);
        setAccessZones(Array.isArray(accessZonesList) ? accessZonesList : []);
        setAccessTypes(Array.isArray(accessTypesList) ? accessTypesList : []);
        setValidities(Array.isArray(validitiesList) ? validitiesList : []);
        setImportances(Array.isArray(importancesList) ? importancesList : []);
        setVehicleTypes(Array.isArray(vehicleTypesList) ? vehicleTypesList : []);
      } catch (err) {
        console.error("Failed to load config:", err);
      }
    };

    loadConfig();
  }, [open, configAggregate, eventId]);

  // Load request details and permits
  useEffect(() => {
    if (!open || !requestId || !eventId || !client) {
      setRequest(null);
      setPermits([]);
      setError(null);
      return;
    }

    const loadRequest = async (retryCount = 0) => {
      try {
        setLoading(true);
        setError(null);
        
        // Wait a bit if retrying to allow connection to stabilize
        if (retryCount > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }

        const call = (method, payload) => client.call(method, payload);
        
        // Load request and permits in parallel
        const [requestResult, permitsResult] = await Promise.all([
          vappAccessRequestApi.get(call, eventId, requestId).catch((err) => {
            // Check if it's a WebSocket connection error
            if (err?.target || (err?.message && err.message.includes("WebSocket"))) {
              return { 
                status: "rejected", 
                response: { 
                  message: "Connection error. Please check your network connection." 
                },
                error: err 
              };
            }
            throw err;
          }),
          vappPermitApi.list(call, {
            event_id: eventId,
            access_request_id: requestId,
            limit: 100,
          }).catch(() => ({ status: "fulfilled", response: { permits: [] } })),
        ]);

        // Handle request result
        if (requestResult?.status === "fulfilled" && requestResult?.response?.request) {
          setRequest(requestResult.response.request);
        } else {
          let errorMsg = "Failed to load request details";
          
          // Check for WebSocket connection errors
          if (requestResult?.error?.target || requestResult?.response?.message?.includes("Connection")) {
            errorMsg = "Connection error. Please check your network connection and try again.";
            
            // Retry up to 2 times
            if (retryCount < 2) {
              console.log(`Retrying loadRequest (attempt ${retryCount + 1})...`);
              return loadRequest(retryCount + 1);
            }
          } else {
            errorMsg = requestResult?.response?.message || errorMsg;
          }
          
          setError(errorMsg);
        }

        // Handle permits result
        if (permitsResult?.status === "fulfilled" && permitsResult?.response?.permits) {
          setPermits(Array.isArray(permitsResult.response.permits) ? permitsResult.response.permits : []);
        }
      } catch (err) {
        console.error("Failed to load request details:", err);
        
        // Check if it's a WebSocket connection error
        let errorMsg = "Failed to load request details";
        if (err?.target || (err?.message && err.message.includes("WebSocket"))) {
          errorMsg = "Connection error. Please check your network connection and try again.";
          
          // Retry up to 2 times
          if (retryCount < 2) {
            console.log(`Retrying loadRequest (attempt ${retryCount + 1})...`);
            return loadRequest(retryCount + 1);
          }
        } else {
          errorMsg = err?.message || errorMsg;
        }
        
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    loadRequest();
  }, [open, requestId, eventId, client]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Details</DialogTitle>
          <DialogDescription>
            {request?.id ? `Request ID: ${request.id.slice(0, 8)}...` : `Loading...`}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading request details...</span>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && request && (
          <div className="space-y-4">
            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Overview</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <StatusBadge status={request.status} />
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <div className="font-medium">{formatDateTime(request.created_at)}</div>
                </div>
                {request.submitted_at && (
                  <div>
                    <Label className="text-muted-foreground">Submitted</Label>
                    <div className="font-medium">{formatDateTime(request.submitted_at)}</div>
                  </div>
                )}
                {request.updated_at && (
                  <div>
                    <Label className="text-muted-foreground">Updated</Label>
                    <div className="font-medium">{formatDateTime(request.updated_at)}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Requester Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Requester Form</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <Label className="text-muted-foreground">Functional Area</Label>
                  <div className="font-medium">
                    {resolveName(sourceRef.functional_area_id, functionalAreasMap)}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Sector</Label>
                  <div className="font-medium">
                    {resolveName(sourceRef.sector_id, sectorsMap)}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">VLO Name</Label>
                  <div className="font-medium">{safeRender(sourceRef.vlo_name) || "-"}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">VLO Phone</Label>
                  <div className="font-medium">
                    {safeRender(sourceRef.vlo_contact_phone) || "-"}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">VLO Email</Label>
                  <div className="font-medium">{safeRender(sourceRef.vlo_email) || "-"}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Company</Label>
                  <div className="font-medium">{safeRender(sourceRef.company) || "-"}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Venue (Access Zone)</Label>
                  <div className="font-medium">
                    {resolveName(sourceRef.access_zone_id, accessZonesMap)}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Access / Parking Type</Label>
                  <div className="font-medium">
                    {resolveName(sourceRef.access_type_id, accessTypesMap)}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Validity</Label>
                  <div className="font-medium">
                    {resolveName(sourceRef.validity_id, validitiesMap)}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Importance</Label>
                  <div className="font-medium">
                    {resolveName(sourceRef.importance_id, importancesMap)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Vehicle</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <Label className="text-muted-foreground">Vehicle Type</Label>
                  <div className="font-medium">
                    {resolveName(sourceRef.vehicle_type_id, vehicleTypesMap)}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Plate Number</Label>
                  <div className="font-mono font-medium">
                    {safeRender(sourceRef.plate_number) || "-"}
                  </div>
                </div>
                {Array.isArray(sourceRef.vehicles) && sourceRef.vehicles.length > 0 ? (
                  sourceRef.vehicles.map((vehicle, idx) => (
                    <div key={idx} className="col-span-2 border-t pt-3 mt-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-muted-foreground">Vehicle Type</Label>
                          <div className="font-medium">
                            {resolveName(vehicle.vehicle_type_id, vehicleTypesMap)}
                          </div>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Plate Number</Label>
                          <div className="font-mono font-medium">
                            {safeRender(vehicle.plate_number) || "-"}
                          </div>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Driver Name</Label>
                          <div className="font-medium">
                            {safeRender(vehicle.driver_name) || "-"}
                          </div>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Driver Phone</Label>
                          <div className="font-medium">
                            {safeRender(vehicle.driver_phone) || "-"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div>
                      <Label className="text-muted-foreground">Driver Name</Label>
                      <div className="font-medium">
                        {safeRender(sourceRef.driver_name) || "-"}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Driver Phone</Label>
                      <div className="font-medium">
                        {safeRender(sourceRef.driver_phone) || "-"}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Justification */}
            {request.justification && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Justification</CardTitle>
                </CardHeader>
                <CardContent className="text-sm whitespace-pre-wrap">
                  {request.justification}
                </CardContent>
              </Card>
            )}

            {/* Permits */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Permits</CardTitle>
              </CardHeader>
              <CardContent>
                {permits.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4 text-center">
                    No permits generated for this request yet.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>QR Code</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {permits.map((permit) => (
                        <TableRow key={permit.id}>
                          <TableCell className="font-mono">
                            {permit.meta?.serial_number || "N/A"}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={permit.status} />
                          </TableCell>
                          <TableCell>
                            {permit.meta?.qr_payload ? (
                              <QrCodeDisplay payload={permit.meta.qr_payload} size={60} />
                            ) : (
                              <span className="text-xs text-muted-foreground">No QR</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
