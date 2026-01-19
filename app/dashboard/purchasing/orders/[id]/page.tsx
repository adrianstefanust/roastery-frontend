'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, Building2, Calendar, Truck, Check, X } from 'lucide-react'
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
  TableFooter,
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
import { env } from '@/lib/config/env'
import { useAuthStore } from '@/lib/stores/auth-store'
import { toast } from 'sonner'
import type { PurchaseOrder, PurchaseOrderItem, POStatus, POStatusHistory } from '@/types'

interface ReceiveItem {
  po_item_id: string
  received_quantity: number
  moisture_content: number
}

export default function PurchaseOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<PurchaseOrder | null>(null)
  const [statusHistory, setStatusHistory] = useState<POStatusHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [processing, setProcessing] = useState(false)

  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)

  const isAccountantOrAdmin = user?.role === 'ACCOUNTANT' || user?.role === 'OWNER'

  // Receive goods state
  const [receiveData, setReceiveData] = useState<ReceiveItem[]>([])
  const [receiveNotes, setReceiveNotes] = useState('')

  // Status change state
  const [newStatus, setNewStatus] = useState<POStatus | ''>('')
  const [statusNotes, setStatusNotes] = useState('')

  useEffect(() => {
    fetchOrder()
    fetchStatusHistory()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${env.apiBase}/api/v1/purchasing/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch purchase order')
      }

      const data = await response.json()
      const orderData = data.purchase_order || data
      setOrder(orderData)

      // Initialize receive data
      if (orderData?.items) {
        setReceiveData(orderData.items.map((item: PurchaseOrderItem) => ({
          po_item_id: item.id,
          received_quantity: item.quantity_kg - item.received_quantity_kg,
          moisture_content: 11.5,
        })))
      }
    } catch (error) {
      console.error('Error fetching purchase order:', error)
      toast.error('Failed to load purchase order')
      router.push('/dashboard/purchasing/orders')
    } finally {
      setLoading(false)
    }
  }

  const fetchStatusHistory = async () => {
    try {
      const response = await fetch(
        `${env.apiBase}/api/v1/purchasing/orders/${orderId}/history`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setStatusHistory(data.status_history || [])
      }
    } catch (error) {
      console.error('Error fetching status history:', error)
    }
  }

  const handleStatusChange = async () => {
    if (!newStatus) return

    try {
      setProcessing(true)
      const response = await fetch(
        `${env.apiBase}/api/v1/purchasing/orders/${orderId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: newStatus,
            notes: statusNotes
          })
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update status')
      }

      toast.success('Status updated successfully')
      setStatusDialogOpen(false)
      setNewStatus('')
      setStatusNotes('')
      fetchOrder()
      fetchStatusHistory()
    } catch (error: any) {
      console.error('Error updating status:', error)
      toast.error(error.message || 'Failed to update status')
    } finally {
      setProcessing(false)
    }
  }

  const handleReceiveGoods = async () => {
    try {
      setProcessing(true)
      const response = await fetch(
        `${env.apiBase}/api/v1/purchasing/orders/${orderId}/receive`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            items: receiveData,
            notes: receiveNotes
          })
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to receive goods')
      }

      toast.success('Goods received successfully. GRN created automatically.')
      setReceiveDialogOpen(false)
      setReceiveNotes('')
      fetchOrder()
      fetchStatusHistory()
    } catch (error: any) {
      console.error('Error receiving goods:', error)
      toast.error(error.message || 'Failed to receive goods')
    } finally {
      setProcessing(false)
    }
  }

  const handleDelete = async () => {
    try {
      setProcessing(true)
      const response = await fetch(`${env.apiBase}/api/v1/purchasing/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete purchase order')
      }

      toast.success('Purchase order deleted successfully')
      router.push('/dashboard/purchasing/orders')
    } catch (error: any) {
      console.error('Error deleting purchase order:', error)
      toast.error(error.message || 'Failed to delete purchase order')
      setDeleteDialogOpen(false)
    } finally {
      setProcessing(false)
    }
  }

  const getStatusColor = (status: POStatus) => {
    const colors: Record<POStatus, string> = {
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

  const getAvailableStatusTransitions = (currentStatus: POStatus): POStatus[] => {
    const transitions: Record<POStatus, POStatus[]> = {
      'DRAFT': ['SENT', 'CANCELLED'],
      'SENT': ['CONFIRMED', 'CANCELLED'],
      'CONFIRMED': ['IN_TRANSIT', 'CANCELLED'],
      'IN_TRANSIT': ['RECEIVED', 'CANCELLED'],
      'RECEIVED': ['COMPLETED'],
      'COMPLETED': [],
      'CANCELLED': [],
    }
    return transitions[currentStatus] || []
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading purchase order...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Purchase order not found</h3>
        <Button asChild className="mt-4">
          <Link href="/dashboard/purchasing/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Purchase Orders
          </Link>
        </Button>
      </div>
    )
  }

  const availableTransitions = getAvailableStatusTransitions(order.status)
  const canReceive = order.status === 'IN_TRANSIT' || order.status === 'SENT'
  const canEdit = order.status === 'DRAFT'
  const canDelete = order.status === 'DRAFT'

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href="/dashboard/purchasing/orders">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Purchase Orders
        </Link>
      </Button>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-100 rounded-lg">
            <Package className="h-8 w-8 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {order.po_number}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getStatusColor(order.status)}>
                {order.status}
              </Badge>
              <span className="text-sm text-gray-500">
                Created {new Date(order.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        {isAccountantOrAdmin && (
          <div className="flex gap-2">
            {canReceive && (
              <Button onClick={() => setReceiveDialogOpen(true)}>
                <Check className="mr-2 h-4 w-4" />
                Receive Goods
              </Button>
            )}
            {availableTransitions.length > 0 && (
              <Button variant="outline" onClick={() => setStatusDialogOpen(true)}>
                Update Status
              </Button>
            )}
            {canDelete && (
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                <X className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-600">Supplier</p>
                <Link
                  href={`/dashboard/purchasing/suppliers/${order.supplier_id}`}
                  className="mt-1 text-sm text-blue-600 hover:underline font-medium"
                >
                  {order.supplier?.name || 'Unknown'}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-600">Order Date</p>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(order.order_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Truck className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-600">Expected Delivery</p>
                <p className="mt-1 text-sm text-gray-900">
                  {order.expected_delivery_date
                    ? new Date(order.expected_delivery_date).toLocaleDateString()
                    : 'Not set'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity (kg)</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total Price</TableHead>
                <TableHead className="text-right">Received (kg)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.sku}</TableCell>
                  <TableCell>{item.description || '-'}</TableCell>
                  <TableCell className="text-right">
                    {item.quantity_kg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    ${item.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    ${item.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={item.received_quantity_kg >= item.quantity_kg ? 'text-green-600 font-medium' : ''}>
                      {item.received_quantity_kg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="text-right font-medium">
                  Total Amount:
                </TableCell>
                <TableCell colSpan={2} className="text-right font-bold text-lg">
                  ${order.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {order.currency}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* Notes */}
      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-900 whitespace-pre-line">{order.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Status History */}
      {statusHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Status History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusHistory.map((history) => (
                <div key={history.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {history.from_status && (
                        <>
                          <Badge variant="outline" className="text-xs">
                            {history.from_status}
                          </Badge>
                          <span className="text-gray-400">→</span>
                        </>
                      )}
                      <Badge className={getStatusColor(history.to_status)}>
                        {history.to_status}
                      </Badge>
                    </div>
                    {history.notes && (
                      <p className="mt-2 text-sm text-gray-600">{history.notes}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(history.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Receive Goods Dialog */}
      <Dialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receive Goods</DialogTitle>
            <DialogDescription>
              Enter the received quantities and moisture content for each item. GRN will be created automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Ordered (kg)</TableHead>
                  <TableHead>Received (kg)</TableHead>
                  <TableHead>Moisture %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items?.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.sku}</TableCell>
                    <TableCell>{item.quantity_kg.toFixed(2)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={receiveData[index]?.received_quantity || 0}
                        onChange={(e) => {
                          const newData = [...receiveData]
                          newData[index] = {
                            ...newData[index],
                            received_quantity: parseFloat(e.target.value) || 0
                          }
                          setReceiveData(newData)
                        }}
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.1"
                        value={receiveData[index]?.moisture_content || 11.5}
                        onChange={(e) => {
                          const newData = [...receiveData]
                          newData[index] = {
                            ...newData[index],
                            moisture_content: parseFloat(e.target.value) || 11.5
                          }
                          setReceiveData(newData)
                        }}
                        className="w-24"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="space-y-2">
              <Label htmlFor="receive-notes">Notes</Label>
              <Textarea
                id="receive-notes"
                value={receiveNotes}
                onChange={(e) => setReceiveNotes(e.target.value)}
                placeholder="Optional notes about the receipt"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiveDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleReceiveGoods} disabled={processing}>
              {processing ? 'Processing...' : 'Confirm Receipt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
            <DialogDescription>
              Change the purchase order status.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as POStatus)}
              >
                <option value="">Select status...</option>
                {availableTransitions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-notes">Notes</Label>
              <Textarea
                id="status-notes"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Optional notes about the status change"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleStatusChange} disabled={processing || !newStatus}>
              {processing ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete purchase order <strong>{order.po_number}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={processing}
              className="bg-red-600 hover:bg-red-700"
            >
              {processing ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
