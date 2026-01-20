'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, LogOut, Menu, X, Home, Package, Flame, Users, ShoppingCart, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useAuth } from '@/lib/hooks/use-auth'
import { getCurrencyIcon } from '@/lib/utils/currency'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { logout, isAdmin } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Check authentication and redirect SUPERADMIN
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // Redirect SUPERADMIN to their panel
    if (user?.role === 'SUPERADMIN') {
      router.push('/superadmin')
    }
  }, [isAuthenticated, user, router])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  if (!isAuthenticated) {
    return null // Show nothing while redirecting
  }

  const CurrencyIcon = getCurrencyIcon(user?.currency || 'USD')

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/inventory/stock', label: 'Stock Overview', icon: Package },
    { href: '/dashboard/production/batches', label: 'Production', icon: Flame },
    { href: '/dashboard/purchasing/suppliers', label: 'Purchasing', icon: ShoppingCart },
    { href: '/dashboard/sales/clients', label: 'Sales', icon: TrendingUp },
    { href: '/dashboard/finance/costs', label: 'Finance', icon: CurrencyIcon },
  ]

  if (isAdmin) {
    navItems.push({ href: '/dashboard/users', label: 'Users', icon: Users })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Mobile Menu Button and Logo */}
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    aria-label="Open menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72">
                  <SheetHeader>
                    <SheetTitle className="text-left">Roastery OS</SheetTitle>
                  </SheetHeader>

                  {/* User Info */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">
                          {user?.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user?.email}
                        </p>
                        <p className="text-xs text-gray-500">{user?.role}</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Navigation Links */}
                  <nav className="space-y-1">
                    {navItems.map((item) => {
                      const Icon = item.icon
                      // For Dashboard, only exact match. For others, match sub-routes too
                      const isActive = item.href === '/dashboard'
                        ? pathname === '/dashboard'
                        : pathname === item.href || pathname.startsWith(item.href + '/')

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          {item.label}
                        </Link>
                      )
                    })}
                  </nav>

                  <Separator className="my-4" />

                  {/* Actions */}
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        // Notifications action
                      }}
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      Notifications
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        logout()
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 whitespace-nowrap">
                Roastery OS
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                // For Dashboard, only exact match. For others, match sub-routes too
                const isActive = item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname === item.href || pathname.startsWith(item.href + '/')

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* Desktop User Menu */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span className="hidden lg:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {children}
      </main>
    </div>
  )
}
