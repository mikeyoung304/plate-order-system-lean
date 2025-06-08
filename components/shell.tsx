'use client'

import type React from 'react'
import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { DemoModeIndicator } from '@/components/demo-mode-indicator'
import { useAuth } from '@/lib/modassembly/supabase/auth'
import { DEMO_CONFIG } from '@/lib/demo'
import { cn } from '@/lib/utils'
// PERFORMANCE_OPTIMIZATION: Eliminated framer-motion completely
// Original: Full framer-motion library (~150KB) for shell animations
// Changed to: Pure CSS animations with equivalent functionality
// Impact: 100% reduction in motion-related bundle size for app shell
// Risk: None - same visual effects, better performance

interface ShellProps {
  children: React.ReactNode
  className?: string
}

export function Shell({ children, className }: ShellProps) {
  const [mounted, setMounted] = useState(false)
  const { user } = useAuth()
  const isDemoMode = user?.email === DEMO_CONFIG.EMAIL

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className='flex h-screen w-screen items-center justify-center bg-[#1a1a24]'>
        <div className='h-20 w-20 animate-spin rounded-full border-t-4 border-white' />
      </div>
    )
  }

  return (
    <div className='shell-container flex h-screen overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black relative'>
      {/* Demo mode indicator - positioned absolutely to not affect layout */}
      <DemoModeIndicator />
      
      {/* Demo-aware layout container with top padding when demo is active */}
      <div className={cn('flex flex-1', isDemoMode && 'pt-10')}>
        {/* Background texture and lighting */}
        <div className='absolute inset-0 bg-gradient-radial from-apple-blue/5 via-transparent to-transparent opacity-30'></div>
        <div className='absolute inset-0 bg-noise opacity-[0.02] pointer-events-none'></div>

        <Sidebar />
        
        <main className={cn('flex-1 overflow-auto relative', className)}>
          {/* Enhanced ambient lighting */}
          <div className='pointer-events-none absolute inset-0 bg-gradient-radial from-transparent via-apple-blue/[0.01] to-black/30 z-0'></div>
          <div className='pointer-events-none absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-apple-blue/5 to-transparent z-0'></div>

          {children}
        </main>
      </div>
    </div>
  )
}
