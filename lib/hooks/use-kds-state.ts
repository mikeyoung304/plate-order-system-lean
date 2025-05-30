import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/modassembly/supabase/client'
import { 
  fetchStationOrders, 
  fetchAllActiveOrders,
  type KDSOrderRouting 
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
  optimisticUpdate: (routingId: string, updates: Partial<KDSOrderRouting>) => void
  
  // UI actions
  setViewMode: (mode: KDSViewMode) => void
  setSortBy: (sort: KDSSortBy) => void
  setFilterBy: (filter: KDSFilterBy) => void
  toggleSound: () => void
}

export function useKDSState(stationId?: string) {
  const [state, setState] = useState<KDSState>({
    orders: [],
    loading: true,
    error: null,
    viewMode: 'table',
    sortBy: 'time',
    filterBy: 'all',
    soundEnabled: true,
    connectionStatus: 'disconnected'
  })
  
  const supabaseRef = useRef(createClient())
  const optimisticUpdatesRef = useRef<Map<string, Partial<KDSOrderRouting>>>(new Map())
  
  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }))
      
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
        connectionStatus: 'connected'
      }))
    } catch (error) {
      console.error('Error fetching KDS orders:', error)
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to fetch orders',
        loading: false,
        connectionStatus: 'disconnected'
      }))
    }
  }, [stationId])
  
  // Optimistic update
  const optimisticUpdate = useCallback((routingId: string, updates: Partial<KDSOrderRouting>) => {
    if (!routingId) return
    
    optimisticUpdatesRef.current.set(routingId, updates)
    
    setState(prev => ({
      ...prev,
      orders: prev.orders.map(order => 
        order.id === routingId ? { ...order, ...updates } : order
      )
    }))
  }, [])
  
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
    
    const channel = supabase
      .channel(`kds-orders-${stationId || 'all'}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'kds_order_routing' },
        () => fetchOrders()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchOrders()
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [stationId, fetchOrders])
  
  // Initial fetch
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])
  
  // Filtered and sorted orders
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = [...state.orders]
    
    // Apply filters
    switch (state.filterBy) {
      case 'new':
        filtered = filtered.filter(order => !order.started_at)
        break
      case 'preparing':
        filtered = filtered.filter(order => order.started_at && !order.completed_at)
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
          return new Date(a.routed_at).getTime() - new Date(b.routed_at).getTime()
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
    toggleSound
  }
  
  return {
    ...state,
    filteredAndSortedOrders,
    ...actions
  }
}

// Simple audio utility
export function useKDSAudio() {
  const audioRef = useRef<AudioContext | null>(null)
  
  useEffect(() => {
    const initAudio = () => {
      if (!audioRef.current && typeof window !== 'undefined') {
        audioRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
    }
    
    window.addEventListener('click', initAudio, { once: true })
    return () => window.removeEventListener('click', initAudio)
  }, [])
  
  const playSound = useCallback((frequency: number = 800, duration: number = 0.1) => {
    if (!audioRef.current) return
    
    try {
      const oscillator = audioRef.current.createOscillator()
      const gainNode = audioRef.current.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioRef.current.destination)
      
      oscillator.frequency.value = frequency
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.3, audioRef.current.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioRef.current.currentTime + duration)
      
      oscillator.start(audioRef.current.currentTime)
      oscillator.stop(audioRef.current.currentTime + duration)
    } catch (error) {
      console.error('Error playing sound:', error)
    }
  }, [])
  
  return { playSound }
}