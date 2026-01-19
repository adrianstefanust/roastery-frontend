'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2,
  Search,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuthStore } from '@/lib/stores/auth-store'

interface Tenant {
  id: string
  name: string
  plan_type: string
  subscription_plan: string
  subscription_status: string
  trial_ends_at: string | null
  subscription_ends_at: string | null
  monthly_payment: number
  max_users: number
  currency: string
  created_at: string
  updated_at: string
}

interface PaginatedResponse {
  data: Tenant[]
  meta: {
    current_page: number
    per_page: number
    total: number
    total_pages: number
  }
}

export default function TenantsPage() {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [newPlan, setNewPlan] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (user.role !== 'SUPERADMIN') {
      router.push('/dashboard')
      return
    }

    fetchTenants()
  }, [user, router, page])

  const fetchTenants = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `http://localhost:8080/api/v1/superadmin/tenants?page=${page}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch tenants')
      }

      const data: PaginatedResponse = await response.json()
      setTenants(data.data || [])
      setTotalPages(data.meta.total_pages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tenants')
    } finally {
      setLoading(false)
    }
  }

  const updateTenantStatus = async (tenantId: string, status: string) => {
    try {
      setActionLoading(true)
      setError(null)

      const response = await fetch(
        `http://localhost:8080/api/v1/superadmin/tenants/${tenantId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update tenant status')
      }

      // Refresh tenants list
      await fetchTenants()
      setShowStatusDialog(false)
      setSelectedTenant(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setActionLoading(false)
    }
  }

  const updateTenantPlan = async (tenantId: string, plan: string) => {
    try {
      setActionLoading(true)
      setError(null)

      const response = await fetch(
        `http://localhost:8080/api/v1/superadmin/tenants/${tenantId}/plan`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ plan }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update tenant plan')
      }

      // Refresh tenants list
      await fetchTenants()
      setShowPlanDialog(false)
      setSelectedTenant(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update plan')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      TRIAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      ACTIVE: 'bg-green-100 text-green-800 border-green-200',
      SUSPENDED: 'bg-red-100 text-red-800 border-red-200',
      CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
    }
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const getPlanBadge = (plan: string) => {
    const badges = {
      TRIAL: 'bg-gray-100 text-gray-800',
      BASIC: 'bg-blue-100 text-blue-800',
      PRO: 'bg-purple-100 text-purple-800',
      ENTERPRISE: 'bg-indigo-100 text-indigo-800',
    }
    return badges[plan as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const filteredTenants = tenants.filter((tenant) =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading && tenants.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading tenants...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tenant Management</h1>
          <p className="text-gray-600 mt-2">View and manage all roastery tenants</p>
        </div>
      </div>

      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="ml-2 text-sm text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search tenants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tenants ({filteredTenants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Max Users
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <Building2 className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                          <div className="text-xs text-gray-500">{tenant.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlanBadge(
                          tenant.subscription_plan
                        )}`}
                      >
                        {tenant.subscription_plan}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(
                          tenant.subscription_status
                        )}`}
                      >
                        {tenant.subscription_status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {tenant.currency} {tenant.monthly_payment.toFixed(2)}/mo
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {tenant.max_users === -1 ? 'Unlimited' : tenant.max_users}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {new Date(tenant.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/superadmin/tenants/${tenant.id}`}
                          className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                          title="Manage Users"
                        >
                          <Users className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedTenant(tenant)
                            setNewPlan(tenant.subscription_plan)
                            setShowPlanDialog(true)
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Change Plan"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {tenant.subscription_status === 'ACTIVE' && (
                          <button
                            onClick={() => {
                              setSelectedTenant(tenant)
                              setNewStatus('SUSPENDED')
                              setShowStatusDialog(true)
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Suspend"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                        {tenant.subscription_status === 'SUSPENDED' && (
                          <button
                            onClick={() => {
                              setSelectedTenant(tenant)
                              setNewStatus('ACTIVE')
                              setShowStatusDialog(true)
                            }}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Activate"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Change Dialog */}
      {showStatusDialog && selectedTenant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Change Tenant Status
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to change the status of <strong>{selectedTenant.name}</strong> to{' '}
              <strong>{newStatus}</strong>?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowStatusDialog(false)
                  setSelectedTenant(null)
                }}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => updateTenantStatus(selectedTenant.id, newStatus)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {actionLoading ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Change Dialog */}
      {showPlanDialog && selectedTenant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Change Subscription Plan
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Select a new plan for <strong>{selectedTenant.name}</strong>
            </p>
            <select
              value={newPlan}
              onChange={(e) => setNewPlan(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
            >
              <option value="TRIAL">Trial ($0/mo)</option>
              <option value="BASIC">Basic ($49/mo)</option>
              <option value="PRO">Pro ($99/mo)</option>
              <option value="ENTERPRISE">Enterprise ($299/mo)</option>
            </select>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowPlanDialog(false)
                  setSelectedTenant(null)
                }}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => updateTenantPlan(selectedTenant.id, newPlan)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {actionLoading ? 'Updating...' : 'Update Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
