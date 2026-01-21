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

const costEntrySchema = z.object({
  entry_date: z.string().min(1, 'Entry date is required'),
  category: z.string().min(1, 'Category is required'),
  amount: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    'Amount must be a positive number'
  ),
  description: z.string().min(1, 'Description is required')
})

type CostEntryFormData = z.infer<typeof costEntrySchema>

export default function NewCostEntryPage() {
  const router = useRouter()
  const token = useAuthStore((state) => state.token)
  const [loading, setLoading] = useState(false)

  const currentDate = new Date().toISOString().split('T')[0]

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<CostEntryFormData>({
    resolver: zodResolver(costEntrySchema),
    defaultValues: {
      entry_date: currentDate,
      category: 'MISC',
      amount: '',
      description: ''
    }
  })

  const selectedCategory = watch('category')

  const onSubmit = async (data: CostEntryFormData) => {
    try {
      setLoading(true)

      const response = await fetch(`${env.apiBase}/api/v1/finance/cost-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          entry_date: data.entry_date,
          category: data.category,
          amount: parseFloat(data.amount),
          description: data.description
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create cost entry')
      }

      toast.success('Cost entry created successfully!')
      router.push('/dashboard/finance/cost-entries')
    } catch (error) {
      console.error('Error creating cost entry:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create cost entry')
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    { value: 'RENT', label: 'Rent', description: 'Building rent, property taxes, insurance' },
    { value: 'UTILITIES', label: 'Utilities', description: 'Electricity, water, gas, internet' },
    { value: 'LABOR', label: 'Labor', description: 'Salaries, wages, benefits' },
    { value: 'FUEL', label: 'Fuel', description: 'Diesel, gasoline for equipment' },
    { value: 'GAS', label: 'Gas', description: 'Propane, natural gas for heating' },
    { value: 'TRANSPORTATION', label: 'Transportation', description: 'Vehicle costs, shipping, delivery' },
    { value: 'MAINTENANCE', label: 'Maintenance', description: 'Equipment repairs, facility upkeep' },
    { value: 'SUPPLIES', label: 'Supplies', description: 'Office supplies, cleaning materials' },
    { value: 'INSURANCE', label: 'Insurance', description: 'Business insurance premiums' },
    { value: 'DEPRECIATION', label: 'Depreciation', description: 'Equipment and asset depreciation' },
    { value: 'MISC', label: 'Miscellaneous', description: 'Other overhead costs' },
  ]

  const selectedCategoryInfo = categories.find(c => c.value === selectedCategory)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button and Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/finance/cost-entries')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Cost Entries
        </Button>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Add Cost Entry
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Record a new indirect cost entry with flexible date and category
        </p>
      </div>

      {/* Info Alert */}
      <Alert className="bg-blue-50 border-blue-200">
        <DollarSign className="h-4 w-4 text-blue-600" />
        <div className="ml-2">
          <h3 className="text-sm font-semibold text-blue-900">Flexible Cost Entry</h3>
          <p className="text-sm text-blue-800 mt-1">
            You can add multiple cost entries per day across different categories. For example, you can
            record fuel purchases today and tomorrow, or multiple expenses on the same day. All entries
            will be aggregated when calculating HPP for a period.
          </p>
        </div>
      </Alert>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Entry Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Entry Date */}
            <div className="space-y-2">
              <Label htmlFor="entry_date">
                Entry Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="entry_date"
                type="date"
                {...register('entry_date')}
                disabled={loading}
              />
              {errors.entry_date && (
                <p className="text-sm text-red-600">{errors.entry_date.message}</p>
              )}
              <p className="text-xs text-gray-500">
                The date when this cost was incurred
              </p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedCategory}
                onValueChange={(value) => setValue('category', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-600">{errors.category.message}</p>
              )}
              {selectedCategoryInfo && (
                <p className="text-xs text-gray-500">
                  {selectedCategoryInfo.description}
                </p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-7"
                  {...register('amount')}
                  disabled={loading}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-600">{errors.amount.message}</p>
              )}
              <p className="text-xs text-gray-500">
                The cost amount in your base currency
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Diesel for generator, Monthly office rent, Electricity bill for January..."
                {...register('description')}
                disabled={loading}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Provide details about this cost entry for future reference
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/finance/cost-entries')}
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
                {loading ? 'Creating...' : 'Create Entry'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
