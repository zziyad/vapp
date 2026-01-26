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
import { Plus, Edit, Trash2, FolderTree } from 'lucide-react'
import { toast } from 'sonner'

export function FunctionalAreasStep({ eventId, onComplete, onDataChange }) {
  const { client } = useTransport()
  const isEventIdValid = useMemo(() => isValidUUID(eventId), [eventId])

  const aggregate = useMemo(() => {
    if (!client || !isEventIdValid) return null
    return getConfigAggregate(eventId, client)
  }, [client, eventId, isEventIdValid])

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    code: '',
    display_name: '',
    description: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!aggregate?.functionalArea) return
    const unsubscribe = aggregate.functionalArea.subscribe((state) => {
      setItems(state.list || [])
      setLoading(state.listLoading)
      setError(state.listError)
    })
    return unsubscribe
  }, [aggregate])

  const onDataChangeRef = useRef(onDataChange)
  useEffect(() => {
    onDataChangeRef.current = onDataChange
  }, [onDataChange])

  const fetchItems = useCallback(async () => {
    if (!aggregate?.functionalArea || !isEventIdValid) return
    try {
      await aggregate.functionalArea.list(eventId)
      // Don't call onDataChange on initial fetch to avoid loops
    } catch (err) {
      console.error('Failed to fetch functional areas:', err)
      setError(err.message || 'Failed to load functional areas.')
    }
  }, [aggregate, eventId, isEventIdValid])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

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

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        code: item.code,
        display_name: item.display_name,
        description: item.description || '',
      })
    } else {
      setEditingItem(null)
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
    setEditingItem(null)
    setFormData({
      code: '',
      display_name: '',
      description: '',
    })
    setFormErrors({})
  }

  const handleSave = async () => {
    if (!validateForm() || !aggregate?.functionalArea || !isEventIdValid) return

    try {
      setSaving(true)
      const payload = {
        event_id: eventId,
        code: formData.code.toUpperCase().trim(),
        display_name: formData.display_name.trim(),
        description: formData.description.trim() || null,
      }

      if (editingItem) {
        await aggregate.functionalArea.update({
          id: editingItem.id,
          display_name: payload.display_name,
          description: payload.description,
        })
        toast.success('Functional area updated successfully.')
      } else {
        await aggregate.functionalArea.create(payload)
        toast.success('Functional area created successfully.')
      }

      handleCloseDialog()
      await fetchItems()
      onDataChangeRef.current?.()
      onComplete?.()
    } catch (err) {
      console.error('Failed to save functional area:', err)
      setFormErrors({ submit: err.message || 'Failed to save functional area' })
      toast.error(err.message || 'Failed to save functional area.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item) => {
    if (!confirm(`Are you sure you want to delete "${item.display_name}"?`)) {
      return
    }

    if (!aggregate?.functionalArea || !isEventIdValid) return

    try {
      await aggregate.functionalArea.delete(eventId, item.id)
      toast.success('Functional area deleted successfully.')
      await fetchItems()
      onDataChangeRef.current?.()
    } catch (err) {
      console.error('Failed to delete functional area:', err)
      toast.error(err.message || 'Failed to delete functional area.')
    }
  }

  if (!isEventIdValid) {
    return <div className="text-center text-red-600">Invalid Event ID</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Functional Areas</h3>
          <p className="text-sm text-gray-600">
            Define functional areas for this event
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Functional Area
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
            <FolderTree className="h-5 w-5" />
            All Functional Areas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading functional areas...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No functional areas configured yet. Click "Add Functional Area" to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.code}</TableCell>
                    <TableCell>{item.display_name}</TableCell>
                    <TableCell className="text-gray-600">{item.description || '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(item)}
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Functional Area' : 'Add New Functional Area'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the details of this functional area.' : 'Create a new functional area.'}
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
                disabled={!!editingItem}
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
    </div>
  )
}
