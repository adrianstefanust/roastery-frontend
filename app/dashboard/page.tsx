'use client'

import { useState, useEffect } from 'react'
import { Users, Package, Flame, Plus, FileText, BarChart, AlertTriangle, TrendingUp, Coffee, ShoppingCart, ShoppingBag, Clock, CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useAuth } from '@/lib/hooks/use-auth'
import { useCurrency } from '@/lib/hooks/use-currency'
import { env } from '@/lib/config/env'
import { getCurrencyIcon } from '@/lib/utils/currency'
import { formatNumber } from '@/lib/utils'
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
  pendingPOs: number
  pendingSOs: number
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

interface PendingPO {
  id: string
  po_number: string
  supplier: { name: string }
  status: string
  total_amount: number
  expected_delivery_date: string
}

interface PendingSO {
  id: string
  so_number: string
  client: { name: string }
  status: string
  total_amount: number
  requested_delivery_date: string
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
    lowStockLots: 0,
    pendingPOs: 0,
    pendingSOs: 0
  })
  const [monthlyProduction, setMonthlyProduction] = useState<MonthlyProduction[]>([])
  const [hppVariance, setHPPVariance] = useState<HPPVariance[]>([])
  const [recentBatches, setRecentBatches] = useState<RecentBatch[]>([])
  const [lowStockLots, setLowStockLots] = useState<LowStockLot[]>([])
  const [pendingPOs, setPendingPOs] = useState<PendingPO[]>([])
  const [pendingSOs, setPendingSOs] = useState<PendingSO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
      const [usersRes, lotsRes, batchesRes, costsRes, posRes, sosRes] = await Promise.all([
        fetch(`${env.apiBase}/api/v1/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ ok: false })),
        fetch(`${env.apiBase}/api/v1/inventory/lots`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ ok: false })),
        fetch(`${env.apiBase}/api/v1/production/batches`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ ok: false })),
        fetch(`${env.apiBase}/api/v1/finance/indirect-costs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ ok: false })),
        fetch(`${env.apiBase}/api/v1/purchasing/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ ok: false })),
        fetch(`${env.apiBase}/api/v1/sales/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ ok: false }))
      ])

      let newStats = { ...stats }

      if (usersRes.ok && 'json' in usersRes) {
        const usersData = await usersRes.json()
        newStats.totalUsers = usersData.data?.length || 0
      }

      if (lotsRes.ok && 'json' in lotsRes) {
        const lotsData = await lotsRes.json()
        const lots = lotsData.data || []
        newStats.coffeeLots = lots.length
        newStats.greenBeanStock = lots.reduce((sum: number, lot: any) => sum + (lot.current_weight || 0), 0)

        const lowStock = lots.filter((lot: any) => lot.current_weight < 50 && lot.current_weight > 0)
        newStats.lowStockLots = lowStock.length
        setLowStockLots(lowStock.slice(0, 3))
      }

      if (batchesRes.ok && 'json' in batchesRes) {
        const batchesData = await batchesRes.json()
        const batches = batchesData.data || []
        newStats.roastBatches = batches.length
        newStats.roastedStock = batches
          .filter((b: any) => b.status === 'QC_PASSED')
          .reduce((sum: number, batch: any) => sum + (batch.weight_out || 0), 0)

        newStats.pendingBatches = batches.filter((b: any) =>
          b.status === 'PENDING_ROAST' || b.status === 'IN_PROGRESS'
        ).length

        // Calculate average shrinkage
        const completedBatches = batches.filter((b: any) => b.weight_out > 0)
        if (completedBatches.length > 0) {
          const totalShrinkage = completedBatches.reduce((sum: number, batch: any) => {
            const shrinkage = ((batch.weight_in - batch.weight_out) / batch.weight_in) * 100
            return sum + shrinkage
          }, 0)
          newStats.avgShrinkage = totalShrinkage / completedBatches.length
        }

        setMonthlyProduction(calculateMonthlyProduction(batches))
        setRecentBatches(batches.slice(0, 5))
      }

      if (costsRes.ok && 'json' in costsRes) {
        const costsData = await costsRes.json()
        const costs = costsData.data || []

        const currentMonth = new Date().getMonth() + 1
        const currentYear = new Date().getFullYear()
        const currentMonthCost = costs.find((c: any) => c.month === currentMonth && c.year === currentYear)
        newStats.monthlyCosts = currentMonthCost?.total_actual?.toLocaleString() || '0'

        setHPPVariance(calculateHPPVariance(costs))
      }

      if (posRes.ok && 'json' in posRes) {
        const posData = await posRes.json()
        const allPOs = posData.purchase_orders || []
        const pending = allPOs.filter((po: any) =>
          po.status === 'SENT' || po.status === 'CONFIRMED' || po.status === 'IN_TRANSIT'
        )
        newStats.pendingPOs = pending.length
        setPendingPOs(pending.slice(0, 5))
      }

      if (sosRes.ok && 'json' in sosRes) {
        const sosData = await sosRes.json()
        const allSOs = sosData.sales_orders || []
        const pending = allSOs.filter((so: any) =>
          so.status === 'PENDING' || so.status === 'CONFIRMED' || so.status === 'PREPARING'
        )
        newStats.pendingSOs = pending.length
        setPendingSOs(pending.slice(0, 5))
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

    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i)
      const key = format(date, 'yyyy-MM')
      monthlyMap.set(key, { batches: 0, weightIn: 0, weightOut: 0 })
    }

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
        const actual = cost.total_actual || 0
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
      case 'PENDING':
      case 'SENT':
        return 'bg-yellow-100 text-yellow-800'
      case 'ROASTED':
      case 'IN_PROGRESS':
      case 'CONFIRMED':
      case 'PREPARING':
        return 'bg-blue-100 text-blue-800'
      case 'QC_PASSED':
      case 'COMPLETED':
      case 'DELIVERED':
        return 'bg-green-100 text-green-800'
      case 'QC_FAILED':
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const CurrencyIcon = getCurrencyIcon(user?.currency || 'USD')

  const quickActions = [
    {
      label: 'Stock Overview',
      href: '/dashboard/inventory/stock',
      icon: BarChart,
      description: 'View all stock levels',
      show: true
    },
    {
      label: 'Create Purchase Order',
      href: '/dashboard/purchasing/orders/new',
      icon: ShoppingCart,
      description: 'Order green coffee',
      show: isAccountant || isAdmin
    },
    {
      label: 'Create Sales Order',
      href: '/dashboard/sales/orders/new',
      icon: ShoppingBag,
      description: 'Sell roasted coffee',
      show: isAccountant || isAdmin
    },
    {
      label: 'Create GRN',
      href: '/dashboard/inventory/grn',
      icon: FileText,
      description: 'Receive green coffee',
      show: isAccountant || isAdmin
    },
    {
      label: 'New Roast Batch',
      href: '/dashboard/production/batches/new',
      icon: Flame,
      description: 'Start roasting',
      show: isRoaster || isAdmin
    },
    {
      label: 'Record Costs',
      href: '/dashboard/finance/costs/new',
      icon: CurrencyIcon,
      description: 'Track expenses',
      show: isAccountant || isAdmin
    },
    {
      label: 'Manage Users',
      href: '/dashboard/users',
      icon: Users,
      description: 'Team management',
      show: isAdmin
    },
    {
      label: 'View Reports',
      href: '/dashboard/finance/reports',
      icon: BarChart,
      description: 'Financial reports',
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

      {/* Quick Actions - TOP SECTION */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.filter(action => action.show).map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto py-4 px-4 justify-start flex-col items-start"
                asChild
              >
                <Link href={action.href}>
                  <div className="flex items-center gap-2 mb-1">
                    <action.icon className="h-4 w-4" />
                    <span className="font-medium">{action.label}</span>
                  </div>
                  <span className="text-xs text-gray-500">{action.description}</span>
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Orders Row */}
      {(isAccountant || isAdmin) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Purchase Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShoppingCart className="h-5 w-5 text-orange-600" />
                    Pending Purchase Orders
                  </CardTitle>
                  <CardDescription>Orders awaiting delivery</CardDescription>
                </div>
                <Badge variant="secondary" className="text-lg">
                  {stats.pendingPOs}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {pendingPOs.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm">No pending purchase orders</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingPOs.map((po) => (
                    <Link
                      key={po.id}
                      href={`/dashboard/purchasing/orders/${po.id}`}
                      className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{po.po_number}</span>
                        <Badge className={getStatusColor(po.status)} variant="secondary">
                          {po.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">{po.supplier?.name || 'Unknown Supplier'}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {po.expected_delivery_date && `Due: ${format(new Date(po.expected_delivery_date), 'MMM d')}`}
                        </span>
                        <span className="text-sm font-medium">{symbol}{formatNumber(po.total_amount)}</span>
                      </div>
                    </Link>
                  ))}
                  {stats.pendingPOs > 5 && (
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                      <Link href="/dashboard/purchasing/orders">
                        View All {stats.pendingPOs} Orders
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Sales Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShoppingBag className="h-5 w-5 text-blue-600" />
                    Pending Sales Orders
                  </CardTitle>
                  <CardDescription>Orders to fulfill</CardDescription>
                </div>
                <Badge variant="secondary" className="text-lg">
                  {stats.pendingSOs}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {pendingSOs.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm">No pending sales orders</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingSOs.map((so) => (
                    <Link
                      key={so.id}
                      href={`/dashboard/sales/orders/${so.id}`}
                      className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{so.so_number}</span>
                        <Badge className={getStatusColor(so.status)} variant="secondary">
                          {so.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">{so.client?.name || 'Unknown Client'}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {so.requested_delivery_date && `Due: ${format(new Date(so.requested_delivery_date), 'MMM d')}`}
                        </span>
                        <span className="text-sm font-medium">{symbol}{formatNumber(so.total_amount)}</span>
                      </div>
                    </Link>
                  ))}
                  {stats.pendingSOs > 5 && (
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                      <Link href="/dashboard/sales/orders">
                        View All {stats.pendingSOs} Orders
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Green Stock</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {loading ? '...' : `${formatNumber(stats.greenBeanStock)} kg`}
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <Coffee className="w-6 h-6 text-amber-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {(isRoaster || isAdmin) && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Roasted Stock</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {loading ? '...' : `${formatNumber(stats.roastedStock)} kg`}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Flame className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {(isRoaster || isAdmin) && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Batches</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {loading ? '...' : stats.pendingBatches}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {(isAccountant || isAdmin) && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Costs</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {loading ? '...' : `${symbol}${stats.monthlyCosts}`}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CurrencyIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Production Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Monthly Production
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-gray-500">Loading...</p>
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
                <p className="text-gray-500">No data</p>
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
                Cost Variance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-500">Loading...</p>
                </div>
              ) : hppVariance.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={hppVariance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="estimated" stroke="#3b82f6" name="Estimated" strokeWidth={2} />
                    <Line type="monotone" dataKey="actual" stroke="#10b981" name="Actual" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-500">No data</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Low Stock Alerts */}
      {lowStockLots.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockLots.map((lot) => (
                <div key={lot.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{lot.sku}</p>
                    <p className="text-xs text-gray-500">Only {formatNumber(lot.current_weight)} kg remaining</p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
