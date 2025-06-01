'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Utensils, 
  ChefHat, 
  Shield, 
  Settings, 
  Menu,
  X,
  Sparkles,
  ArrowRight,
  Clock,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useRole, useHasRole } from '@/lib/modassembly/supabase/auth'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  description: string
  roles: string[]
  isNew?: boolean
  isBeta?: boolean
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: <Home className="w-4 h-4" />,
    description: 'Overview and quick access',
    roles: ['server', 'cook', 'admin']
  },
  {
    href: '/server',
    label: 'Server View',
    icon: <Utensils className="w-4 h-4" />,
    description: 'Take orders with voice recognition',
    roles: ['server', 'admin'],
    isNew: true
  },
  {
    href: '/kitchen',
    label: 'Kitchen',
    icon: <ChefHat className="w-4 h-4" />,
    description: 'Food preparation dashboard',
    roles: ['cook', 'admin']
  },
  {
    href: '/expo',
    label: 'Expo',
    icon: <Shield className="w-4 h-4" />,
    description: 'Order delivery coordination',
    roles: ['server', 'cook', 'admin']
  },
  {
    href: '/admin',
    label: 'Admin',
    icon: <Settings className="w-4 h-4" />,
    description: 'System configuration',
    roles: ['admin'],
    isBeta: true
  }
]

export function BetaNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const userRole = useRole()
  const isAdmin = useHasRole('admin')

  // Filter navigation items based on user role
  const accessibleNavItems = navItems.filter(item => 
    item.roles.includes(userRole || '') || isAdmin
  )

  const currentItem = accessibleNavItems.find(item => 
    pathname.startsWith(item.href) && item.href !== '/dashboard' || 
    (pathname === '/dashboard' && item.href === '/dashboard')
  )

  const toggleNav = () => setIsOpen(!isOpen)

  return (
    <>
      {/* Mobile Navigation Button */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <Button
          onClick={toggleNav}
          variant="outline"
          size="icon"
          className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg"
        >
          {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Desktop Quick Navigation */}
      <div className="hidden lg:block fixed top-4 left-4 z-50">
        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg">
          <CardContent className="p-2">
            <div className="flex items-center gap-2">
              {accessibleNavItems.map((item) => {
                const isActive = pathname.startsWith(item.href) && item.href !== '/dashboard' || 
                               (pathname === '/dashboard' && item.href === '/dashboard')
                
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className={`relative ${isActive ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-100'}`}
                      title={item.description}
                    >
                      {item.icon}
                      <span className="ml-2 hidden xl:inline">{item.label}</span>
                      
                      {/* New/Beta badges */}
                      {item.isNew && (
                        <Badge variant="secondary" className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1 scale-75">
                          NEW
                        </Badge>
                      )}
                      {item.isBeta && (
                        <Badge variant="secondary" className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1 scale-75">
                          BETA
                        </Badge>
                      )}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Navigation Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={toggleNav} />
          
          <div className="fixed left-0 top-0 h-full w-80 max-w-[90vw] bg-white shadow-2xl">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">Plate Beta</h2>
                    <p className="text-xs text-gray-500">Navigation</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={toggleNav}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Current Location */}
              {currentItem && (
                <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white">
                      {currentItem.icon}
                    </div>
                    <span className="font-medium text-blue-900">Current: {currentItem.label}</span>
                  </div>
                  <p className="text-sm text-blue-700">{currentItem.description}</p>
                </div>
              )}

              {/* Navigation Items */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-3">
                  Available Views
                </h3>
                
                {accessibleNavItems.map((item) => {
                  const isActive = pathname.startsWith(item.href) && item.href !== '/dashboard' || 
                                 (pathname === '/dashboard' && item.href === '/dashboard')
                  
                  return (
                    <Link key={item.href} href={item.href} onClick={toggleNav}>
                      <div className={`p-3 rounded-lg border-2 transition-all ${
                        isActive 
                          ? 'border-blue-200 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {item.icon}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                                {item.label}
                              </span>
                              
                              {/* Badges */}
                              {item.isNew && (
                                <Badge variant="secondary" className="bg-green-500 text-white text-xs">
                                  NEW
                                </Badge>
                              )}
                              {item.isBeta && (
                                <Badge variant="secondary" className="bg-orange-500 text-white text-xs">
                                  BETA
                                </Badge>
                              )}
                            </div>
                            <p className={`text-sm ${isActive ? 'text-blue-700' : 'text-gray-600'}`}>
                              {item.description}
                            </p>
                          </div>
                          
                          {!isActive && (
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>

              {/* Quick Stats */}
              <div className="mt-6 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Beta Stats</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock className="w-3 h-3" />
                    <span>Live since v2.0</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Users className="w-3 h-3" />
                    <span>Beta tester</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}