import { useState, useEffect } from 'react'
import { useTransport } from '@/contexts/TransportContext'
import { getConfigAggregate } from '@/aggregates/config/get-config-aggregate'
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
import { Plus, Trash2 } from 'lucide-react'

export function SubtypesManager({ eventId, permitType, open, onOpenChange, onSaved }) {
  const { client } = useTransport()
  const aggregate = client ? getConfigAggregate(eventId, client) : null

  const [subtypes, setSubtypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  
  const [formData, setFormData] = useState({
    code: '',
    display_name: '',
    description: '',
  })

  const loadSubtypes = async () => {
    if (!permitType?.id || !aggregate?.permitTypeSubtype) return
    
    try {
      setLoading(true)
      const result = await aggregate.permitTypeSubtype.list(eventId, permitType.id)
      setSubtypes(Array.isArray(result) ? result : [])
    } catch (err) {
      console.error('Failed to load subtypes:', err)
      setSubtypes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && permitType?.id) {
      loadSubtypes()
    }
  }, [open, permitType?.id, eventId])

  const handleAdd = async () => {
    if (!formData.code.trim() || !formData.display_name.trim()) {
      alert('Code and display name are required')
      return
    }

    if (!aggregate?.permitTypeSubtype) {
      alert('Transport not ready')
      return
    }

    try {
      setSaving(true)
      await aggregate.permitTypeSubtype.create({
        event_id: eventId,
        permit_type_id: permitType.id,
        code: formData.code.toUpperCase().trim(),
        display_name: formData.display_name.trim(),
        description: formData.description.trim() || null,
      })
      
      setFormData({ code: '', display_name: '', description: '' })
      setShowAddDialog(false)
      await loadSubtypes()
      onSaved?.()
    } catch (err) {
      console.error('Failed to create subtype:', err)
      alert(err?.message || 'Failed to create subtype')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (subtypeId) => {
    if (!confirm('Are you sure you want to delete this subtype?')) return

    if (!aggregate?.permitTypeSubtype) {
      alert('Transport not ready')
      return
    }

    try {
      await aggregate.permitTypeSubtype.delete(eventId, permitType.id, subtypeId)
      await loadSubtypes()
      onSaved?.()
    } catch (err) {
      console.error('Failed to delete subtype:', err)
      alert(err?.message || 'Failed to delete subtype')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Subtypes: {permitType?.display_name}</DialogTitle>
          <DialogDescription>
            Add and manage subtypes for this permit type (e.g., M1, M2, STA, PAF)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add Subtype Button */}
          <div className="flex justify-end">
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Subtype
            </Button>
          </div>

          {/* Subtypes Table */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
              <p className="text-sm text-gray-600 mt-2">Loading subtypes...</p>
            </div>
          ) : subtypes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No subtypes configured. Click "Add Subtype" to create one.
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
                {subtypes.map((subtype) => (
                  <TableRow key={subtype.id}>
                    <TableCell className="font-mono text-sm">
                      <Badge variant="outline">{subtype.code}</Badge>
                    </TableCell>
                    <TableCell>{subtype.display_name}</TableCell>
                    <TableCell className="text-gray-600">
                      {subtype.description || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(subtype.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Add Subtype Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subtype</DialogTitle>
            <DialogDescription>
              Create a new subtype for {permitType?.display_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="subtype_code">
                Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subtype_code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="M1, M2, STA, PAF, etc."
              />
              <p className="text-xs text-gray-600 mt-1">
                Subtype code (e.g., M1, M2, STA, PAF)
              </p>
            </div>

            <div>
              <Label htmlFor="subtype_display_name">
                Display Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subtype_display_name"
                value={formData.display_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    display_name: e.target.value,
                  })
                }
                placeholder="Match Day 1, Stadium Access, etc."
              />
            </div>

            <div>
              <Label htmlFor="subtype_description">Description</Label>
              <Textarea
                id="subtype_description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
                placeholder="Optional description"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
