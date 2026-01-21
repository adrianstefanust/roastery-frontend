'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { env } from '@/lib/config/env'
import { useAuthStore } from '@/lib/stores/auth-store'
import { toast } from 'sonner'
import type { Client, SalesOrder } from '@/types'

interface InvoiceItem {
  product_sku: string
  product_name: string
  quantity: number
  unit_price: number
  line_total: number
  notes?: string
}

export default function NewSalesInvoicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const soId = searchParams.get('so_id')
  const token = useAuthStore((state) => state.token)

  const [clients, setClients] = useState<Client[]>([])
  const [salesOrder, setSalesOrder] = useState<SalesOrder | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingSO, setLoadingSO] = useState(!!soId)

  // Form state
  const [clientId, setClientId] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentTermsDays, setPaymentTermsDays] = useState(30)
  const [taxAmount, setTaxAmount] = useState(0)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([
    { product_sku: '', product_name: '', quantity: 1, unit_price: 0, line_total: 0 }
  ])

  useEffect(() => {
    fetchClients()
    if (soId) {
      fetchSalesOrder(soId)
    }
  }, [soId])

  const fetchClients = async () => {
    try {
      const response = await fetch(`${env.apiBase}/api/v1/sales/clients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const fetchSalesOrder = async (id: string) => {
    try {
      setLoadingSO(true)
      const response = await fetch(`${env.apiBase}/api/v1/sales/orders/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        const so = data.sales_order || data

        if (!so || !so.client_id) {
          throw new Error('Invalid sales order data')
        }

        setSalesOrder(so)
        setClientId(so.client_id)

        // Pre-fill items from SO
        if (so.items && so.items.length > 0) {
          const soItems: InvoiceItem[] = so.items.map((item: any) => ({
            product_sku: item.product_sku,
            product_name: item.description || item.product_sku,
            quantity: item.quantity_kg,
            unit_price: item.unit_price,
            line_total: item.total_price || (item.unit_price * item.quantity_kg),
            notes: ''
          }))
          setItems(soItems)
        }
      } else {
        throw new Error('Failed to fetch sales order')
      }
    } catch (error) {
      console.error('Error fetching sales order:', error)
      toast.error('Failed to load sales order')
    } finally {
      setLoadingSO(false)
    }
  }

  const addItem = () => {
    setItems([...items, { product_sku: '', product_name: '', quantity: 1, unit_price: 0, line_total: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }

    // Recalculate line total
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].line_total = newItems[index].quantity * newItems[index].unit_price
    }

    setItems(newItems)
  }

  const subtotal = items.reduce((sum, item) => sum + item.line_total, 0)
  const total = subtotal + taxAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!clientId) {
      toast.error('Please select a client')
      return
    }

    if (items.some(item => !item.product_sku || !item.product_name || item.quantity <= 0)) {
      toast.error('Please fill all item fields correctly')
      return
    }

    setLoading(true)

    try {
      let url = `${env.apiBase}/api/v1/sales/invoices`
      let body: any = {
        invoice_date: invoiceDate,
        payment_terms_days: paymentTermsDays,
        tax_amount: taxAmount,
        notes: notes || undefined,
      }

      if (soId) {
        // Create from SO
        url = `${env.apiBase}/api/v1/sales/orders/${soId}/invoice`
      } else {
        // Create manual invoice
        body.client_id = clientId
        body.items = items.map(item => ({
          product_sku: item.product_sku,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          notes: item.notes || undefined
        }))
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create invoice')
      }

      const data = await response.json()
      toast.success('Invoice created successfully')
      router.push(`/dashboard/sales/invoices/${data.invoice.id}`)
    } catch (error: any) {
      console.error('Error creating invoice:', error)
      toast.error(error.message || 'Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  if (loadingSO) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading sales order...</div>
      </div>
    )
  }

  const isFromSO = !!soId && !!salesOrder

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/sales/invoices">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">
            {isFromSO ? `Generate Invoice from ${salesOrder?.so_number}` : 'New Sales Invoice'}
          </h1>
          <p className="text-gray-500 mt-1">Create a new sales invoice</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Select
                  value={clientId}
                  onValueChange={setClientId}
                  disabled={isFromSO}
                >
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceDate">Invoice Date *</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms (Days) *</Label>
                <Input
                  id="paymentTerms"
                  type="number"
                  min="0"
                  value={paymentTermsDays}
                  onChange={(e) => setPaymentTermsDays(parseInt(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxAmount">Tax Amount</Label>
                <Input
                  id="taxAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Line Items</CardTitle>
              {!isFromSO && (
                <Button type="button" onClick={addItem} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-12 md:col-span-2 space-y-2">
                    <Label>SKU *</Label>
                    <Input
                      value={item.product_sku}
                      onChange={(e) => updateItem(index, 'product_sku', e.target.value)}
                      required
                      disabled={isFromSO}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-3 space-y-2">
                    <Label>Product Name *</Label>
                    <Input
                      value={item.product_name}
                      onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                      required
                      disabled={isFromSO}
                    />
                  </div>
                  <div className="col-span-6 md:col-span-2 space-y-2">
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      required
                      disabled={isFromSO}
                    />
                  </div>
                  <div className="col-span-6 md:col-span-2 space-y-2">
                    <Label>Unit Price *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      required
                      disabled={isFromSO}
                    />
                  </div>
                  <div className="col-span-6 md:col-span-2 space-y-2">
                    <Label>Line Total</Label>
                    <Input
                      type="number"
                      value={item.line_total.toFixed(2)}
                      disabled
                    />
                  </div>
                  {!isFromSO && (
                    <div className="col-span-6 md:col-span-1">
                      <Button
                        type="button"
                        onClick={() => removeItem(index)}
                        size="sm"
                        variant="ghost"
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              <div className="border-t pt-4 mt-4">
                <div className="flex justify-end space-y-2">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Subtotal:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Tax:</span>
                      <span>${taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/dashboard/sales/invoices">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Invoice'}
          </Button>
        </div>
      </form>
    </div>
  )
}
