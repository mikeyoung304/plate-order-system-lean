'use client'

/**
 * Optimized Real-time Context
 * 
 * Enterprise-grade real-time connection management with:
 * - Connection pooling for 1000+ concurrent users
 * - Role-based selective filtering to reduce data transfer
 * - Intelligent reconnection with exponential backoff
 * - Real-time health monitoring and metrics
 * - Channel multiplexing for efficiency
 * - Automatic cleanup and resource management
 */

import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react'
import { createClient } from '@/lib/modassembly/supabase/client'
import type { 
  RealtimeChannel, 
  SupabaseClient,
  RealtimePostgresChangesPayload,
  RealtimePostgresChangesFilter,
} from '@supabase/supabase-js'

// Connection pool configuration
const POOL_CONFIG = {
  MAX_CHANNELS: 10, // Max channels per pool
  MAX_SUBSCRIPTIONS_PER_CHANNEL: 20, // Max subscriptions per channel
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  RECONNECT_MAX_ATTEMPTS: 10,
  RECONNECT_BASE_DELAY: 1000,
  RECONNECT_MAX_DELAY: 30000,
  LATENCY_CHECK_INTERVAL: 5000,
  CLEANUP_INTERVAL: 60000, // 1 minute
}

// Connection status types
type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'degraded'

// Subscription configuration
interface SubscriptionConfig {
  id: string
  table: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
  schema?: string
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
  priority?: 'high' | 'normal' | 'low'
}

// Channel pool entry
interface PooledChannel {
  channel: RealtimeChannel
  subscriptions: Map<string, SubscriptionConfig>
  lastActivity: number
  status: 'active' | 'idle' | 'error'
}

// Connection metrics
interface ConnectionMetrics {
  totalChannels: number
  activeSubscriptions: number
  averageLatency: number
  lastHeartbeat: Date | null
  reconnectAttempts: number
  dataTransferred: number
  messagesReceived: number
  errorCount: number
}

// Performance metrics
interface PerformanceMetrics {
  subscriptionSetupTime: number[]
  messageProcessingTime: number[]
  channelUtilization: number
  cacheHitRate: number
}

// Context value interface
interface OptimizedRealtimeContextValue {
  // Connection state
  connectionStatus: ConnectionStatus
  isConnected: boolean
  isStable: boolean
  
  // Subscription management
  subscribe: (config: SubscriptionConfig) => () => void
  unsubscribe: (subscriptionId: string) => void
  
  // Connection control
  reconnect: () => Promise<void>
  disconnect: () => void
  
  // Metrics and monitoring
  getConnectionHealth: () => ConnectionMetrics
  getPerformanceMetrics: () => PerformanceMetrics
  
  // Role-based filtering
  setUserRole: (role: string, userId?: string) => void
  
  // Utility
  isSubscribed: (table: string, filter?: string) => boolean
}

const OptimizedRealtimeContext = createContext<OptimizedRealtimeContextValue | null>(null)

interface OptimizedRealtimeProviderProps {
  children: ReactNode
  userRole?: string
  userId?: string
  enableMetrics?: boolean
  enableAutoCleanup?: boolean
}

