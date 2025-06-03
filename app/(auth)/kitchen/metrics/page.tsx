'use client'

import { Shell } from '@/components/shell'
import { ProtectedRoute } from '@/lib/modassembly/supabase/auth'
import { LiveRestaurantMetrics } from '@/components/analytics/live-restaurant-metrics'

export default function MetricsPage() {
  return (
    <ProtectedRoute roles={['cook', 'admin']}>
      <Shell className='bg-gray-900 min-h-screen'>
        <div className='container py-6'>
          <LiveRestaurantMetrics />
        </div>
      </Shell>
    </ProtectedRoute>
  )
}
