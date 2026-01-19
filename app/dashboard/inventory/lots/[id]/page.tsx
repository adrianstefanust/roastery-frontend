'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Package, Calendar, Droplets, Edit, Trash2, Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { env } from '@/lib/config/env'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useAuth } from '@/lib/hooks/use-auth'
import { useCurrency } from '@/lib/hooks/use-currency'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { GreenCoffeeLot } from '@/types'
import { formatNumber } from '@/lib/utils'

const editLotSchema = z.object({
  moisture_content: z.string().refine(
    (val) => {
      const num = parseFloat(val)
      return !isNaN(num) && num >= 0 && num <= 100
    },
    'Moisture must be between 0 and 100'
  ),
  purchase_cost_per_kg: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    'Cost must be a positive number'
  )
})

type EditLotData = z.infer<typeof editLotSchema>

export default function LotDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [lot, setLot] = useState<GreenCoffeeLot | null>(null)
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const token = useAuthStore((state) => state.token)
  const { isAdmin, isAccountant } = useAuth()
  const { symbol, icon: CurrencyIcon } = useCurrency()

  const editForm = useForm<EditLotData>({
    resolver: zodResolver(editLotSchema)
  })

  useEffect(() => {
    fetchLotDetails()
  }, [params.id])

  const fetchLotDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${env.apiBase}/api/v1/inventory/lots/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch lot details')
      }

      const data = await response.json()
      setLot(data.data)
    } catch (error) {
      console.error('Error fetching lot:', error)
      toast.error('Failed to load lot details')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenEditDialog = () => {
    if (lot) {
      editForm.setValue('moisture_content', lot.moisture_content.toString())
      editForm.setValue('purchase_cost_per_kg', lot.purchase_cost_per_kg?.toString() || '0')
      setEditDialogOpen(true)
    }
  }

  const handleEditLot = async (data: EditLotData) => {
    try {
      setSubmitting(true)

      const response = await fetch(`${env.apiBase}/api/v1/inventory/lots/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          moisture_content: parseFloat(data.moisture_content),
          purchase_cost_per_kg: parseFloat(data.purchase_cost_per_kg)
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update lot')
      }

      toast.success('Lot updated successfully!')
      setEditDialogOpen(false)
      await fetchLotDetails()
    } catch (error) {
      console.error('Error updating lot:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update lot')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteLot = async () => {
    try {
      setSubmitting(true)

      const response = await fetch(`${env.apiBase}/api/v1/inventory/lots/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete lot')
      }

      toast.success('Lot deleted successfully!')
      router.push('/dashboard/inventory/lots')
    } catch (error) {
      console.error('Error deleting lot:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete lot')
      setDeleteDialogOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800'
      case 'DEPLETED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-gray-500">Loading lot details...</div>
      </div>
    )
  }

  if (!lot) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Lot not found</h3>
        <p className="mt-1 text-sm text-gray-500">This lot may have been deleted or doesn't exist</p>
        <div className="mt-6">
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Inventory
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {lot.lot_number}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              SKU: {lot.sku}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(lot.status)}>
              {lot.status}
            </Badge>
            {(isAdmin || isAccountant) && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenEditDialog}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Current Weight</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatNumber(lot.current_weight)} kg
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CurrencyIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Cost per KG</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {symbol}{lot.weighted_avg_cost.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Droplets className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Moisture</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {lot.moisture_content.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Received</p>
                <p className="text-xl font-semibold text-gray-900">
                  {format(new Date(lot.received_at), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Lot Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Lot Number</h3>
              <p className="mt-1 text-base font-semibold text-gray-900">{lot.lot_number}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">SKU</h3>
              <p className="mt-1 text-base font-semibold text-gray-900">{lot.sku}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Initial Weight</h3>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {formatNumber(lot.initial_weight)} kg
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Current Weight</h3>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {formatNumber(lot.current_weight)} kg
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Purchase Cost per KG</h3>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {symbol}{formatNumber(lot.purchase_cost_per_kg || 0)}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Weighted Avg Cost</h3>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {symbol}{formatNumber(lot.weighted_avg_cost)}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Moisture Content</h3>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {formatNumber(lot.moisture_content, 1)}%
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <Badge className={`mt-1 ${getStatusColor(lot.status)}`}>
                {lot.status}
              </Badge>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Received Date</h3>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {format(new Date(lot.received_at), 'MMMM d, yyyy')}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Created At</h3>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {format(new Date(lot.created_at), 'MMMM d, yyyy HH:mm')}
              </p>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Calculated Values */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Calculated Values</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-500">Weight Used</p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {formatNumber(lot.initial_weight - lot.current_weight)} kg
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-500">Usage %</p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {formatNumber((1 - lot.current_weight / lot.initial_weight) * 100, 1)}%
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-500">Total Value</p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {symbol}{formatNumber(lot.current_weight * lot.weighted_avg_cost)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Lot Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Coffee Lot</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEditLot)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="moisture_content">
                Moisture Content (%) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="moisture_content"
                type="number"
                step="0.1"
                {...editForm.register('moisture_content')}
                disabled={submitting}
              />
              {editForm.formState.errors.moisture_content && (
                <p className="text-sm text-red-600">
                  {editForm.formState.errors.moisture_content.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_cost_per_kg">
                Purchase Cost per kg ($) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="purchase_cost_per_kg"
                type="number"
                step="0.01"
                {...editForm.register('purchase_cost_per_kg')}
                disabled={submitting}
              />
              {editForm.formState.errors.purchase_cost_per_kg && (
                <p className="text-sm text-red-600">
                  {editForm.formState.errors.purchase_cost_per_kg.message}
                </p>
              )}
            </div>

            <p className="text-xs text-gray-500">
              Note: Only moisture content and purchase cost can be edited. SKU, lot number, and weights cannot be changed.
            </p>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                <Save className="mr-2 h-4 w-4" />
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Lot Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Coffee Lot</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this lot? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm font-medium text-red-900">Lot Details:</p>
              <p className="text-sm text-red-800 mt-1">SKU: {lot?.sku}</p>
              <p className="text-sm text-red-800">Lot Number: {lot?.lot_number}</p>
              <p className="text-sm text-red-800">Current Weight: {lot?.current_weight.toFixed(2)} kg</p>
            </div>
            <p className="text-sm text-gray-600">
              This will permanently remove all data associated with this lot from the system.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteLot}
              disabled={submitting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {submitting ? 'Deleting...' : 'Delete Lot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
