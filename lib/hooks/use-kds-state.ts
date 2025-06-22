import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/modassembly/supabase/client'
import { useSession } from '@/lib/auth/session-manager'
import {
  type KDSOrderRouting,
  fetchAllActiveOrders,
  fetchStationOrders,
} from '@/lib/modassembly/supabase/database/kds'

export type KDSViewMode = 'grid' | 'list' | 'table'
export type KDSSortBy = 'time' | 'priority' | 'table'
export type KDSFilterBy = 'all' | 'new' | 'preparing' | 'overdue'
export type KDSConnectionStatus = 'connected' | 'disconnected' | 'reconnecting'

export interface KDSState {
  // Data
  orders: KDSOrderRouting[]
  loading: boolean
  error: string | null

  // UI state
  viewMode: KDSViewMode
  sortBy: KDSSortBy
  filterBy: KDSFilterBy
  soundEnabled: boolean

  // Connection
  connectionStatus: KDSConnectionStatus
}

export interface KDSActions {
  // Data actions
  refetch: () => Promise<void>
  optimisticUpdate: (
    routingId: string,
    updates: Partial<KDSOrderRouting>
  ) => void

  // UI actions
  setViewMode: (mode: KDSViewMode) => void
  setSortBy: (sort: KDSSortBy) => void
  setFilterBy: (filter: KDSFilterBy) => void
  toggleSound: () => void
}

