'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTransport } from '@/contexts/TransportContext'
import { getConfigAggregate } from '@/aggregates/config/get-config-aggregate'
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
import { Edit, Star, Info } from 'lucide-react'
import { toast } from 'sonner'

export default function ImportancePage() {
  const params = useParams()
  const { client } = useTransport()
  
  const eventId = useMemo(
    () => (Array.isArray(params?.eventId) ? params.eventId[0] : params?.eventId),
    [params?.eventId]
  )

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
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!aggregate?.importance) return
    return aggregate.importance.subscribe((state) => {
      setItems(state.list || [])
      setLoading(state.listLoading)
      setError(state.listError)
    })
  }, [aggregate])

  const fetchItems = useCallback(async () => {
    if (!aggregate?.importance) return
    try {
      await aggregate.importance.list()
    } catch (err) {
      console.error('Failed to fetch importance levels:', err)
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
    setFormErrors({})
    setShowDialog(true)
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
    setEditingItem(null)
    setFormData({
      description: '',
    })
    setFormErrors({})
  }

  const handleSave = async () => {
    if (!aggregate?.importance || !editingItem) return

    try {
      setSaving(true)
      await aggregate.importance.update({
        id: editingItem.id,
        description: formData.description.trim() || null,
      })

      handleCloseDialog()
      await fetchItems()
      toast.success('Importance level updated successfully.')
    } catch (err) {
      console.error('Failed to save importance:', err)
      setFormErrors({ submit: err.message || 'Failed to save importance' })
      toast.error(err.message || 'Failed to save importance.')
    } finally {
      setSaving(false)
    }
  }

  if (!eventId) {
    return (
      <Container className="py-6">
        <div className="text-center text-gray-500">Event ID is required</div>
      </Container>
    )
  }

  const sortedItems = [...items].sort((a, b) => {
    const aOrder = a.priority_order ?? 999
    const bOrder = b.priority_order ?? 999
    return aOrder - bOrder
  })

  return (
    <Container className="py-6">
      <VappPageHeader
        eventId={eventId}
        pageTitle="Importance"
        pageDescription="View and manage importance levels (static global values)"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <AdminSidebar eventId={eventId} />
        </div>
        <div className="lg:col-span-3">
          <PermissionGuard permission={PERMISSIONS.VAPP.CONFIG.IMPORTANCE.READ}>
            <div className="space-y-6">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900">Read-Only Configuration</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Importance levels are static global values seeded during system initialization.
                        You can only edit descriptions. Code and display names cannot be modified.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Importance Levels</h3>
                  <p className="text-sm text-gray-600">
                    Static importance/priority levels available to all events
                  </p>
                </div>
              </div>

              {loading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  <p className="text-sm text-gray-600 mt-2">Loading importance levels...</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {!loading && sortedItems.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    No importance levels found.
                  </CardContent>
                </Card>
              )}

              {!loading && sortedItems.length > 0 && (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Priority</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Display Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              {item.priority_order !== null && item.priority_order !== undefined ? (
                                <Badge variant="outline">{item.priority_order}</Badge>
                              ) : (
                                '—'
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-sm">{item.code}</TableCell>
                            <TableCell className="font-medium">{item.display_name}</TableCell>
                            <TableCell className="text-gray-600">
                              {item.description || '—'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.is_active ? 'default' : 'outline'}>
                                {item.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <PermissionGuard permission={PERMISSIONS.VAPP.CONFIG.IMPORTANCE.WRITE}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenDialog(item)}
                                    title="Edit description"
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
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

              <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Importance</DialogTitle>
                    <DialogDescription>
                      Update the description for this importance level. Code and display name cannot be modified.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Code</Label>
                      <Input
                        value={editingItem?.code || ''}
                        disabled
                        className="bg-gray-100"
                      />
                    </div>
                    <div>
                      <Label>Display Name</Label>
                      <Input
                        value={editingItem?.display_name || ''}
                        disabled
                        className="bg-gray-100"
                      />
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
                      {saving ? 'Saving...' : 'Update'}
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
