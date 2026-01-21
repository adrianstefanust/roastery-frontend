'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Flame, Package, Calendar, Scale, TrendingDown, Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { env } from '@/lib/config/env'
import { useAuthStore } from '@/lib/stores/auth-store'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { RoastBatch } from '@/types'

const finishRoastingSchema = z.object({
  weight_out: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    'Weight must be a positive number'
  ),
  qc_passed: z.string().min(1, 'Please select QC status'),
  qc_notes: z.string().optional()
})

const submitQCSchema = z.object({
  aroma: z.string().refine(
    (val) => {
      const num = parseFloat(val)
      return !isNaN(num) && num >= 0 && num <= 10
    },
    'Score must be between 0 and 10'
  ),
  flavor: z.string().refine(
    (val) => {
      const num = parseFloat(val)
      return !isNaN(num) && num >= 0 && num <= 10
    },
    'Score must be between 0 and 10'
  ),
  aftertaste: z.string().refine(
    (val) => {
      const num = parseFloat(val)
      return !isNaN(num) && num >= 0 && num <= 10
    },
    'Score must be between 0 and 10'
  ),
  acidity: z.string().refine(
    (val) => {
      const num = parseFloat(val)
      return !isNaN(num) && num >= 0 && num <= 10
    },
    'Score must be between 0 and 10'
  ),
  body: z.string().refine(
    (val) => {
      const num = parseFloat(val)
      return !isNaN(num) && num >= 0 && num <= 10
    },
    'Score must be between 0 and 10'
  ),
  notes: z.string().optional()
})

type FinishRoastingData = z.infer<typeof finishRoastingSchema>
type SubmitQCData = z.infer<typeof submitQCSchema>