export function useKDSState(stationId?: string) {
  const { session, loading: sessionLoading } = useSession()
  const [state, setState] = useState<KDSState>({
    orders: [],
    loading: true,
    error: null,
    viewMode: 'table',
    sortBy: 'time',
    filterBy: 'all',
    soundEnabled: true,
    connectionStatus: 'disconnected',
  })

  const supabaseRef = useRef(createClient())
  const sessionCheckRef = useRef(false)
  const optimisticUpdatesRef = useRef<Map<string, Partial<KDSOrderRouting>>>(
    new Map()
  )

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }))

      // Check session from session manager
      if (!session) {
        console.error('🚨 [KDS Client] No session available from session manager')
        setState(prev => ({ 
          ...prev, 
          error: 'Authentication required for KDS data access',
          loading: false,
          connectionStatus: 'disconnected'
        }))
        return
      }

      if (!sessionCheckRef.current) {
        console.log('🔐 [KDS Client] Session available from session manager:', {
          hasSession: !!session,
          userId: session.user.id,
          email: session.user.email,
          role: session.user.user_metadata?.role,
          timestamp: new Date().toISOString()
        })
        sessionCheckRef.current = true
      }

      const supabase = createClient()
      const data = stationId
        ? await fetchStationOrders(supabase, stationId)
        : await fetchAllActiveOrders(supabase)

      // Apply optimistic updates
      const updatedData = data.map(order => {
        const optimisticUpdate = optimisticUpdatesRef.current.get(order.id)
        return optimisticUpdate ? { ...order, ...optimisticUpdate } : order
      })

      setState(prev => ({
        ...prev,
        orders: updatedData,
        loading: false,
        connectionStatus: 'connected',
      }))
    } catch (error) {
      console.error('Error fetching KDS orders:', error)
      setState(prev => ({
        ...prev,
        error:
          error instanceof Error ? error.message : 'Failed to fetch orders',
        loading: false,
        connectionStatus: 'disconnected',
      }))
    }
    }, [stationId, session])

  // Optimistic update
  const optimisticUpdate = useCallback(
    (routingId: string, updates: Partial<KDSOrderRouting>) => {
      if (!routingId) {
        return
      }

      optimisticUpdatesRef.current.set(routingId, updates)

      setState(prev => ({
        ...prev,
        orders: prev.orders.map(order =>
          order.id === routingId ? { ...order, ...updates } : order
        ),
      }))
    },
    []
  )

  // UI actions
  const setViewMode = useCallback((mode: KDSViewMode) => {
    setState(prev => ({ ...prev, viewMode: mode }))
  }, [])

  const setSortBy = useCallback((sort: KDSSortBy) => {
    setState(prev => ({ ...prev, sortBy: sort }))
  }, [])

  const setFilterBy = useCallback((filter: KDSFilterBy) => {
    setState(prev => ({ ...prev, filterBy: filter }))
  }, [])

  const toggleSound = useCallback(() => {
    setState(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))
  }, [])

  // Set up real-time subscription
  useEffect(() => {
    const supabase = supabaseRef.current

    // Verify session before setting up subscriptions
    const setupSubscription = async () => {
      // Don't attempt subscription setup until session loading is complete
      if (sessionLoading) {
        console.log('🔄 [KDS Client] Waiting for session to load...')
        return null
      }

      if (!session) {
        console.error('🚨 [KDS Client] No session for real-time subscription')
        setState(prev => ({ ...prev, connectionStatus: 'disconnected' }))
        return null
      }

      console.log('🔐 [KDS Client] Setting up real-time subscription with session:', {
        userId: session.user.id,
        stationId: stationId || 'all'
      })

      return supabase
        .channel(`kds-orders-${stationId || 'all'}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'kds_order_routing' },
          (payload) => {
            console.log('📡 [KDS Client] Real-time update received:', payload.eventType)
            fetchOrders()
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            console.log('📡 [KDS Client] Orders table update received:', payload.eventType)
            fetchOrders()
          }
        )
        .subscribe((status) => {
          console.log('📡 [KDS Client] Subscription status:', status)
          setState(prev => ({
            ...prev,
            connectionStatus: status === 'SUBSCRIBED' ? 'connected' : 'disconnected'
          }))
        })
    }

    let channel: any = null
    setupSubscription().then(ch => { 
      channel = ch 
    })

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [stationId, fetchOrders, session, sessionLoading])

  // Initial fetch - only when session is available
  useEffect(() => {
    if (!sessionLoading && session) {
      fetchOrders()
    } else if (!sessionLoading && !session) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'No authentication session available',
        connectionStatus: 'disconnected'
      }))
    }
  }, [fetchOrders, sessionLoading, session])

  // Filtered and sorted orders
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = [...state.orders]

    // Apply filters
    switch (state.filterBy) {
      case 'new':
        filtered = filtered.filter(order => !order.started_at)
        break
      case 'preparing':
        filtered = filtered.filter(
          order => order.started_at && !order.completed_at
        )
        break
      case 'overdue':
        const now = Date.now()
        filtered = filtered.filter(order => {
          const startTime = order.started_at
            ? new Date(order.started_at).getTime()
            : new Date(order.routed_at).getTime()
          return (now - startTime) / 1000 > 600 // Over 10 minutes
        })
        break
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (state.sortBy) {
        case 'priority':
          return (b.priority || 0) - (a.priority || 0)
        case 'table':
          const tableA = a.order?.table?.label || ''
          const tableB = b.order?.table?.label || ''
          return tableA.localeCompare(tableB)
        case 'time':
        default:
          return (
            new Date(a.routed_at).getTime() - new Date(b.routed_at).getTime()
          )
      }
    })

    return filtered
  }, [state.orders, state.filterBy, state.sortBy])

  const actions: KDSActions = {
    refetch: fetchOrders,
    optimisticUpdate,
    setViewMode,
    setSortBy,
    setFilterBy,
    toggleSound,
  }

  return {
    ...state,
    filteredAndSortedOrders,
    ...actions,
  }
}

// Simple audio utility
export function useKDSAudio() {
  const audioRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    const initAudio = () => {
      if (!audioRef.current && typeof window !== 'undefined') {
        audioRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)()
      }
    }

    window.addEventListener('click', initAudio, { once: true })
    return () => window.removeEventListener('click', initAudio)
  }, [])

  const playSound = useCallback(
    (frequency: number = 800, duration: number = 0.1) => {
      if (!audioRef.current) {
        return
      }

      try {
        const oscillator = audioRef.current.createOscillator()
        const gainNode = audioRef.current.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioRef.current.destination)

        oscillator.frequency.value = frequency
        oscillator.type = 'sine'
        gainNode.gain.setValueAtTime(0.3, audioRef.current.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioRef.current.currentTime + duration
        )

        oscillator.start(audioRef.current.currentTime)
        oscillator.stop(audioRef.current.currentTime + duration)
      } catch (error) {
        console.error('Error playing sound:', error)
      }
    },
    []
  )

  return { playSound }
}
