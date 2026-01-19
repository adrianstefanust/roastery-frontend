'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Mail, Phone, MapPin, FileText, Edit, Trash2, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { env } from '@/lib/config/env'
import { useAuthStore } from '@/lib/stores/auth-store'
import { toast } from 'sonner'
import type { Client, SalesOrder } from '@/types'

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const [client, setClient] = useState<Client | null>(null)
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)

  const isAccountantOrAdmin = user?.role === 'ACCOUNTANT' || user?.role === 'OWNER'

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    shipping_address: '',
    billing_address: '',
    country: '',
    notes: '',
    is_active: true,
  })

  useEffect(() => {
    fetchClient()
    fetchSalesOrders()
  }, [clientId])

  const fetchClient = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${env.apiBase}/api/v1/sales/clients/${clientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch client')
      }

      const data = await response.json()
      const clientData = data.client || data
      setClient(clientData)

      // Initialize edit form
      if (clientData) {
        setEditForm({
          name: clientData.name || '',
          contact_person: clientData.contact_person || '',
          email: clientData.email || '',
          phone: clientData.phone || '',
          shipping_address: clientData.shipping_address || '',
          billing_address: clientData.billing_address || '',
          country: clientData.country || '',
          notes: clientData.notes || '',
          is_active: clientData.is_active ?? true,
        })
      }
    } catch (error) {
      console.error('Error fetching client:', error)
      toast.error('Failed to load client details')
      router.push('/dashboard/sales/clients')
    } finally {
      setLoading(false)
    }
  }

  const fetchSalesOrders = async () => {
    try {
      const response = await fetch(
        `${env.apiBase}/api/v1/sales/orders?client_id=${clientId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch sales orders')
      }

      const data = await response.json()
      setSalesOrders(data.sales_orders || [])
    } catch (error) {
      console.error('Error fetching sales orders:', error)
    }
  }

  const handleEditSubmit = async () => {
    try {
      setSaving(true)
      const response = await fetch(`${env.apiBase}/api/v1/sales/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      })

      if (!response.ok) {
        throw new Error('Failed to update client')
      }

      toast.success('Client updated successfully')
      setEditDialogOpen(false)
      fetchClient()
    } catch (error) {
      console.error('Error updating client:', error)
      toast.error('Failed to update client')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      const response = await fetch(`${env.apiBase}/api/v1/sales/clients/${clientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete client')
      }

      toast.success('Client deleted successfully')
      router.push('/dashboard/sales/clients')
    } catch (error: any) {
      console.error('Error deleting client:', error)
      toast.error(error.message || 'Failed to delete client')
      setDeleteDialogOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'PENDING': 'bg-gray-100 text-gray-800',
      'CONFIRMED': 'bg-purple-100 text-purple-800',
      'PREPARING': 'bg-yellow-100 text-yellow-800',
      'SHIPPED': 'bg-blue-100 text-blue-800',
      'DELIVERED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const totalRevenue = salesOrders
    .filter(so => so.status !== 'CANCELLED')
    .reduce((sum, so) => sum + so.total_amount, 0)

  const activeSOs = salesOrders.filter(
    so => !['DELIVERED', 'CANCELLED'].includes(so.status)
  ).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading client details...</p>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 mx-auto text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Client not found</h3>
        <Button asChild className="mt-4">
          <Link href="/dashboard/sales/clients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href="/dashboard/sales/clients">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Link>
      </Button>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {client.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={client.is_active ? 'default' : 'secondary'}>
                {client.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <span className="text-sm text-gray-500">
                Added {new Date(client.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        {isAccountantOrAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Sales Orders
                </p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">
                  {salesOrders.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Revenue
                </p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">
                  ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Orders
                </p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">
                  {activeSOs}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {client.contact_person && (
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Contact Person</p>
                  <p className="mt-1 text-sm text-gray-900">{client.contact_person}</p>
                </div>
              </div>
            )}
            {client.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <a href={`mailto:${client.email}`} className="mt-1 text-sm text-blue-600 hover:underline">
                    {client.email}
                  </a>
                </div>
              </div>
            )}
            {client.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Phone</p>
                  <a href={`tel:${client.phone}`} className="mt-1 text-sm text-blue-600 hover:underline">
                    {client.phone}
                  </a>
                </div>
              </div>
            )}
            {client.country && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Country</p>
                  <p className="mt-1 text-sm text-gray-900">{client.country}</p>
                </div>
              </div>
            )}
          </div>
          {(client.shipping_address || client.billing_address) && (
            <div className="mt-6 pt-6 border-t space-y-4">
              {client.shipping_address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Shipping Address</p>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{client.shipping_address}</p>
                  </div>
                </div>
              )}
              {client.billing_address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Billing Address</p>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{client.billing_address}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {client.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
              <p className="text-sm text-gray-900 whitespace-pre-line">{client.notes}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sales Orders History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sales Orders</CardTitle>
            {isAccountantOrAdmin && (
              <Button size="sm" asChild>
                <Link href={`/dashboard/sales/orders/new?client_id=${client.id}`}>
                  Create SO
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {salesOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No sales orders</h3>
              <p className="mt-2 text-gray-600">
                No sales orders have been created for this client yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SO Number</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Requested Delivery</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesOrders.map((so) => (
                  <TableRow key={so.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/sales/orders/${so.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {so.so_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">
                        {new Date(so.order_date).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(so.status)}`}>
                        {so.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">
                        ${so.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {so.currency}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {so.requested_delivery_date
                          ? new Date(so.requested_delivery_date).toLocaleDateString()
                          : '-'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update client information and contact details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Client Name *</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Enter client name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                value={editForm.contact_person}
                onChange={(e) => setEditForm({ ...editForm, contact_person: e.target.value })}
                placeholder="Enter contact person name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={editForm.country}
                onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                placeholder="Enter country"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping_address">Shipping Address</Label>
              <Textarea
                id="shipping_address"
                value={editForm.shipping_address}
                onChange={(e) => setEditForm({ ...editForm, shipping_address: e.target.value })}
                placeholder="Enter shipping address"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing_address">Billing Address</Label>
              <Textarea
                id="billing_address"
                value={editForm.billing_address}
                onChange={(e) => setEditForm({ ...editForm, billing_address: e.target.value })}
                placeholder="Enter billing address"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Additional notes about this client"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={editForm.is_active}
                onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
              />
              <Label htmlFor="is_active">Active Client</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={saving || !editForm.name}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{client.name}</strong>?
              This action cannot be undone. Note: You cannot delete clients that have active sales orders.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
