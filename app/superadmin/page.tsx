'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, CreditCard, TrendingUp, Users, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuthStore } from '@/lib/stores/auth-store'

interface Analytics {
  total_tenants: number
  status_counts: {
    TRIAL: number
    ACTIVE: number
    SUSPENDED: number
    CANCELLED: number
  }
  plan_counts: {
    TRIAL: number
    BASIC: number
    PRO: number
    ENTERPRISE: number
  }
  monthly_revenue: number
}

export default function SuperAdminDashboard() {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (user.role !== 'SUPERADMIN') {
      router.push('/dashboard')
      return
    }

    fetchAnalytics()
  }, [user, router])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('http://localhost:8080/api/v1/superadmin/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      setAnalytics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="bg-red-50 border-red-200">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="ml-2 text-sm text-red-800">
          {error}
        </AlertDescription>
      </Alert>
    )
  }

  if (!analytics) {
    return null
  }

  const stats = [
    {
      title: 'Total Tenants',
      value: analytics.total_tenants,
      icon: Building2,
      color: 'bg-blue-500',
    },
    {
      title: 'Active Subscriptions',
      value: analytics.status_counts.ACTIVE,
      icon: Users,
      color: 'bg-green-500',
    },
    {
      title: 'Trial Tenants',
      value: analytics.status_counts.TRIAL,
      icon: AlertCircle,
      color: 'bg-yellow-500',
    },
    {
      title: 'Monthly Revenue',
      value: `$${analytics.monthly_revenue.toFixed(2)}`,
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-gray-600 mt-2">Monitor and manage all tenants across the platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
            <CardDescription>Breakdown by subscription status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Trial</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {analytics.status_counts.TRIAL}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Active</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {analytics.status_counts.ACTIVE}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Suspended</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {analytics.status_counts.SUSPENDED}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Cancelled</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {analytics.status_counts.CANCELLED}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
            <CardDescription>Breakdown by subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-sm text-gray-700">Trial</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {analytics.plan_counts.TRIAL}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Basic ($49/mo)</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {analytics.plan_counts.BASIC}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Pro ($99/mo)</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {analytics.plan_counts.PRO}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Enterprise ($299/mo)</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {analytics.plan_counts.ENTERPRISE}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/superadmin/tenants')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-left"
            >
              <Building2 className="h-5 w-5 text-blue-600 mb-2" />
              <h3 className="font-medium text-gray-900">Manage Tenants</h3>
              <p className="text-sm text-gray-500 mt-1">View and manage all roastery tenants</p>
            </button>
            <button
              onClick={() => router.push('/superadmin/payments')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-left"
            >
              <CreditCard className="h-5 w-5 text-green-600 mb-2" />
              <h3 className="font-medium text-gray-900">View Payments</h3>
              <p className="text-sm text-gray-500 mt-1">Monitor payment history and transactions</p>
            </button>
            <button
              onClick={() => router.push('/superadmin/analytics')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-left"
            >
              <TrendingUp className="h-5 w-5 text-purple-600 mb-2" />
              <h3 className="font-medium text-gray-900">Platform Analytics</h3>
              <p className="text-sm text-gray-500 mt-1">Detailed platform performance metrics</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
