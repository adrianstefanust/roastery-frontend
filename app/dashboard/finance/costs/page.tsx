'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { env } from '@/lib/config/env'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useCurrency } from '@/lib/hooks/use-currency'
import { toast } from 'sonner'
import type { IndirectCost } from '@/types'

export default function IndirectCostsPage() {
  const router = useRouter()
  const [costs, setCosts] = useState<IndirectCost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const token = useAuthStore((state) => state.token)
  const { symbol, icon: CurrencyIcon } = useCurrency()

  useEffect(() => {
    fetchCosts()
  }, [])

  const fetchCosts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${env.apiBase}/api/v1/finance/costs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch costs')
      }

      const data = await response.json()
      setCosts(data.data || [])
    } catch (error) {
      console.error('Error fetching costs:', error)
      toast.error('Failed to load indirect costs')
    } finally {
      setLoading(false)
    }
  }

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months[month - 1] || 'Unknown'
  }

  const filteredCosts = costs.filter((cost) =>
    `${getMonthName(cost.month)} ${cost.year}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
            Indirect Costs
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage monthly overhead costs (rent, utilities, labor, etc.)
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/finance/costs/new">
            <Plus className="mr-2 h-4 w-4" />
            Record Costs
          </Link>
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by month and year..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Costs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CurrencyIcon className="h-5 w-5" />
            All Indirect Costs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse text-gray-500">Loading costs...</div>
            </div>
          ) : filteredCosts.length === 0 ? (
            <div className="text-center py-12">
              <CurrencyIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No costs found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? 'Try adjusting your search' : 'Get started by recording monthly indirect costs'}
              </p>
              {!searchQuery && (
                <div className="mt-6">
                  <Button asChild>
                    <Link href="/dashboard/finance/costs/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Record Costs
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
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Period</th>
                    <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">Total Pool</th>
                    <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">Estimated</th>
                    <th className="text-center py-3 px-4 font-medium text-sm text-gray-700">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCosts.map((cost) => (
                    <tr key={cost.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {getMonthName(cost.month)} {cost.year}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                        {symbol}{cost.total_actual?.toLocaleString() || '0'}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-gray-600">
                        {symbol}{cost.estimated_total?.toLocaleString() || '0'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={cost.is_closed ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}>
                          {cost.is_closed ? 'Closed' : 'Open'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/finance/costs/${cost.id}`)}
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
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-amber-900 mb-3">
            About Indirect Costs
          </h3>
          <div className="space-y-2 text-sm text-amber-800">
            <p>
              <strong>Indirect costs</strong> are monthly overhead expenses that cannot be directly attributed
              to specific products. These include:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Rent and facility costs</li>
              <li>Utilities (electricity, water, internet)</li>
              <li>Labor costs (salaries, wages)</li>
              <li>Miscellaneous overhead (insurance, maintenance, etc.)</li>
            </ul>
            <p className="mt-3">
              These costs are used to calculate the <strong>Cost of Goods Manufactured (HPP)</strong> by
              distributing overhead across all production for the period.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
