'use client'

import React, { ReactNode, createContext, useContext } from 'react'
import { type KDSActions, type KDSState, useKDSState } from '@/lib/hooks/use-kds-state'
import { type KDSOrderRouting } from '@/lib/modassembly/supabase/database/kds/types'

interface KDSStateContextType extends KDSState, KDSActions {
  filteredAndSortedOrders: KDSOrderRouting[]
}

const KDSStateContext = createContext<KDSStateContextType | null>(null)

interface KDSStateProviderProps {
  children: ReactNode
  stationId?: string
}

/**
 * KDS State Provider
 * 
 * Provides centralized state management for the entire KDS system.
 * This replaces the need for prop drilling and provides optimized
 * access to KDS data and actions throughout the component tree.
 */
export function KDSStateProvider({ children, stationId }: KDSStateProviderProps) {
  const kdsState = useKDSState(stationId)

  const contextValue: KDSStateContextType = {
    ...kdsState,
  }

  return (
    <KDSStateContext.Provider value={contextValue}>
      {children}
    </KDSStateContext.Provider>
  )
}

/**
 * Hook to access KDS state from any component within the provider
 */
export function useKDSContext(): KDSStateContextType {
  const context = useContext(KDSStateContext)
  
  if (!context) {
    throw new Error('useKDSContext must be used within a KDSStateProvider')
  }
  
  return context
}

/**
 * Selector hook for optimized subscriptions to specific state slices
 */
export function useKDSSelector<T>(selector: (_state: KDSStateContextType) => T): T {
  const context = useKDSContext()
  return selector(context)
}