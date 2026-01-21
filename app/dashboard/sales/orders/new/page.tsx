'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShoppingBag, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FormattedNumberInput } from '@/components/ui/formatted-number-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { env } from '@/lib/config/env'
import { useAuthStore } from '@/lib/stores/auth-store'
import { toast } from 'sonner'
import type { Client } from '@/types'
import { formatNumber } from '@/lib/utils'

interface OrderItem {
  product_sku: string
  description: string
  quantity_kg: number
  unit_price: number
  total_price: number
}

export default function NewSalesOrderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)

  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [availableProducts, setAvailableProducts] = useState<Array<{ sku: string; available_qty: number }>>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  const [form, setForm] = useState({
    client_id: searchParams.get('client_id') || '',
    order_date: new Date().toISOString().split('T')[0],
    requested_delivery_date: '',
    notes: '',
    currency: user?.currency || 'USD',
  })

  const [items, setItems] = useState<OrderItem[]>([
    { product_sku: '', description: '', quantity_kg: 0, unit_price: 0, total_price: 0 }
  ])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchClients()
    fetchAvailableProducts()
  }, [])

  const fetchClients = async () => {
    try {
      setLoadingClients(true)
      const response = await fetch(`${env.apiBase}/api/v1/sales/clients?is_active=true`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch clients')
      }

      const data = await response.json()
      setClients(data.clients || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast.error('Failed to load clients')
    } finally {
      setLoadingClients(false)
    }
  }

  const fetchAvailableProducts = async () => {
    try {
      setLoadingProducts(true)

      // Fetch roast batches (correct endpoint)
      const response = await fetch(`${env.apiBase}/api/v1/roast-batches`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        console.warn('Failed to fetch roast batches')
        setAvailableProducts([])
        return
      }

      const data = await response.json()
      const batches = Array.isArray(data) ? data : (data.data || data.batches || [])

      // Group by product_sku and sum available quantities (only QC_PASSED/QC_APPROVED batches)
      const productMap = new Map<string, number>()
      batches.forEach((batch: any) => {
        // Only include QC_PASSED or QC_APPROVED batches with available inventory
        if ((batch.status === 'QC_PASSED' || batch.status === 'QC_APPROVED') && batch.product_sku && batch.weight_out > 0) {
          const currentQty = productMap.get(batch.product_sku) || 0
          // Use available_quantity_kg if it exists, otherwise use weight_out
          const availableQty = batch.available_quantity_kg !== undefined
            ? batch.available_quantity_kg
            : batch.weight_out
          productMap.set(batch.product_sku, currentQty + availableQty)
        }
      })

      // Convert to array
      const products = Array.from(productMap.entries())
        .map(([sku, available_qty]) => ({
          sku,
          available_qty
        }))
        .filter(p => p.available_qty > 0) // Only show products with available stock

      setAvailableProducts(products)
    } catch (error) {
      console.error('Error fetching products:', error)
      // Set empty array so UI shows "No products available" instead of crashing
      setAvailableProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }

  const updateItemTotal = (index: number, item: OrderItem) => {
    const total = item.quantity_kg * item.unit_price
    const newItems = [...items]
    newItems[index] = { ...item, total_price: total }
    setItems(newItems)
  }

  const addItem = () => {
    setItems([...items, { product_sku: '', description: '', quantity_kg: 0, unit_price: 0, total_price: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => sum + item.total_price, 0)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!form.client_id) {
      newErrors.client_id = 'Client is required'
    }

    if (!form.order_date) {
      newErrors.order_date = 'Order date is required'
    }

    const hasValidItems = items.some(item =>
      item.product_sku.trim() && item.quantity_kg > 0 && item.unit_price > 0
    )

    if (!hasValidItems) {
      newErrors.items = 'At least one valid item is required'
    }

    // Check for duplicate SKUs
    const skus = items.map(item => item.product_sku.trim()).filter(sku => sku)
    const duplicates = skus.filter((sku, index) => skus.indexOf(sku) !== index)
    if (duplicates.length > 0) {
      newErrors.items = `Duplicate SKUs found: ${duplicates.join(', ')}`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (shouldConfirm: boolean = false) => {
    if (!validateForm()) {
      toast.error('Please fix the validation errors')
      return
    }

    try {
      setSaving(true)

      // Filter out empty items
      const validItems = items.filter(item =>
        item.product_sku.trim() && item.quantity_kg > 0 && item.unit_price > 0
      )

      const orderData = {
        ...form,
        status: 'PENDING',
        total_amount: calculateGrandTotal(),
        items: validItems
      }

      const response = await fetch(`${env.apiBase}/api/v1/sales/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create sales order')
      }

      const data = await response.json()
      const salesOrder = data.sales_order || data
      const orderId = salesOrder.id

      // If user wants to confirm immediately, do so
      if (shouldConfirm) {
        const confirmResponse = await fetch(
          `${env.apiBase}/api/v1/sales/orders/${orderId}/confirm`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (!confirmResponse.ok) {
          toast.warning('Order created but confirmation failed. You can confirm it from the order detail page.')
        } else {
          toast.success('Sales order created and confirmed successfully!')
        }
      } else {
        toast.success('Sales order created successfully')
      }

      router.push(`/dashboard/sales/orders/${orderId}`)
    } catch (error: any) {
      console.error('Error creating sales order:', error)
      toast.error(error.message || 'Failed to create sales order')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href="/dashboard/sales/orders">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sales Orders
        </Link>
      </Button>

      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-100 rounded-lg">
          <ShoppingBag className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Create Sales Order
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Create a new sales order for roasted coffee
          </p>
        </div>
      </div>

      {/* Order Details */}
      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
          <CardDescription>
            Enter the basic information for the sales order.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">
                Client <span className="text-red-500">*</span>
              </Label>
              {loadingClients ? (
                <div className="text-sm text-gray-500">Loading clients...</div>
              ) : (
                <Select value={form.client_id} onValueChange={(value) => setForm({ ...form, client_id: value })}>
                  <SelectTrigger className={errors.client_id ? 'border-red-500' : ''}>
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
              )}
              {errors.client_id && (
                <p className="text-sm text-red-500">{errors.client_id}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="order_date">
                Order Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="order_date"
                type="date"
                value={form.order_date}
                onChange={(e) => setForm({ ...form, order_date: e.target.value })}
                className={errors.order_date ? 'border-red-500' : ''}
              />
              {errors.order_date && (
                <p className="text-sm text-red-500">{errors.order_date}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="requested_delivery_date">Requested Delivery Date</Label>
              <Input
                id="requested_delivery_date"
                type="date"
                value={form.requested_delivery_date}
                onChange={(e) => setForm({ ...form, requested_delivery_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={form.currency}
                disabled
                className="bg-gray-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">
                Currency is set based on your tenant settings
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Add any additional notes or instructions"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>
                Add line items for this sales order.
              </CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {errors.items && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.items}</p>
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Product SKU *</TableHead>
                  <TableHead className="w-[250px]">Description</TableHead>
                  <TableHead className="w-[120px]">Quantity (kg) *</TableHead>
                  <TableHead className="w-[120px]">Unit Price *</TableHead>
                  <TableHead className="w-[120px]">Total</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => {
                  const product = availableProducts.find(p => p.sku === item.product_sku)
                  const hasInsufficientStock = product && item.quantity_kg > product.available_qty

                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Select
                            value={item.product_sku || '__empty__'}
                            onValueChange={(value) => {
                              const newItems = [...items]
                              if (value !== '__empty__') {
                                newItems[index].product_sku = value
                              }
                              setItems(newItems)
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableProducts.length === 0 ? (
                                <SelectItem value="__empty__" disabled>
                                  No products available
                                </SelectItem>
                              ) : (
                                availableProducts.map((product) => (
                                  <SelectItem key={product.sku} value={product.sku}>
                                    {product.sku} ({formatNumber(product.available_qty)} kg available)
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          {hasInsufficientStock && (
                            <p className="text-xs text-red-600">
                              Only {formatNumber(product.available_qty)} kg available
                            </p>
                          )}
                        </div>
                      </TableCell>
                    <TableCell>
                      <Input
                        value={item.description}
                        onChange={(e) => {
                          const newItems = [...items]
                          newItems[index].description = e.target.value
                          setItems(newItems)
                        }}
                        placeholder="Description"
                      />
                    </TableCell>
                    <TableCell>
                      <FormattedNumberInput
                        value={item.quantity_kg || 0}
                        onChange={(value) => {
                          const newItem = { ...item, quantity_kg: value }
                          updateItemTotal(index, newItem)
                        }}
                        decimals={2}
                        placeholder="0,00"
                      />
                    </TableCell>
                    <TableCell>
                      <FormattedNumberInput
                        value={item.unit_price || 0}
                        onChange={(value) => {
                          const newItem = { ...item, unit_price: value }
                          updateItemTotal(index, newItem)
                        }}
                        decimals={2}
                        placeholder="0,00"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-right">
                        {formatNumber(item.total_price)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="text-right font-medium">
                    Grand Total:
                  </TableCell>
                  <TableCell colSpan={2} className="font-bold text-lg text-right">
                    {formatNumber(calculateGrandTotal())} {form.currency}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSubmit(false)}
          disabled={saving}
        >
          {saving ? 'Creating...' : 'Create Order'}
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={saving}
        >
          {saving ? 'Creating...' : 'Create & Confirm'}
        </Button>
      </div>
    </div>
  )
}
