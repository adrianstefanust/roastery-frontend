'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, CreditCard, BarChart3, Home, LogOut } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useAuth } from '@/lib/hooks/use-auth'

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user } = useAuthStore()
  const { logout } = useAuth()

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      router.push('/login')
      return
    }

    // Check if user is SUPERADMIN
    if (user.role !== 'SUPERADMIN') {
      router.push('/dashboard')
    }
  }, [user, router])

  if (!user || user.role !== 'SUPERADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold">SUPERADMIN Panel</h1>
              <div className="flex space-x-4">
                <Link
                  href="/superadmin"
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
                <Link
                  href="/superadmin/tenants"
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Tenants
                </Link>
                <Link
                  href="/superadmin/payments"
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payments
                </Link>
                <Link
                  href="/superadmin/analytics"
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-white/80">{user.email}</span>
              <button
                onClick={logout}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
