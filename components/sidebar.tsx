'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useMediaQuery } from '@/hooks/use-media-query'
import {
  ChefHat,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  Utensils,
} from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
// PERFORMANCE_OPTIMIZATION: Eliminated framer-motion completely
// Original: Full framer-motion library (~150KB) for sidebar animations
// Changed to: Pure CSS animations with equivalent functionality
// Impact: 100% reduction in motion-related bundle size for navigation
// Risk: None - same visual effects, better performance
import { useToast } from '@/components/ui/use-toast'
import { signOut } from '@/lib/modassembly/supabase/auth/actions'

// Animation classes are now handled via CSS for better performance

type NavItem = {
  name: string
  href: string
  icon: React.ReactNode
  badge?: number
}

type SidebarProps = {
  user: {
    id: string
    email?: string
  } | null
  profile: {
    name: string | null
    role: string | null
  } | null
}

export function Sidebar({ user: _user, profile }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { toast } = useToast()

  const userData = {
    name: profile?.name || null,
    role: profile?.role || null,
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className='h-5 w-5' />,
    },
    {
      name: 'Server',
      href: '/server',
      icon: <Utensils className='h-5 w-5' />,
      badge: 2,
    },
    {
      name: 'Kitchen',
      href: '/kitchen',
      icon: <ChefHat className='h-5 w-5' />,
      badge: 5,
    },
    {
      name: 'Expo',
      href: '/expo',
      icon: <Shield className='h-5 w-5' />,
      badge: 2,
    },
    {
      name: 'Admin',
      href: '/admin',
      icon: <Settings className='h-5 w-5' />,
    },
  ]

  const renderNavItems = () => (
    <ul className='sidebar-nav-container space-y-2 px-4 py-4'>
      {navItems.map((navItem, index) => (
        <li
          key={navItem.href}
          className={`sidebar-nav-item sidebar-nav-item-${index + 1}`}
        >
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={navItem.href}
                  className={cn(
                    'flex items-center px-4 py-3 rounded-2xl transition-all duration-300 relative group font-display font-medium backdrop-blur-sm',
                    pathname === navItem.href
                      ? 'bg-gradient-to-r from-apple-blue/20 to-apple-blue/10 text-white border border-apple-blue/30 shadow-lg'
                      : 'text-apple-gray-5 hover:bg-white/10 hover:text-white hover:scale-105 hover:shadow-lg'
                  )}
                  onClick={() => isMobile && setIsMobileOpen(false)}
                >
                  <span className='mr-3'>{navItem.icon}</span>
                  {(isMobileOpen || !collapsed) && <span>{navItem.name}</span>}
                  {navItem.badge && (
                    <Badge
                      variant='default'
                      className='ml-auto bg-gradient-to-r from-apple-red to-apple-orange text-white border-0 shadow-lg animate-pulse'
                    >
                      {navItem.badge}
                    </Badge>
                  )}
                </Link>
              </TooltipTrigger>
              {collapsed && !isMobile && (
                <TooltipContent side='right'>
                  <p>{navItem.name}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </li>
      ))}
    </ul>
  )

  // In the mobile view
  const userInfoSection = (
    <div className='p-6 border-t border-white/10 mt-auto bg-gradient-to-t from-black/20 to-transparent backdrop-blur-sm'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center'>
          <Avatar className='h-10 w-10 mr-3 ring-2 ring-apple-blue/30 shadow-lg'>
            <AvatarFallback>{userData.name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <p className='text-sm font-display font-semibold text-white'>
              {userData.name || 'User'}
            </p>
            <p className='text-xs text-apple-gray-5 font-sans capitalize'>
              {userData.role || 'Loading...'}
            </p>
          </div>
        </div>
        <Button
          variant='ghost'
          size='icon'
          onClick={handleSignOut}
          className='text-gray-400 hover:text-white hover:bg-white/10'
        >
          <LogOut className='h-5 w-5' />
        </Button>
      </div>
    </div>
  )

  // In the desktop view
  const desktopUserInfoSection = (
    <div className='p-6 border-t border-white/10 bg-gradient-to-t from-black/20 to-transparent backdrop-blur-sm'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center min-w-0'>
          <Avatar className='h-10 w-10 mr-3 flex-shrink-0 ring-2 ring-apple-blue/30 shadow-lg'>
            <AvatarFallback>{userData.name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className='min-w-0'>
              <p className='text-sm font-medium sf-pro-text truncate'>
                {userData.name || 'User'}
              </p>
              <p className='text-xs text-gray-400 sf-pro-text capitalize'>
                {userData.role || 'Loading...'}
              </p>
            </div>
          )}
        </div>
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                onClick={handleSignOut}
                className='text-gray-400 hover:text-white hover:bg-white/10'
              >
                <LogOut className='h-5 w-5' />
              </Button>
            </TooltipTrigger>
            <TooltipContent side='right'>Sign Out</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )

  // Mobile sidebar
  if (isMobile) {
    return (
      <>
        <Button
          variant='ghost'
          size='icon'
          className='fixed top-4 left-4 z-50'
          onClick={() => setIsMobileOpen(true)}
        >
          <Menu className='h-5 w-5' />
        </Button>

        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetContent
            side='left'
            className='w-64 bg-[#1a1a24] border-r border-gray-800 p-0'
          >
            <div className='flex flex-col h-full'>
              <div className='p-4'>
                <Image
                  src='/images/plate-logo-white.png'
                  alt='Logo'
                  width={32}
                  height={32}
                />
              </div>

              {renderNavItems()}

              {userInfoSection}
            </div>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  // Desktop sidebar
  return (
    <div
      className={cn(
        'bg-black/20 backdrop-blur-2xl border-r border-white/10 flex flex-col transition-all duration-500 ease-out shadow-2xl',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className='p-6 flex items-center justify-between border-b border-white/10'>
        <Image
          src='/images/plate-logo-white.png'
          alt='Logo'
          width={36}
          height={36}
          className='drop-shadow-lg'
        />
        <Button
          variant='ghost'
          size='icon'
          onClick={() => setCollapsed(!collapsed)}
          className='text-apple-gray-5 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300'
        >
          <ChevronLeft
            className={cn(
              'h-5 w-5 transition-transform duration-300',
              collapsed && 'rotate-180'
            )}
          />
        </Button>
      </div>

      {renderNavItems()}

      {desktopUserInfoSection}
    </div>
  )
}
