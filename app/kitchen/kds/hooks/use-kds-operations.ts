'use client'

import { useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { getClientUser } from '@/lib/modassembly/supabase/auth/session'
import {
  addOrderNotes,
  bumpOrder,
  recallOrder,
  startOrderPrep,
  updateOrderPriority,
} from '@/lib/modassembly/supabase/database/kds'
import { useKDSAudio } from '@/lib/hooks/use-kds-state'
import { useKDSContext } from '../providers/kds-state-provider'

export interface KDSOperations {
  // Single order operations
  startOrder: (_routingId: string) => Promise<void>
  completeOrder: (_routingId: string) => Promise<void>
  recallOrder: (_routingId: string) => Promise<void>
  updatePriority: (_routingId: string, _priority: number) => Promise<void>
  addNotes: (_routingId: string, _notes: string) => Promise<void>
  
  // Bulk operations
  bulkStart: (_routingIds: string[]) => Promise<void>
  bulkComplete: (_routingIds: string[]) => Promise<void>
  bulkUpdatePriority: (_routingIds: string[], _priority: number) => Promise<void>
  
  // Station operations
  completeAllForStation: (_stationId: string) => Promise<void>
  
  // Audio feedback
  playOrderSound: (_type: 'new' | 'complete' | 'urgent') => void
}

/**
 * Custom hook for KDS operations
 * 
 * Provides all business logic operations for the KDS system including:
 * - Order state management (start, complete, recall)
 * - Bulk operations for efficiency
 * - Audio feedback for kitchen staff
 * - Error handling with optimistic updates
 * - Station-specific operations
 */
export function useKDSOperations(): KDSOperations {
  const { toast } = useToast()
  const { playSound } = useKDSAudio()
  const { optimisticUpdate, refetch, soundEnabled, orders } = useKDSContext()

  // Helper function to get current user
  const getCurrentUser = useCallback(async () => {
    const user = await getClientUser()
    if (!user?.id) {
      throw new Error('User not authenticated')
    }
    return user
  }, [])

  // Error handler with automatic state restoration
  const handleError = useCallback((
    action: string, 
    error: unknown, 
    _routingId?: string
  ) => {
    console.error(`Error performing ${action}:`, error)
    
    // Restore correct state on error
    refetch()
    
    toast({
      title: `Error: ${action}`,
      description: error instanceof Error ? error.message : 'An unexpected error occurred',
      variant: 'destructive',
    })
  }, [refetch, toast])

  // Audio feedback
  const playOrderSound = useCallback((type: 'new' | 'complete' | 'urgent') => {
    if (!soundEnabled) {return}
    
    switch (type) {
      case 'new':
        playSound(800, 0.1) // High beep for new orders
        break
      case 'complete':
        playSound(600, 0.2) // Lower beep for completion
        break
      case 'urgent':
        // Double beep for urgent orders
        playSound(1000, 0.1)
        setTimeout(() => playSound(1000, 0.1), 200)
        break
    }
  }, [soundEnabled, playSound])

  // Start order preparation
  const startOrder = useCallback(async (routingId: string) => {
    try {
      await getCurrentUser()
      
      // Optimistic update
      optimisticUpdate(routingId, {
        started_at: new Date().toISOString()
      })
      
      await startOrderPrep(routingId)
      
      toast({
        title: 'Preparation started',
        description: 'Order preparation has begun',
      })
      
      playOrderSound('new')
    } catch (error) {
      handleError('start preparation', error, routingId)
    }
  }, [getCurrentUser, optimisticUpdate, toast, playOrderSound, handleError])

  // Complete order (bump)
  const completeOrder = useCallback(async (routingId: string) => {
    try {
      const user = await getCurrentUser()
      
      // Optimistic update
      optimisticUpdate(routingId, {
        completed_at: new Date().toISOString(),
        bumped_at: new Date().toISOString()
      })
      
      await bumpOrder(routingId, user.id)
      
      toast({
        title: 'Order completed',
        description: 'Order marked as ready for pickup',
      })
      
      playOrderSound('complete')
    } catch (error) {
      handleError('complete order', error, routingId)
    }
  }, [getCurrentUser, optimisticUpdate, toast, playOrderSound, handleError])

  // Recall order
  const recallOrderFunc = useCallback(async (routingId: string) => {
    try {
      // Optimistic update
      optimisticUpdate(routingId, {
        completed_at: null,
        bumped_at: null,
        recalled_at: new Date().toISOString()
      })
      
      await recallOrder(routingId)
      
      toast({
        title: 'Order recalled',
        description: 'Order has been recalled to the kitchen',
      })
    } catch (error) {
      handleError('recall order', error, routingId)
    }
  }, [optimisticUpdate, toast, handleError])

  // Update order priority
  const updatePriority = useCallback(async (routingId: string, priority: number) => {
    try {
      // Optimistic update
      optimisticUpdate(routingId, { priority })
      
      await updateOrderPriority(routingId, priority)
      
      toast({
        title: 'Priority updated',
        description: `Order priority set to ${priority}`,
      })
      
      if (priority >= 8) {
        playOrderSound('urgent')
      }
    } catch (error) {
      handleError('update priority', error, routingId)
    }
  }, [optimisticUpdate, toast, playOrderSound, handleError])

  // Add notes to order
  const addNotes = useCallback(async (routingId: string, notes: string) => {
    try {
      // Optimistic update
      optimisticUpdate(routingId, { notes })
      
      await addOrderNotes(routingId, notes)
      
      toast({
        title: 'Notes saved',
        description: 'Order notes have been updated',
      })
    } catch (error) {
      handleError('save notes', error, routingId)
    }
  }, [optimisticUpdate, toast, handleError])

  // Bulk start multiple orders
  const bulkStart = useCallback(async (routingIds: string[]) => {
    try {
      await getCurrentUser()
      
      // Optimistic updates
      const timestamp = new Date().toISOString()
      routingIds.forEach(id => {
        optimisticUpdate(id, { started_at: timestamp })
      })
      
      await Promise.all(routingIds.map(id => startOrderPrep(id)))
      
      toast({
        title: 'Bulk preparation started',
        description: `Started preparation for ${routingIds.length} orders`,
      })
      
      playOrderSound('new')
    } catch (error) {
      handleError('bulk start preparation', error)
    }
  }, [getCurrentUser, optimisticUpdate, toast, playOrderSound, handleError])

  // Bulk complete multiple orders
  const bulkComplete = useCallback(async (routingIds: string[]) => {
    try {
      const user = await getCurrentUser()
      
      // Optimistic updates
      const timestamp = new Date().toISOString()
      routingIds.forEach(id => {
        optimisticUpdate(id, {
          completed_at: timestamp,
          bumped_at: timestamp
        })
      })
      
      await Promise.all(routingIds.map(id => bumpOrder(id, user.id)))
      
      toast({
        title: 'Bulk completion',
        description: `Completed ${routingIds.length} orders`,
      })
      
      playOrderSound('complete')
    } catch (error) {
      handleError('bulk complete orders', error)
    }
  }, [getCurrentUser, optimisticUpdate, toast, playOrderSound, handleError])

  // Bulk priority update
  const bulkUpdatePriority = useCallback(async (routingIds: string[], priority: number) => {
    try {
      // Optimistic updates
      routingIds.forEach(id => {
        optimisticUpdate(id, { priority })
      })
      
      await Promise.all(routingIds.map(id => updateOrderPriority(id, priority)))
      
      toast({
        title: 'Bulk priority update',
        description: `Updated priority for ${routingIds.length} orders`,
      })
      
      if (priority >= 8) {
        playOrderSound('urgent')
      }
    } catch (error) {
      handleError('bulk update priority', error)
    }
  }, [optimisticUpdate, toast, playOrderSound, handleError])

  // Complete all orders for a specific station
  const completeAllForStation = useCallback(async (stationId: string) => {
    try {
      const _user = await getCurrentUser()
      
      // Find all orders for this station that are not completed
      const stationOrders = orders.filter(order => 
        order.station?.id === stationId && !order.completed_at
      )
      
      if (stationOrders.length === 0) {
        toast({
          title: 'No orders to complete',
          description: 'All orders for this station are already completed',
        })
        return
      }
      
      const routingIds = stationOrders.map(order => order.id)
      await bulkComplete(routingIds)
      
      toast({
        title: 'Station cleared',
        description: `Completed all ${routingIds.length} orders for station`,
      })
    } catch (error) {
      handleError('complete all for station', error)
    }
  }, [getCurrentUser, orders, bulkComplete, toast, handleError])

  return {
    startOrder,
    completeOrder,
    recallOrder: recallOrderFunc,
    updatePriority,
    addNotes,
    bulkStart,
    bulkComplete,
    bulkUpdatePriority,
    completeAllForStation,
    playOrderSound,
  }
}