export default function BatchDetailPage() {
  const router = useRouter()
  const params = useParams()
  const batchId = params.id as string

  const [batch, setBatch] = useState<RoastBatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [finishDialogOpen, setFinishDialogOpen] = useState(false)
  const [qcDialogOpen, setQCDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const token = useAuthStore((state) => state.token)

  const finishRoastingForm = useForm<FinishRoastingData>({
    resolver: zodResolver(finishRoastingSchema)
  })

  const qcForm = useForm<SubmitQCData>({
    resolver: zodResolver(submitQCSchema),
    defaultValues: {
      aroma: '7',
      flavor: '7',
      aftertaste: '7',
      acidity: '7',
      body: '7',
      notes: ''
    }
  })

  useEffect(() => {
    if (batchId) {
      fetchBatch()
    }
  }, [batchId])

  const fetchBatch = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${env.apiBase}/api/v1/roast-batches/${batchId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 403) {
          toast.error(`Access denied: ${errorData.error || 'You do not have permission to view this batch'}`)
        } else {
          toast.error(errorData.error || 'Failed to fetch batch')
        }
        router.push('/dashboard/production/batches')
        return
      }

      const data = await response.json()
      setBatch(data)
    } catch (error) {
      console.error('Error fetching batch:', error)
      toast.error('Failed to load batch details')
      router.push('/dashboard/production/batches')
    } finally {
      setLoading(false)
    }
  }

  const handleFinishRoasting = async (data: FinishRoastingData) => {
    try {
      setSubmitting(true)

      // Step 1: Finish roasting
      const finishResponse = await fetch(`${env.apiBase}/api/v1/roast-batches/${batchId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          weight_out: parseFloat(data.weight_out)
        })
      })

      if (!finishResponse.ok) {
        const errorData = await finishResponse.json()
        if (finishResponse.status === 403) {
          toast.error(`Access denied: ${errorData.error || 'You do not have permission to finish roasting batches'}`)
        } else {
          toast.error(errorData.error || 'Failed to finish roasting')
        }
        return
      }

      // Step 2: Submit QC if user selected a status
      if (data.qc_passed) {
        const qcPassed = data.qc_passed === 'true'
        const qcResponse = await fetch(`${env.apiBase}/api/v1/roast-batches/${batchId}/qc`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            aroma: qcPassed ? 8.0 : 5.0,
            flavor: qcPassed ? 8.0 : 5.0,
            aftertaste: qcPassed ? 8.0 : 5.0,
            acidity: qcPassed ? 8.0 : 5.0,
            body: qcPassed ? 8.0 : 5.0,
            notes: data.qc_notes || (qcPassed ? 'Quality approved during roasting' : 'Quality issues detected')
          })
        })

        if (!qcResponse.ok) {
          const errorData = await qcResponse.json()
          toast.error(`Roasting completed but QC submission failed: ${errorData.error}`)
          await fetchBatch()
          return
        }

        toast.success(`Roasting completed and marked as ${qcPassed ? 'QC Passed' : 'QC Failed'}!`)
      } else {
        toast.success('Roasting completed successfully!')
      }

      setFinishDialogOpen(false)
      finishRoastingForm.reset()
      await fetchBatch() // Refresh batch data
    } catch (error) {
      console.error('Error finishing roasting:', error)
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        toast.error('Network error: Could not connect to server. Please check if the API is running.')
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to finish roasting')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitQC = async (data: SubmitQCData) => {
    try {
      setSubmitting(true)

      const response = await fetch(`${env.apiBase}/api/v1/roast-batches/${batchId}/qc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          aroma: parseFloat(data.aroma),
          flavor: parseFloat(data.flavor),
          aftertaste: parseFloat(data.aftertaste),
          acidity: parseFloat(data.acidity),
          body: parseFloat(data.body),
          notes: data.notes || ''
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 403) {
          toast.error(`Access denied: ${errorData.error || 'You do not have permission to submit QC'}`)
        } else {
          toast.error(errorData.error || 'Failed to submit QC')
        }
        return
      }

      toast.success('Quality control submitted successfully!')
      setQCDialogOpen(false)
      qcForm.reset()
      await fetchBatch() // Refresh batch data
    } catch (error) {
      console.error('Error submitting QC:', error)
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        toast.error('Network error: Could not connect to server. Please check if the API is running.')
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to submit QC')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING_ROAST':
        return 'bg-yellow-100 text-yellow-800'
      case 'ROASTED':
      case 'PENDING_APPROVAL':
        return 'bg-orange-100 text-orange-800'
      case 'QC_PASSED':
      case 'QC_APPROVED':
        return 'bg-green-100 text-green-800'
      case 'QC_FAILED':
        return 'bg-red-100 text-red-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING_ROAST':
        return 'Pending Roast'
      case 'ROASTED':
      case 'PENDING_APPROVAL':
        return 'Pending QC'
      case 'QC_PASSED':
      case 'QC_APPROVED':
        return 'QC Passed'
      case 'QC_FAILED':
        return 'QC Failed'
      case 'IN_PROGRESS':
        return 'In Progress'
      default:
        return status
    }
  }

  const calculateShrinkage = () => {
    if (!batch || !batch.weight_out || batch.weight_out === 0) return null
    return ((batch.weight_in - batch.weight_out) / batch.weight_in) * 100
  }

  const formatDate = (dateString: string | null | undefined, formatStr: string = 'MMM d, yyyy HH:mm') => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid date'
      return format(date, formatStr)
    } catch {
      return 'Invalid date'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-gray-500">Loading batch details...</div>
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Batch not found</p>
      </div>
    )
  }

  const shrinkage = calculateShrinkage()

  return (
    <div className="space-y-6">
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

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Batch Details
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {batch.batch_number || `Batch ${batch.id.slice(0, 8)}`}
            </p>
          </div>
          <Badge className={getStatusBadgeColor(batch.status)}>
            {getStatusLabel(batch.status)}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Weight In</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {batch.weight_in.toFixed(2)} kg
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <Scale className="w-6 h-6 text-amber-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Weight Out</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {batch.weight_out ? `${batch.weight_out.toFixed(2)} kg` : '-'}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Package className="w-6 h-6 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Shrinkage</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {shrinkage !== null ? `${shrinkage.toFixed(2)}%` : '-'}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Created</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {formatDate(batch.created_at, 'MMM d, yyyy')}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batch Information */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Batch ID</h3>
              <p className="text-sm text-gray-900 font-mono">{batch.id}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Batch Number</h3>
              <p className="text-sm text-gray-900">
                {batch.batch_number || 'Not assigned'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Green Coffee Lot ID</h3>
              <p className="text-sm text-gray-900 font-mono">{batch.lot_id}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
              <Badge className={getStatusBadgeColor(batch.status)}>
                {getStatusLabel(batch.status)}
              </Badge>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Weight In (Green)</h3>
              <p className="text-sm text-gray-900">{batch.weight_in.toFixed(2)} kg</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Weight Out (Roasted)</h3>
              <p className="text-sm text-gray-900">
                {batch.weight_out ? `${batch.weight_out.toFixed(2)} kg` : 'Not roasted yet'}
              </p>
            </div>
            {shrinkage !== null && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Shrinkage Percentage</h3>
                <p className="text-sm text-gray-900">{shrinkage.toFixed(2)}%</p>
              </div>
            )}
            {batch.roasted_at && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Roasted At</h3>
                <p className="text-sm text-gray-900">
                  {formatDate(batch.roasted_at)}
                </p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Created At</h3>
              <p className="text-sm text-gray-900">
                {formatDate(batch.created_at)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h3>
              <p className="text-sm text-gray-900">
                {formatDate(batch.updated_at)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {batch.status === 'PENDING_ROAST' && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-amber-900 mb-1">
                  Batch is Pending Roast
                </h3>
                <p className="text-sm text-amber-800">
                  This batch is ready to be roasted. Update the status once roasting is complete.
                </p>
              </div>
              <Button
                variant="default"
                className="ml-4"
                onClick={() => setFinishDialogOpen(true)}
              >
                <Flame className="mr-2 h-4 w-4" />
                Finish Roasting
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {batch.status === 'ROASTED' && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Quality Control Pending
                </h3>
                <p className="text-sm text-blue-800">
                  This batch has been roasted and is waiting for quality control inspection.
                </p>
              </div>
              <Button
                variant="default"
                className="ml-4"
                onClick={() => setQCDialogOpen(true)}
              >
                Submit QC
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Finish Roasting Dialog */}
      <Dialog open={finishDialogOpen} onOpenChange={setFinishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finish Roasting</DialogTitle>
          </DialogHeader>
          <form onSubmit={finishRoastingForm.handleSubmit(handleFinishRoasting)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weight_out">
                Roasted Coffee Weight (kg) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="weight_out"
                type="number"
                step="0.01"
                placeholder="e.g., 45.50"
                {...finishRoastingForm.register('weight_out')}
                disabled={submitting}
              />
              {finishRoastingForm.formState.errors.weight_out && (
                <p className="text-sm text-red-600">
                  {finishRoastingForm.formState.errors.weight_out.message}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Weight in: {batch?.weight_in.toFixed(2)} kg
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qc_passed">
                Quality Control Status <span className="text-red-500">*</span>
              </Label>
              <select
                id="qc_passed"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...finishRoastingForm.register('qc_passed')}
                disabled={submitting}
              >
                <option value="">Select QC Status</option>
                <option value="true">QC Passed ✓</option>
                <option value="false">QC Failed ✗</option>
              </select>
              {finishRoastingForm.formState.errors.qc_passed && (
                <p className="text-sm text-red-600">
                  {finishRoastingForm.formState.errors.qc_passed.message}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Choose whether this batch passes quality control
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qc_notes">
                QC Notes (Optional)
              </Label>
              <textarea
                id="qc_notes"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any quality notes or observations..."
                {...finishRoastingForm.register('qc_notes')}
                disabled={submitting}
              />
              <p className="text-xs text-gray-500">
                Optional notes about the roast quality
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFinishDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                <Save className="mr-2 h-4 w-4" />
                {submitting ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Submit QC Dialog */}
      <Dialog open={qcDialogOpen} onOpenChange={setQCDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Quality Control</DialogTitle>
          </DialogHeader>
          <form onSubmit={qcForm.handleSubmit(handleSubmitQC)} className="space-y-4">
            <p className="text-sm text-gray-600">
              Rate each attribute on a scale of 0-10 (10 being excellent)
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aroma">Aroma <span className="text-red-500">*</span></Label>
                <Input
                  id="aroma"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  {...qcForm.register('aroma')}
                  disabled={submitting}
                />
                {qcForm.formState.errors.aroma && (
                  <p className="text-sm text-red-600">{qcForm.formState.errors.aroma.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="flavor">Flavor <span className="text-red-500">*</span></Label>
                <Input
                  id="flavor"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  {...qcForm.register('flavor')}
                  disabled={submitting}
                />
                {qcForm.formState.errors.flavor && (
                  <p className="text-sm text-red-600">{qcForm.formState.errors.flavor.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="aftertaste">Aftertaste <span className="text-red-500">*</span></Label>
                <Input
                  id="aftertaste"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  {...qcForm.register('aftertaste')}
                  disabled={submitting}
                />
                {qcForm.formState.errors.aftertaste && (
                  <p className="text-sm text-red-600">{qcForm.formState.errors.aftertaste.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="acidity">Acidity <span className="text-red-500">*</span></Label>
                <Input
                  id="acidity"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  {...qcForm.register('acidity')}
                  disabled={submitting}
                />
                {qcForm.formState.errors.acidity && (
                  <p className="text-sm text-red-600">{qcForm.formState.errors.acidity.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Body <span className="text-red-500">*</span></Label>
                <Input
                  id="body"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  {...qcForm.register('body')}
                  disabled={submitting}
                />
                {qcForm.formState.errors.body && (
                  <p className="text-sm text-red-600">{qcForm.formState.errors.body.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Tasting Notes (Optional)</Label>
              <textarea
                id="notes"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Chocolate, nutty, citrus hints..."
                {...qcForm.register('notes')}
                disabled={submitting}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setQCDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                <Save className="mr-2 h-4 w-4" />
                {submitting ? 'Submitting...' : 'Submit QC'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
