'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Bell, LogOut, Menu, Home, Package, Flame, Users,
  ShoppingCart, TrendingUp, PackageOpen, ClipboardList,
  FileText, Truck, UserCircle, Receipt, DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useAuth } from '@/lib/hooks/use-auth'
import { getCurrencyIcon } from '@/lib/utils/currency'

type NavItem = {
  href: string
  label: string
  icon: any
  children?: NavItem[]
}

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

  const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    {
      href: '/dashboard/inventory',
      label: 'Inventory',
      icon: Package,
      children: [
        { href: '/dashboard/inventory/stock', label: 'Stock Overview', icon: PackageOpen },
        { href: '/dashboard/inventory/lots', label: 'Coffee Lots', icon: ClipboardList },
        { href: '/dashboard/inventory/grn', label: 'Goods Receipt', icon: Receipt },
      ]
    },
    {
      href: '/dashboard/production',
      label: 'Production',
      icon: Flame,
      children: [
        { href: '/dashboard/production/batches', label: 'Roast Batches', icon: Flame },
      ]
    },
    {
      href: '/dashboard/purchasing',
      label: 'Purchasing',
      icon: ShoppingCart,
      children: [
        { href: '/dashboard/purchasing/suppliers', label: 'Suppliers', icon: Truck },
        { href: '/dashboard/purchasing/orders', label: 'Purchase Orders', icon: FileText },
      ]
    },
    {
      href: '/dashboard/sales',
      label: 'Sales',
      icon: TrendingUp,
      children: [
        { href: '/dashboard/sales/clients', label: 'Clients', icon: UserCircle },
        { href: '/dashboard/sales/orders', label: 'Sales Orders', icon: Receipt },
      ]
    },
    {
      href: '/dashboard/finance',
      label: 'Finance',
      icon: CurrencyIcon,
      children: [
        { href: '/dashboard/finance/costs', label: 'Cost Management', icon: DollarSign },
      ]
    },
  ]

  if (isAdmin) {
    navItems.push({ href: '/dashboard/users', label: 'Users', icon: Users })
  }

  // Find active parent and children for sub-navigation
  const activeParent = navItems.find(item =>
    item.children && pathname.startsWith(item.href + '/')
  )
  const showSubNav = activeParent && activeParent.children && activeParent.children.length > 0

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
                        <div key={item.href}>
                          <Link
                            href={item.children ? item.children[0].href : item.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              isActive
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                            {item.label}
                          </Link>
                          {/* Show children if parent is active */}
                          {item.children && isActive && (
                            <div className="ml-8 mt-1 space-y-1">
                              {item.children.map((child) => {
                                const ChildIcon = child.icon
                                const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/')
                                return (
                                  <Link
                                    key={child.href}
                                    href={child.href}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                      isChildActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                  >
                                    <ChildIcon className="h-4 w-4" />
                                    {child.label}
                                  </Link>
                                )
                              })}
                            </div>
                          )}
                        </div>
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
                    href={item.children ? item.children[0].href : item.href}
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

      {/* Sub Navigation - Shows when in a section with children */}
      {showSubNav && activeParent && (
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1 py-2 overflow-x-auto">
              {activeParent.children!.map((child) => {
                const ChildIcon = child.icon
                const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/')

                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      isChildActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <ChildIcon className="h-4 w-4" />
                    {child.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {children}
      </main>
    </div>
  )
}
