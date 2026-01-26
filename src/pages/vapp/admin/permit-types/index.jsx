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
import { Plus, Edit, Trash2, Layers, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { SubtypesManager } from '@/components/vapp/admin/permit-types/SubtypesManager'

export default function PermitTypesPage() {
  const params = useParams()
  const { client } = useTransport()
  
  const eventId = useMemo(
    () => (Array.isArray(params?.eventId) ? params.eventId[0] : params?.eventId),
    [params?.eventId]
  )

  const isEventIdValid = useMemo(() => isValidUUID(eventId), [eventId])

  const aggregate = useMemo(() => {
    if (!client || !isEventIdValid) return null
    return getConfigAggregate(eventId, client)
  }, [client, eventId, isEventIdValid])

  const [permitTypes, setPermitTypes] = useState([])
  const [totalSubtypes, setTotalSubtypes] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editingType, setEditingType] = useState(null)
  const [showSubtypesDialog, setShowSubtypesDialog] = useState(false)
  const [selectedTypeForSubtypes, setSelectedTypeForSubtypes] = useState(null)
  const [formData, setFormData] = useState({
    code: '',
    display_name: '',
    description: '',
    is_active: true,
  })
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // Subscribe to aggregate state
  useEffect(() => {
    if (!aggregate?.permitType) return
    const unsubscribe = aggregate.permitType.subscribe((state) => {
      setPermitTypes(state.list || [])
      setTotalSubtypes(state.totalSubtypes || 0)
      setLoading(state.listLoading)
      setError(state.listError)
    })
    return unsubscribe
  }, [aggregate])

  // Fetch permit types
  const fetchPermitTypes = useCallback(async () => {
    if (!aggregate?.permitType || !isEventIdValid) {
      setError('Invalid Event ID provided.')
      return
    }
    try {
      await aggregate.permitType.list(eventId)
    } catch (err) {
      console.error('Failed to fetch permit types:', err)
      setError(err.message || 'Failed to load permit types.')
    }
  }, [aggregate, eventId, isEventIdValid])

  useEffect(() => {
    fetchPermitTypes()
  }, [fetchPermitTypes])

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

  const handleOpenDialog = (type = null) => {
    if (type) {
      setEditingType(type)
      setFormData({
        code: type.code,
        display_name: type.display_name,
        description: type.description || '',
        is_active: type.is_active !== undefined ? type.is_active : true,
      })
    } else {
      setEditingType(null)
      setFormData({
        code: '',
        display_name: '',
        description: '',
        is_active: true,
      })
    }
    setFormErrors({})
    setShowDialog(true)
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
    setEditingType(null)
    setFormData({
      code: '',
      display_name: '',
      description: '',
      is_active: true,
    })
    setFormErrors({})
  }

  const handleSave = async () => {
    if (!validateForm() || !aggregate?.permitType || !isEventIdValid) return

    try {
      setSaving(true)
      const payload = {
        event_id: eventId,
        code: formData.code.toUpperCase().trim(),
        display_name: formData.display_name.trim(),
        description: formData.description.trim() || null,
        is_active: formData.is_active,
      }

      if (editingType) {
        await aggregate.permitType.update({
          permit_type_id: editingType.id,
          event_id: eventId,
          ...payload,
        })
      } else {
        await aggregate.permitType.create(payload)
      }

      handleCloseDialog()
      // Force refresh after save
      await fetchPermitTypes()
    } catch (err) {
      console.error('Failed to save permit type:', err)
      setFormErrors({ submit: err.message || 'Failed to save permit type' })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (type) => {
    if (!aggregate?.permitType || !isEventIdValid) return

    try {
      await aggregate.permitType.toggleActive(eventId, type.id)
      // Force refresh after toggle
      await fetchPermitTypes()
    } catch (err) {
      console.error('Failed to toggle permit type status:', err)
      setError(err.message || 'Failed to update permit type status.')
    }
  }

  const handleDelete = async (type) => {
    if (!confirm(`Are you sure you want to delete "${type.display_name}"?`)) {
      return
    }

    if (!aggregate?.permitType || !isEventIdValid) return

    try {
      await aggregate.permitType.delete(type.id)
      // Force refresh after delete
      await fetchPermitTypes()
    } catch (err) {
      console.error('Failed to delete permit type:', err)
      setError(err.message || 'Failed to delete permit type.')
    }
  }

  if (!isEventIdValid) {
    return (
      <Container className="py-6">
        <div className="text-center text-red-600">
          <h1 className="text-2xl font-bold">Invalid Event ID</h1>
          <p className="text-muted-foreground">Please provide a valid Event ID in the URL.</p>
        </div>
      </Container>
    )
  }

  const activeCount = permitTypes.filter(pt => pt.is_active).length

  return (
    <Container className="py-6">
      <VappPageHeader
        eventId={eventId}
        pageTitle="Permit Types"
        pageDescription="Manage permit types and their configurations"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <AdminSidebar eventId={eventId} />
        </div>
        <div className="lg:col-span-3">
          <PermissionGuard permission={PERMISSIONS.VAPP.CONFIG.PERMIT_TYPE.READ}>
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Permit Types</h3>
                  <p className="text-sm text-gray-600">
                    Define types of permits for this event (e.g., VIP, Staff, Media)
                  </p>
                </div>

                <PermissionGuard permission={PERMISSIONS.VAPP.CONFIG.PERMIT_TYPE.WRITE}>
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Permit Type
                  </Button>
                </PermissionGuard>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Total Permit Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{permitTypes.length}</div>
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
                    <CardTitle className="text-sm font-medium">Total Subtypes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{totalSubtypes}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <strong className="font-bold">Error:</strong>
                  <span className="block sm:inline"> {error}</span>
                </div>
              )}

              {/* Status */}
              {permitTypes.length > 0 ? (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-900">
                        {permitTypes.length} permit type{permitTypes.length !== 1 ? 's' : ''} configured
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      <span className="text-sm font-medium text-amber-900">
                        No permit types configured yet
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Permit Types Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    All Permit Types
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading permit types...</div>
                  ) : permitTypes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No permit types configured yet. Click "Add Permit Type" to get started.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Display Name</TableHead>
                        <TableHead>Subtypes</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {permitTypes.map((type) => (
                        <TableRow key={type.id}>
                          <TableCell className="font-medium">{type.code}</TableCell>
                          <TableCell>{type.display_name}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTypeForSubtypes(type)
                                setShowSubtypesDialog(true)
                              }}
                              className="gap-2"
                            >
                              <Layers className="h-3 w-3" />
                              Subtypes
                            </Button>
                          </TableCell>
                          <TableCell className="text-gray-600">{type.description || '—'}</TableCell>
                          <TableCell>
                            <Badge variant={type.is_active ? 'default' : 'secondary'}>
                              {type.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <PermissionGuard permission={PERMISSIONS.VAPP.CONFIG.PERMIT_TYPE.WRITE}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleActive(type)}
                                  title={type.is_active ? 'Deactivate' : 'Activate'}
                                >
                                  {type.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenDialog(type)}
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(type)}
                                  title="Delete"
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
                  )}
                </CardContent>
              </Card>
            </div>
          </PermissionGuard>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingType ? 'Edit Permit Type' : 'Add New Permit Type'}</DialogTitle>
            <DialogDescription>
              {editingType ? 'Update the details of this permit type.' : 'Create a new permit type.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Code
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="col-span-3"
                disabled={!!editingType}
              />
              {formErrors.code && <p className="col-span-4 text-right text-red-500 text-sm">{formErrors.code}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="display_name" className="text-right">
                Display Name
              </Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                className="col-span-3"
              />
              {formErrors.display_name && <p className="col-span-4 text-right text-red-500 text-sm">{formErrors.display_name}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_active" className="text-right">
                Active
              </Label>
              <div className="col-span-3">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
              </div>
            </div>
            {formErrors.submit && <p className="col-span-4 text-center text-red-500 text-sm">{formErrors.submit}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subtypes Manager Dialog */}
      <SubtypesManager
        eventId={eventId}
        permitType={selectedTypeForSubtypes}
        open={showSubtypesDialog}
        onOpenChange={setShowSubtypesDialog}
        onSaved={fetchPermitTypes}
      />
    </Container>
  )
}
