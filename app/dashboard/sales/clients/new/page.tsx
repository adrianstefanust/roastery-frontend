'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { env } from '@/lib/config/env'
import { useAuthStore } from '@/lib/stores/auth-store'
import { toast } from 'sonner'

export default function NewClientPage() {
  const router = useRouter()
  const token = useAuthStore((state) => state.token)

  const [form, setForm] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    shipping_address: '',
    billing_address: '',
    country: '',
    notes: '',
    is_active: true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!form.name.trim()) {
      newErrors.name = 'Client name is required'
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Invalid email format'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the validation errors')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`${env.apiBase}/api/v1/sales/clients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create client')
      }

      const data = await response.json()
      const client = data.client || data
      toast.success('Client created successfully')
      router.push(`/dashboard/sales/clients/${client.id}`)
    } catch (error: any) {
      console.error('Error creating client:', error)
      toast.error(error.message || 'Failed to create client')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href="/dashboard/sales/clients">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Link>
      </Button>

      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-100 rounded-lg">
          <Users className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Add New Client
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Create a new client for selling roasted coffee
          </p>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>
              Enter the details for the new client. Fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Client Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter client name"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  value={form.contact_person}
                  onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                  placeholder="Enter contact person name"
                />
              </div>
            </div>

            {/* Contact Details */}
            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Details</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="email@example.com"
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    placeholder="Enter country"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shipping_address">Shipping Address</Label>
                  <Textarea
                    id="shipping_address"
                    value={form.shipping_address}
                    onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
                    placeholder="Enter shipping address"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billing_address">Billing Address</Label>
                  <Textarea
                    id="billing_address"
                    value={form.billing_address}
                    onChange={(e) => setForm({ ...form, billing_address: e.target.value })}
                    placeholder="Enter billing address (leave blank to use shipping address)"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Add any additional notes about this client"
                    rows={4}
                  />
                  <p className="text-sm text-gray-500">
                    Optional notes or special instructions for this client
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={form.is_active}
                    onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">
                    Active Client
                  </Label>
                </div>
                <p className="text-sm text-gray-500">
                  Inactive clients cannot be used for new sales orders
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Creating...' : 'Create Client'}
          </Button>
        </div>
      </form>
    </div>
  )
}