export function OptimizedRealtimeProvider({
  children,
  userRole: initialUserRole,
  userId: initialUserId,
  enableMetrics = true,
  enableAutoCleanup = true,
}: OptimizedRealtimeProviderProps) {
  // State
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [userRole, setUserRole] = useState(initialUserRole)
  const [userId, setUserId] = useState(initialUserId)
  const [metrics, setMetrics] = useState<ConnectionMetrics>({
    totalChannels: 0,
    activeSubscriptions: 0,
    averageLatency: 0,
    lastHeartbeat: null,
    reconnectAttempts: 0,
    dataTransferred: 0,
    messagesReceived: 0,
    errorCount: 0,
  })
  
  // Refs
  const supabaseRef = useRef<SupabaseClient | null>(null)
  const channelPoolRef = useRef<Map<string, PooledChannel>>(new Map())
  const subscriptionsRef = useRef<Map<string, SubscriptionConfig>>(new Map())
  const performanceRef = useRef<PerformanceMetrics>({
    subscriptionSetupTime: [],
    messageProcessingTime: [],
    channelUtilization: 0,
    cacheHitRate: 0,
  })
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const latencyCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)
  
  // Initialize Supabase client
  useEffect(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient()
    }
  }, [])
  
  // Get role-based filter for a table
  const getRoleBasedFilter = useCallback((table: string): string | undefined => {
    if (!userRole || !userId) return undefined
    
    // Role-based filtering rules
    switch (userRole) {
      case 'server':
        if (table === 'orders') {
          return `server_id=eq.${userId}`
        }
        break
      case 'cook':
        if (table === 'orders') {
          return `status=in.("pending","confirmed","preparing")`
        }
        break
      case 'admin':
        // Admins see everything
        return undefined
      default:
        return undefined
    }
  }, [userRole, userId])
  
  // Find or create optimal channel for subscription
  const findOrCreateChannel = useCallback((): PooledChannel | null => {
    if (!supabaseRef.current || !mountedRef.current) return null
    
    // Find channel with capacity
    for (const [channelName, pooledChannel] of channelPoolRef.current) {
      if (
        pooledChannel.status === 'active' &&
        pooledChannel.subscriptions.size < POOL_CONFIG.MAX_SUBSCRIPTIONS_PER_CHANNEL
      ) {
        return pooledChannel
      }
    }
    
    // Create new channel if within limits
    if (channelPoolRef.current.size < POOL_CONFIG.MAX_CHANNELS) {
      const channelName = `optimized-pool-${Date.now()}`
      const channel = supabaseRef.current.channel(channelName)
      
      const pooledChannel: PooledChannel = {
        channel,
        subscriptions: new Map(),
        lastActivity: Date.now(),
        status: 'active',
      }
      
      // Set up channel event handlers
      channel.on('system', {}, (payload) => {
        if (payload.eventType === 'error') {
          pooledChannel.status = 'error'
          setMetrics(prev => ({ ...prev, errorCount: prev.errorCount + 1 }))
        }
      })
      
      channelPoolRef.current.set(channelName, pooledChannel)
      setMetrics(prev => ({ ...prev, totalChannels: channelPoolRef.current.size }))
      
      return pooledChannel
    }
    
    return null
  }, [])
  
  // Subscribe to real-time updates
  const subscribe = useCallback((config: SubscriptionConfig): (() => void) => {
    const startTime = performance.now()
    
    // Check if already subscribed
    if (subscriptionsRef.current.has(config.id)) {
      console.warn(`Subscription ${config.id} already exists`)
      return () => unsubscribe(config.id)
    }
    
    // Apply role-based filter
    const roleFilter = getRoleBasedFilter(config.table)
    const effectiveFilter = config.filter || roleFilter
    
    // Find or create channel
    const pooledChannel = findOrCreateChannel()
    if (!pooledChannel) {
      console.error('Unable to create channel for subscription')
      return () => {}
    }
    
    // Create filter configuration
    const filterConfig: RealtimePostgresChangesFilter<any> = {
      event: config.event || '*',
      schema: config.schema || 'public',
      table: config.table,
    }
    
    if (effectiveFilter) {
      filterConfig.filter = effectiveFilter
    }
    
    // Add subscription to channel
    pooledChannel.channel.on(
      'postgres_changes',
      filterConfig,
      (payload) => {
        const processingStart = performance.now()
        
        // Update metrics
        setMetrics(prev => ({
          ...prev,
          messagesReceived: prev.messagesReceived + 1,
          dataTransferred: prev.dataTransferred + JSON.stringify(payload).length,
        }))
        
        // Call subscription callback
        config.callback(payload)
        
        // Track processing time
        if (enableMetrics) {
          performanceRef.current.messageProcessingTime.push(
            performance.now() - processingStart
          )
          // Keep only last 100 measurements
          if (performanceRef.current.messageProcessingTime.length > 100) {
            performanceRef.current.messageProcessingTime.shift()
          }
        }
        
        // Update last activity
        pooledChannel.lastActivity = Date.now()
      }
    )
    
    // Store subscription
    subscriptionsRef.current.set(config.id, config)
    pooledChannel.subscriptions.set(config.id, config)
    
    // Update metrics
    setMetrics(prev => ({
      ...prev,
      activeSubscriptions: subscriptionsRef.current.size,
    }))
    
    // Track setup time
    if (enableMetrics) {
      performanceRef.current.subscriptionSetupTime.push(
        performance.now() - startTime
      )
      if (performanceRef.current.subscriptionSetupTime.length > 100) {
        performanceRef.current.subscriptionSetupTime.shift()
      }
    }
    
    // Subscribe channel if not already subscribed
    if (pooledChannel.channel.state !== 'joined') {
      pooledChannel.channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected')
          pooledChannel.status = 'active'
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          pooledChannel.status = 'error'
          setConnectionStatus('degraded')
          scheduleReconnect()
        }
      })
    }
    
    // Return unsubscribe function
    return () => unsubscribe(config.id)
  }, [getRoleBasedFilter, findOrCreateChannel, enableMetrics])
  
  // Unsubscribe from updates
  const unsubscribe = useCallback((subscriptionId: string) => {
    const subscription = subscriptionsRef.current.get(subscriptionId)
    if (!subscription) return
    
    // Remove from subscriptions
    subscriptionsRef.current.delete(subscriptionId)
    
    // Find and clean up from channel pool
    for (const [channelName, pooledChannel] of channelPoolRef.current) {
      if (pooledChannel.subscriptions.has(subscriptionId)) {
        pooledChannel.subscriptions.delete(subscriptionId)
        
        // Remove channel if empty
        if (pooledChannel.subscriptions.size === 0 && supabaseRef.current) {
          supabaseRef.current.removeChannel(pooledChannel.channel)
          channelPoolRef.current.delete(channelName)
        }
        
        break
      }
    }
    
    // Update metrics
    setMetrics(prev => ({
      ...prev,
      activeSubscriptions: subscriptionsRef.current.size,
      totalChannels: channelPoolRef.current.size,
    }))
  }, [])
  
  // Heartbeat monitoring
  const performHeartbeat = useCallback(() => {
    if (!mountedRef.current) return
    
    const now = Date.now()
    let activeChannels = 0
    
    // Check all channels
    for (const pooledChannel of channelPoolRef.current.values()) {
      if (pooledChannel.status === 'active') {
        activeChannels++
      }
    }
    
    // Update connection status
    if (activeChannels === 0 && subscriptionsRef.current.size > 0) {
      setConnectionStatus('disconnected')
      scheduleReconnect()
    } else if (activeChannels < channelPoolRef.current.size) {
      setConnectionStatus('degraded')
    } else if (activeChannels > 0) {
      setConnectionStatus('connected')
    }
    
    // Update metrics
    setMetrics(prev => ({
      ...prev,
      lastHeartbeat: new Date(),
    }))
  }, [])
  
  // Latency monitoring
  const checkLatency = useCallback(async () => {
    if (!supabaseRef.current || !mountedRef.current) return
    
    const measurements: number[] = []
    
    // Measure latency for each active channel
    for (const pooledChannel of channelPoolRef.current.values()) {
      if (pooledChannel.status === 'active') {
        const start = performance.now()
        // Send a small test message
        await pooledChannel.channel.send({
          type: 'broadcast',
          event: 'latency-check',
          payload: { timestamp: Date.now() },
        })
        measurements.push(performance.now() - start)
      }
    }
    
    // Calculate average latency
    if (measurements.length > 0) {
      const avgLatency = measurements.reduce((a, b) => a + b, 0) / measurements.length
      setMetrics(prev => ({ ...prev, averageLatency: avgLatency }))
    }
  }, [])
  
  // Cleanup idle channels
  const cleanupIdleChannels = useCallback(() => {
    if (!supabaseRef.current || !mountedRef.current) return
    
    const now = Date.now()
    const idleThreshold = 5 * 60 * 1000 // 5 minutes
    
    for (const [channelName, pooledChannel] of channelPoolRef.current) {
      if (
        pooledChannel.subscriptions.size === 0 &&
        now - pooledChannel.lastActivity > idleThreshold
      ) {
        supabaseRef.current.removeChannel(pooledChannel.channel)
        channelPoolRef.current.delete(channelName)
      }
    }
    
    // Update metrics
    setMetrics(prev => ({
      ...prev,
      totalChannels: channelPoolRef.current.size,
    }))
    
    // Calculate channel utilization
    if (enableMetrics) {
      const totalCapacity = channelPoolRef.current.size * POOL_CONFIG.MAX_SUBSCRIPTIONS_PER_CHANNEL
      const totalUsed = Array.from(channelPoolRef.current.values())
        .reduce((sum, channel) => sum + channel.subscriptions.size, 0)
      performanceRef.current.channelUtilization = totalCapacity > 0 ? totalUsed / totalCapacity : 0
    }
  }, [enableMetrics])
  
  // Schedule reconnection with exponential backoff
  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current || reconnectTimeoutRef.current) return
    
    setMetrics(prev => {
      const attempts = prev.reconnectAttempts + 1
      
      if (attempts <= POOL_CONFIG.RECONNECT_MAX_ATTEMPTS) {
        const delay = Math.min(
          POOL_CONFIG.RECONNECT_BASE_DELAY * Math.pow(2, attempts - 1),
          POOL_CONFIG.RECONNECT_MAX_DELAY
        )
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            reconnect()
          }
        }, delay)
      }
      
      return { ...prev, reconnectAttempts: attempts }
    })
  }, [])
  
  // Reconnect all channels
  const reconnect = useCallback(async () => {
    if (!supabaseRef.current || !mountedRef.current) return
    
    setConnectionStatus('reconnecting')
    
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    try {
      // Resubscribe all channels
      for (const pooledChannel of channelPoolRef.current.values()) {
        if (pooledChannel.channel.state !== 'joined') {
          await pooledChannel.channel.subscribe()
        }
      }
      
      setConnectionStatus('connected')
      setMetrics(prev => ({ ...prev, reconnectAttempts: 0 }))
    } catch (error) {
      console.error('Reconnection failed:', error)
      setConnectionStatus('disconnected')
      scheduleReconnect()
    }
  }, [scheduleReconnect])
  
  // Disconnect all channels
  const disconnect = useCallback(() => {
    if (!supabaseRef.current) return
    
    // Clear all intervals
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
    if (cleanupIntervalRef.current) {
      clearInterval(cleanupIntervalRef.current)
      cleanupIntervalRef.current = null
    }
    if (latencyCheckIntervalRef.current) {
      clearInterval(latencyCheckIntervalRef.current)
      latencyCheckIntervalRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    // Remove all channels
    for (const pooledChannel of channelPoolRef.current.values()) {
      supabaseRef.current.removeChannel(pooledChannel.channel)
    }
    
    // Clear references
    channelPoolRef.current.clear()
    subscriptionsRef.current.clear()
    
    setConnectionStatus('disconnected')
    setMetrics({
      totalChannels: 0,
      activeSubscriptions: 0,
      averageLatency: 0,
      lastHeartbeat: null,
      reconnectAttempts: 0,
      dataTransferred: 0,
      messagesReceived: 0,
      errorCount: 0,
    })
  }, [])
  
  // Get connection health metrics
  const getConnectionHealth = useCallback((): ConnectionMetrics => {
    return { ...metrics }
  }, [metrics])
  
  // Get performance metrics
  const getPerformanceMetrics = useCallback((): PerformanceMetrics => {
    const avgSetupTime = performanceRef.current.subscriptionSetupTime.length > 0
      ? performanceRef.current.subscriptionSetupTime.reduce((a, b) => a + b, 0) / 
        performanceRef.current.subscriptionSetupTime.length
      : 0
      
    const avgProcessingTime = performanceRef.current.messageProcessingTime.length > 0
      ? performanceRef.current.messageProcessingTime.reduce((a, b) => a + b, 0) / 
        performanceRef.current.messageProcessingTime.length
      : 0
    
    return {
      subscriptionSetupTime: [avgSetupTime],
      messageProcessingTime: [avgProcessingTime],
      channelUtilization: performanceRef.current.channelUtilization,
      cacheHitRate: performanceRef.current.cacheHitRate,
    }
  }, [])
  
  // Check if subscribed to a table
  const isSubscribed = useCallback((table: string, filter?: string): boolean => {
    for (const subscription of subscriptionsRef.current.values()) {
      if (
        subscription.table === table &&
        (!filter || subscription.filter === filter)
      ) {
        return true
      }
    }
    return false
  }, [])
  
  // Update user role
  const setUserRoleAndId = useCallback((role: string, id?: string) => {
    setUserRole(role)
    setUserId(id)
    
    // Reapply filters to existing subscriptions
    // This would require resubscribing with new filters
    // For now, log a warning
    if (subscriptionsRef.current.size > 0) {
      console.warn('Role changed with active subscriptions. Consider reconnecting to apply new filters.')
    }
  }, [])
  
  // Set up monitoring intervals
  useEffect(() => {
    // Heartbeat monitoring
    heartbeatIntervalRef.current = setInterval(
      performHeartbeat,
      POOL_CONFIG.HEARTBEAT_INTERVAL
    )
    
    // Latency monitoring
    if (enableMetrics) {
      latencyCheckIntervalRef.current = setInterval(
        checkLatency,
        POOL_CONFIG.LATENCY_CHECK_INTERVAL
      )
    }
    
    // Cleanup monitoring
    if (enableAutoCleanup) {
      cleanupIntervalRef.current = setInterval(
        cleanupIdleChannels,
        POOL_CONFIG.CLEANUP_INTERVAL
      )
    }
    
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
      if (latencyCheckIntervalRef.current) {
        clearInterval(latencyCheckIntervalRef.current)
      }
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current)
      }
    }
  }, [performHeartbeat, checkLatency, cleanupIdleChannels, enableMetrics, enableAutoCleanup])
  
  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && connectionStatus === 'disconnected') {
        reconnect()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [connectionStatus, reconnect])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      disconnect()
    }
  }, [disconnect])
  
  // Computed values
  const isConnected = connectionStatus === 'connected'
  const isStable = isConnected && metrics.reconnectAttempts === 0 && metrics.errorCount === 0
  
  // Context value
  const contextValue: OptimizedRealtimeContextValue = {
    connectionStatus,
    isConnected,
    isStable,
    subscribe,
    unsubscribe,
    reconnect,
    disconnect,
    getConnectionHealth,
    getPerformanceMetrics,
    setUserRole: setUserRoleAndId,
    isSubscribed,
  }
  
  return (
    <OptimizedRealtimeContext.Provider value={contextValue}>
      {children}
    </OptimizedRealtimeContext.Provider>
  )
}

