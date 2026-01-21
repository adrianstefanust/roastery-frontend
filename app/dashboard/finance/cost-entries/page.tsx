'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Trash2, Edit } from 'lucide-react'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { env } from '@/lib/config/env'
import { useAuthStore } from '@/lib/stores/auth-store'
import { toast } from 'sonner'
import { format } from 'date-fns'

type CostCategory = 'RENT' | 'UTILITIES' | 'LABOR' | 'FUEL' | 'GAS' | 'TRANSPORTATION' | 'MAINTENANCE' | 'SUPPLIES' | 'INSURANCE' | 'DEPRECIATION' | 'MISC'

interface IndirectCostEntry {
  id: string
  tenant_id: string
  entry_date: string
  category: CostCategory
  amount: number
  description: string
  created_by: string
  created_at: string
  updated_at: string
}

export default function CostEntriesPage() {
  const [entries, setEntries] = useState<IndirectCostEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)

  const isAccountantOrAdmin = user?.role === 'ACCOUNTANT' || user?.role === 'OWNER'

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('limit', '100')
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter)
      }

      const response = await fetch(`${env.apiBase}/api/v1/finance/cost-entries?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch cost entries')
      }

      const data = await response.json()
      setEntries(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching cost entries:', error)
      toast.error('Failed to load cost entries')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [categoryFilter])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cost entry?')) {
      return
    }

    try {
      const response = await fetch(`${env.apiBase}/api/v1/finance/cost-entries/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete cost entry')
      }

      toast.success('Cost entry deleted successfully')
      fetchEntries()
    } catch (error) {
      console.error('Error deleting cost entry:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete cost entry')
    }
  }

  const getCategoryColor = (category: CostCategory) => {
    const colors: Record<CostCategory, string> = {
      'RENT': 'bg-purple-100 text-purple-800',
      'UTILITIES': 'bg-blue-100 text-blue-800',
      'LABOR': 'bg-green-100 text-green-800',
      'FUEL': 'bg-orange-100 text-orange-800',
      'GAS': 'bg-red-100 text-red-800',
      'TRANSPORTATION': 'bg-yellow-100 text-yellow-800',
      'MAINTENANCE': 'bg-indigo-100 text-indigo-800',
      'SUPPLIES': 'bg-pink-100 text-pink-800',
      'INSURANCE': 'bg-cyan-100 text-cyan-800',
      'DEPRECIATION': 'bg-gray-100 text-gray-800',
      'MISC': 'bg-slate-100 text-slate-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const filteredEntries = entries.filter(entry =>
    entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalAmount = filteredEntries.reduce((sum, entry) => sum + entry.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Indirect Cost Entries
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Track and manage overhead costs by date and category
          </p>
        </div>
        {isAccountantOrAdmin && (
          <Link href="/dashboard/finance/cost-entries/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Cost Entry
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Entries</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {filteredEntries.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {new Set(entries.map(e => e.category)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by description or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="RENT">Rent</SelectItem>
                <SelectItem value="UTILITIES">Utilities</SelectItem>
                <SelectItem value="LABOR">Labor</SelectItem>
                <SelectItem value="FUEL">Fuel</SelectItem>
                <SelectItem value="GAS">Gas</SelectItem>
                <SelectItem value="TRANSPORTATION">Transportation</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="SUPPLIES">Supplies</SelectItem>
                <SelectItem value="INSURANCE">Insurance</SelectItem>
                <SelectItem value="DEPRECIATION">Depreciation</SelectItem>
                <SelectItem value="MISC">Miscellaneous</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading cost entries...</div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No cost entries found. {isAccountantOrAdmin && 'Add your first cost entry to get started.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    {isAccountantOrAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {format(new Date(entry.entry_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(entry.category)}>
                          {entry.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell className="text-right font-mono">
                        ${entry.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      {isAccountantOrAdmin && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(entry.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
