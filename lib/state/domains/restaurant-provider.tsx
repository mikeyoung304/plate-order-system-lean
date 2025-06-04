'use client'

/**
 * Restaurant Provider
 * 
 * Combines all domain-specific contexts into a single provider for
 * convenient application-wide state management. Replaces the monolithic
 * restaurant-state-context.tsx with a modular approach.
 */

import React, { ReactNode, useCallback, useState } from 'react'
import { ConnectionProvider } from './connection-context'
import { TablesProvider } from './tables-context'
import { OrdersProvider } from './orders-context'
import { ServerProvider } from './server-context'

interface RestaurantProviderProps {
  children: ReactNode
  
  // Configuration options
  floorPlanId?: string
  enableRealtime?: boolean
  enableAutoRefresh?: boolean
  refreshInterval?: number
  
  // Development options
  debug?: boolean
}

/**
 * Combined Restaurant Provider
 * 
 * This provider wraps all domain-specific contexts in the correct order
 * and handles cross-context communication when needed.
 * 
 * Context hierarchy:
 * 1. ConnectionProvider - Foundation for all real-time features
 * 2. TablesProvider - Table data and floor plan management
 * 3. OrdersProvider - Order lifecycle and operations
 * 4. ServerProvider - Server workflow and UI state
 */
export function RestaurantProvider({
  children,
  floorPlanId,
  enableRealtime = true,
  enableAutoRefresh = false,
  refreshInterval = 30000,
  debug = false,
}: RestaurantProviderProps) {
  // Global error state (can be used by all contexts)
  const [globalError, setGlobalError] = useState<string | null>(null)
  
  // Connection status handler
  const handleConnectionChange = useCallback((status: string) => {
    if (debug) {
      console.log('[RestaurantProvider] Connection status changed:', status)
    }
    
    // Clear global error when connection is restored
    if (status === 'connected' && globalError) {
      setGlobalError(null)
    }
  }, [debug, globalError])
  
  // Error boundary for development
  if (debug && globalError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-red-800 font-medium">Restaurant Provider Error</h3>
        <p className="text-red-600 text-sm mt-1">{globalError}</p>
        <button
          onClick={() => setGlobalError(null)}
          className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded"
        >
          Dismiss
        </button>
      </div>
    )
  }
  
  return (
    <ConnectionProvider 
      onConnectionChange={handleConnectionChange}
    >
      <TablesProvider 
        floorPlanId={floorPlanId}
        enableRealtime={enableRealtime}
      >
        <OrdersProvider 
          enableRealtime={enableRealtime}
          autoRefresh={enableAutoRefresh}
          refreshInterval={refreshInterval}
        >
          <ServerProvider>
            {children}
          </ServerProvider>
        </OrdersProvider>
      </TablesProvider>
    </ConnectionProvider>
  )
}

/**
 * Legacy compatibility provider
 * 
 * For gradual migration from the old monolithic context,
 * this provides the same API structure while using the new
 * domain-specific contexts under the hood.
 */
export function RestaurantStateProvider({
  children,
  ...props
}: RestaurantProviderProps) {
  console.warn(
    'RestaurantStateProvider is deprecated. Use RestaurantProvider instead.'
  )
  
  return (
    <RestaurantProvider {...props}>
      {children}
    </RestaurantProvider>
  )
}

/**
 * Development helper for context debugging
 */
export function useRestaurantDebug() {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('useRestaurantDebug is only available in development mode')
  }
  
  // This would typically import all the domain hooks for debugging
  // For now, just return a simple debug interface
  return {
    logContextState: () => {
      console.group('[Restaurant Debug] Context State')
      console.log('Connection:', 'Available via useConnection()')
      console.log('Tables:', 'Available via useTables()')
      console.log('Orders:', 'Available via useOrders()')
      console.log('Server:', 'Available via useServer()')
      console.groupEnd()
    },
  }
}