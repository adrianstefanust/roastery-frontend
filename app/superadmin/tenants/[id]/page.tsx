'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Mail,
  Key,
  Edit,
  AlertCircle,
  Users as UsersIcon,
  Building2,
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

interface User {
  id: string
  tenant_id: string
  email: string
  role: string
  created_at: string
  updated_at: string
}

interface PaginatedResponse {
  data: User[]
  meta: {
    current_page: number
    per_page: number
    total: number
    total_pages: number
  }
}

export default function TenantDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const tenantId = params.id as string
  const { user, token } = useAuthStore()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showCurrencyDialog, setShowCurrencyDialog] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newCurrency, setNewCurrency] = useState('')
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

    fetchTenantDetails()
    fetchTenantUsers()
  }, [user, router, tenantId])

  const fetchTenantDetails = async () => {
    try {
      setError(null)

      const response = await fetch(
        `http://localhost:8080/api/v1/superadmin/tenants/${tenantId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch tenant details')
      }

      const data: Tenant = await response.json()
      setTenant(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tenant')
    }
  }

  const fetchTenantUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `http://localhost:8080/api/v1/superadmin/tenants/${tenantId}/users?page=1&limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data: PaginatedResponse = await response.json()
      setUsers(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const updateUserEmail = async (userId: string, email: string) => {
    try {
      setActionLoading(true)
      setError(null)

      const response = await fetch(
        `http://localhost:8080/api/v1/superadmin/tenants/${tenantId}/users/${userId}/email`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update email')
      }

      // Refresh users list
      await fetchTenantUsers()
      setShowEmailDialog(false)
      setSelectedUser(null)
      setNewEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update email')
    } finally {
      setActionLoading(false)
    }
  }

  const resetUserPassword = async (userId: string, password: string) => {
    try {
      setActionLoading(true)
      setError(null)

      const response = await fetch(
        `http://localhost:8080/api/v1/superadmin/tenants/${tenantId}/users/${userId}/password`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to reset password')
      }

      // Close dialog
      setShowPasswordDialog(false)
      setSelectedUser(null)
      setNewPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setActionLoading(false)
    }
  }

  const updateTenantCurrency = async (currency: string) => {
    try {
      setActionLoading(true)
      setError(null)

      const response = await fetch(
        `http://localhost:8080/api/v1/superadmin/tenants/${tenantId}/currency`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ currency }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update currency')
      }

      // Refresh tenant details
      await fetchTenantDetails()
      setShowCurrencyDialog(false)
      setNewCurrency('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update currency')
    } finally {
      setActionLoading(false)
    }
  }

  const getRoleBadge = (role: string) => {
    const badges = {
      SUPERADMIN: 'bg-red-100 text-red-800',
      OWNER: 'bg-purple-100 text-purple-800',
      ACCOUNTANT: 'bg-blue-100 text-blue-800',
      ROASTER: 'bg-green-100 text-green-800',
    }
    return badges[role as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  if (loading && !tenant) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading tenant details...</div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Tenant not found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/superadmin/tenants')}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{tenant.name}</h1>
            <p className="text-gray-600 mt-1">Tenant Details & User Management</p>
          </div>
        </div>
      </div>

      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="ml-2 text-sm text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Tenant Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Tenant Information
            </span>
            <button
              onClick={() => {
                setNewCurrency(tenant.currency)
                setShowCurrencyDialog(true)
              }}
              className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Change Currency
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-gray-500">Subscription Plan</p>
              <p className="font-semibold text-lg">{tenant.subscription_plan}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-semibold text-lg">{tenant.subscription_status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Currency</p>
              <p className="font-semibold text-lg">{tenant.currency}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Monthly Payment</p>
              <p className="font-semibold text-lg">{tenant.currency} {tenant.monthly_payment.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Max Users</p>
              <p className="font-semibold text-lg">
                {tenant.max_users === -1 ? 'Unlimited' : tenant.max_users}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UsersIcon className="h-5 w-5 mr-2" />
            Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
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
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm text-gray-900">{user.email}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadge(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setNewEmail(user.email)
                            setShowEmailDialog(true)
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit Email"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setNewPassword('')
                            setShowPasswordDialog(true)
                          }}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Reset Password"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Email Edit Dialog */}
      {showEmailDialog && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Email</h3>
            <p className="text-sm text-gray-600 mb-4">
              Change email for <strong>{selectedUser.email}</strong>
            </p>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              placeholder="New email address"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEmailDialog(false)
                  setSelectedUser(null)
                  setNewEmail('')
                }}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => updateUserEmail(selectedUser.id, newEmail)}
                disabled={actionLoading || !newEmail}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {actionLoading ? 'Updating...' : 'Update Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Dialog */}
      {showPasswordDialog && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reset Password</h3>
            <p className="text-sm text-gray-600 mb-4">
              Set new password for <strong>{selectedUser.email}</strong>
            </p>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              placeholder="New password (min 8 characters)"
              minLength={8}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowPasswordDialog(false)
                  setSelectedUser(null)
                  setNewPassword('')
                }}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => resetUserPassword(selectedUser.id, newPassword)}
                disabled={actionLoading || newPassword.length < 8}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {actionLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Currency Change Dialog */}
      {showCurrencyDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Currency</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select a new currency for <strong>{tenant.name}</strong>
            </p>
            <select
              value={newCurrency}
              onChange={(e) => setNewCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="JPY">JPY - Japanese Yen</option>
              <option value="AUD">AUD - Australian Dollar</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="CHF">CHF - Swiss Franc</option>
              <option value="CNY">CNY - Chinese Yuan</option>
              <option value="INR">INR - Indian Rupee</option>
              <option value="IDR">IDR - Indonesian Rupiah</option>
              <option value="SGD">SGD - Singapore Dollar</option>
            </select>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCurrencyDialog(false)
                  setNewCurrency('')
                }}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => updateTenantCurrency(newCurrency)}
                disabled={actionLoading || !newCurrency}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {actionLoading ? 'Updating...' : 'Update Currency'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
