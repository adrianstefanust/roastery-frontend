'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BarChart, TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { env } from '@/lib/config/env'
import { useAuthStore } from '@/lib/stores/auth-store'
import { toast } from 'sonner'

export default function FinanceReportsPage() {
  const router = useRouter()
  const token = useAuthStore((state) => state.token)

  const [reportType, setReportType] = useState<'hpp' | 'variance'>('hpp')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [hppData, setHppData] = useState<any>(null)
  const [varianceData, setVarianceData] = useState<any[]>([])

  useEffect(() => {
    if (reportType === 'hpp') {
      fetchHPPReport()
    } else {
      fetchVarianceReport()
    }
  }, [reportType, selectedYear])

  const fetchHPPReport = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `${env.apiBase}/api/v1/finance/reports/hpp?year=${selectedYear}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch HPP report')
      }

      const data = await response.json()
      setHppData(data.data)
    } catch (error) {
      console.error('Error fetching HPP report:', error)
      toast.error('Failed to load HPP report')
    } finally {
      setLoading(false)
    }
  }

  const fetchVarianceReport = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `${env.apiBase}/api/v1/finance/reports/variance?year=${selectedYear}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch variance report')
      }

      const data = await response.json()
      setVarianceData(data.data || [])
    } catch (error) {
      console.error('Error fetching variance report:', error)
      toast.error('Failed to load variance report')
    } finally {
      setLoading(false)
    }
  }

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months[month - 1] || 'Unknown'
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Financial Reports
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          View cost analysis and variance reports
        </p>
      </div>

      {/* Report Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Report Type Selection */}
            <div className="space-y-2">
              <Label>Report Type</Label>
              <div className="flex gap-2">
                <Button
                  variant={reportType === 'hpp' ? 'default' : 'outline'}
                  onClick={() => setReportType('hpp')}
                  className="flex-1"
                >
                  <BarChart className="mr-2 h-4 w-4" />
                  HPP Report
                </Button>
                <Button
                  variant={reportType === 'variance' ? 'default' : 'outline'}
                  onClick={() => setReportType('variance')}
                  className="flex-1"
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Variance
                </Button>
              </div>
            </div>

            {/* Year Selection */}
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* HPP Report */}
      {reportType === 'hpp' && (
        <>
          {loading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-12">
                  <div className="animate-pulse text-gray-500">Loading HPP report...</div>
                </div>
              </CardContent>
            </Card>
          ) : hppData ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-gray-600">Total Overhead</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">
                      ${hppData.total_overhead?.toLocaleString() || '0'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-gray-600">Total Production</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">
                      {hppData.total_production_kg?.toFixed(2) || '0'} kg
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-gray-600">Avg HPP per kg</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">
                      ${hppData.average_hpp?.toFixed(2) || '0'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly HPP Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Month</th>
                          <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">Overhead</th>
                          <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">Production (kg)</th>
                          <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">HPP/kg</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hppData.months?.length > 0 ? (
                          hppData.months.map((month: any) => (
                            <tr key={month.month} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm text-gray-900">
                                {getMonthName(month.month)}
                              </td>
                              <td className="py-3 px-4 text-right text-sm text-gray-900">
                                ${month.overhead?.toLocaleString() || '0'}
                              </td>
                              <td className="py-3 px-4 text-right text-sm text-gray-900">
                                {month.production_kg?.toFixed(2) || '0'}
                              </td>
                              <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                                ${month.hpp_per_kg?.toFixed(2) || '0'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-12 text-center text-sm text-gray-500">
                              No data available for {selectedYear}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <BarChart className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No HPP data available</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Record indirect costs and production to generate HPP reports
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Variance Report */}
      {reportType === 'variance' && (
        <Card>
          <CardHeader>
            <CardTitle>Cost Variance Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-gray-500">Loading variance report...</div>
              </div>
            ) : varianceData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Period</th>
                      <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">Estimated</th>
                      <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">Actual</th>
                      <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">Variance</th>
                      <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">Variance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {varianceData.map((item: any) => {
                      const isFavorable = item.variance < 0
                      return (
                        <tr key={`${item.year}-${item.month}`} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {getMonthName(item.month)} {item.year}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right text-sm text-gray-900">
                            ${item.estimated?.toLocaleString() || '0'}
                          </td>
                          <td className="py-3 px-4 text-right text-sm text-gray-900">
                            ${item.actual?.toLocaleString() || '0'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`text-sm font-medium ${isFavorable ? 'text-green-600' : 'text-red-600'}`}>
                              {isFavorable ? (
                                <span className="flex items-center justify-end gap-1">
                                  <TrendingDown className="h-4 w-4" />
                                  ${Math.abs(item.variance).toLocaleString()}
                                </span>
                              ) : (
                                <span className="flex items-center justify-end gap-1">
                                  <TrendingUp className="h-4 w-4" />
                                  ${item.variance.toLocaleString()}
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Badge className={isFavorable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {item.variance_pct?.toFixed(1) || '0'}%
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No variance data available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Record both estimated and actual costs to see variance analysis
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              About HPP (Cost of Goods Manufactured)
            </h3>
            <p className="text-sm text-blue-800">
              HPP distributes monthly overhead costs across all production for that period.
              It shows the overhead cost per kilogram of coffee roasted, which helps in pricing decisions.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold text-amber-900 mb-2">
              About Variance Analysis
            </h3>
            <p className="text-sm text-amber-800">
              Variance compares estimated (budgeted) costs to actual costs. Negative variance (green)
              means you spent less than planned. Positive variance (red) means you spent more than budgeted.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
