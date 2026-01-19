'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, ShoppingBag, Search, Eye, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { toast } from 'sonner'
import type { SalesOrder, SOStatus } from '@/types'

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)

  const isAccountantOrAdmin = user?.role === 'ACCOUNTANT' || user?.role === 'OWNER'

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${env.apiBase}/api/v1/sales/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch sales orders')
      }

      const data = await response.json()
      setOrders(data.sales_orders || [])
    } catch (error) {
      console.error('Error fetching sales orders:', error)
      toast.error('Failed to load sales orders')
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.so_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.client?.name?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: SOStatus) => {
    const colors: Record<SOStatus, string> = {
      'PENDING': 'bg-gray-100 text-gray-800',
      'CONFIRMED': 'bg-purple-100 text-purple-800',
      'PREPARING': 'bg-yellow-100 text-yellow-800',
      'SHIPPED': 'bg-blue-100 text-blue-800',
      'DELIVERED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  // Calculate stats
  const totalOrders = orders.length
  const activeOrders = orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status)).length
  const totalValue = orders
    .filter(o => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.total_amount, 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Sales Orders
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your sales orders to clients
          </p>
        </div>
        {isAccountantOrAdmin && (
          <Button asChild>
            <Link href="/dashboard/sales/orders/new">
              <Plus className="mr-2 h-4 w-4" />
              Create SO
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Orders
                </p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">
                  {totalOrders}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Orders
                </p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">
                  {activeOrders}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Value
                </p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">
                  ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by SO number or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="PREPARING">Preparing</SelectItem>
                <SelectItem value="SHIPPED">Shipped</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sales Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Orders List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading sales orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No sales orders found</h3>
              <p className="mt-2 text-gray-600">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first sales order to get started'}
              </p>
              {!searchQuery && statusFilter === 'all' && isAccountantOrAdmin && (
                <Button asChild className="mt-4">
                  <Link href="/dashboard/sales/orders/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create SO
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SO Number</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Requested Delivery</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/sales/orders/${order.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {order.so_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">
                        {order.client?.name || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">
                        {new Date(order.order_date).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">
                        ${order.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {order.currency}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {order.requested_delivery_date
                          ? new Date(order.requested_delivery_date).toLocaleDateString()
                          : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/sales/orders/${order.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
