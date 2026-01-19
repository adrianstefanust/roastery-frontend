'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Search, Shield, UserPlus, Edit, Trash2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { env } from '@/lib/config/env'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useAuth } from '@/lib/hooks/use-auth'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { User } from '@/types'

export default function UsersManagementPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  // Add user form state
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserRole, setNewUserRole] = useState('ACCOUNTANT')
  const token = useAuthStore((state) => state.token)
  const currentUser = useAuthStore((state) => state.user)
  const { isAdmin } = useAuth()

  useEffect(() => {
    // Check if user is admin
    if (!isAdmin) {
      toast.error('Access denied', {
        description: 'Only administrators can access user management'
      })
      router.push('/dashboard')
      return
    }

    fetchUsers()
  }, [isAdmin])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${env.apiBase}/api/v1/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data.data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenEditDialog = (user: User) => {
    setSelectedUser(user)
    setSelectedRole(user.role)
    setEditDialogOpen(true)
  }

  const handleEditRole = async () => {
    if (!selectedUser) return

    try {
      setSubmitting(true)

      const response = await fetch(`${env.apiBase}/api/v1/users/${selectedUser.id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          role: selectedRole
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update role')
      }

      toast.success('User role updated successfully!')
      setEditDialogOpen(false)
      await fetchUsers()
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update role')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    // Prevent self-deletion
    if (selectedUser.id === currentUser?.id) {
      toast.error('You cannot delete your own account')
      setDeleteDialogOpen(false)
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch(`${env.apiBase}/api/v1/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete user')
      }

      toast.success('User deleted successfully!')
      setDeleteDialogOpen(false)
      await fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete user')
      setDeleteDialogOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenAddUserDialog = () => {
    setNewUserEmail('')
    setNewUserPassword('')
    setNewUserRole('ROASTER')
    setAddUserDialogOpen(true)
  }

  const handleAddUser = async () => {
    // Validation
    if (!newUserEmail || !newUserPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (newUserPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch(`${env.apiBase}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create user')
      }

      toast.success('User created successfully!')
      setAddUserDialogOpen(false)
      await fetchUsers()
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create user')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredUsers = users.filter((user) =>
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-blue-100 text-blue-800'
      case 'ACCOUNTANT':
        return 'bg-green-100 text-green-800'
      case 'ROASTER':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            User Management
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage users and their roles in your organization
          </p>
        </div>
        <Button onClick={handleOpenAddUserDialog}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse text-gray-500">Loading users...</div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? 'Try adjusting your search' : 'No users in the system yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Created</th>
                    <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{user.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getRoleBadgeColor(user.role)}>
                          <Shield className="mr-1 h-3 w-3" />
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditDialog(user)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Role
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDeleteDialog(user)}
                            disabled={user.id === currentUser?.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Info Card */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-amber-900 mb-3">
            Role Permissions
          </h3>
          <div className="space-y-2 text-sm text-amber-800">
            <div className="flex items-start gap-2">
              <Badge className="bg-blue-100 text-blue-800 mt-0.5">OWNER</Badge>
              <p>Full access to their tenant's data and operations</p>
            </div>
            <div className="flex items-start gap-2">
              <Badge className="bg-green-100 text-green-800 mt-0.5">ACCOUNTANT</Badge>
              <p>Access to inventory, finance, and reporting</p>
            </div>
            <div className="flex items-start gap-2">
              <Badge className="bg-orange-100 text-orange-800 mt-0.5">ROASTER</Badge>
              <p>Access to production and inventory operations</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm font-medium text-blue-900">User:</p>
              <p className="text-sm text-blue-800 mt-1">{selectedUser?.email}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">New Role <span className="text-red-500">*</span></Label>
              <select
                id="role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              >
                <option value="ACCOUNTANT">Accountant</option>
                <option value="ROASTER">Roaster</option>
              </select>
              <p className="text-xs text-gray-500">
                Select the new role for this user (subaccounts only)
              </p>
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Role Permissions:</h3>
                {selectedRole === 'ACCOUNTANT' && (
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Create and manage inventory (GRN, lots)</li>
                    <li>Record and manage costs</li>
                    <li>View financial reports (HPP, variance)</li>
                    <li>Read-only access to production batches</li>
                  </ul>
                )}
                {selectedRole === 'ROASTER' && (
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Create and manage roast batches</li>
                    <li>Finish roasting and submit QC</li>
                    <li>Read-only access to inventory</li>
                    <li>Cannot access finance data</li>
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleEditRole}
              disabled={submitting || !selectedRole}
            >
              <Save className="mr-2 h-4 w-4" />
              {submitting ? 'Saving...' : 'Save Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm font-medium text-red-900">User Details:</p>
              <p className="text-sm text-red-800 mt-1">Email: {selectedUser?.email}</p>
              <p className="text-sm text-red-800">Role: {selectedUser?.role}</p>
              <p className="text-sm text-red-800">
                Created: {selectedUser?.created_at && format(new Date(selectedUser.created_at), 'MMM d, yyyy')}
              </p>
            </div>
            <p className="text-sm text-gray-600">
              This will permanently remove the user and revoke their access to the system.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={submitting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {submitting ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account for your organization. They will receive these credentials to login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                disabled={submitting}
              />
              <p className="text-xs text-gray-500">
                User will login with this email address
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 8 characters"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                disabled={submitting}
              />
              <p className="text-xs text-gray-500">
                Minimum 8 characters required
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newRole">Role <span className="text-red-500">*</span></Label>
              <select
                id="newRole"
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              >
                <option value="ACCOUNTANT">Accountant</option>
                <option value="ROASTER">Roaster</option>
              </select>
              <p className="text-xs text-gray-500">
                Select the role for this subaccount (Accountant or Roaster)
              </p>
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Role Permissions:</h3>
                {newUserRole === 'ACCOUNTANT' && (
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Create and manage inventory (GRN, lots)</li>
                    <li>Record and manage costs</li>
                    <li>View financial reports (HPP, variance)</li>
                    <li>Read-only access to production batches</li>
                  </ul>
                )}
                {newUserRole === 'ROASTER' && (
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Create and manage roast batches</li>
                    <li>Finish roasting and submit QC</li>
                    <li>Read-only access to inventory</li>
                    <li>Cannot access finance data</li>
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddUserDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddUser}
              disabled={submitting || !newUserEmail || !newUserPassword}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {submitting ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
