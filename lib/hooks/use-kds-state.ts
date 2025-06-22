import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/modassembly/supabase/client'
import { getRealtimeManager } from '@/lib/realtime/session-aware-subscriptions'
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
        ? await fetchStationOrders(stationId)
        : await fetchAllActiveOrders()

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

  // Set up real-time subscription with session-aware manager
  useEffect(() => {
    // Don't attempt subscription until session is loaded
    if (sessionLoading) {
      console.log('🔄 [KDS] Waiting for session to load...')
      return
    }

    if (!session) {
      console.error('🚨 [KDS] No session for real-time subscription')
      setState(prev => ({ ...prev, connectionStatus: 'disconnected' }))
      return
    }

    const realtimeManager = getRealtimeManager()
    let subscriptionId: string | null = null

    const setupSubscription = async () => {
      try {
        console.log('🔐 [KDS] Setting up real-time subscription with session:', {
          userId: session.user.id,
          stationId: stationId || 'all'
        })

        // Subscribe to kds_order_routing table
        const kdsSubscriptionId = await realtimeManager.subscribe({
          table: 'kds_order_routing',
          event: '*',
          filter: stationId ? `station_id=eq.${stationId}` : undefined,
          onData: (payload) => {
            console.log('📡 [KDS] Real-time update received:', payload.eventType)
            fetchOrders()
          },
          onConnect: () => {
            setState(prev => ({ ...prev, connectionStatus: 'connected' }))
          },
          onDisconnect: () => {
            setState(prev => ({ ...prev, connectionStatus: 'disconnected' }))
          },
          onError: (error) => {
            console.error('❌ [KDS] Real-time error:', error)
            setState(prev => ({ 
              ...prev, 
              connectionStatus: 'disconnected',
              error: error.message 
            }))
          }
        })

        subscriptionId = kdsSubscriptionId

        // Also subscribe to orders table for updates
        await realtimeManager.subscribe({
          table: 'orders',
          event: '*',
          onData: (payload) => {
            console.log('📡 [KDS] Orders table update received:', payload.eventType)
            fetchOrders()
          }
        })

      } catch (error) {
        console.error('❌ [KDS] Failed to setup subscription:', error)
        setState(prev => ({ 
          ...prev, 
          connectionStatus: 'disconnected',
          error: error instanceof Error ? error.message : 'Failed to connect'
        }))
      }
    }

    setupSubscription()

    return () => {
      if (subscriptionId) {
        realtimeManager.unsubscribe(subscriptionId).catch(error =>
          console.error('Error unsubscribing:', error)
        )
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
