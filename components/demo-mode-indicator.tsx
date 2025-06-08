'use client'

import { useAuth } from '@/lib/modassembly/supabase/auth'
import { DEMO_CONFIG } from '@/lib/demo'

export function DemoModeIndicator() {
  const { user } = useAuth()

  // Only show for demo users
  if (user?.email !== DEMO_CONFIG.EMAIL) {
    return null
  }

  return (
    <div className='fixed top-0 left-0 right-0 bg-purple-600 text-white text-center py-2 z-50 shadow-lg border-b border-purple-500'>
      <div className='flex items-center justify-center gap-2 text-sm'>
        <span className='text-base'>🎮</span>
        <span className='font-medium'>Demo Mode - All Features Unlocked for Testing</span>
        <span className='text-xs opacity-90 bg-purple-700 px-2 py-1 rounded'>
          {user.email}
        </span>
      </div>
    </div>
  )
}