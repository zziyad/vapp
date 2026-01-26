'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTransport } from '@/contexts/TransportContext'
import { getConfigAggregate } from '@/aggregates/config/get-config-aggregate'
import { isValidUUID } from '@/lib/utils/uuid'
import Container from '@/components/layout/Container'
import { AdminSidebar } from '@/components/vapp/admin/AdminSidebar'
import { VappPageHeader } from '@/components/vapp/shared/navigation/VappPageHeader'
import { PermissionGuard, PERMISSIONS } from '@/components/permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Edit, Trash2, Building2 } from 'lucide-react'

export default function SectorsPage() {
  const params = useParams()
  const { client } = useTransport()
  
  const eventId = useMemo(
    () => (Array.isArray(params?.eventId) ? params.eventId[0] : params?.eventId),
    [params?.eventId]
  )

  const aggregate = useMemo(() => {
    if (!client || !eventId || !isValidUUID(eventId)) return null
    return getConfigAggregate(eventId, client)
  }, [client, eventId])

  const [sectors, setSectors] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editingSector, setEditingSector] = useState(null)
  const [formData, setFormData] = useState({
    code: '',
    display_name: '',
    description: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // Subscribe to aggregate state
  useEffect(() => {
    if (!aggregate?.sector) return
    return aggregate.sector.subscribe((state) => {
      setSectors(state.list || [])
      setLoading(state.listLoading)
      setError(state.listError)
    })
  }, [aggregate])

  // Fetch sectors
  const fetchSectors = useCallback(async () => {
    if (!aggregate?.sector || !eventId) return
    try {
      await aggregate.sector.list(eventId)
    } catch (err) {
      console.error('Failed to fetch sectors:', err)
    }
  }, [aggregate, eventId])

  useEffect(() => {
    fetchSectors()
  }, [fetchSectors])

  const validateForm = () => {
    const newErrors = {}
    if (!formData.code.trim()) {
      newErrors.code = 'Code is required'
    } else if (!/^[A-Z0-9_-]+$/.test(formData.code.toUpperCase())) {
      newErrors.code = 'Code must be uppercase letters, numbers, hyphens, or underscores'
    }
    if (!formData.display_name.trim()) {
      newErrors.display_name = 'Display name is required'
    }
    setFormErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleOpenDialog = (sector = null) => {
    if (sector) {
      setEditingSector(sector)
      setFormData({
        code: sector.code,
        display_name: sector.display_name,
        description: sector.description || '',
      })
    } else {
      setEditingSector(null)
      setFormData({
        code: '',
        display_name: '',
        description: '',
      })
    }
    setFormErrors({})
    setShowDialog(true)
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
    setEditingSector(null)
    setFormData({
      code: '',
      display_name: '',
      description: '',
    })
    setFormErrors({})
  }

  const handleSave = async () => {
    if (!validateForm() || !aggregate?.sector || !eventId) return

    try {
      setSaving(true)
      const payload = {
        event_id: eventId,
        code: formData.code.toUpperCase().trim(),
        display_name: formData.display_name.trim(),
        description: formData.description.trim() || null,
      }

      if (editingSector) {
        await aggregate.sector.update({
          id: editingSector.id,
          display_name: payload.display_name,
          description: payload.description,
        })
      } else {
        await aggregate.sector.create(payload)
      }

      handleCloseDialog()
    } catch (err) {
      console.error('Failed to save sector:', err)
      setFormErrors({ submit: err.message || 'Failed to save sector' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (sector, hardDelete = false) => {
    if (!aggregate?.sector) return
    if (!confirm(
      hardDelete
        ? `Are you sure you want to permanently delete "${sector.display_name}"? This action cannot be undone.`
        : `Are you sure you want to deactivate "${sector.display_name}"?`
    )) {
      return
    }

    try {
      await aggregate.sector.delete(sector.id, hardDelete)
    } catch (err) {
      console.error('Failed to delete sector:', err)
      alert(err.message || 'Failed to delete sector')
    }
  }

  if (!eventId) {
    return (
      <Container className="py-6">
        <div className="text-center text-gray-500">Event ID is required</div>
      </Container>
    )
  }

  if (!isValidUUID(eventId)) {
    return (
      <Container className="py-6">
        <div className="text-center">
          <div className="text-red-600 font-semibold mb-2">Invalid Event ID</div>
          <div className="text-gray-500">The event ID in the URL is not a valid UUID format.</div>
          <div className="text-sm text-gray-400 mt-2">Event ID: {eventId}</div>
        </div>
      </Container>
    )
  }

  const activeCount = sectors.filter(s => s.is_active).length
  const inactiveCount = sectors.length - activeCount

  return (
    <Container className="py-6">
      <VappPageHeader
        eventId={eventId}
        pageTitle="Sectors"
        pageDescription="Manage organizational sectors for this event"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <AdminSidebar eventId={eventId} />
        </div>
        <div className="lg:col-span-3">
          <PermissionGuard permission={PERMISSIONS.VAPP.CONFIG.SECTOR.READ}>
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Sectors</h3>
                  <p className="text-sm text-gray-600">
                    Define organizational sectors for this event (e.g., Operations, Shared Services, Marketing)
                  </p>
                </div>
                <PermissionGuard permission={PERMISSIONS.VAPP.CONFIG.SECTOR.WRITE}>
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Sector
                  </Button>
                </PermissionGuard>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{sectors.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Active</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{activeCount}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Inactive</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-500">{inactiveCount}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  <p className="text-sm text-gray-600 mt-2">Loading sectors...</p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* Table */}
              {!loading && sectors.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    No sectors found. Create your first sector to get started.
                  </CardContent>
                </Card>
              )}

              {!loading && sectors.length > 0 && (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Display Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sectors.map((sector) => (
                          <TableRow key={sector.id}>
                            <TableCell className="font-mono text-sm">{sector.code}</TableCell>
                            <TableCell className="font-medium">{sector.display_name}</TableCell>
                            <TableCell className="text-gray-600">
                              {sector.description || '—'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={sector.is_active ? 'default' : 'outline'}>
                                {sector.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <PermissionGuard permission={PERMISSIONS.VAPP.CONFIG.SECTOR.WRITE}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenDialog(sector)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(sector, false)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </PermissionGuard>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Dialog */}
              <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingSector ? 'Edit Sector' : 'Create Sector'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingSector
                        ? 'Update the sector information below.'
                        : 'Enter the sector details below.'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="code">Code *</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="OPERATIONS"
                        disabled={!!editingSector}
                        className={formErrors.code ? 'border-red-500' : ''}
                      />
                      {formErrors.code && (
                        <p className="text-sm text-red-500 mt-1">{formErrors.code}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="display_name">Display Name *</Label>
                      <Input
                        id="display_name"
                        value={formData.display_name}
                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                        placeholder="Operations"
                        className={formErrors.display_name ? 'border-red-500' : ''}
                      />
                      {formErrors.display_name && (
                        <p className="text-sm text-red-500 mt-1">{formErrors.display_name}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Optional description"
                        rows={3}
                      />
                    </div>
                    {formErrors.submit && (
                      <p className="text-sm text-red-500">{formErrors.submit}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={handleCloseDialog}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving...' : editingSector ? 'Update' : 'Create'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </PermissionGuard>
        </div>
      </div>
    </Container>
  )
}
