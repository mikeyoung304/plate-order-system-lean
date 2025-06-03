'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/modassembly/supabase/client'
import {
  fetchStationOrders,
  fetchAllActiveOrders,
  type KDSOrderRouting,
} from '@/lib/modassembly/supabase/database/kds'
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'

interface UseKDSOrdersOptions {
  stationId?: string // If provided, filter to specific station
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseKDSOrdersReturn {
  orders: KDSOrderRouting[]
  loading: boolean
  error: string | null
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting'
  refetch: () => Promise<void>
  optimisticUpdate: (
    routingId: string,
    updates: Partial<KDSOrderRouting>
  ) => void
  revertOptimisticUpdate: (routingId: string) => void
}

const MAX_RETRY_ATTEMPTS = 5
const INITIAL_RETRY_DELAY = 1000
const MAX_RETRY_DELAY = 30000

export function useKDSOrders(
  options: UseKDSOrdersOptions = {}
): UseKDSOrdersReturn {
  const { stationId, autoRefresh = true, refreshInterval = 5000 } = options

  const [orders, setOrders] = useState<KDSOrderRouting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'disconnected' | 'reconnecting'
  >('disconnected')

  const supabaseRef = useRef<SupabaseClient | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const optimisticUpdatesRef = useRef<Map<string, Partial<KDSOrderRouting>>>(
    new Map()
  )
  const retryAttemptsRef = useRef(0)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    try {
      const client = createClient()
      if (isMountedRef.current) {
        supabaseRef.current = client
      }
    } catch (error) {
      console.error('Error initializing Supabase client:', error)
      if (isMountedRef.current) {
        setError('Failed to initialize connection')
        setConnectionStatus('disconnected')
      }
    }
  }, [])

  const fetchOrders = useCallback(async () => {
    if (!supabaseRef.current || !isMountedRef.current) return

    try {
      setError(null)

      const data = stationId
        ? await fetchStationOrders(stationId)
        : await fetchAllActiveOrders()

      if (!isMountedRef.current) return

      const updatedData = data.map(order => {
        const optimisticUpdate = optimisticUpdatesRef.current.get(order.id)
        return optimisticUpdate ? { ...order, ...optimisticUpdate } : order
      })

      setOrders(updatedData)
      setConnectionStatus('connected')
      retryAttemptsRef.current = 0
    } catch (err) {
      console.error('Error fetching KDS orders:', err)

      if (!isMountedRef.current) return

      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch orders'
      setError(errorMessage)
      setConnectionStatus('disconnected')
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [stationId])

  const optimisticUpdate = useCallback(
    (routingId: string, updates: Partial<KDSOrderRouting>) => {
      if (!routingId || typeof routingId !== 'string') {
        console.error('Invalid routing ID for optimistic update')
        return
      }

      optimisticUpdatesRef.current.set(routingId, updates)
      setOrders(prev =>
        prev.map(order =>
          order.id === routingId ? { ...order, ...updates } : order
        )
      )
    },
    []
  )

  const revertOptimisticUpdate = useCallback(
    (routingId: string) => {
      optimisticUpdatesRef.current.delete(routingId)
      fetchOrders()
    },
    [fetchOrders]
  )

  const setupRealtimeSubscription = useCallback(async () => {
    if (!supabaseRef.current || !autoRefresh || !isMountedRef.current) return

    try {
      setConnectionStatus('reconnecting')

      if (channelRef.current) {
        await supabaseRef.current.removeChannel(channelRef.current)
        channelRef.current = null
      }

      const channel = supabaseRef.current
        .channel(`kds-orders-updates-${stationId || 'all'}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'kds_order_routing',
            ...(stationId ? { filter: `station_id=eq.${stationId}` } : {}),
          },
          (payload: any) => {
            console.log('KDS order routing update:', payload)

            if (payload.new?.id) {
              optimisticUpdatesRef.current.delete(payload.new.id)
            }
            if (isMountedRef.current) {
              fetchOrders()
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
          },
          (payload: any) => {
            console.log('Order update:', payload)

            if (
              payload.new?.status !== payload.old?.status &&
              isMountedRef.current
            ) {
              fetchOrders()
            }
          }
        )
        .subscribe((status: string) => {
          console.log('KDS subscription status:', status)

          if (!isMountedRef.current) return

          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected')
            retryAttemptsRef.current = 0
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setConnectionStatus('disconnected')
            handleRetry()
          }
        })

      channelRef.current = channel
    } catch (err) {
      console.error('Error setting up real-time subscription:', err)

      if (!isMountedRef.current) return

      setConnectionStatus('disconnected')
      handleRetry()
    }
  }, [stationId, autoRefresh, fetchOrders])

  const handleRetry = useCallback(() => {
    if (!isMountedRef.current) return

    if (retryAttemptsRef.current >= MAX_RETRY_ATTEMPTS) {
      console.error('Max retry attempts reached, stopping reconnection')
      setError('Connection lost. Please refresh the page.')
      return
    }

    const delay = Math.min(
      INITIAL_RETRY_DELAY * Math.pow(2, retryAttemptsRef.current),
      MAX_RETRY_DELAY
    )

    console.log(
      `Retrying connection in ${delay}ms (attempt ${retryAttemptsRef.current + 1}/${MAX_RETRY_ATTEMPTS})`
    )

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }

    retryTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        retryAttemptsRef.current++
        setupRealtimeSubscription()
      }
    }, delay)
  }, [setupRealtimeSubscription])

  useEffect(() => {
    setupRealtimeSubscription()

    return () => {
      if (channelRef.current && supabaseRef.current) {
        supabaseRef.current.removeChannel(channelRef.current)
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [setupRealtimeSubscription])

  useEffect(() => {
    if (
      !autoRefresh ||
      connectionStatus === 'connected' ||
      !isMountedRef.current
    )
      return

    const startAutoRefresh = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }

      if (isMountedRef.current) {
        refreshTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            fetchOrders()
            startAutoRefresh()
          }
        }, refreshInterval)
      }
    }

    startAutoRefresh()

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [autoRefresh, connectionStatus, refreshInterval, fetchOrders])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false

      if (channelRef.current && supabaseRef.current) {
        supabaseRef.current.removeChannel(channelRef.current)
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  return {
    orders,
    loading,
    error,
    connectionStatus,
    refetch: fetchOrders,
    optimisticUpdate,
    revertOptimisticUpdate,
  }
}

export function useOrderTiming(order: KDSOrderRouting) {
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [colorStatus, setColorStatus] = useState<'green' | 'yellow' | 'red'>(
    'green'
  )
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const updateTiming = () => {
      const now = Date.now()
      const startTime = order.started_at
        ? new Date(order.started_at).getTime()
        : new Date(order.routed_at).getTime()
      const elapsed = Math.floor((now - startTime) / 1000)

      setTimeElapsed(elapsed)

      if (elapsed <= 300) {
        setColorStatus('green')
      } else if (elapsed <= 600) {
        setColorStatus('yellow')
      } else {
        setColorStatus('red')
      }
    }

    updateTiming()
    intervalRef.current = setInterval(updateTiming, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [order.routed_at, order.started_at])

  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }, [])

  return useMemo(
    () => ({
      timeElapsed,
      colorStatus,
      formattedTime: formatTime(timeElapsed),
      isOverdue: timeElapsed > 600,
    }),
    [timeElapsed, colorStatus, formatTime]
  )
}

interface KDSStation {
  id: string
  name: string
  color?: string
  position: number
  is_active: boolean
  [key: string]: any
}

export function useKDSStations() {
  const [stations, setStations] = useState<KDSStation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)

  const fetchStations = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('kds_stations')
        .select('*')
        .eq('is_active', true)
        .order('position', { ascending: true })

      if (fetchError) throw fetchError

      if (isMountedRef.current) {
        setStations(data || [])
        setError(null)
      }
    } catch (err) {
      console.error('Error fetching KDS stations:', err)

      if (isMountedRef.current) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch stations'
        )
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchStations()
  }, [fetchStations])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return {
    stations,
    loading,
    error,
    refetch: fetchStations,
  }
}
