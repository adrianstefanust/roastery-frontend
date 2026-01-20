'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Coffee, AlertTriangle, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { env } from '@/lib/config/env'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useCurrency } from '@/lib/hooks/use-currency'
import { toast } from 'sonner'
import { formatNumber } from '@/lib/utils'
import type { GreenCoffeeLot } from '@/types'

interface RoastBatch {
  id: string
  batch_number: string
  roast_profile: string
  weight_out: number
  reserved_quantity_kg: number
  available_quantity_kg: number
  status: string
  created_at: string
}

interface StockSummaryBySKU {
  sku: string
  total_weight: number
  lot_count: number
  total_value: number
  oldest_date: string
}

interface RoastedStockBySKU {
  roast_profile: string
  total_available: number
  total_reserved: number
  total_weight: number
  batch_count: number
}

export default function StockOverviewPage() {
  const [greenLots, setGreenLots] = useState<GreenCoffeeLot[]>([])
  const [roastBatches, setRoastBatches] = useState<RoastBatch[]>([])
  const [loading, setLoading] = useState(true)
  const token = useAuthStore((state) => state.token)
  const { symbol } = useCurrency()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch green coffee lots and roast batches in parallel
      const [lotsRes, batchesRes] = await Promise.all([
        fetch(`${env.apiBase}/api/v1/inventory/lots`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${env.apiBase}/api/v1/production/batches`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (lotsRes.ok && 'json' in lotsRes) {
        const lotsData = await lotsRes.json()
        setGreenLots(lotsData.data || [])
      }

      if (batchesRes.ok && 'json' in batchesRes) {
        const batchesData = await batchesRes.json()
        setRoastBatches(batchesData.data || [])
      }
    } catch (error) {
      console.error('Error fetching stock data:', error)
      toast.error('Failed to load stock data')
    } finally {
      setLoading(false)
    }
  }

  // Calculate green coffee summary by SKU
  const greenStockBySKU = (): StockSummaryBySKU[] => {
    const summary = new Map<string, StockSummaryBySKU>()

    greenLots
      .filter(lot => lot.current_weight > 0) // Only filter by weight, no status field in DB
      .forEach(lot => {
        const existing = summary.get(lot.sku)
        if (existing) {
          existing.total_weight += lot.current_weight
          existing.lot_count += 1
          existing.total_value += lot.current_weight * (lot.weighted_avg_cost || lot.unit_cost_wac)
          if (lot.received_at && new Date(lot.received_at) < new Date(existing.oldest_date)) {
            existing.oldest_date = lot.received_at
          }
        } else {
          summary.set(lot.sku, {
            sku: lot.sku,
            total_weight: lot.current_weight,
            lot_count: 1,
            total_value: lot.current_weight * (lot.weighted_avg_cost || lot.unit_cost_wac),
            oldest_date: lot.received_at || lot.created_at
          })
        }
      })

    return Array.from(summary.values()).sort((a, b) => b.total_weight - a.total_weight)
  }

  // Calculate roasted coffee summary by roast profile
  const roastedStockByProfile = (): RoastedStockBySKU[] => {
    const summary = new Map<string, RoastedStockBySKU>()

    roastBatches
      .filter(batch => batch.status === 'QC_PASSED' && batch.weight_out > 0)
      .forEach(batch => {
        const existing = summary.get(batch.roast_profile)
        if (existing) {
          existing.total_available += batch.available_quantity_kg || 0
          existing.total_reserved += batch.reserved_quantity_kg || 0
          existing.total_weight += batch.weight_out
          existing.batch_count += 1
        } else {
          summary.set(batch.roast_profile, {
            roast_profile: batch.roast_profile,
            total_available: batch.available_quantity_kg || 0,
            total_reserved: batch.reserved_quantity_kg || 0,
            total_weight: batch.weight_out,
            batch_count: 1
          })
        }
      })

    return Array.from(summary.values()).sort((a, b) => b.total_available - a.total_available)
  }

  const greenStock = greenStockBySKU()
  const roastedStock = roastedStockByProfile()

  const totalGreenWeight = greenStock.reduce((sum, item) => sum + item.total_weight, 0)
  const totalGreenValue = greenStock.reduce((sum, item) => sum + item.total_value, 0)
  const totalRoastedAvailable = roastedStock.reduce((sum, item) => sum + item.total_available, 0)
  const totalRoastedReserved = roastedStock.reduce((sum, item) => sum + item.total_reserved, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-gray-500">Loading stock overview...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Stock Overview
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Comprehensive view of your green and roasted coffee inventory
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Green Coffee</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatNumber(totalGreenWeight)} kg
                </p>
                <p className="text-xs text-gray-500">{greenStock.length} SKUs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Coffee className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Roasted Available</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatNumber(totalRoastedAvailable)} kg
                </p>
                <p className="text-xs text-gray-500">{roastedStock.length} Profiles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Reserved Stock</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatNumber(totalRoastedReserved)} kg
                </p>
                <p className="text-xs text-gray-500">Pending shipment</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {symbol}{formatNumber(totalGreenValue)}
                </p>
                <p className="text-xs text-gray-500">Green coffee</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Green Coffee Stock by SKU */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                Green Coffee Stock
              </CardTitle>
              <CardDescription>
                Raw coffee inventory grouped by SKU
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/inventory/lots">
                View All Lots
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {greenStock.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p>No green coffee in stock</p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href="/dashboard/inventory/grn">Create GRN</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Total Weight</TableHead>
                  <TableHead className="text-right">Lots</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead className="text-right">Oldest Stock</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {greenStock.map((stock) => {
                  const age = Math.floor(
                    (new Date().getTime() - new Date(stock.oldest_date).getTime()) / (1000 * 60 * 60 * 24)
                  )
                  const isOld = age > 180 // Older than 6 months

                  return (
                    <TableRow key={stock.sku}>
                      <TableCell className="font-medium">{stock.sku}</TableCell>
                      <TableCell className="text-right">
                        {formatNumber(stock.total_weight)} kg
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{stock.lot_count}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {symbol}{formatNumber(stock.total_value)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={isOld ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                          {age} days
                          {isOld && <AlertTriangle className="inline ml-1 h-3 w-3" />}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href="/dashboard/inventory/lots">View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Roasted Coffee Stock by Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Coffee className="h-5 w-5 text-blue-600" />
                Roasted Coffee Stock
              </CardTitle>
              <CardDescription>
                Finished product inventory grouped by roast profile
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/production/batches">
                View All Batches
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {roastedStock.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Coffee className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p>No roasted coffee in stock</p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href="/dashboard/production/batches/new">Create Roast Batch</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roast Profile</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead className="text-right">Reserved</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Batches</TableHead>
                  <TableHead className="text-right">Availability</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roastedStock.map((stock) => {
                  const availabilityPercent = (stock.total_available / stock.total_weight) * 100
                  const isLow = availabilityPercent < 20

                  return (
                    <TableRow key={stock.roast_profile}>
                      <TableCell className="font-medium">{stock.roast_profile}</TableCell>
                      <TableCell className="text-right">
                        <span className={isLow ? 'text-orange-600 font-semibold' : ''}>
                          {formatNumber(stock.total_available)} kg
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-gray-600">
                        {formatNumber(stock.total_reserved)} kg
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatNumber(stock.total_weight)} kg
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{stock.batch_count}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Progress value={availabilityPercent} className="w-16 h-2" />
                          <span className="text-xs text-gray-600 w-10">
                            {Math.round(availabilityPercent)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href="/dashboard/production/batches">View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Alerts */}
      {(greenStock.filter(s => s.total_weight < 50).length > 0 ||
        roastedStock.filter(s => s.total_available < 10).length > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {greenStock
                .filter(s => s.total_weight < 50)
                .map(stock => (
                  <div key={stock.sku} className="flex items-center justify-between p-3 bg-white rounded-md">
                    <div>
                      <p className="font-medium text-orange-900">Green: {stock.sku}</p>
                      <p className="text-sm text-orange-700">
                        Only {formatNumber(stock.total_weight)} kg remaining
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/dashboard/purchasing/orders/new">Order More</Link>
                    </Button>
                  </div>
                ))}
              {roastedStock
                .filter(s => s.total_available < 10)
                .map(stock => (
                  <div key={stock.roast_profile} className="flex items-center justify-between p-3 bg-white rounded-md">
                    <div>
                      <p className="font-medium text-orange-900">Roasted: {stock.roast_profile}</p>
                      <p className="text-sm text-orange-700">
                        Only {formatNumber(stock.total_available)} kg available
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/dashboard/production/batches/new">Roast More</Link>
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
