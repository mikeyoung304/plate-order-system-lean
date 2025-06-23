import dynamic from 'next/dynamic'
import { PageLoadingState } from '@/components/loading-states'
import { createClient } from '@/lib/modassembly/supabase/server'
import { fetchKDSStations } from '@/lib/modassembly/supabase/database/kds'

const KDSInterface = dynamic(() => import('@/components/kds/KDSInterface').then(mod => mod.KDSInterface), {
  loading: () => <PageLoadingState message='Loading Kitchen Display System...' showProgress />,
  ssr: true
})

export default async function KDSPage() {
  try {
    // Server-side data fetching with authenticated server client
    const supabase = await createClient()
    
    // Verify authentication with comprehensive logging
    const { data: { session } } = await supabase.auth.getSession()
    
    console.log('🔐 [KDS Server] Session check:', {
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
      role: session?.user?.user_metadata?.role,
      expiresAt: session?.expires_at,
      timestamp: new Date().toISOString()
    })
    
    if (!session) {
      console.error('🚨 [KDS Server] No session found - redirecting to auth')
      throw new Error('Authentication required for KDS access')
    }

    // Fetch initial station data server-side
    const stations = await fetchKDSStations(supabase)

    return <KDSInterface initialStations={stations} />
  } catch (error) {
    console.error('KDS Server Component Error:', error)
    
    return (
      <PageLoadingState
        message='Failed to load Kitchen Display System'
        showProgress={false}
      />
    )
  }
}
