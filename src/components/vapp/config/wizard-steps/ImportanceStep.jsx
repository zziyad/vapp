import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTransport } from '@/contexts/TransportContext'
import { getConfigAggregate } from '@/aggregates/config/get-config-aggregate'
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
import { Edit, Star, Info } from 'lucide-react'
import { toast } from 'sonner'

export function ImportanceStep({ eventId, onComplete, onDataChange }) {
  const { client } = useTransport()

  const aggregate = useMemo(() => {
    if (!client) return null
    // Importance is global, doesn't need eventId
    return getConfigAggregate(null, client)
  }, [client])

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    description: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!aggregate?.importance) return
    const unsubscribe = aggregate.importance.subscribe((state) => {
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
    if (!aggregate?.importance) return
    try {
      await aggregate.importance.list()
      // Don't call onDataChange on initial fetch to avoid loops
    } catch (err) {
      console.error('Failed to fetch importance levels:', err)
      setError(err.message || 'Failed to load importance levels.')
    }
  }, [aggregate])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        description: item.description || '',
      })
    }
    setShowDialog(true)
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
    setEditingItem(null)
    setFormData({
      description: '',
    })
  }

  const handleSave = async () => {
    if (!aggregate?.importance || !editingItem) return

    try {
      setSaving(true)
      await aggregate.importance.update({
        id: editingItem.id,
        description: formData.description.trim() || null,
      })
      toast.success('Importance level updated successfully.')
      handleCloseDialog()
      await fetchItems()
      onDataChangeRef.current?.()
      onComplete?.()
    } catch (err) {
      console.error('Failed to save importance level:', err)
      toast.error(err.message || 'Failed to save importance level.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Importance</h3>
          <p className="text-sm text-gray-600">
            Review static importance levels (read-only, description can be edited)
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            All Importance Levels
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading importance levels...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No importance levels found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.code}</TableCell>
                    <TableCell>{item.display_name}</TableCell>
                    <TableCell>{item.priority_order || '—'}</TableCell>
                    <TableCell className="text-gray-600">{item.description || '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
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
            <DialogTitle>Edit Importance Level</DialogTitle>
            <DialogDescription>
              Update the description for {editingItem?.display_name}. Code and display name cannot be changed.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Code
              </Label>
              <Input
                id="code"
                value={editingItem?.code || ''}
                disabled
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="display_name" className="text-right">
                Display Name
              </Label>
              <Input
                id="display_name"
                value={editingItem?.display_name || ''}
                disabled
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
