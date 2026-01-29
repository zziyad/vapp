"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTransport } from "@/contexts/TransportContext";
import { vappPermitApi } from "@/lib/services/vapp/vapp-api-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QrCode, RefreshCw, Download, Printer, CheckCircle2, FileDown, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getPermitQrPayload } from "@/lib/utils/qrCode";
import { QrCodeDisplay } from "@/components/vapp/permit/QrCodeDisplay";
import { QrAssignmentBar } from "./QrAssignmentBar";

// qrcode.react for QR download
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';

/**
 * QR Assignment Component
 * Assign QR codes to permits and manage printing
 */
export function QrAssignment({ eventId }) {
  const { client } = useTransport();

  const [loading, setLoading] = useState(false);
  const [permits, setPermits] = useState([]);
  const [selectedPermitIds, setSelectedPermitIds] = useState(new Set());
  const [assigningQr, setAssigningQr] = useState(false);
  const [bulkMarking, setBulkMarking] = useState(false);

  // QR download settings
  const [qrFormat, setQrFormat] = useState('png'); // png | svg
  const [qrSizePx, setQrSizePx] = useState(512);
  const [qrLevel, setQrLevel] = useState('M'); // L | M | Q | H
  const [downloadJob, setDownloadJob] = useState(null);
  const downloadHostRef = useRef(null);

  const resolvedQrSizePx = useMemo(() => {
    const n = Number(qrSizePx);
    if (!Number.isFinite(n)) return 512;
    return Math.max(64, Math.min(4096, Math.floor(n)));
  }, [qrSizePx]);

  // Load permits (with serial numbers but without QR codes, or all permits for printing)
  const loadPermits = useCallback(async () => {
    if (!eventId || !client) return;

    setLoading(true);
    try {
      const call = (method, payload) => client.call(method, payload);
      const result = await vappPermitApi.list(call, {
        event_id: eventId,
        limit: 500,
      });

      if (result?.status === 'fulfilled' && result?.response?.permits) {
        setPermits(result.response.permits);
      } else {
        setPermits([]);
        toast.error('Failed to load permits');
      }
    } catch (error) {
      console.error('Failed to load permits:', error);
      toast.error('Failed to load permits');
      setPermits([]);
    } finally {
      setLoading(false);
    }
  }, [eventId, client]);

  useEffect(() => {
    loadPermits();
  }, [loadPermits]);

  // Filter permits: those without QR codes for assignment, all for printing
  const permitsWithoutQr = useMemo(() => {
    return permits.filter(p => !(p.meta?.qr_token && p.meta?.qr_payload));
  }, [permits]);

  const permitsWithQr = useMemo(() => {
    return permits.filter(p => p.meta?.qr_token && p.meta?.qr_payload);
  }, [permits]);

  // Assign QR codes to selected permits
  const handleAssignQr = useCallback(async () => {
    if (!eventId || !client) return;
    if (selectedPermitIds.size === 0) {
      toast.error("Select at least one permit");
      return;
    }

    try {
      setAssigningQr(true);
      const call = (method, payload) => client.call(method, payload);
      const result = await vappPermitApi.assignQr(call, eventId, Array.from(selectedPermitIds));

      if (result?.status === "fulfilled" && result?.response) {
        const { assigned, skipped } = result.response;
        if (assigned > 0) {
          toast.success(`QR codes assigned to ${assigned} permit${assigned !== 1 ? "s" : ""}${skipped > 0 ? ` (${skipped} already had QR codes)` : ""}`);
        } else {
          toast.info(`All selected permits already have QR codes`);
        }
        
        setSelectedPermitIds(new Set());
        await loadPermits();
      } else {
        const errorMsg = result?.response?.message || "Failed to assign QR codes";
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("Failed to assign QR codes:", error);
      const errorMsg = error?.message || error?.response?.message || "Failed to assign QR codes";
      toast.error(errorMsg);
    } finally {
      setAssigningQr(false);
    }
  }, [eventId, client, selectedPermitIds, loadPermits]);

  // Mark single permit as printed
  const handleMarkPrinted = useCallback(async (permitId) => {
    if (!eventId || !client) return;

    try {
      const call = (method, payload) => client.call(method, payload);
      // Note: This API may need to be implemented in the backend
      const result = await call('vapp.permit.markPrinted', {
        event_id: eventId,
        permit_id: permitId,
      });

      if (result?.status === 'fulfilled') {
        toast.success('Permit marked as printed');
        setSelectedPermitIds((prev) => {
          const next = new Set(prev);
          next.delete(permitId);
          return next;
        });
        await loadPermits();
      } else {
        toast.error(result?.response?.message || 'Failed to mark as printed');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to mark as printed');
    }
  }, [eventId, client, loadPermits]);

  // Bulk mark as printed
  const handleBulkMarkPrinted = useCallback(async () => {
    if (!eventId || !client || selectedPermitIds.size === 0) return;

    setBulkMarking(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const call = (method, payload) => client.call(method, payload);
      // Note: This API may need to be implemented in the backend
      for (const permitId of selectedPermitIds) {
        try {
          const result = await call('vapp.permit.markPrinted', {
            event_id: eventId,
            permit_id: permitId,
          });

          if (result?.status === 'fulfilled') {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (err) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Marked ${successCount} permit(s) as printed`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to mark ${errorCount} permit(s)`);
      }

      setSelectedPermitIds(new Set());
      await loadPermits();
    } catch (error) {
      toast.error('Failed to process bulk action');
    } finally {
      setBulkMarking(false);
    }
  }, [eventId, client, selectedPermitIds, loadPermits]);

  // Download QR code
  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const downloadDataUrl = (dataUrl, filename) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleDownloadQr = (permit) => {
    const payload = getPermitQrPayload(permit);
    if (!payload) {
      toast.error('No QR payload on this permit');
      return;
    }
    const serial = permit?.meta?.serial_number || permit?.id?.slice(0, 8) || 'permit';
    setDownloadJob({
      payload,
      format: qrFormat,
      size: resolvedQrSizePx,
      level: qrLevel,
      filenameBase: `VAPP_${serial}`,
    });
  };

  // Execute download once the QR is rendered offscreen
  useEffect(() => {
    if (!downloadJob) return;
    const host = downloadHostRef.current;
    if (!host) return;

    const raf = requestAnimationFrame(() => {
      try {
        if (downloadJob.format === 'svg') {
          const svg = host.querySelector('svg');
          if (!svg) throw new Error('SVG not rendered');
          const xml = new XMLSerializer().serializeToString(svg);
          const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
          downloadBlob(blob, `${downloadJob.filenameBase}_${downloadJob.size}px.svg`);
        } else {
          const canvas = host.querySelector('canvas');
          if (!canvas) throw new Error('Canvas not rendered');
          const dataUrl = canvas.toDataURL('image/png');
          downloadDataUrl(dataUrl, `${downloadJob.filenameBase}_${downloadJob.size}px.png`);
        }
      } catch (e) {
        toast.error(e?.message || 'Failed to download QR');
      } finally {
        setDownloadJob(null);
      }
    });

    return () => cancelAnimationFrame(raf);
  }, [downloadJob]);

  const selectedIdsCsv = useMemo(() => {
    if (!selectedPermitIds || selectedPermitIds.size === 0) return '';
    return Array.from(selectedPermitIds).join(',');
  }, [selectedPermitIds]);

  // Selection handlers
  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      setSelectedPermitIds(new Set(permitsWithoutQr.map((p) => p.id)));
    } else {
      setSelectedPermitIds(new Set());
    }
  }, [permitsWithoutQr]);

  const handleSelectPermit = useCallback((permitId, checked) => {
    setSelectedPermitIds((prev) => {
      const newSelected = new Set(prev);
      if (checked) {
        newSelected.add(permitId);
      } else {
        newSelected.delete(permitId);
      }
      return newSelected;
    });
  }, []);

  const allSelected = useMemo(() => {
    return permitsWithoutQr.length > 0 && permitsWithoutQr.every((p) => selectedPermitIds.has(p.id));
  }, [permitsWithoutQr, selectedPermitIds]);

  return (
    <div className="space-y-6">
      {/* Offscreen QR render target for downloads */}
      <div
        ref={downloadHostRef}
        style={{
          position: 'absolute',
          left: -10000,
          top: -10000,
          width: 0,
          height: 0,
          overflow: 'hidden',
        }}
        aria-hidden="true"
      >
        {downloadJob ? (
          downloadJob.format === 'svg' ? (
            <QRCodeSVG
              value={downloadJob.payload}
              size={downloadJob.size}
              level={downloadJob.level}
              includeMargin={true}
            />
          ) : (
            <QRCodeCanvas
              value={downloadJob.payload}
              size={downloadJob.size}
              level={downloadJob.level}
              includeMargin={true}
            />
          )
        ) : null}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QR Assignment & Print</h1>
          <p className="text-sm text-gray-600 mt-1">
            Assign QR codes to permits and manage printing
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to={`/events/${eventId}/vapp/ops/permits/generate`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Generate
          </Link>
        </Button>
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>Permits</CardTitle>
          <CardDescription>
            {permits.length} total permit(s) - {permitsWithoutQr.length} need QR codes, {permitsWithQr.length} ready for printing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button
                onClick={loadPermits}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {selectedPermitIds.size > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selectedPermitIds.size} selected
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">QR</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={64}
                    max={4096}
                    value={qrSizePx}
                    onChange={(e) => setQrSizePx(e.target.value)}
                    className="w-24 h-9"
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
                <Select value={qrFormat} onValueChange={setQrFormat}>
                  <SelectTrigger className="w-24 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="svg">SVG</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={qrLevel} onValueChange={setQrLevel}>
                  <SelectTrigger className="w-20 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="M">M</SelectItem>
                    <SelectItem value="Q">Q</SelectItem>
                    <SelectItem value="H">H</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedPermitIds.size > 0 && permitsWithQr.some(p => selectedPermitIds.has(p.id)) && (
                <Button
                  onClick={() => {
                    // TODO: Implement print sheet page or use window.print() with selected permits
                    toast.info('Print sheet functionality coming soon');
                  }}
                  size="sm"
                  variant="outline"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Print / Save PDF
                </Button>
              )}
              {selectedPermitIds.size > 0 && permitsWithQr.some(p => selectedPermitIds.has(p.id)) && (
                <Button
                  onClick={handleBulkMarkPrinted}
                  disabled={bulkMarking || !client}
                  size="sm"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark {selectedPermitIds.size} as Printed
                </Button>
              )}
            </div>
          </div>

          {loading && permits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading permits...
            </div>
          ) : permits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No permits found. Generate permits first.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={handleSelectAll}
                        disabled={permitsWithoutQr.length === 0}
                        aria-label="Select all permits without QR"
                      />
                    </TableHead>
                    <TableHead>Serial</TableHead>
                    <TableHead>Request ID</TableHead>
                    <TableHead>QR Code</TableHead>
                    <TableHead>Generated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permits.map((permit) => {
                    const hasQr = !!(permit.meta?.qr_token && permit.meta?.qr_payload);
                    const qrPayload = hasQr ? getPermitQrPayload(permit) : null;
                    const isSelected = selectedPermitIds.has(permit.id);
                    const canSelect = !hasQr; // Only select permits without QR for assignment

                    return (
                      <TableRow 
                        key={permit.id}
                        className={isSelected ? "bg-muted/50" : ""}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectPermit(permit.id, checked)}
                            disabled={!canSelect}
                            aria-label={`Select permit ${permit.id?.substring(0, 8)}`}
                          />
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {permit.meta?.serial_number || permit.id?.slice(0, 8)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {permit.request_id ? (
                            <Link
                              to={`/events/${eventId}/vapp/ops/review/${permit.request_id}`}
                              className="text-primary hover:underline text-sm font-mono"
                            >
                              {permit.request_id.slice(0, 8)}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {qrPayload ? (
                            <div className="flex items-center justify-center">
                              <QrCodeDisplay payload={qrPayload} size={80} />
                            </div>
                          ) : (
                            <span className="text-xs text-orange-600">No QR</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {permit.meta?.lifecycle?.generated_at ? (
                            <span className="text-sm">
                              {new Date(permit.meta.lifecycle.generated_at).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {hasQr && (
                              <>
                                <Button
                                  onClick={() => handleDownloadQr(permit)}
                                  disabled={!client}
                                  size="sm"
                                  variant="outline"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download QR
                                </Button>
                                <Button
                                  onClick={() => handleMarkPrinted(permit.id)}
                                  disabled={!client}
                                  size="sm"
                                  variant="outline"
                                >
                                  <Printer className="h-4 w-4 mr-2" />
                                  Mark Printed
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Assignment Bar */}
      {selectedPermitIds.size > 0 && permitsWithoutQr.some(p => selectedPermitIds.has(p.id)) && (
        <QrAssignmentBar
          selectedCount={selectedPermitIds.size}
          onAssign={handleAssignQr}
          onClear={() => setSelectedPermitIds(new Set())}
          loading={assigningQr}
        />
      )}

      {/* Add bottom padding when QR assignment bar is visible */}
      {selectedPermitIds.size > 0 && permitsWithoutQr.some(p => selectedPermitIds.has(p.id)) && <div className="h-24" />}
    </div>
  );
}
