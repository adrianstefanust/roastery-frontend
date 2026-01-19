'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ArrowLeft, Save, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { env } from '@/lib/config/env'
import { useAuthStore } from '@/lib/stores/auth-store'
import { toast } from 'sonner'

const grnSchema = z.object({
  lotNumber: z.string().min(1, 'Lot number is required'),
  sku: z.string().min(1, 'SKU is required'),
  initialWeight: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Initial weight must be a positive number'
  }),
  moistureContent: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 100,
    { message: 'Moisture content must be between 0 and 100' }
  ),
  purchaseCostPerKg: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Purchase cost must be a positive number'
  }),
  receivedAt: z.string().min(1, 'Received date is required')
})

type GRNFormData = z.infer<typeof grnSchema>

export default function CreateGRNPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const token = useAuthStore((state) => state.token)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<GRNFormData>({
    resolver: zodResolver(grnSchema),
    defaultValues: {
      lotNumber: '',
      sku: '',
      initialWeight: '',
      moistureContent: '',
      purchaseCostPerKg: '',
      receivedAt: new Date().toISOString().split('T')[0] // Today's date
    }
  })

  const onSubmit = async (data: GRNFormData) => {
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${env.apiBase}/api/v1/inventory/lots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          lot_number: data.lotNumber,
          sku: data.sku,
          initial_weight: parseFloat(data.initialWeight),
          moisture_content: parseFloat(data.moistureContent),
          purchase_cost_per_kg: parseFloat(data.purchaseCostPerKg),
          received_at: data.receivedAt
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create GRN')
      }

      const result = await response.json()

      toast.success('GRN created successfully', {
        description: `Lot ${data.lotNumber} has been added to inventory`
      })

      // Redirect to the new lot's detail page
      if (result.data?.id) {
        router.push(`/dashboard/inventory/lots/${result.data.id}`)
      } else {
        router.push('/dashboard/inventory/lots')
      }
    } catch (err: any) {
      console.error('Error creating GRN:', err)
      setError(err.message || 'An unexpected error occurred')
      toast.error('Failed to create GRN', {
        description: err.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Inventory
        </Button>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Package className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Create Goods Received Note (GRN)
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Add new green coffee lot to inventory
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Lot Information</CardTitle>
          <CardDescription>
            Enter the details of the received green coffee lot
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Lot Number */}
            <div className="space-y-2">
              <Label htmlFor="lotNumber">
                Lot Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lotNumber"
                type="text"
                placeholder="e.g., LOT-2024-001"
                disabled={loading}
                {...register('lotNumber')}
              />
              {errors.lotNumber && (
                <p className="text-sm text-red-500">{errors.lotNumber.message}</p>
              )}
            </div>

            {/* SKU */}
            <div className="space-y-2">
              <Label htmlFor="sku">
                SKU <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sku"
                type="text"
                placeholder="e.g., ETH-YIRG-001"
                disabled={loading}
                {...register('sku')}
              />
              {errors.sku && (
                <p className="text-sm text-red-500">{errors.sku.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Stock Keeping Unit for identification
              </p>
            </div>

            {/* Initial Weight */}
            <div className="space-y-2">
              <Label htmlFor="initialWeight">
                Initial Weight (kg) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="initialWeight"
                type="number"
                step="0.01"
                placeholder="e.g., 60.00"
                disabled={loading}
                {...register('initialWeight')}
              />
              {errors.initialWeight && (
                <p className="text-sm text-red-500">{errors.initialWeight.message}</p>
              )}
            </div>

            {/* Moisture Content */}
            <div className="space-y-2">
              <Label htmlFor="moistureContent">
                Moisture Content (%) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="moistureContent"
                type="number"
                step="0.1"
                placeholder="e.g., 12.5"
                disabled={loading}
                {...register('moistureContent')}
              />
              {errors.moistureContent && (
                <p className="text-sm text-red-500">{errors.moistureContent.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Acceptable range: 9-13% for optimal storage
              </p>
            </div>

            {/* Purchase Cost per KG */}
            <div className="space-y-2">
              <Label htmlFor="purchaseCostPerKg">
                Purchase Cost per KG ($) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="purchaseCostPerKg"
                type="number"
                step="0.01"
                placeholder="e.g., 8.50"
                disabled={loading}
                {...register('purchaseCostPerKg')}
              />
              {errors.purchaseCostPerKg && (
                <p className="text-sm text-red-500">{errors.purchaseCostPerKg.message}</p>
              )}
            </div>

            {/* Received Date */}
            <div className="space-y-2">
              <Label htmlFor="receivedAt">
                Received Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="receivedAt"
                type="date"
                disabled={loading}
                {...register('receivedAt')}
              />
              {errors.receivedAt && (
                <p className="text-sm text-red-500">{errors.receivedAt.message}</p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-none"
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Creating...' : 'Create GRN'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            What is a GRN?
          </h3>
          <p className="text-sm text-blue-800">
            A Goods Received Note documents the receipt of green coffee into your inventory.
            It tracks the initial weight, cost, and quality metrics of each lot. Once created,
            the lot will be available for roast batch production.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
