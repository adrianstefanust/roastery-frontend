'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Flame, Search, Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { env } from '@/lib/config/env'
import { useAuthStore } from '@/lib/stores/auth-store'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { RoastBatch } from '@/types'

export default function RoastBatchesPage() {
  const router = useRouter()
  const [batches, setBatches] = useState<RoastBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    fetchBatches()
  }, [])

  const fetchBatches = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${env.apiBase}/api/v1/roast-batches`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch batches')
      }

      const data = await response.json()
      setBatches(data?.data || [])
    } catch (error) {
      console.error('Error fetching batches:', error)
      toast.error('Failed to load roast batches')
    } finally {
      setLoading(false)
    }
  }

  const filteredBatches = batches.filter((batch) =>
    batch.batch_number?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING_ROAST':
        return 'bg-yellow-100 text-yellow-800'
      case 'ROASTED':
        return 'bg-orange-100 text-orange-800'
      case 'QC_PASSED':
        return 'bg-green-100 text-green-800'
      case 'QC_FAILED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING_ROAST':
        return 'Pending Roast'
      case 'ROASTED':
        return 'Roasted'
      case 'QC_PASSED':
        return 'QC Passed'
      case 'QC_FAILED':
        return 'QC Failed'
      default:
        return status
    }
  }

  const calculateShrinkage = (batch: RoastBatch) => {
    if (!batch.weight_out || batch.weight_out === 0) return null
    const shrinkage = ((batch.weight_in - batch.weight_out) / batch.weight_in) * 100
    return shrinkage.toFixed(2)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Roast Batches
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage coffee roasting production batches
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/production/batches/new">
            <Plus className="mr-2 h-4 w-4" />
            New Batch
          </Link>
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by batch number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Batches Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            All Batches
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse text-gray-500">Loading batches...</div>
            </div>
          ) : filteredBatches.length === 0 ? (
            <div className="text-center py-12">
              <Flame className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No batches found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? 'Try adjusting your search' : 'Get started by creating a new roast batch'}
              </p>
              {!searchQuery && (
                <div className="mt-6">
                  <Button asChild>
                    <Link href="/dashboard/production/batches/new">
                      <Plus className="mr-2 h-4 w-4" />
                      New Batch
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Batch #</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Weight In</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Weight Out</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Shrinkage</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Created</th>
                    <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBatches.map((batch) => (
                    <tr key={batch.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <Link
                          href={`/dashboard/production/batches/${batch.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          {batch.batch_number || batch.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {batch.weight_in.toFixed(2)} kg
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {batch.weight_out ? `${batch.weight_out.toFixed(2)} kg` : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {calculateShrinkage(batch) ? `${calculateShrinkage(batch)}%` : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusBadgeColor(batch.status)}>
                          {getStatusLabel(batch.status)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {format(new Date(batch.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/production/batches/${batch.id}`)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">
            Batch Status Guide
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-start gap-2">
              <Badge className="bg-yellow-100 text-yellow-800 mt-0.5">Pending Roast</Badge>
              <p>Batch created, waiting to be roasted</p>
            </div>
            <div className="flex items-start gap-2">
              <Badge className="bg-orange-100 text-orange-800 mt-0.5">Roasted</Badge>
              <p>Roasting completed, waiting for quality control</p>
            </div>
            <div className="flex items-start gap-2">
              <Badge className="bg-green-100 text-green-800 mt-0.5">QC Passed</Badge>
              <p>Quality control passed, ready for sale</p>
            </div>
            <div className="flex items-start gap-2">
              <Badge className="bg-red-100 text-red-800 mt-0.5">QC Failed</Badge>
              <p>Quality control failed, not suitable for sale</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
