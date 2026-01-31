"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useTransport } from "@/contexts/TransportContext";
import { RequestDetailsDrawer } from "@/components/vapp/shared/RequestDetailsDrawer";
import { vappAccessRequestApi, vappConfigApi, vappPermitApi } from "@/lib/services/vapp/vapp-api-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, Search, RefreshCw, CheckCircle, AlertCircle, Info, Loader2, FileDown, Send, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import StatusBadge from "@/components/vapp/shared/StatusBadge";
import { createVappTemplatePdf } from "@/lib/utils/simplePdf";
import { getConfigAggregate } from "@/aggregates/config/get-config-aggregate";

/**
 * PermitGenerate Component
 * Generate permits from approved access requests with serial number assignment
 */
export function PermitGenerate({ eventId }) {
  const { client } = useTransport();

  const [loading, setLoading] = useState(false);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Permits state
  const [permits, setPermits] = useState([]);
  const [permitsByRequest, setPermitsByRequest] = useState(new Map()); // requestId -> permit[]

  // Generate dialog state
  const [generateOpen, setGenerateOpen] = useState(false);
  const [selectedRequestIds, setSelectedRequestIds] = useState(new Set());
  const [permitTypes, setPermitTypes] = useState([]);
  const [generating, setGenerating] = useState(false);
  
  // Config aggregate for resolving permit types, sectors, functional areas for PDF
  const configAggregate = useMemo(() => {
    if (!client || !eventId) return null;
    return getConfigAggregate(eventId, client);
  }, [client, eventId]);
  
  const [sectors, setSectors] = useState([]);
  const [functionalAreas, setFunctionalAreas] = useState([]);
  
  // Single shared configuration for all selected requests
  const [sharedConfig, setSharedConfig] = useState({
    permitTypeId: "",
    subtypeCode: "",
    autoAssign: true,
    subtypes: [],
    serialSummary: null,
    serials: [], // List of available serial numbers
    selectedSerialId: "", // Selected serial ID for manual assignment
  });

  const resetGenerateForm = () => {
    setSharedConfig({
      permitTypeId: "",
      subtypeCode: "",
      autoAssign: true,
      subtypes: [],
      serialSummary: null,
      serials: [],
      selectedSerialId: "",
    });
  };

  // Load approved requests with retry logic
  const loadApprovedRequests = useCallback(async (retryCount = 0) => {
    if (!eventId || !client) return;

    try {
      setLoading(true);
      
      // Wait a bit if retrying to allow connection to stabilize
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
      
      const call = (method, payload) => client.call(method, payload);
      const result = await vappAccessRequestApi.list(call, {
        event_id: eventId,
        status: "approved",
        light: false, // Need source_ref for plate numbers
        limit: 100,
      });

      if (result?.status === "fulfilled" && result?.response) {
        setApprovedRequests(result.response.requests || []);
      } else {
        const errorMsg = result?.response?.message || result?.response || "Failed to load approved requests";
        toast.error(errorMsg);
        console.error("Failed to load approved requests:", result);
      }
    } catch (error) {
      // Handle WebSocket errors and regular errors
      let errorMsg = "Failed to load approved requests";
      let isConnectionError = false;
      
      if (error instanceof Error) {
        errorMsg = error.message;
        isConnectionError = error.message.includes('WebSocket') || error.message.includes('Connection') || error.message.includes('not connected');
      } else if (typeof error === 'string') {
        errorMsg = error;
      } else if (error?.message) {
        errorMsg = error.message;
        isConnectionError = error.message.includes('WebSocket') || error.message.includes('Connection');
      } else if (error?.response?.message) {
        errorMsg = error.response.message;
      } else if (error?.response) {
        errorMsg = String(error.response);
      } else if (error?.target) {
        // WebSocket event object
        errorMsg = "Connection error. Retrying...";
        isConnectionError = true;
      }
      
      console.error("Failed to load approved requests:", error);
      
      // Retry on connection errors (max 2 retries)
      if (isConnectionError && retryCount < 2) {
        console.log(`Retrying loadApprovedRequests (attempt ${retryCount + 1})...`);
        return loadApprovedRequests(retryCount + 1);
      }
      
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [eventId, client]);

  // Load permit types
  const loadPermitTypes = useCallback(async () => {
    if (!eventId || !client) return;
    try {
      const call = (method, payload) => client.call(method, payload);
      const res = await vappConfigApi.permitType.list(call, eventId);
      if (res?.status === "fulfilled") {
        const pts =
          res.response?.permitTypes ||
          res.response?.permit_types ||
          res.response?.permit_types_list ||
          res.response?.permitTypesList ||
          res.response ||
          [];
        const arr = Array.isArray(pts) ? pts : [];
        setPermitTypes(
          arr.filter((pt) => pt && pt.is_active !== false && pt.is_deleted !== true)
        );
      } else {
        console.warn("Failed to load permit types:", res);
      }
    } catch (error) {
      // Check if it's a WebSocket connection error
      const isConnectionError = error?.target || 
        (error?.message && (error.message.includes('WebSocket') || error.message.includes('Connection')));
      
      if (isConnectionError) {
        console.warn("Failed to load permit types (connection error)");
      } else {
        console.error("Failed to load permit types:", error);
      }
    }
  }, [eventId, client]);

  const loadSubtypes = useCallback(
    async (permitTypeId) => {
      if (!eventId || !client || !permitTypeId) return;
      try {
        const call = (method, payload) => client.call(method, payload);
        const res = await vappConfigApi.permitTypeSubtype.list(
          call,
          eventId,
          permitTypeId
        );
        if (res?.status === "fulfilled") {
          const arr = Array.isArray(res.response?.subtypes) ? res.response.subtypes : [];
          const filtered = arr.filter((s) => s && s.is_active !== false && s.is_deleted !== true);
          setSharedConfig(prev => ({ ...prev, subtypes: filtered, subtypeCode: "" }));
        } else {
          setSharedConfig(prev => ({ ...prev, subtypes: [], subtypeCode: "" }));
        }
      } catch (error) {
        console.error("Failed to load subtypes:", error);
        setSharedConfig(prev => ({ ...prev, subtypes: [], subtypeCode: "" }));
      }
    },
    [eventId, client]
  );

  const loadAvailableSerials = useCallback(
    async (permitTypeId, subtypeCode) => {
      if (!eventId || !client || !permitTypeId) return;
      try {
        const call = (method, payload) => client.call(method, payload);
        const res = await vappPermitApi.serialPoolListAvailable(
          call,
          eventId,
          permitTypeId,
          subtypeCode || null,
          { limit: 200 }
        );
        if (res?.status === "fulfilled") {
          const summary = res.response?.summary || null;
          const serials = Array.isArray(res.response?.serialNumbers) ? res.response.serialNumbers : [];
          setSharedConfig(prev => ({ 
            ...prev, 
            serialSummary: summary,
            serials: serials,
            selectedSerialId: prev.autoAssign ? "" : prev.selectedSerialId, // Clear selection if auto-assign
          }));
        } else {
          setSharedConfig(prev => ({ 
            ...prev, 
            serialSummary: null,
            serials: [],
            selectedSerialId: "",
          }));
        }
      } catch (error) {
        console.error("Failed to load available serials:", error);
        setSharedConfig(prev => ({ 
          ...prev, 
          serialSummary: null,
          serials: [],
          selectedSerialId: "",
        }));
      }
    },
    [eventId, client]
  );

  const openGenerate = useCallback(
    async (requestIds) => {
      const ids = Array.isArray(requestIds) ? requestIds : [requestIds];
      setSelectedRequestIds(new Set(ids));
      resetGenerateForm();
      
      setGenerateOpen(true);
      if (permitTypes.length === 0) {
        await loadPermitTypes();
      }
    },
    [permitTypes.length, loadPermitTypes]
  );

  // Generate permits
  const handleGenerate = useCallback(async () => {
    if (!eventId || !client) return;
    if (selectedRequestIds.size === 0) return;

    // Validate shared config
    if (!sharedConfig.permitTypeId) {
      toast.error("Permit type is required");
      return;
    }
    if (sharedConfig.subtypes.length > 0 && !sharedConfig.subtypeCode) {
      toast.error("Permit subtype is required");
      return;
    }
    // For single request, allow manual selection; for bulk, require auto-assign
    if (selectedRequestIds.size > 1 && !sharedConfig.autoAssign) {
      toast.error("Auto-assign must be enabled for bulk generation");
      return;
    }
    if (!sharedConfig.autoAssign && !sharedConfig.selectedSerialId) {
      toast.error("Please select a serial number or enable auto-assign");
      return;
    }

    try {
      setGenerating(true);
      const call = (method, payload) => client.call(method, payload);

      // Generate permits for each request using shared config with auto-assign
      const requestIds = Array.from(selectedRequestIds);
      const results = [];
      let succeeded = 0;
      let failed = 0;

      for (const requestId of requestIds) {
        try {
          const result = await vappPermitApi.generate(call, eventId, requestId, {
            permit_type_id: sharedConfig.permitTypeId,
            subtype_code: sharedConfig.subtypeCode || null,
            auto_assign: sharedConfig.autoAssign,
            serial_number_id: sharedConfig.autoAssign ? null : sharedConfig.selectedSerialId,
            generate_qr: false, // No QR generation
          });

          if (result?.status === "fulfilled" && result?.response) {
            results.push({ request_id: requestId, status: "success" });
            succeeded++;
          } else {
            // Extract error message from response
            let errorMsg = "Failed to generate permit";
            const response = result?.response;
            
            if (response?.error_code === 'DUPLICATE_PERMIT_TYPE_SUBTYPE') {
              errorMsg = "A permit with this permit type and subtype already exists for this request. Please select a different combination.";
            } else if (response?.error_code === 'SERIAL_POOL_EMPTY') {
              errorMsg = "No available serial numbers for the selected permit type/subtype.";
            } else if (response?.message) {
              errorMsg = response.message;
            } else if (typeof response === 'string') {
              errorMsg = response;
            }
            
            results.push({
              request_id: requestId,
              status: "error",
              error: errorMsg,
            });
            failed++;
          }
        } catch (error) {
          // Handle different error types
          let errorMsg = "Failed to generate permit";
          
          if (error?.response?.error_code === 'DUPLICATE_PERMIT_TYPE_SUBTYPE') {
            errorMsg = "A permit with this permit type and subtype already exists for this request. Please select a different combination.";
          } else if (error?.response?.error_code === 'SERIAL_POOL_EMPTY') {
            errorMsg = "No available serial numbers for the selected permit type/subtype.";
          } else if (error?.message) {
            errorMsg = error.message;
          } else if (error?.response?.message) {
            errorMsg = error.response.message;
          }
          
          results.push({
            request_id: requestId,
            status: "error",
            error: errorMsg,
          });
          failed++;
        }
      }

      // Show results
      if (succeeded > 0) {
        toast.success(
          `Generated ${succeeded} permit${succeeded !== 1 ? "s" : ""}${failed > 0 ? ` (${failed} failed)` : ""}`
        );
      }

      if (failed > 0) {
        const failures = results.filter((r) => r.status === "error");
        failures.forEach((f) => {
          toast.error(
            `Request ${f.request_id?.slice(0, 8)}... failed: ${f.error}`
          );
        });
      }

      setGenerateOpen(false);
      setSelectedRequestIds(new Set());
      resetGenerateForm();

      // Reload approved requests and permits
      await loadApprovedRequests();
      // loadPermits will be called automatically by useEffect when approvedRequests changes
    } catch (error) {
      console.error("Failed to generate permits:", error);
      toast.error(error.message || "Failed to generate permits");
    } finally {
      setGenerating(false);
    }
  }, [
    eventId,
    client,
    selectedRequestIds,
    sharedConfig,
    loadApprovedRequests,
  ]);

  useEffect(() => {
    if (client && eventId) {
      loadApprovedRequests();
      loadPermitTypes();
    }
  }, [client, eventId, loadApprovedRequests, loadPermitTypes]);

  // Load serials when permit type/subtype changes
  useEffect(() => {
    if (generateOpen && sharedConfig.permitTypeId) {
      loadAvailableSerials(sharedConfig.permitTypeId, sharedConfig.subtypeCode);
    }
  }, [generateOpen, sharedConfig.permitTypeId, sharedConfig.subtypeCode, loadAvailableSerials]);

  const filteredRequests = useMemo(() => {
    if (!searchQuery) return approvedRequests;
    const query = searchQuery.toLowerCase();
    return approvedRequests.filter(
      (request) =>
        request.id?.toLowerCase().includes(query) ||
        request.department?.code?.toLowerCase().includes(query) ||
        request.department?.name?.toLowerCase().includes(query)
    );
  }, [approvedRequests, searchQuery]);

  // Unified selection - only track requests, permits are derived from selected requests
  const [selectedRequests, setSelectedRequests] = useState(new Set());
  
  // Get all permits from selected requests
  const selectedPermits = useMemo(() => {
    const permitIds = new Set();
    selectedRequests.forEach(requestId => {
      const requestPermits = permitsByRequest.get(requestId) || [];
      requestPermits.forEach(permit => permitIds.add(permit.id));
    });
    return permitIds;
  }, [selectedRequests, permitsByRequest]);
  
  // Request details drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  
  // Terms management dialog
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [termsAction, setTermsAction] = useState(null); // 'send' or 'mark'
  const [markAcceptedForm, setMarkAcceptedForm] = useState({
    accepted_by_name: '',
    accepted_at: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm format
    notes: '',
  });
  const [processingTerms, setProcessingTerms] = useState(false);

  const handleSelectAll = useCallback(
    (checked) => {
      if (checked) {
        setSelectedRequests(new Set(filteredRequests.map((r) => r.id)));
      } else {
        setSelectedRequests(new Set());
      }
    },
    [filteredRequests]
  );

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

  const handleBulkGenerate = useCallback(() => {
    if (selectedRequests.size === 0) {
      toast.error("Select at least one request");
      return;
    }
    openGenerate(Array.from(selectedRequests));
  }, [selectedRequests, openGenerate]);

  // Permit selection is now derived from request selection - no separate handlers needed

  // Open terms management dialog
  const handleOpenTermsDialog = useCallback((action) => {
    if (selectedPermits.size === 0) {
      toast.error("Select at least one request with permits");
      return;
    }
    setTermsAction(action);
    setTermsDialogOpen(true);
  }, [selectedPermits]);

  // Load permits for approved requests
  const loadPermits = useCallback(async () => {
    if (!eventId || !client) return;

    try {
      const call = (method, payload) => client.call(method, payload);
      const requestIds = approvedRequests.map((r) => r.id);
      
      if (requestIds.length === 0) {
        setPermits([]);
        return;
      }

      // Load permits for all approved requests
      const permitPromises = requestIds.map(async (requestId) => {
        try {
          const result = await vappPermitApi.list(call, {
            event_id: eventId,
            access_request_id: requestId,
            limit: 100,
          });
          if (result?.status === 'fulfilled' && result?.response?.permits) {
            return result.response.permits;
          }
          return [];
        } catch (error) {
          console.error(`Failed to load permits for request ${requestId}:`, error);
          return [];
        }
      });

      const permitArrays = await Promise.all(permitPromises);
      const allPermits = permitArrays.flat();
      setPermits(allPermits);
      
      // Group permits by request ID
      const permitsMap = new Map();
      allPermits.forEach(permit => {
        const requestId = permit.request_id;
        if (!permitsMap.has(requestId)) {
          permitsMap.set(requestId, []);
        }
        permitsMap.get(requestId).push(permit);
      });
      setPermitsByRequest(permitsMap);
    } catch (error) {
      console.error('Failed to load permits:', error);
      toast.error('Failed to load permits');
    }
  }, [eventId, client, approvedRequests]);

  // Send terms handler (defined after loadPermits)
  const handleSendTerms = useCallback(async () => {
    if (!client || !eventId || selectedPermits.size === 0) {
      toast.error("Select at least one request with permits");
      return;
    }

    setProcessingTerms(true);
    try {
      const call = (method, payload) => client.call(method, payload);
      const result = await vappPermitApi.sendTerms(call, eventId, Array.from(selectedPermits));

      if (result?.status === 'fulfilled') {
        toast.success(`Terms sent to ${result.response.sent_count} permit${result.response.sent_count !== 1 ? 's' : ''}`);
        setSelectedRequests(new Set()); // Clear request selection
        setTermsDialogOpen(false);
        // Reload permits to update status
        await loadPermits();
      } else {
        toast.error(result?.response?.message || 'Failed to send terms');
      }
    } catch (err) {
      console.error('Failed to send terms:', err);
      toast.error(err?.message || 'Failed to send terms');
    } finally {
      setProcessingTerms(false);
    }
  }, [client, eventId, selectedPermits, loadPermits]);

  // Mark terms as accepted handler (defined after loadPermits)
  const handleMarkTermsAccepted = useCallback(async () => {
    if (!client || !eventId || selectedPermits.size === 0) {
      toast.error("Select at least one request with permits");
      return;
    }
    if (!markAcceptedForm.accepted_by_name.trim()) {
      toast.error("Accepted by name is required");
      return;
    }

    setProcessingTerms(true);
    try {
      const call = (method, payload) => client.call(method, payload);
      const result = await vappPermitApi.markTermsAccepted(call, eventId, Array.from(selectedPermits), {
        accepted_by_name: markAcceptedForm.accepted_by_name.trim(),
        accepted_at: markAcceptedForm.accepted_at ? new Date(markAcceptedForm.accepted_at).toISOString() : undefined,
        notes: markAcceptedForm.notes.trim() || undefined,
      });

      if (result?.status === 'fulfilled') {
        toast.success(`Terms marked as accepted for ${result.response.accepted_count} permit${result.response.accepted_count !== 1 ? 's' : ''}`);
        setSelectedRequests(new Set()); // Clear request selection
        setTermsDialogOpen(false);
        setMarkAcceptedForm({
          accepted_by_name: '',
          accepted_at: new Date().toISOString().slice(0, 16),
          notes: '',
        });
        // Reload permits to update status
        await loadPermits();
      } else {
        toast.error(result?.response?.message || 'Failed to mark terms as accepted');
      }
    } catch (err) {
      console.error('Failed to mark terms as accepted:', err);
      toast.error(err?.message || 'Failed to mark terms as accepted');
    } finally {
      setProcessingTerms(false);
    }
  }, [client, eventId, selectedPermits, markAcceptedForm, loadPermits]);

  // Load permits when approved requests change
  useEffect(() => {
    if (approvedRequests.length > 0 && client && eventId) {
      loadPermits();
    } else {
      setPermits([]);
    }
  }, [approvedRequests.length]); // Only depend on length to avoid infinite loops

  // Load config for PDF generation
  useEffect(() => {
    if (!configAggregate || !eventId) return;

    const loadConfig = async () => {
      try {
        const [sectorsList, functionalAreasList] = await Promise.all([
          configAggregate.sector.list(eventId).catch(() => []),
          configAggregate.functionalArea.list(eventId).catch(() => []),
        ]);
        setSectors(Array.isArray(sectorsList) ? sectorsList : []);
        setFunctionalAreas(Array.isArray(functionalAreasList) ? functionalAreasList : []);
      } catch (err) {
        console.error("Failed to load config for PDF:", err);
      }
    };

    loadConfig();
  }, [configAggregate, eventId]);

  // Generate PDF for all permits of a request
  const handleGeneratePdf = useCallback(async (request) => {
    if (!request) {
      toast.error("Request data missing");
      return;
    }

    const requestPermits = permitsByRequest.get(request.id) || [];
    if (requestPermits.length === 0) {
      toast.error("No permits found for this request");
      return;
    }

    try {
      const sourceRef = request.source_ref || {};
      
      // Parse source_ref if it's a string
      let parsedSourceRef = sourceRef;
      if (typeof sourceRef === "string") {
        try {
          parsedSourceRef = JSON.parse(sourceRef);
        } catch {
          parsedSourceRef = {};
        }
      }

      // Get sector and functional area names
      const sectorId = parsedSourceRef.sector_id;
      const functionalAreaId = parsedSourceRef.functional_area_id;
      const sector = sectors.find(s => s.id === sectorId);
      const functionalArea = functionalAreas.find(fa => fa.id === functionalAreaId);

      // Get vehicle info
      const vehicles = Array.isArray(parsedSourceRef.vehicles) ? parsedSourceRef.vehicles : [];
      const primaryVehicle = vehicles[0] || {
        plate_number: parsedSourceRef.plate_number || "",
        driver_name: parsedSourceRef.driver_name || "",
        company: parsedSourceRef.company || "",
      };

      // Build rows for all permits
      const rows = requestPermits.map((permit) => {
        // Parse meta if it's a string
        let meta = permit.meta || {};
        if (typeof meta === "string") {
          try {
            meta = JSON.parse(meta);
          } catch {
            meta = {};
          }
        }

        // Find permit type
        const permitType = permitTypes.find(pt => pt.id === permit.permit_type_id);
        let vappType = permitType?.display_name || permitType?.name || permitType?.code || "";
        
        // Include subtype if available
        if (meta?.subtype_code) {
          const subtypeCode = String(meta.subtype_code).trim();
          if (subtypeCode) {
            // Format: "P1 (M1)" or "P1-M1"
            vappType = vappType ? `${vappType} (${subtypeCode})` : subtypeCode;
          }
        }

        // Extract serial number - ensure it's a clean string
        let serial = "";
        if (meta?.serial_number) {
          serial = String(meta.serial_number).trim();
        } else if (permit.id) {
          serial = permit.id.slice(0, 8);
        }

        // For multi-vehicle requests, try to match vehicle to permit if possible
        // Otherwise use primary vehicle
        let vehicle = primaryVehicle;
        if (vehicles.length > 1 && meta.vehicle_index !== undefined) {
          const vehicleIndex = parseInt(meta.vehicle_index, 10);
          if (!isNaN(vehicleIndex) && vehicles[vehicleIndex]) {
            vehicle = vehicles[vehicleIndex];
          }
        }

        return {
          vappType,
          serial: serial,
          driver: vehicle.driver_name || "",
          plate: vehicle.plate_number || "",
          company: vehicle.company || parsedSourceRef.company || "",
        };
      });

      const now = new Date();
      const pdfStr = createVappTemplatePdf({
        dateTime: now.toLocaleString(),
        sector: sector?.display_name || sector?.name || sector?.code || "",
        functionalArea: functionalArea?.display_name || functionalArea?.name || functionalArea?.code || "",
        rows,
      });

      // Convert latin1 string -> Uint8Array
      const bytes = new Uint8Array(pdfStr.length);
      for (let i = 0; i < pdfStr.length; i++) bytes[i] = pdfStr.charCodeAt(i) & 0xff;

      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      
      // Download PDF file
      const a = document.createElement("a");
      a.href = url;
      const serialNumbersForFilename = requestPermits.map(p => p.meta?.serial_number || p.id?.slice(0, 8)).filter(Boolean).join('_');
      a.download = `VAPP_${serialNumbersForFilename || request.id?.slice(0, 8)}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      // Clean up after a delay
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      
      toast.success(`PDF downloaded with ${requestPermits.length} permit${requestPermits.length !== 1 ? "s" : ""}`);
    } catch (e) {
      console.error("Failed to generate PDF:", e);
      toast.error(e?.message || "Failed to generate PDF");
    }
  }, [permitTypes, sectors, functionalAreas, permitsByRequest]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Generate Permits</h1>
          <p className="text-sm text-gray-600 mt-1">
            Generate permits from approved access requests with serial number assignment
          </p>
        </div>
        <Button
          onClick={loadApprovedRequests}
          disabled={loading || !client}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Permit Generation</AlertTitle>
        <AlertDescription>
          Select approved requests, choose permit type/subtype, and assign serial numbers from the pool. QR codes can be generated later before printing.
        </AlertDescription>
      </Alert>

      {/* Unified Requests & Permits List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Approved Requests & Permits
          </CardTitle>
          <CardDescription>
            Select requests to generate permits with serial numbers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search requests by ID or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {selectedRequests.size > 0 && (
                <div className="flex items-center gap-2">
                  <Button onClick={handleBulkGenerate} size="sm">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Generate {selectedRequests.size} Permit{selectedRequests.size !== 1 ? "s" : ""}
                  </Button>
                  {selectedPermits.size > 0 && (
                    <Button onClick={() => handleOpenTermsDialog(null)} size="sm" variant="outline">
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Manage Terms ({selectedPermits.size})
                    </Button>
                  )}
                </div>
              )}
            </div>

            {loading && approvedRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading approved requests...
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? "No requests match your search"
                    : "No approved requests found. Approve requests first to generate permits."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox
                          checked={
                            selectedRequests.size === filteredRequests.length &&
                            filteredRequests.length > 0
                          }
                          onCheckedChange={handleSelectAll}
                          disabled={loading || filteredRequests.length === 0}
                          aria-label="Select all requests"
                        />
                      </TableHead>
                      <TableHead>Request ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Plate Number</TableHead>
                      <TableHead>Serial Numbers</TableHead>
                      <TableHead className="text-right">PDF</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => {
                      const isSelected = selectedRequests.has(request.id);
                      const requestPermits = permitsByRequest.get(request.id) || [];
                      const permitsWithoutQr = requestPermits.filter(
                        p => !(p.meta?.qr_token && p.meta?.qr_payload)
                      );
                      const hasPermits = requestPermits.length > 0;
                      const hasAllQr = hasPermits && requestPermits.every(
                        p => p.meta?.qr_token && p.meta?.qr_payload
                      );
                      
                      return (
                        <TableRow 
                          key={request.id}
                          className={isSelected ? "bg-muted/50" : ""}
                        >
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) =>
                                handleSelectRequest(request.id, checked)
                              }
                              aria-label={`Select request ${request.id?.substring(0, 8)}`}
                            />
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => {
                                setSelectedRequestId(request.id);
                                setDrawerOpen(true);
                              }}
                              className="font-mono text-sm text-primary hover:underline cursor-pointer"
                            >
                              {request.id?.slice(0, 8)}...
                            </button>
                          </TableCell>
                          <TableCell>
                            {hasPermits ? (
                              // Show terms status from permits (use the most restrictive status)
                              (() => {
                                const permitStatuses = requestPermits.map(p => {
                                  const stage = p.meta?.lifecycle?.stage || 'pending_terms_acceptance';
                                  return stage;
                                });
                                // If any permit is pending, show pending; otherwise show accepted
                                const hasPending = permitStatuses.some(s => s === 'pending_terms_acceptance');
                                const hasAccepted = permitStatuses.some(s => s === 'terms_accepted');
                                
                                if (hasPending) {
                                  return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-300">Pending Terms</span>;
                                } else if (hasAccepted) {
                                  return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 border border-green-300">Terms Accepted</span>;
                                } else {
                                  return <StatusBadge status={request.status} />;
                                }
                              })()
                            ) : (
                              <StatusBadge status={request.status} />
                            )}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              // Try to get vehicle number from source_ref
                              const sourceRef = request.source_ref;
                              if (sourceRef) {
                                // Check for vehicles array (v2 format)
                                if (Array.isArray(sourceRef.vehicles) && sourceRef.vehicles.length > 0) {
                                  const plateNumbers = sourceRef.vehicles
                                    .map(v => v?.plate_number)
                                    .filter(Boolean)
                                    .join(', ');
                                  return plateNumbers || <span className="text-muted-foreground">N/A</span>;
                                }
                                // Check for backward-compatible plate_number
                                if (sourceRef.plate_number) {
                                  return <span className="font-mono text-sm">{sourceRef.plate_number}</span>;
                                }
                              }
                              return <span className="text-muted-foreground">N/A</span>;
                            })()}
                          </TableCell>
                          <TableCell>
                            {hasPermits ? (
                              <div className="space-y-1">
                                {requestPermits.map((permit) => (
                                  <div key={permit.id} className="text-xs font-mono">
                                    {permit.meta?.serial_number || 'N/A'}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {hasPermits ? (
                              <Button
                                onClick={() => handleGeneratePdf(request)}
                                disabled={loading || !client}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                title={`Generate PDF for ${requestPermits.length} permit${requestPermits.length !== 1 ? "s" : ""}`}
                              >
                                <FileDown className="h-4 w-4" />
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Generate Dialog */}
      <Dialog
        open={generateOpen}
        onOpenChange={(o) => {
          setGenerateOpen(o);
          if (!o) {
            setSelectedRequestIds(new Set());
            resetGenerateForm();
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Generate Permit{selectedRequestIds.size > 1 ? "s" : ""}
            </DialogTitle>
            <DialogDescription>
              {selectedRequestIds.size > 1
                ? `Configure permit type and subtype for ${selectedRequestIds.size} requests. Each request will be assigned the next available serial number automatically.`
                : "Select permit type/subtype. The next available serial number will be assigned automatically."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Selected Requests List */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Selected Requests ({selectedRequestIds.size})
              </Label>
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedRequestIds).map((requestId) => (
                  <span
                    key={requestId}
                    className="px-2 py-1 bg-muted rounded text-xs font-mono"
                  >
                    {requestId?.slice(0, 8)}...
                  </span>
                ))}
              </div>
            </div>

            {/* Single Configuration Form */}
            <div className="space-y-4">
              {/* Permit Type */}
              <div className="space-y-2">
                <Label htmlFor="permit-type">Permit Type *</Label>
                <Select
                  value={sharedConfig.permitTypeId || ""}
                  onValueChange={async (v) => {
                    if (!v) return;
                    setSharedConfig(prev => ({
                      ...prev,
                      permitTypeId: v,
                      subtypeCode: "",
                    }));
                    await loadSubtypes(v);
                  }}
                >
                  <SelectTrigger id="permit-type" className="w-full">
                    <SelectValue placeholder="Select permit type" />
                  </SelectTrigger>
                  <SelectContent>
                    {permitTypes.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">No permit types available</div>
                    ) : (
                      permitTypes.map((pt) => (
                        <SelectItem key={pt.id} value={pt.id}>
                          {pt.display_name || pt.name || pt.code || pt.id}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Subtype */}
              {sharedConfig.permitTypeId && (
                <div className="space-y-2">
                  <Label htmlFor="subtype">Subtype (Optional)</Label>
                  {sharedConfig.subtypes.length > 0 ? (
                    <>
                      <Select
                        value={sharedConfig.subtypeCode || undefined}
                        onValueChange={async (v) => {
                          setSharedConfig(prev => ({
                            ...prev,
                            subtypeCode: v || "",
                          }));
                          await loadAvailableSerials(sharedConfig.permitTypeId, v || null);
                        }}
                      >
                        <SelectTrigger id="subtype" className="w-full">
                          <SelectValue placeholder="Select subtype (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {sharedConfig.subtypes.map((s) => (
                            <SelectItem key={s.id} value={s.code}>
                              {s.display_name || s.name || s.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {/* List of all available subtypes */}
                      <div className="mt-2 p-3 bg-muted rounded-md">
                        <div className="text-xs font-medium mb-2 text-muted-foreground">
                          All Available Subtypes ({sharedConfig.subtypes.length}):
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {sharedConfig.subtypes.map((s) => (
                            <div
                              key={s.id}
                              className={`px-2 py-1 rounded text-xs border ${
                                sharedConfig.subtypeCode === s.code
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background border-border"
                              }`}
                            >
                              {s.display_name || s.name || s.code}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                      No subtypes available for this permit type
                    </div>
                  )}
                </div>
              )}

              {/* Serial Assignment */}
              <div className="space-y-2">
                <Label>Serial Assignment</Label>
                {selectedRequestIds.size === 1 ? (
                  // Single request: allow manual selection
                  <>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                      <Checkbox
                        checked={sharedConfig.autoAssign}
                        onCheckedChange={(checked) => {
                          setSharedConfig(prev => ({
                            ...prev,
                            autoAssign: !!checked,
                            selectedSerialId: !!checked ? "" : prev.selectedSerialId,
                          }));
                        }}
                      />
                      <Label className="text-sm">Auto-assign next available serial number</Label>
                    </div>
                    {!sharedConfig.autoAssign && sharedConfig.permitTypeId && (
                      <div className="space-y-2">
                        <Label htmlFor="serial-select">Select Serial Number *</Label>
                        <Select
                          value={sharedConfig.selectedSerialId || ""}
                          onValueChange={(v) => {
                            setSharedConfig(prev => ({
                              ...prev,
                              selectedSerialId: v,
                            }));
                          }}
                          disabled={!sharedConfig.permitTypeId || (sharedConfig.subtypes.length > 0 && !sharedConfig.subtypeCode)}
                        >
                          <SelectTrigger id="serial-select" className="w-full">
                            <SelectValue placeholder="Select serial number" />
                          </SelectTrigger>
                          <SelectContent>
                            {sharedConfig.serials.length === 0 ? (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                No serial numbers available
                              </div>
                            ) : (
                              sharedConfig.serials.map((sn) => (
                                <SelectItem key={sn.id} value={sn.id}>
                                  {sn.serial_number}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                ) : (
                  // Multiple requests: auto-assign only
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                    <Checkbox checked={true} disabled />
                    <Label className="text-sm">Auto-assign next available serial number</Label>
                  </div>
                )}
                {sharedConfig.serialSummary && (
                  <div className="text-sm text-muted-foreground">
                    {sharedConfig.serialSummary.available > 0 ? (
                      <span className="text-green-600">
                        {sharedConfig.serialSummary.available} serial number{sharedConfig.serialSummary.available !== 1 ? "s" : ""} available
                      </span>
                    ) : (
                      <span className="text-orange-600">
                        No serial numbers available for this permit type/subtype
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGenerateOpen(false)}
              disabled={generating}
            >
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={generating || !client}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Details Drawer */}
      <RequestDetailsDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedRequestId(null);
        }}
        requestId={selectedRequestId}
        eventId={eventId}
      />

      {/* Terms Management Dialog */}
      <Dialog
        open={termsDialogOpen}
        onOpenChange={(open) => {
          setTermsDialogOpen(open);
          if (!open) {
            setTermsAction(null);
            setMarkAcceptedForm({
              accepted_by_name: '',
              accepted_at: new Date().toISOString().slice(0, 16),
              notes: '',
            });
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Terms ({selectedPermits.size} permit{selectedPermits.size !== 1 ? 's' : ''})</DialogTitle>
            <DialogDescription>
              Choose an action for the selected permits
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {!termsAction ? (
              // Action selection
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => setTermsAction('send')}
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2"
                >
                  <Send className="h-6 w-6" />
                  <span className="font-semibold">Send to Approve</span>
                  <span className="text-xs text-muted-foreground">Mark as sent to requester</span>
                </Button>
                <Button
                  onClick={() => setTermsAction('mark')}
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2"
                >
                  <CheckSquare className="h-6 w-6" />
                  <span className="font-semibold">Mark as Approved</span>
                  <span className="text-xs text-muted-foreground">For in-person signing</span>
                </Button>
              </div>
            ) : termsAction === 'send' ? (
              // Send to approve form
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Send Terms</AlertTitle>
                  <AlertDescription>
                    This will mark the selected permits as sent to the requester for terms acceptance.
                    The lifecycle status will remain as "Pending Terms Acceptance".
                  </AlertDescription>
                </Alert>
                <div className="text-sm text-muted-foreground">
                  Selected permits: {selectedPermits.size}
                </div>
              </div>
            ) : (
              // Mark as approved form
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Mark as Approved</AlertTitle>
                  <AlertDescription>
                    Use this when the requester has signed the terms document in person.
                    This will update the lifecycle status to "Terms Accepted".
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="accepted-by-name">Accepted By Name *</Label>
                    <Input
                      id="accepted-by-name"
                      value={markAcceptedForm.accepted_by_name}
                      onChange={(e) => setMarkAcceptedForm(prev => ({ ...prev, accepted_by_name: e.target.value }))}
                      placeholder="Enter name of person who signed"
                      disabled={processingTerms}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accepted-at">Accepted At *</Label>
                    <Input
                      id="accepted-at"
                      type="datetime-local"
                      value={markAcceptedForm.accepted_at}
                      onChange={(e) => setMarkAcceptedForm(prev => ({ ...prev, accepted_at: e.target.value }))}
                      disabled={processingTerms}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={markAcceptedForm.notes}
                      onChange={(e) => setMarkAcceptedForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Optional notes about the acceptance"
                      rows={3}
                      disabled={processingTerms}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {termsAction && (
              <Button
                variant="outline"
                onClick={() => setTermsAction(null)}
                disabled={processingTerms}
              >
                Back
              </Button>
            )}
            {termsAction === 'send' && (
              <Button
                onClick={handleSendTerms}
                disabled={processingTerms}
              >
                {processingTerms ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Terms
                  </>
                )}
              </Button>
            )}
            {termsAction === 'mark' && (
              <Button
                onClick={handleMarkTermsAccepted}
                disabled={processingTerms || !markAcceptedForm.accepted_by_name.trim()}
              >
                {processingTerms ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Mark as Approved
                  </>
                )}
              </Button>
            )}
            {!termsAction && (
              <Button
                variant="outline"
                onClick={() => setTermsDialogOpen(false)}
              >
                Cancel
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
