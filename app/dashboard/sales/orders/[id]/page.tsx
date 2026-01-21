'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShoppingBag, Users, Calendar, Truck, Check, X, Package, FileText } from 'lucide-react'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { env } from '@/lib/config/env'
import { useAuthStore } from '@/lib/stores/auth-store'
import { toast } from 'sonner'
import type { SalesOrder, SOStatus, SOStatusHistory, InventoryReservation } from '@/types'

export default function SalesOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<SalesOrder | null>(null)
  const [reservations, setReservations] = useState<InventoryReservation[]>([])
  const [statusHistory, setStatusHistory] = useState<SOStatusHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [shipDialogOpen, setShipDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [processing, setProcessing] = useState(false)

  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)

  const isAccountantOrAdmin = user?.role === 'ACCOUNTANT' || user?.role === 'OWNER'

  useEffect(() => {
    fetchOrder()
    fetchReservations()
    fetchStatusHistory()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${env.apiBase}/api/v1/sales/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch sales order')
      }

      const data = await response.json()
      const orderData = data.sales_order || data
      setOrder(orderData)
    } catch (error) {
      console.error('Error fetching sales order:', error)
      toast.error('Failed to load sales order')
      router.push('/dashboard/sales/orders')
    } finally {
      setLoading(false)
    }
  }

  const fetchReservations = async () => {
    try {
      const response = await fetch(
        `${env.apiBase}/api/v1/sales/orders/${orderId}/reservations`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setReservations(data.reservations || [])
      }
    } catch (error) {
      console.error('Error fetching reservations:', error)
    }
  }

  const fetchStatusHistory = async () => {
    try {
      const response = await fetch(
        `${env.apiBase}/api/v1/sales/orders/${orderId}/history`,
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

  const handleConfirmOrder = async () => {
    try {
      setProcessing(true)
      const response = await fetch(
        `${env.apiBase}/api/v1/sales/orders/${orderId}/confirm`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        const data = await response.json()
        const errorMsg = data.error || 'Failed to confirm order'

        // Check if it's an inventory issue
        if (errorMsg.includes('insufficient inventory') || errorMsg.includes('could not reserve')) {
          toast.error(errorMsg, {
            description: 'Tip: Make sure your roasted coffee batches have passed QC. Only QC-passed batches are available for sale.',
            duration: 8000
          })
          throw new Error(errorMsg)
        }

        throw new Error(errorMsg)
      }

      toast.success('Order confirmed successfully. Inventory reserved.')
      setConfirmDialogOpen(false)
      fetchOrder()
      fetchReservations()
      fetchStatusHistory()
    } catch (error: any) {
      console.error('Error confirming order:', error)
      if (!error.message.includes('insufficient inventory')) {
        toast.error(error.message || 'Failed to confirm order')
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleShipOrder = async () => {
    try {
      setProcessing(true)
      const response = await fetch(
        `${env.apiBase}/api/v1/sales/orders/${orderId}/ship`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to ship order')
      }

      toast.success('Order shipped successfully. Inventory deducted.')
      setShipDialogOpen(false)
      fetchOrder()
      fetchReservations()
      fetchStatusHistory()
    } catch (error: any) {
      console.error('Error shipping order:', error)
      toast.error(error.message || 'Failed to ship order')
    } finally {
      setProcessing(false)
    }
  }

  const handleCancelOrder = async () => {
    try {
      setProcessing(true)
      const response = await fetch(
        `${env.apiBase}/api/v1/sales/orders/${orderId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel order')
      }

      toast.success('Order cancelled successfully.')
      setCancelDialogOpen(false)
      fetchOrder()
      fetchReservations()
      fetchStatusHistory()
    } catch (error: any) {
      console.error('Error cancelling order:', error)
      toast.error(error.message || 'Failed to cancel order')
    } finally {
      setProcessing(false)
    }
  }

  const handleDelete = async () => {
    try {
      setProcessing(true)
      const response = await fetch(`${env.apiBase}/api/v1/sales/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete sales order')
      }

      toast.success('Sales order deleted successfully')
      router.push('/dashboard/sales/orders')
    } catch (error: any) {
      console.error('Error deleting sales order:', error)
      toast.error(error.message || 'Failed to delete sales order')
      setDeleteDialogOpen(false)
    } finally {
      setProcessing(false)
    }
  }

  const getStatusColor = (status: SOStatus) => {
    const colors: Record<SOStatus, string> = {
      'PENDING': 'bg-gray-100 text-gray-800',
      'CONFIRMED': 'bg-purple-100 text-purple-800',
      'PREPARING': 'bg-yellow-100 text-yellow-800',
      'SHIPPED': 'bg-blue-100 text-blue-800',
      'DELIVERED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sales order...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="h-12 w-12 mx-auto text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Sales order not found</h3>
        <Button asChild className="mt-4">
          <Link href="/dashboard/sales/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sales Orders
          </Link>
        </Button>
      </div>
    )
  }

  const canConfirm = order.status === 'PENDING'
  const canShip = order.status === 'CONFIRMED' || order.status === 'PREPARING'
  const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status)
  const canDelete = order.status === 'PENDING'

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href="/dashboard/sales/orders">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sales Orders
        </Link>
      </Button>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <ShoppingBag className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {order.so_number}
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
            {(order.status === 'SHIPPED' || order.status === 'DELIVERED') && (
              <Button
                variant="outline"
                onClick={() => {
                  if (order.status !== 'CONFIRMED' && order.status !== 'PREPARING' && order.status !== 'SHIPPED' && order.status !== 'DELIVERED') {
                    toast.error('Cannot generate invoice: Order must be confirmed first')
                    return
                  }
                  window.location.href = `/dashboard/sales/invoices/new?so_id=${order.id}`
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Generate Invoice
              </Button>
            )}
            {canConfirm && (
              <Button onClick={() => setConfirmDialogOpen(true)}>
                <Check className="mr-2 h-4 w-4" />
                Confirm Order
              </Button>
            )}
            {canShip && (
              <Button onClick={() => setShipDialogOpen(true)}>
                <Truck className="mr-2 h-4 w-4" />
                Ship Order
              </Button>
            )}
            {canCancel && (
              <Button variant="outline" onClick={() => setCancelDialogOpen(true)}>
                <X className="mr-2 h-4 w-4" />
                Cancel
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
              <Users className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-600">Client</p>
                <Link
                  href={`/dashboard/sales/clients/${order.client_id}`}
                  className="mt-1 text-sm text-blue-600 hover:underline font-medium"
                >
                  {order.client?.name || 'Unknown'}
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
                <p className="text-sm font-medium text-gray-600">Requested Delivery</p>
                <p className="mt-1 text-sm text-gray-900">
                  {order.requested_delivery_date
                    ? new Date(order.requested_delivery_date).toLocaleDateString()
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
                <TableHead>Product SKU</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity (kg)</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total Price</TableHead>
                <TableHead className="text-right">Fulfilled (kg)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product_sku}</TableCell>
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
                    <span className={item.fulfilled_quantity_kg >= item.quantity_kg ? 'text-green-600 font-medium' : ''}>
                      {item.fulfilled_quantity_kg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

      {/* Inventory Reservations */}
      {reservations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Inventory Reservations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch ID</TableHead>
                  <TableHead>Quantity (kg)</TableHead>
                  <TableHead>Reserved At</TableHead>
                  <TableHead>Fulfilled At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((res) => (
                  <TableRow key={res.id}>
                    <TableCell className="font-mono text-sm">{res.batch_id}</TableCell>
                    <TableCell>
                      {res.quantity_kg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {new Date(res.reserved_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {res.fulfilled_at ? (
                        <span className="text-green-600">
                          {new Date(res.fulfilled_at).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-gray-500">Not fulfilled</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Sales Order</AlertDialogTitle>
            <AlertDialogDescription>
              This will reserve inventory for this order using FIFO (First In, First Out) allocation.
              Make sure sufficient inventory is available.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmOrder} disabled={processing}>
              {processing ? 'Confirming...' : 'Confirm Order'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ship Dialog */}
      <AlertDialog open={shipDialogOpen} onOpenChange={setShipDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ship Sales Order</AlertDialogTitle>
            <AlertDialogDescription>
              This will fulfill the reservations and deduct inventory from the system.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleShipOrder} disabled={processing}>
              {processing ? 'Shipping...' : 'Ship Order'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Sales Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel order <strong>{order.so_number}</strong>?
              This will release all inventory reservations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>No, Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOrder}
              disabled={processing}
              className="bg-red-600 hover:bg-red-700"
            >
              {processing ? 'Cancelling...' : 'Yes, Cancel Order'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sales Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete order <strong>{order.so_number}</strong>?
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
