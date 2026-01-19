'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Flame, AlertTriangle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { env } from '@/lib/config/env'
import { useAuthStore } from '@/lib/stores/auth-store'
import { toast } from 'sonner'
import type { GreenCoffeeLot } from '@/types'

const batchSchema = z.object({
  lot_id: z.string().min(1, 'Please select a green coffee lot'),
  weight_in: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    'Weight must be a positive number'
  )
})

type BatchFormData = z.infer<typeof batchSchema>

export default function NewBatchPage() {
  const router = useRouter()
  const token = useAuthStore((state) => state.token)
  const [lots, setLots] = useState<GreenCoffeeLot[]>([])
  const [loading, setLoading] = useState(false)
  const [lotsLoading, setLotsLoading] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<BatchFormData>({
    resolver: zodResolver(batchSchema)
  })

  const selectedLotId = watch('lot_id')
  const selectedLot = lots.find((lot) => lot.id === selectedLotId)

  useEffect(() => {
    fetchLots()
  }, [])

  const fetchLots = async () => {
    try {
      setLotsLoading(true)
      const response = await fetch(`${env.apiBase}/api/v1/inventory/lots`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch lots')
      }

      const data = await response.json()
      // Only show lots with weight > 0
      const availableLots = (data.data || []).filter(
        (lot: GreenCoffeeLot) => lot.current_weight > 0
      )
      setLots(availableLots)
    } catch (error) {
      console.error('Error fetching lots:', error)
      toast.error('Failed to load green coffee lots')
    } finally {
      setLotsLoading(false)
    }
  }

  const onSubmit = async (data: BatchFormData) => {
    try {
      setLoading(true)

      const response = await fetch(`${env.apiBase}/api/v1/roast-batches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          lot_id: data.lot_id,
          weight_in: parseFloat(data.weight_in)
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create batch')
      }

      const result = await response.json()
      toast.success('Roast batch created successfully!')
      router.push(`/dashboard/production/batches/${result.id}`)
    } catch (error) {
      console.error('Error creating batch:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create batch')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button and Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/production/batches')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Batches
        </Button>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Create New Roast Batch
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Start a new roasting batch from available green coffee lots
        </p>
      </div>

      {/* Info Alert */}
      <Alert className="bg-blue-50 border-blue-200">
        <Flame className="h-4 w-4 text-blue-600" />
        <div className="ml-2">
          <h3 className="text-sm font-semibold text-blue-900">Before You Start</h3>
          <p className="text-sm text-blue-800 mt-1">
            Select a green coffee lot with available weight. The batch will be created with status "Pending Roast"
            and can be updated once roasting is complete.
          </p>
        </div>
      </Alert>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Green Coffee Lot Selection */}
            <div className="space-y-2">
              <Label htmlFor="lot_id">
                Green Coffee Lot <span className="text-red-500">*</span>
              </Label>
              <select
                id="lot_id"
                {...register('lot_id')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={lotsLoading}
              >
                <option value="">
                  {lotsLoading ? 'Loading lots...' : 'Select a green coffee lot'}
                </option>
                {lots.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    {lot.sku} - {lot.current_weight.toFixed(2)} kg available
                  </option>
                ))}
              </select>
              {errors.lot_id && (
                <p className="text-sm text-red-600">{errors.lot_id.message}</p>
              )}
            </div>

            {/* Selected Lot Info */}
            {selectedLot && (
              <Card className="bg-gray-50">
                <CardContent className="pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Selected Lot Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">SKU:</span>
                      <span className="ml-2 font-medium text-gray-900">{selectedLot.sku}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Available:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {selectedLot.current_weight.toFixed(2)} kg
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Moisture:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {selectedLot.moisture_content.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Cost per kg (WAC):</span>
                      <span className="ml-2 font-medium text-gray-900">
                        ${(selectedLot.unit_cost_wac || selectedLot.purchase_cost_per_kg || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weight In */}
            <div className="space-y-2">
              <Label htmlFor="weight_in">
                Green Coffee Weight (kg) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="weight_in"
                type="number"
                step="0.01"
                placeholder="e.g., 50.00"
                {...register('weight_in')}
                disabled={loading}
              />
              {errors.weight_in && (
                <p className="text-sm text-red-600">{errors.weight_in.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Enter the weight of green coffee beans to roast
              </p>
            </div>

            {/* Weight Validation Warning */}
            {selectedLot && watch('weight_in') && parseFloat(watch('weight_in')) > selectedLot.current_weight && (
              <Alert className="bg-red-50 border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="ml-2 text-sm text-red-800">
                  Weight exceeds available lot weight ({selectedLot.current_weight.toFixed(2)} kg)
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/production/batches')}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || lotsLoading}
                className="flex-1"
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Creating...' : 'Create Batch'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            What happens next?
          </h3>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
            <li>Batch will be created with status "Pending Roast"</li>
            <li>Selected green coffee weight will be reserved from the lot</li>
            <li>You can update the batch with roasted weight once complete</li>
            <li>Quality control can be performed after roasting</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
