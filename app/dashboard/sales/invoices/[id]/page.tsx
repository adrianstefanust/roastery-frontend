'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { env } from '@/lib/config/env'
import { useAuthStore } from '@/lib/stores/auth-store'
import { toast } from 'sonner'
import type { SalesInvoice, PaymentStatus } from '@/types'

export default function SalesInvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params.id as string
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)

  const [invoice, setInvoice] = useState<SalesInvoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paidAmount, setPaidAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentReference, setPaymentReference] = useState('')

  const isAccountantOrAdmin = user?.role === 'ACCOUNTANT' || user?.role === 'OWNER'

  useEffect(() => {
    fetchInvoice()
  }, [invoiceId])

  const fetchInvoice = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${env.apiBase}/api/v1/sales/invoices/${invoiceId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch invoice')
      }

      const data = await response.json()
      setInvoice(data.invoice)
      setPaidAmount(data.invoice.paid_amount || 0)
    } catch (error) {
      console.error('Error fetching invoice:', error)
      toast.error('Failed to load invoice')
      router.push('/dashboard/sales/invoices')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePayment = async () => {
    if (!invoice) return

    if (paidAmount < 0 || paidAmount > invoice.total_amount) {
      toast.error('Invalid payment amount')
      return
    }

    setUpdating(true)

    try {
      const response = await fetch(`${env.apiBase}/api/v1/sales/invoices/${invoiceId}/payment`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paid_amount: paidAmount,
          payment_method: paymentMethod || undefined,
          payment_date: paymentDate || undefined,
          payment_reference: paymentReference || undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update payment')
      }

      toast.success('Payment updated successfully')
      setPaymentDialogOpen(false)
      fetchInvoice()
    } catch (error: any) {
      console.error('Error updating payment:', error)
      toast.error(error.message || 'Failed to update payment')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!invoice || invoice.payment_status !== 'UNPAID') {
      toast.error('Only unpaid invoices can be deleted')
      return
    }

    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return
    }

    setDeleting(true)

    try {
      const response = await fetch(`${env.apiBase}/api/v1/sales/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete invoice')
      }

      toast.success('Invoice deleted successfully')
      router.push('/dashboard/sales/invoices')
    } catch (error: any) {
      console.error('Error deleting invoice:', error)
      toast.error(error.message || 'Failed to delete invoice')
    } finally {
      setDeleting(false)
    }
  }

  const getStatusColor = (status: PaymentStatus) => {
    const colors: Record<PaymentStatus, string> = {
      'UNPAID': 'bg-yellow-100 text-yellow-800',
      'PARTIALLY_PAID': 'bg-blue-100 text-blue-800',
      'PAID': 'bg-green-100 text-green-800',
      'OVERDUE': 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading invoice...</div>
      </div>
    )
  }

  if (!invoice) {
    return null
  }

  const balanceDue = invoice.total_amount - invoice.paid_amount

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/sales/invoices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{invoice.invoice_number}</h1>
            <p className="text-gray-500 mt-1">Sales Invoice Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.payment_status)}`}>
            {invoice.payment_status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Invoice Number:</span>
              <span className="font-medium">{invoice.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Client:</span>
              <span className="font-medium">{invoice.client?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Invoice Date:</span>
              <span className="font-medium">{new Date(invoice.invoice_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Due Date:</span>
              <span className="font-medium">{new Date(invoice.due_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Terms:</span>
              <span className="font-medium">{invoice.payment_terms_days} days</span>
            </div>
            {invoice.purchase_order_id && (
              <div className="flex justify-between">
                <span className="text-gray-500">Sales Order:</span>
                <Link
                  href={`/dashboard/sales/orders/${invoice.purchase_order_id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  View SO
                </Link>
              </div>
            )}
            {invoice.notes && (
              <div className="pt-3 border-t">
                <span className="text-gray-500 block mb-1">Notes:</span>
                <p className="text-sm">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-lg">
              <span className="text-gray-500">Subtotal:</span>
              <span className="font-medium">${invoice.subtotal_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-gray-500">Tax:</span>
              <span className="font-medium">${invoice.tax_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold border-t pt-3">
              <span>Total:</span>
              <span>${invoice.total_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg border-t pt-3">
              <span className="text-gray-500">Paid Amount:</span>
              <span className="font-medium text-green-600">${invoice.paid_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold border-t pt-3">
              <span>Balance Due:</span>
              <span className={balanceDue > 0 ? 'text-red-600' : 'text-green-600'}>
                ${balanceDue.toFixed(2)}
              </span>
            </div>
            {invoice.payment_method && (
              <>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-gray-500">Payment Method:</span>
                  <span className="font-medium">{invoice.payment_method}</span>
                </div>
                {invoice.payment_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment Date:</span>
                    <span className="font-medium">{new Date(invoice.payment_date).toLocaleDateString()}</span>
                  </div>
                )}
                {invoice.payment_reference && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment Reference:</span>
                    <span className="font-medium">{invoice.payment_reference}</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Line Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product_sku}</TableCell>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">${item.unit_price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${item.line_total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isAccountantOrAdmin && (
        <div className="flex justify-between">
          <div>
            {invoice.payment_status === 'UNPAID' && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? 'Deleting...' : 'Delete Invoice'}
              </Button>
            )}
          </div>
          <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <DollarSign className="h-4 w-4 mr-2" />
                Update Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Payment</DialogTitle>
                <DialogDescription>
                  Record a payment for this invoice
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="paidAmount">Paid Amount *</Label>
                  <Input
                    id="paidAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={invoice.total_amount}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-sm text-gray-500">
                    Total: ${invoice.total_amount.toFixed(2)} | Balance: ${(invoice.total_amount - paidAmount).toFixed(2)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Input
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    placeholder="e.g., Bank Transfer, Check, Cash"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentDate">Payment Date</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentReference">Payment Reference</Label>
                  <Input
                    id="paymentReference"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="e.g., Transaction ID, Check Number"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPaymentDialogOpen(false)}
                  disabled={updating}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdatePayment} disabled={updating}>
                  {updating ? 'Updating...' : 'Update Payment'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  )
}
