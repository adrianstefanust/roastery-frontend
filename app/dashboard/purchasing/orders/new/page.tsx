'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, Plus, Trash2 } from 'lucide-react'
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
import type { Supplier } from '@/types'
import { formatNumber } from '@/lib/utils'

interface OrderItem {
  sku: string
  description: string
  quantity_kg: number
  unit_price: number
  total_price: number
}

export default function NewPurchaseOrderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(true)

  const [form, setForm] = useState({
    supplier_id: searchParams.get('supplier_id') || '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    notes: '',
    currency: user?.currency || 'USD',
  })

  const [items, setItems] = useState<OrderItem[]>([
    { sku: '', description: '', quantity_kg: 0, unit_price: 0, total_price: 0 }
  ])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      setLoadingSuppliers(true)
      const response = await fetch(`${env.apiBase}/api/v1/purchasing/suppliers?is_active=true`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch suppliers')
      }

      const data = await response.json()
      setSuppliers(data.suppliers || [])
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      toast.error('Failed to load suppliers')
    } finally {
      setLoadingSuppliers(false)
    }
  }

  const updateItemTotal = (index: number, item: OrderItem) => {
    const total = item.quantity_kg * item.unit_price
    const newItems = [...items]
    newItems[index] = { ...item, total_price: total }
    setItems(newItems)
  }

  const addItem = () => {
    setItems([...items, { sku: '', description: '', quantity_kg: 0, unit_price: 0, total_price: 0 }])
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

    if (!form.supplier_id) {
      newErrors.supplier_id = 'Supplier is required'
    }

    if (!form.order_date) {
      newErrors.order_date = 'Order date is required'
    }

    const hasValidItems = items.some(item =>
      item.sku.trim() && item.quantity_kg > 0 && item.unit_price > 0
    )

    if (!hasValidItems) {
      newErrors.items = 'At least one valid item is required'
    }

    // Check for duplicate SKUs
    const skus = items.map(item => item.sku.trim()).filter(sku => sku)
    const duplicates = skus.filter((sku, index) => skus.indexOf(sku) !== index)
    if (duplicates.length > 0) {
      newErrors.items = `Duplicate SKUs found: ${duplicates.join(', ')}`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (status: 'DRAFT' | 'SENT') => {
    if (!validateForm()) {
      toast.error('Please fix the validation errors')
      return
    }

    try {
      setSaving(true)

      // Filter out empty items
      const validItems = items.filter(item =>
        item.sku.trim() && item.quantity_kg > 0 && item.unit_price > 0
      )

      const orderData = {
        ...form,
        status,
        total_amount: calculateGrandTotal(),
        items: validItems
      }

      const response = await fetch(`${env.apiBase}/api/v1/purchasing/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create purchase order')
      }

      const data = await response.json()
      const purchaseOrder = data.purchase_order || data
      toast.success(`Purchase order ${status === 'DRAFT' ? 'saved as draft' : 'created and sent'}`)
      router.push(`/dashboard/purchasing/orders/${purchaseOrder.id}`)
    } catch (error: any) {
      console.error('Error creating purchase order:', error)
      toast.error(error.message || 'Failed to create purchase order')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href="/dashboard/purchasing/orders">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Purchase Orders
        </Link>
      </Button>

      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-orange-100 rounded-lg">
          <Package className="h-8 w-8 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Create Purchase Order
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Create a new purchase order for green coffee beans
          </p>
        </div>
      </div>

      {/* Order Details */}
      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
          <CardDescription>
            Enter the basic information for the purchase order.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier_id">
                Supplier <span className="text-red-500">*</span>
              </Label>
              {loadingSuppliers ? (
                <div className="text-sm text-gray-500">Loading suppliers...</div>
              ) : (
                <Select value={form.supplier_id} onValueChange={(value) => setForm({ ...form, supplier_id: value })}>
                  <SelectTrigger className={errors.supplier_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.supplier_id && (
                <p className="text-sm text-red-500">{errors.supplier_id}</p>
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
              <Label htmlFor="expected_delivery_date">Expected Delivery Date</Label>
              <Input
                id="expected_delivery_date"
                type="date"
                value={form.expected_delivery_date}
                onChange={(e) => setForm({ ...form, expected_delivery_date: e.target.value })}
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
                Add line items for this purchase order.
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
                  <TableHead className="w-[200px]">SKU *</TableHead>
                  <TableHead className="w-[250px]">Description</TableHead>
                  <TableHead className="w-[120px]">Quantity (kg) *</TableHead>
                  <TableHead className="w-[120px]">Unit Price *</TableHead>
                  <TableHead className="w-[120px]">Total</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Input
                        value={item.sku}
                        onChange={(e) => {
                          const newItems = [...items]
                          newItems[index].sku = e.target.value
                          setItems(newItems)
                        }}
                        placeholder="e.g., COL-EXCELSO"
                      />
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
                ))}
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
          onClick={() => handleSubmit('DRAFT')}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save as Draft'}
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit('SENT')}
          disabled={saving}
        >
          {saving ? 'Creating...' : 'Create & Send'}
        </Button>
      </div>
    </div>
  )
}
