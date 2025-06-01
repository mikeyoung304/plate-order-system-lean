'use client'

import { ProtectedRoute } from '@/lib/modassembly/supabase/auth'

export default function SimpleKitchenPage() {
  return (
    <ProtectedRoute roles='cook'>
      <div className='p-8 bg-gray-900 min-h-screen'>
        <h1 className='text-3xl font-bold text-white'>
          Kitchen Display - Working!
        </h1>
        <p className='text-gray-300 mt-4'>
          Simple test page to verify routing works.
        </p>
      </div>
    </ProtectedRoute>
  )
}
