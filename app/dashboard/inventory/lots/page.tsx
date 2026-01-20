'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Package, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { env } from '@/lib/config/env'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useCurrency } from '@/lib/hooks/use-currency'
import { toast } from 'sonner'
import type { GreenCoffeeLot } from '@/types'

export default function InventoryLotsPage() {
  const searchParams = useSearchParams()
  const skuParam = searchParams.get('sku')
  const [lots, setLots] = useState<GreenCoffeeLot[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(skuParam || '')
  const token = useAuthStore((state) => state.token)
  const { symbol } = useCurrency()

  useEffect(() => {
    fetchLots()
  }, [])

  useEffect(() => {
    if (skuParam) {
      setSearchQuery(skuParam)
    }
  }, [skuParam])

  const fetchLots = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${env.apiBase}/api/v1/inventory/lots`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch lots')
      }

      const data = await response.json()
      setLots(data.data || [])
    } catch (error) {
      console.error('Error fetching lots:', error)
      toast.error('Failed to load inventory lots')
    } finally {
      setLoading(false)
    }
  }

  const filteredLots = lots.filter((lot) =>
    lot.sku.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Green Coffee Inventory
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your green coffee lots and stock
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/inventory/grn">
            <Plus className="mr-2 h-4 w-4" />
            New GRN
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lots Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Coffee Lots
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse text-gray-500">Loading lots...</div>
            </div>
          ) : filteredLots.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No lots found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? 'Try adjusting your search' : 'Create your first GRN to add inventory'}
              </p>
              {!searchQuery && (
                <div className="mt-6">
                  <Button asChild>
                    <Link href="/dashboard/inventory/grn">
                      <Plus className="mr-2 h-4 w-4" />
                      Create GRN
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
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">SKU</th>
                    <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">Current Weight (kg)</th>
                    <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">Moisture (%)</th>
                    <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">Cost/kg (WAC)</th>
                    <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLots.map((lot) => (
                    <tr key={lot.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <Link
                          href={`/dashboard/inventory/lots/${lot.id}`}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          {lot.sku}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">
                        {lot.current_weight?.toFixed(2) || '0.00'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">
                        {lot.moisture_content?.toFixed(1) || '0.0'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">
                        {symbol}{lot.unit_cost_wac?.toFixed(2) || '0.00'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/inventory/lots/${lot.id}`}>
                            View
                          </Link>
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
    </div>
  )
}
