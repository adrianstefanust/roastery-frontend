'use client'

import { useState, useEffect } from 'react'
import { Users, Package, Flame, Plus, FileText, BarChart, AlertTriangle, TrendingUp, Coffee } from 'lucide-react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useAuth } from '@/lib/hooks/use-auth'
import { useCurrency } from '@/lib/hooks/use-currency'
import { env } from '@/lib/config/env'
import { getCurrencyIcon } from '@/lib/utils/currency'
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts'
import { format, subMonths } from 'date-fns'

interface DashboardStats {
  totalUsers: number
  coffeeLots: number
  roastBatches: number
  monthlyCosts: string
  greenBeanStock: number
  roastedStock: number
  pendingBatches: number
  avgShrinkage: number
  lowStockLots: number
}

interface MonthlyProduction {
  month: string
  batches: number
  weightIn: number
  weightOut: number
}

interface HPPVariance {
  month: string
  estimated: number
  actual: number
  variance: number
}

interface RecentBatch {
  id: string
  weight_in: number
  weight_out: number
  status: string
  created_at: string
}

interface LowStockLot {
  id: string
  sku: string
  current_weight: number
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const token = useAuthStore((state) => state.token)
  const { isAdmin, isAccountant, isRoaster } = useAuth()
  const { symbol } = useCurrency()

  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    coffeeLots: 0,
    roastBatches: 0,
    monthlyCosts: '0',
    greenBeanStock: 0,
    roastedStock: 0,
    pendingBatches: 0,
    avgShrinkage: 0,
    lowStockLots: 0
  })
  const [monthlyProduction, setMonthlyProduction] = useState<MonthlyProduction[]>([])
  const [hppVariance, setHPPVariance] = useState<HPPVariance[]>([])
  const [recentBatches, setRecentBatches] = useState<RecentBatch[]>([])
  const [lowStockLots, setLowStockLots] = useState<LowStockLot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Don't fetch data for SUPERADMIN users
    if (user?.role === 'SUPERADMIN') {
      setLoading(false)
      return
    }
    fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch all data in parallel
      const [usersRes, lotsRes, batchesRes, costsRes] = await Promise.all([
        fetch(`${env.apiBase}/api/v1/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ ok: false })),
        fetch(`${env.apiBase}/api/v1/inventory/lots`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ ok: false })),
        fetch(`${env.apiBase}/api/v1/roast-batches`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ ok: false })),
        fetch(`${env.apiBase}/api/v1/finance/costs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ ok: false }))
      ])

      const newStats = { ...stats }
      let allBatches: any[] = []
      let allLots: any[] = []

      // Parse users
      if (usersRes.ok && 'json' in usersRes) {
        const usersData = await usersRes.json()
        newStats.totalUsers = usersData.data?.length || 0
      }

      // Parse lots
      if (lotsRes.ok && 'json' in lotsRes) {
        const lotsData = await lotsRes.json()
        allLots = lotsData?.data || []
        newStats.coffeeLots = allLots.length

        // Calculate green bean stock
        newStats.greenBeanStock = allLots.reduce((sum: number, lot: any) =>
          sum + (lot.current_weight || 0), 0
        )

        // Find low stock lots (< 50kg)
        const lowStock = allLots.filter((lot: any) =>
          lot.current_weight > 0 && lot.current_weight < 50
        )
        newStats.lowStockLots = lowStock.length
        setLowStockLots(lowStock.slice(0, 5))
      }

      // Parse batches
      if (batchesRes.ok && 'json' in batchesRes) {
        const batchesData = await batchesRes.json()
        allBatches = batchesData?.data || []
        newStats.roastBatches = allBatches.length

        // Calculate roasted stock (completed batches)
        const completedBatches = allBatches.filter((b: any) =>
          b.status === 'QC_PASSED' || b.status === 'QC_FAILED' || b.status === 'ROASTED'
        )
        newStats.roastedStock = completedBatches.reduce((sum: number, batch: any) =>
          sum + (batch.weight_out || 0), 0
        )

        // Count pending batches
        newStats.pendingBatches = allBatches.filter((b: any) =>
          b.status === 'PENDING_ROAST'
        ).length

        // Calculate average shrinkage
        const batchesWithShrinkage = allBatches.filter((b: any) =>
          b.shrinkage_pct && b.shrinkage_pct > 0
        )
        if (batchesWithShrinkage.length > 0) {
          newStats.avgShrinkage = batchesWithShrinkage.reduce((sum: number, b: any) =>
            sum + b.shrinkage_pct, 0
          ) / batchesWithShrinkage.length
        }

        // Get recent batches
        setRecentBatches(allBatches.slice(0, 5))

        // Calculate monthly production (last 6 months)
        const monthlyData = calculateMonthlyProduction(allBatches)
        setMonthlyProduction(monthlyData)
      }

      // Parse costs
      if (costsRes.ok && 'json' in costsRes) {
        const costsData = await costsRes.json()
        const currentMonth = new Date().getMonth() + 1
        const currentYear = new Date().getFullYear()
        const currentCosts = costsData.data?.find(
          (cost: any) => cost.month === currentMonth && cost.year === currentYear
        )
        if (currentCosts?.total_pool) {
          newStats.monthlyCosts = parseFloat(currentCosts.total_pool).toLocaleString()
        }

        // Calculate HPP variance (last 6 months)
        const varianceData = calculateHPPVariance(costsData?.data || [])
        setHPPVariance(varianceData)
      }

      setStats(newStats)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateMonthlyProduction = (batches: any[]) => {
    const monthlyMap = new Map<string, { batches: number; weightIn: number; weightOut: number }>()

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i)
      const key = format(date, 'yyyy-MM')
      monthlyMap.set(key, { batches: 0, weightIn: 0, weightOut: 0 })
    }

    // Aggregate batch data
    batches.forEach((batch: any) => {
      const batchDate = new Date(batch.created_at)
      const key = format(batchDate, 'yyyy-MM')

      if (monthlyMap.has(key)) {
        const data = monthlyMap.get(key)!
        data.batches++
        data.weightIn += batch.weight_in || 0
        data.weightOut += batch.weight_out || 0
        monthlyMap.set(key, data)
      }
    })

    return Array.from(monthlyMap.entries()).map(([key, data]) => ({
      month: format(new Date(key), 'MMM yyyy'),
      batches: data.batches,
      weightIn: Math.round(data.weightIn * 10) / 10,
      weightOut: Math.round(data.weightOut * 10) / 10
    }))
  }

  const calculateHPPVariance = (costs: any[]) => {
    const last6Months: HPPVariance[] = []

    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i)
      const month = date.getMonth() + 1
      const year = date.getFullYear()

      const cost = costs.find((c: any) => c.month === month && c.year === year)

      if (cost) {
        const estimated = cost.estimated_total || 0
        const actual = cost.total_pool || 0
        last6Months.push({
          month: format(date, 'MMM yyyy'),
          estimated: Math.round(estimated),
          actual: Math.round(actual),
          variance: Math.round(actual - estimated)
        })
      } else {
        last6Months.push({
          month: format(date, 'MMM yyyy'),
          estimated: 0,
          actual: 0,
          variance: 0
        })
      }
    }

    return last6Months
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_ROAST':
        return 'bg-yellow-100 text-yellow-800'
      case 'ROASTED':
        return 'bg-blue-100 text-blue-800'
      case 'QC_PASSED':
        return 'bg-green-100 text-green-800'
      case 'QC_FAILED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const CurrencyIcon = getCurrencyIcon(user?.currency || 'USD')

  const statsArray = [
    {
      title: 'Green Bean Stock',
      value: `${stats.greenBeanStock.toFixed(1)} kg`,
      icon: Coffee,
      iconColor: 'text-amber-700',
      bgColor: 'bg-amber-100',
      show: true
    },
    {
      title: 'Roasted Stock',
      value: `${stats.roastedStock.toFixed(1)} kg`,
      icon: Flame,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-100',
      show: isRoaster || isAdmin
    },
    {
      title: 'Pending Batches',
      value: stats.pendingBatches.toString(),
      icon: Package,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
      show: isRoaster || isAdmin
    },
    {
      title: 'Avg Shrinkage',
      value: `${stats.avgShrinkage.toFixed(1)}%`,
      icon: TrendingUp,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-100',
      show: isRoaster || isAdmin
    },
    {
      title: 'Total Users',
      value: stats.totalUsers.toString(),
      icon: Users,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
      show: isAdmin
    },
    {
      title: 'Monthly Costs',
      value: `${symbol}${stats.monthlyCosts}`,
      icon: CurrencyIcon,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100',
      show: isAccountant || isAdmin
    }
  ]

  const quickActions = [
    {
      label: 'Create GRN',
      href: '/dashboard/inventory/grn',
      icon: FileText,
      show: isAccountant || isAdmin
    },
    {
      label: 'New Roast Batch',
      href: '/dashboard/production/batches/new',
      icon: Flame,
      show: isRoaster || isAdmin
    },
    {
      label: 'Record Costs',
      href: '/dashboard/finance/costs/new',
      icon: CurrencyIcon,
      show: isAccountant || isAdmin
    },
    {
      label: 'Manage Users',
      href: '/dashboard/users',
      icon: Users,
      show: isAdmin
    },
    {
      label: 'View Inventory',
      href: '/dashboard/inventory/lots',
      icon: Package,
      show: true
    },
    {
      label: 'View Reports',
      href: '/dashboard/finance/reports',
      icon: BarChart,
      show: isAccountant || isAdmin
    }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Dashboard
        </h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
          Welcome back, {user?.email}
        </p>
      </div>

      {/* Low Stock Alert */}
      {stats.lowStockLots > 0 && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="ml-2">
            <span className="font-semibold text-yellow-900">Low Stock Alert:</span>
            <span className="text-yellow-800 ml-1">
              {stats.lowStockLots} lot(s) have less than 50kg remaining
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {statsArray.filter(stat => stat.show).map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">
                    {loading ? (
                      <span className="animate-pulse text-gray-400">...</span>
                    ) : (
                      stat.value
                    )}
                  </p>
                </div>
                <div className={`p-3 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Production Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Monthly Production (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-gray-500">Loading chart...</p>
              </div>
            ) : monthlyProduction.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyProduction}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="weightIn" stackId="1" stroke="#f59e0b" fill="#fbbf24" name="Green (kg)" />
                  <Area type="monotone" dataKey="weightOut" stackId="2" stroke="#ea580c" fill="#fb923c" name="Roasted (kg)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-gray-500">No production data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* HPP Variance Chart */}
        {(isAccountant || isAdmin) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CurrencyIcon className="h-5 w-5" />
                Cost Variance (Estimated vs Actual)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-500">Loading chart...</p>
                </div>
              ) : hppVariance.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={hppVariance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="estimated" stroke="#3b82f6" name="Estimated ($)" strokeWidth={2} />
                    <Line type="monotone" dataKey="actual" stroke="#10b981" name="Actual ($)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-500">No cost data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Batches */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Flame className="h-5 w-5" />
                Recent Roast Batches
              </span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/production/batches">View All</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : recentBatches.length > 0 ? (
              <div className="space-y-3">
                {recentBatches.map((batch) => (
                  <div key={batch.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {batch.weight_in.toFixed(1)} kg → {batch.weight_out ? `${batch.weight_out.toFixed(1)} kg` : 'Pending'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(batch.created_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <Badge className={getStatusColor(batch.status)}>
                      {batch.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No batches yet</p>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Lots */}
        {lowStockLots.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Low Stock Alerts
                </span>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/inventory/lots">View All</Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockLots.map((lot) => (
                  <div key={lot.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{lot.sku}</p>
                      <p className="text-xs text-gray-500">Only {lot.current_weight.toFixed(1)} kg remaining</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions (if no low stock alerts) */}
        {lowStockLots.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {quickActions.filter(action => action.show).slice(0, 6).map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    size="lg"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href={action.href}>
                      <action.icon className="mr-2 h-4 w-4" />
                      {action.label}
                    </Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
