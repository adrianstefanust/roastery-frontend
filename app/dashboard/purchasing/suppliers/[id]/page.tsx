'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, Mail, Phone, MapPin, FileText, Edit, Trash2, Package } from 'lucide-react'
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
import type { Supplier, PurchaseOrder } from '@/types'

export default function SupplierDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supplierId = params.id as string

  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
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
    address: '',
    country: '',
    notes: '',
    is_active: true,
  })

  useEffect(() => {
    fetchSupplier()
    fetchPurchaseOrders()
  }, [supplierId])

  const fetchSupplier = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${env.apiBase}/api/v1/purchasing/suppliers/${supplierId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch supplier')
      }

      const data = await response.json()
      const supplierData = data.supplier || data
      setSupplier(supplierData)

      // Initialize edit form
      if (supplierData) {
        setEditForm({
          name: supplierData.name || '',
          contact_person: supplierData.contact_person || '',
          email: supplierData.email || '',
          phone: supplierData.phone || '',
          address: supplierData.address || '',
          country: supplierData.country || '',
          notes: supplierData.notes || '',
          is_active: supplierData.is_active ?? true,
        })
      }
    } catch (error) {
      console.error('Error fetching supplier:', error)
      toast.error('Failed to load supplier details')
      router.push('/dashboard/purchasing/suppliers')
    } finally {
      setLoading(false)
    }
  }

  const fetchPurchaseOrders = async () => {
    try {
      const response = await fetch(
        `${env.apiBase}/api/v1/purchasing/orders?supplier_id=${supplierId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch purchase orders')
      }

      const data = await response.json()
      setPurchaseOrders(data.purchase_orders || [])
    } catch (error) {
      console.error('Error fetching purchase orders:', error)
    }
  }

  const handleEditSubmit = async () => {
    try {
      setSaving(true)
      const response = await fetch(`${env.apiBase}/api/v1/purchasing/suppliers/${supplierId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      })

      if (!response.ok) {
        throw new Error('Failed to update supplier')
      }

      toast.success('Supplier updated successfully')
      setEditDialogOpen(false)
      fetchSupplier()
    } catch (error) {
      console.error('Error updating supplier:', error)
      toast.error('Failed to update supplier')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      const response = await fetch(`${env.apiBase}/api/v1/purchasing/suppliers/${supplierId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete supplier')
      }

      toast.success('Supplier deleted successfully')
      router.push('/dashboard/purchasing/suppliers')
    } catch (error: any) {
      console.error('Error deleting supplier:', error)
      toast.error(error.message || 'Failed to delete supplier')
      setDeleteDialogOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'SENT': 'bg-blue-100 text-blue-800',
      'CONFIRMED': 'bg-purple-100 text-purple-800',
      'IN_TRANSIT': 'bg-yellow-100 text-yellow-800',
      'RECEIVED': 'bg-green-100 text-green-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const totalSpent = purchaseOrders
    .filter(po => po.status !== 'CANCELLED')
    .reduce((sum, po) => sum + po.total_amount, 0)

  const activePOs = purchaseOrders.filter(
    po => !['COMPLETED', 'CANCELLED'].includes(po.status)
  ).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading supplier details...</p>
        </div>
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 mx-auto text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Supplier not found</h3>
        <Button asChild className="mt-4">
          <Link href="/dashboard/purchasing/suppliers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Suppliers
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href="/dashboard/purchasing/suppliers">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Suppliers
        </Link>
      </Button>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-100 rounded-lg">
            <Building2 className="h-8 w-8 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {supplier.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                {supplier.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <span className="text-sm text-gray-500">
                Added {new Date(supplier.created_at).toLocaleDateString()}
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
                  Total Purchase Orders
                </p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">
                  {purchaseOrders.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Spent
                </p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">
                  ${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
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
                  {activePOs}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Package className="h-6 w-6 text-orange-600" />
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
            {supplier.contact_person && (
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Contact Person</p>
                  <p className="mt-1 text-sm text-gray-900">{supplier.contact_person}</p>
                </div>
              </div>
            )}
            {supplier.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <a href={`mailto:${supplier.email}`} className="mt-1 text-sm text-blue-600 hover:underline">
                    {supplier.email}
                  </a>
                </div>
              </div>
            )}
            {supplier.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Phone</p>
                  <a href={`tel:${supplier.phone}`} className="mt-1 text-sm text-blue-600 hover:underline">
                    {supplier.phone}
                  </a>
                </div>
              </div>
            )}
            {supplier.country && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Country</p>
                  <p className="mt-1 text-sm text-gray-900">{supplier.country}</p>
                </div>
              </div>
            )}
          </div>
          {supplier.address && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Address</p>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{supplier.address}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {supplier.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
              <p className="text-sm text-gray-900 whitespace-pre-line">{supplier.notes}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Purchase Orders History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Purchase Orders</CardTitle>
            {isAccountantOrAdmin && (
              <Button size="sm" asChild>
                <Link href={`/dashboard/purchasing/orders/new?supplier_id=${supplier.id}`}>
                  Create PO
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {purchaseOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No purchase orders</h3>
              <p className="mt-2 text-gray-600">
                No purchase orders have been created for this supplier yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Expected Delivery</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/purchasing/orders/${po.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {po.po_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">
                        {new Date(po.order_date).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(po.status)}`}>
                        {po.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">
                        ${po.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {po.currency}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {po.expected_delivery_date
                          ? new Date(po.expected_delivery_date).toLocaleDateString()
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
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>
              Update supplier information and contact details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Supplier Name *</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Enter supplier name"
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
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                placeholder="Enter full address"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Additional notes about this supplier"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={editForm.is_active}
                onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
              />
              <Label htmlFor="is_active">Active Supplier</Label>
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
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{supplier.name}</strong>?
              This action cannot be undone. Note: You cannot delete suppliers that have active purchase orders.
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
