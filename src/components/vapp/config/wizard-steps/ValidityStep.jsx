import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTransport } from '@/contexts/TransportContext'
import { getConfigAggregate } from '@/aggregates/config/get-config-aggregate'
import { isValidUUID } from '@/lib/utils/uuid'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Plus, Edit, Trash2, Calendar } from 'lucide-react'
import { toast } from 'sonner'

export function ValidityStep({ eventId, onComplete, onDataChange }) {
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
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!aggregate?.validity) return
    const unsubscribe = aggregate.validity.subscribe((state) => {
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
    if (!aggregate?.validity || !isEventIdValid) return
    try {
      await aggregate.validity.list(eventId)
      // Don't call onDataChange on initial fetch to avoid loops
    } catch (err) {
      console.error('Failed to fetch validity periods:', err)
      setError(err.message || 'Failed to load validity periods.')
    }
  }, [aggregate, eventId, isEventIdValid])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

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
  }

  const handleSave = async () => {
    if (!aggregate?.validity || !isEventIdValid) return

    try {
      setSaving(true)
      const payload = {
        event_id: eventId,
        code: formData.code.toUpperCase().trim(),
        display_name: formData.display_name.trim(),
        description: formData.description.trim() || null,
      }

      if (editingItem) {
        await aggregate.validity.update({
          id: editingItem.id,
          ...payload,
        })
        toast.success('Validity period updated successfully.')
      } else {
        await aggregate.validity.create(payload)
        toast.success('Validity period created successfully.')
      }

      handleCloseDialog()
      await fetchItems()
      onDataChangeRef.current?.()
      onComplete?.()
    } catch (err) {
      console.error('Failed to save validity period:', err)
      toast.error(err.message || 'Failed to save validity period.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item) => {
    if (!confirm(`Are you sure you want to delete "${item.display_name}"?`)) {
      return
    }

    if (!aggregate?.validity || !isEventIdValid) return

    try {
      await aggregate.validity.delete(eventId, item.id)
      toast.success('Validity period deleted successfully.')
      await fetchItems()
      onDataChangeRef.current?.()
    } catch (err) {
      console.error('Failed to delete validity period:', err)
      toast.error(err.message || 'Failed to delete validity period.')
    }
  }

  if (!isEventIdValid) {
    return <div className="text-center text-red-600">Invalid Event ID</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Validity</h3>
          <p className="text-sm text-gray-600">
            Define validity periods for this event
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Validity Period
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
            <Calendar className="h-5 w-5" />
            All Validity Periods
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading validity periods...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No validity periods configured yet. Click "Add Validity Period" to get started.
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
            <DialogTitle>{editingItem ? 'Edit Validity Period' : 'Add New Validity Period'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the details of this validity period.' : 'Create a new validity period.'}
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
