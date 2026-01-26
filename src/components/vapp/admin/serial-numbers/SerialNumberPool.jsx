import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTransport } from '@/contexts/TransportContext'
import { getConfigAggregate } from '@/aggregates/config/get-config-aggregate'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Hash, RefreshCw } from 'lucide-react'
import { GenerateSerialModal } from './GenerateSerialModal'

export function SerialNumberPool({ eventId }) {
  const { client } = useTransport()
  const aggregate = useMemo(() => {
    if (!client || !eventId) return null
    return getConfigAggregate(eventId, client)
  }, [client, eventId])

  const [permitTypes, setPermitTypes] = useState([])
  const [subtypes, setSubtypes] = useState([])
  const [selectedPermitTypeId, setSelectedPermitTypeId] = useState(null)
  const [selectedSubtypeCode, setSelectedSubtypeCode] = useState(null)
  const [serialNumbers, setSerialNumbers] = useState([])
  const [summary, setSummary] = useState({ total: 0, available: 0, assigned: 0, used: 0 })
  const [loading, setLoading] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)

  // Load permit types
  useEffect(() => {
    const loadPermitTypes = async () => {
      if (!aggregate?.permitType) return
      try {
        const types = await aggregate.permitType.list(eventId)
        setPermitTypes(types || [])
      } catch (err) {
        console.error('Failed to load permit types:', err)
      }
    }
    loadPermitTypes()
  }, [eventId, aggregate])

  // Load subtypes for selected permit type
  useEffect(() => {
    if (!selectedPermitTypeId || !aggregate?.permitTypeSubtype) {
      setSubtypes([])
      return
    }

    const loadSubtypes = async () => {
      try {
        const subs = await aggregate.permitTypeSubtype.list(eventId, selectedPermitTypeId)
        setSubtypes(subs || [])
      } catch (err) {
        console.error('Failed to load subtypes:', err)
        setSubtypes([])
      }
    }
    loadSubtypes()
  }, [eventId, selectedPermitTypeId, aggregate])

  // Load serial numbers function
  const loadSerialNumbers = useCallback(async () => {
    if (!selectedPermitTypeId || !aggregate?.serialNumber) {
      setSerialNumbers([])
      setSummary({ total: 0, available: 0, assigned: 0, used: 0 })
      return
    }

    try {
      setLoading(true)
      const result = await aggregate.serialNumber.list(
        eventId,
        selectedPermitTypeId,
        selectedSubtypeCode || null
      )

      setSerialNumbers(result?.serialNumbers || [])
      setSummary(result?.summary || { total: 0, available: 0, assigned: 0, used: 0 })
    } catch (err) {
      console.error('Failed to load serial numbers:', err)
      setSerialNumbers([])
      setSummary({ total: 0, available: 0, assigned: 0, used: 0 })
    } finally {
      setLoading(false)
    }
  }, [eventId, selectedPermitTypeId, selectedSubtypeCode, aggregate])

  // Load serial numbers when dependencies change
  useEffect(() => {
    loadSerialNumbers()
  }, [loadSerialNumbers])

  const handlePermitTypeChange = (permitTypeId) => {
    setSelectedPermitTypeId(permitTypeId)
    setSelectedSubtypeCode(null) // Reset subtype when permit type changes
  }

  const handleSubtypeChange = (subtypeCode) => {
    setSelectedSubtypeCode(subtypeCode === 'base' ? null : subtypeCode)
  }

  const handleGenerateComplete = () => {
    // Reload serial numbers after generation
    loadSerialNumbers()
    setShowGenerateModal(false)
  }

  const selectedPermitType = permitTypes.find(pt => pt.id === selectedPermitTypeId)

  return (
    <div className="space-y-6">
      {/* Selection Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Select Permit Type & Subtype</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Permit Type</label>
              <Select
                value={selectedPermitTypeId || ''}
                onValueChange={handlePermitTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select permit type" />
                </SelectTrigger>
                <SelectContent>
                  {permitTypes.map((pt) => (
                    <SelectItem key={pt.id} value={pt.id}>
                      {pt.display_name} ({pt.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Subtype</label>
              <Select
                value={selectedSubtypeCode || 'base'}
                onValueChange={handleSubtypeChange}
                disabled={!selectedPermitTypeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subtype" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="base">Base Type (no subtype)</SelectItem>
                  {subtypes.map((st) => (
                    <SelectItem key={st.id} value={st.code}>
                      {st.code} - {st.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => setShowGenerateModal(true)}
                disabled={!selectedPermitTypeId}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Generate Serial Numbers
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {selectedPermitTypeId && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total}</div>
              <p className="text-xs text-muted-foreground mt-1">serial numbers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Available</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.available}</div>
              <p className="text-xs text-muted-foreground mt-1">not assigned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{summary.assigned}</div>
              <p className="text-xs text-muted-foreground mt-1">to requests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Used</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{summary.used}</div>
              <p className="text-xs text-muted-foreground mt-1">permits generated</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Serial Numbers Table */}
      {selectedPermitTypeId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Serial Numbers
                {selectedSubtypeCode && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({selectedPermitType?.display_name} - {subtypes.find(s => s.code === selectedSubtypeCode)?.display_name || selectedSubtypeCode})
                  </span>
                )}
                {!selectedSubtypeCode && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({selectedPermitType?.display_name} - Base Type)
                  </span>
                )}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={loadSerialNumbers}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                <p className="text-sm text-gray-600 mt-2">Loading serial numbers...</p>
              </div>
            ) : serialNumbers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No serial numbers generated yet. Click "Generate Serial Numbers" to create them.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serialNumbers.map((serial) => (
                      <TableRow key={serial.id}>
                        <TableCell className="font-mono text-sm">
                          {serial.serial_number}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              serial.status === 'available'
                                ? 'default'
                                : serial.status === 'assigned'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {serial.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {serial.assigned_to_request_id ? (
                            <span className="text-sm font-mono">
                              {serial.assigned_to_request_id.slice(0, 8)}...
                            </span>
                          ) : serial.assigned_to_permit_id ? (
                            <span className="text-sm font-mono">
                              {serial.assigned_to_permit_id.slice(0, 8)}...
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {serial.assigned_at
                            ? new Date(serial.assigned_at).toLocaleDateString()
                            : new Date(serial.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generate Modal */}
      {selectedPermitTypeId && (
        <GenerateSerialModal
          eventId={eventId}
          permitTypeId={selectedPermitTypeId}
          permitType={selectedPermitType}
          subtypeCode={selectedSubtypeCode}
          subtypes={subtypes}
          open={showGenerateModal}
          onOpenChange={setShowGenerateModal}
          onComplete={handleGenerateComplete}
        />
      )}
    </div>
  )
}
