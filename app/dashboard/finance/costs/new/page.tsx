'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, DollarSign } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { env } from '@/lib/config/env'
import { useAuthStore } from '@/lib/stores/auth-store'
import { toast } from 'sonner'

const costSchema = z.object({
  month: z.string().refine(
    (val) => {
      const num = parseInt(val)
      return !isNaN(num) && num >= 1 && num <= 12
    },
    'Month must be between 1 and 12'
  ),
  year: z.string().refine(
    (val) => {
      const num = parseInt(val)
      return !isNaN(num) && num >= 2020 && num <= 2100
    },
    'Please enter a valid year'
  ),
  rent: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    'Rent must be a positive number or zero'
  ),
  utilities: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    'Utilities must be a positive number or zero'
  ),
  labor: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    'Labor must be a positive number or zero'
  ),
  misc: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    'Miscellaneous must be a positive number or zero'
  ),
  estimated_total: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    'Estimated total must be a positive number or zero'
  )
})

type CostFormData = z.infer<typeof costSchema>

export default function NewIndirectCostPage() {
  const router = useRouter()
  const token = useAuthStore((state) => state.token)
  const [loading, setLoading] = useState(false)

  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<CostFormData>({
    resolver: zodResolver(costSchema),
    defaultValues: {
      month: currentMonth.toString(),
      year: currentYear.toString(),
      rent: '0',
      utilities: '0',
      labor: '0',
      misc: '0',
      estimated_total: '0'
    }
  })

  const watchedValues = watch()
  const calculatedTotal =
    (parseFloat(watchedValues.rent) || 0) +
    (parseFloat(watchedValues.utilities) || 0) +
    (parseFloat(watchedValues.labor) || 0) +
    (parseFloat(watchedValues.misc) || 0)

  const onSubmit = async (data: CostFormData) => {
    try {
      setLoading(true)

      const response = await fetch(`${env.apiBase}/api/v1/finance/costs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          month: parseInt(data.month),
          year: parseInt(data.year),
          rent: parseFloat(data.rent),
          utilities: parseFloat(data.utilities),
          labor: parseFloat(data.labor),
          misc: parseFloat(data.misc),
          estimated_total: parseFloat(data.estimated_total)
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to record costs')
      }

      const result = await response.json()
      toast.success('Indirect costs recorded successfully!')
      router.push('/dashboard/finance/costs')
    } catch (error) {
      console.error('Error recording costs:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to record costs')
    } finally {
      setLoading(false)
    }
  }

  const getMonthName = (month: string) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December']
    const idx = parseInt(month) - 1
    return months[idx] || 'Unknown'
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button and Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/finance/costs')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Costs
        </Button>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Record Indirect Costs
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Record monthly overhead costs for cost calculation
        </p>
      </div>

      {/* Info Alert */}
      <Alert className="bg-blue-50 border-blue-200">
        <DollarSign className="h-4 w-4 text-blue-600" />
        <div className="ml-2">
          <h3 className="text-sm font-semibold text-blue-900">Cost Recording Guidelines</h3>
          <p className="text-sm text-blue-800 mt-1">
            Record all overhead costs for a specific month. These costs will be used to calculate
            the Cost of Goods Manufactured (HPP) by distributing overhead across production.
          </p>
        </div>
      </Alert>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Period Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="month">
                  Month <span className="text-red-500">*</span>
                </Label>
                <select
                  id="month"
                  {...register('month')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {month} - {getMonthName(month.toString())}
                    </option>
                  ))}
                </select>
                {errors.month && (
                  <p className="text-sm text-red-600">{errors.month.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">
                  Year <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="year"
                  type="number"
                  {...register('year')}
                  disabled={loading}
                />
                {errors.year && (
                  <p className="text-sm text-red-600">{errors.year.message}</p>
                )}
              </div>
            </div>

            {/* Period Display */}
            <Card className="bg-gray-50">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Recording costs for:</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {getMonthName(watchedValues.month)} {watchedValues.year}
                </p>
              </CardContent>
            </Card>

            {/* Cost Categories */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Cost Categories</h3>

              <div className="space-y-2">
                <Label htmlFor="rent">
                  Rent & Facility Costs <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <Input
                    id="rent"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-7"
                    {...register('rent')}
                    disabled={loading}
                  />
                </div>
                {errors.rent && (
                  <p className="text-sm text-red-600">{errors.rent.message}</p>
                )}
                <p className="text-xs text-gray-500">Building rent, property taxes, insurance</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="utilities">
                  Utilities <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <Input
                    id="utilities"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-7"
                    {...register('utilities')}
                    disabled={loading}
                  />
                </div>
                {errors.utilities && (
                  <p className="text-sm text-red-600">{errors.utilities.message}</p>
                )}
                <p className="text-xs text-gray-500">Electricity, water, gas, internet</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="labor">
                  Labor Costs <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <Input
                    id="labor"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-7"
                    {...register('labor')}
                    disabled={loading}
                  />
                </div>
                {errors.labor && (
                  <p className="text-sm text-red-600">{errors.labor.message}</p>
                )}
                <p className="text-xs text-gray-500">Salaries, wages, benefits</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="misc">
                  Miscellaneous <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <Input
                    id="misc"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-7"
                    {...register('misc')}
                    disabled={loading}
                  />
                </div>
                {errors.misc && (
                  <p className="text-sm text-red-600">{errors.misc.message}</p>
                )}
                <p className="text-xs text-gray-500">Other overhead costs</p>
              </div>
            </div>

            {/* Calculated Total */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Calculated Total (Actual)</p>
                    <p className="text-xs text-blue-700 mt-1">Sum of all cost categories above</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    ${calculatedTotal.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Estimated Total */}
            <div className="space-y-2">
              <Label htmlFor="estimated_total">
                Estimated Total (Budget) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                <Input
                  id="estimated_total"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-7"
                  {...register('estimated_total')}
                  disabled={loading}
                />
              </div>
              {errors.estimated_total && (
                <p className="text-sm text-red-600">{errors.estimated_total.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Your budgeted/estimated overhead for this month (for variance analysis)
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/finance/costs')}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Recording...' : 'Record Costs'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