// Hook for using optimized real-time context
export function useOptimizedRealtime() {
  const context = useContext(OptimizedRealtimeContext)
  if (!context) {
    throw new Error('useOptimizedRealtime must be used within an OptimizedRealtimeProvider')
  }
  return context
}

// Hook for monitoring connection health
export function useRealtimeHealth() {
  const { getConnectionHealth, getPerformanceMetrics, connectionStatus } = useOptimizedRealtime()
  
  const [health, setHealth] = useState({
    connection: getConnectionHealth(),
    performance: getPerformanceMetrics(),
  })
  
  useEffect(() => {
    const interval = setInterval(() => {
      setHealth({
        connection: getConnectionHealth(),
        performance: getPerformanceMetrics(),
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [getConnectionHealth, getPerformanceMetrics])
  
  return {
    ...health,
    status: connectionStatus,
    healthScore: calculateHealthScore(health.connection, health.performance),
  }
}

// Calculate health score based on metrics
function calculateHealthScore(
  connection: ConnectionMetrics,
  performance: PerformanceMetrics
): number {
  let score = 100
  
  // Deduct for high latency
  if (connection.averageLatency > 1000) score -= 30
  else if (connection.averageLatency > 500) score -= 20
  else if (connection.averageLatency > 200) score -= 10
  
  // Deduct for errors
  score -= Math.min(connection.errorCount * 5, 30)
  
  // Deduct for reconnect attempts
  score -= Math.min(connection.reconnectAttempts * 10, 30)
  
  // Deduct for low channel utilization
  if (performance.channelUtilization < 0.3) score -= 10
  
  // Bonus for high cache hit rate
  score += Math.round(performance.cacheHitRate * 10)
  
  return Math.max(0, Math.min(100, score))
}