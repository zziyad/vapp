import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTransport } from '@/contexts/TransportContext'
import { getConfigAggregate } from '@/aggregates/config/get-config-aggregate'
import { isValidUUID } from '@/lib/utils/uuid'
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
import { toast } from 'sonner'

export function SectorsStep({ eventId, onComplete, onDataChange }) {
  const { client } = useTransport()
  
  const isEventIdValid = useMemo(() => isValidUUID(eventId), [eventId])

  const aggregate = useMemo(() => {
    if (!client || !isEventIdValid) return null
    return getConfigAggregate(eventId, client)
  }, [client, eventId, isEventIdValid])

  const [sectors, setSectors] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editingSector, setEditingSector] = useState(null)
  const [formData, setFormData] = useState({
    code: '',
    display_name: '',
    description: '',
    is_active: true,
  })
  const [saving, setSaving] = useState(false)

  // Subscribe to aggregate state
  useEffect(() => {
    if (!aggregate?.sector) return
    const unsubscribe = aggregate.sector.subscribe((state) => {
      setSectors(state.list || [])
      setLoading(state.listLoading)
      setError(state.listError)
    })
    return unsubscribe
  }, [aggregate])

  const onDataChangeRef = useRef(onDataChange)
  useEffect(() => {
    onDataChangeRef.current = onDataChange
  }, [onDataChange])

  // Fetch sectors
  const fetchSectors = useCallback(async () => {
    if (!aggregate?.sector || !isEventIdValid) return
    try {
      await aggregate.sector.list(eventId)
      // Don't call onDataChange on initial fetch to avoid loops
    } catch (err) {
      console.error('Failed to fetch sectors:', err)
      setError(err.message || 'Failed to load sectors.')
    }
  }, [aggregate, eventId, isEventIdValid])

  useEffect(() => {
    fetchSectors()
  }, [fetchSectors])

  const handleOpenDialog = (sector = null) => {
    if (sector) {
      setEditingSector(sector)
      setFormData({
        code: sector.code,
        display_name: sector.display_name,
        description: sector.description || '',
        is_active: sector.is_active !== undefined ? sector.is_active : true,
      })
    } else {
      setEditingSector(null)
      setFormData({
        code: '',
        display_name: '',
        description: '',
        is_active: true,
      })
    }
    setShowDialog(true)
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
    setEditingSector(null)
    setFormData({
      code: '',
      display_name: '',
      description: '',
      is_active: true,
    })
  }

  const handleSave = async () => {
    if (!aggregate?.sector || !isEventIdValid) return

    try {
      setSaving(true)
      const payload = {
        event_id: eventId,
        code: formData.code.toUpperCase().trim(),
        display_name: formData.display_name.trim(),
        description: formData.description.trim() || null,
        is_active: formData.is_active,
      }

      if (editingSector) {
        await aggregate.sector.update({
          id: editingSector.id,
          ...payload,
        })
        toast.success('Sector updated successfully.')
      } else {
        await aggregate.sector.create(payload)
        toast.success('Sector created successfully.')
      }

      handleCloseDialog()
      await fetchSectors()
      onDataChangeRef.current?.()
      onComplete?.()
    } catch (err) {
      console.error('Failed to save sector:', err)
      toast.error(err.message || 'Failed to save sector.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (sector) => {
    if (!confirm(`Are you sure you want to delete "${sector.display_name}"?`)) {
      return
    }

    if (!aggregate?.sector || !isEventIdValid) return

    try {
      await aggregate.sector.delete(eventId, sector.id)
      toast.success('Sector deleted successfully.')
      await fetchSectors()
      onDataChangeRef.current?.()
    } catch (err) {
      console.error('Failed to delete sector:', err)
      toast.error(err.message || 'Failed to delete sector.')
    }
  }

  if (!isEventIdValid) {
    return <div className="text-center text-red-600">Invalid Event ID</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Sectors</h3>
          <p className="text-sm text-gray-600">
            Define organizational sectors for this event
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Sector
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            All Sectors
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading sectors...</div>
          ) : sectors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sectors configured yet. Click "Add Sector" to get started.
            </div>
          ) : (
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
                    <TableCell className="font-medium">{sector.code}</TableCell>
                    <TableCell>{sector.display_name}</TableCell>
                    <TableCell className="text-gray-600">{sector.description || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={sector.is_active ? 'default' : 'secondary'}>
                        {sector.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(sector)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(sector)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingSector ? 'Edit Sector' : 'Add New Sector'}</DialogTitle>
            <DialogDescription>
              {editingSector ? 'Update the details of this sector.' : 'Create a new sector.'}
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
                disabled={!!editingSector}
              />
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
    </div>
  )
}
