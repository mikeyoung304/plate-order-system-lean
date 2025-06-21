'use client'

import React, { Suspense, memo, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { useKDSState } from '@/lib/hooks/use-kds-state'
import { useTableGroupedOrders } from '@/hooks/use-table-grouped-orders'
import {
  addOrderNotes,
  bumpOrder,
  recallOrder,
  startOrderPrep,
  updateOrderPriority,
} from '@/lib/modassembly/supabase/database/kds'
import { getClientUser } from '@/lib/modassembly/supabase/auth/session'
import { useToast } from '@/hooks/use-toast'

// Performance optimized imports
import { VirtualizedOrderList } from './VirtualizedOrderList'
import { KDSErrorBoundary, OrderListErrorBoundary } from './ErrorBoundary'
import { 
  DetailedLoadingFallback, 
  KDSSuspenseBoundary, 
  OrdersLoadingState 
} from './SuspenseBoundary'

interface OptimizedKDSMainContentProps {
  className?: string
  orders?: any[]
  loading?: boolean
  error?: string
  viewMode?: string
  filterBy?: string
  sortBy?: string
  
  // Performance options
  enableVirtualization?: boolean
  enableLazyLoading?: boolean
  infiniteScrollThreshold?: number
  preloadOffscreenItems?: boolean
}

// Memoized empty state component
const EmptyState = memo(({ filterBy }: { filterBy: string }) => (
  <div className="flex items-center justify-center h-full min-h-[400px] text-gray-500">
    <div className="text-center">
      <div className="text-6xl mb-4">🍽️</div>
      <h3 className="text-xl font-medium mb-2 text-white">No orders</h3>
      <p className="text-gray-400">
        {filterBy === 'all'
          ? 'All caught up! No pending orders.'
          : `No ${filterBy} orders at the moment.`}
      </p>
    </div>
  </div>
))
EmptyState.displayName = 'EmptyState'

// Memoized error display component
const ErrorDisplay = memo(({ error }: { error: string }) => (
  <div className="p-4">
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Failed to load orders: {error}
      </AlertDescription>
    </Alert>
  </div>
))
ErrorDisplay.displayName = 'ErrorDisplay'

// Helper function to derive order status from KDS routing fields
const getOrderStatus = (order: any) => {
  if (order.completed_at) {return 'ready'}
  if (order.started_at) {return 'preparing'}
  return 'new'
}

// Custom hook for filtered and sorted orders with memoization
function useOptimizedFilteredOrders() {
  const kdsState = useKDSState()
  
  return useMemo(() => {
    if (!kdsState.orders) {return []}
    
    let filtered = [...kdsState.orders]
    
    // Apply filters
    if (kdsState.filterBy !== 'all') {
      filtered = filtered.filter(order => {
        const status = getOrderStatus(order)
        return status === kdsState.filterBy
      })
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (kdsState.sortBy) {
        case 'priority':
          return (b.priority || 0) - (a.priority || 0)
        case 'time':
          return new Date(a.routed_at).getTime() - new Date(b.routed_at).getTime()
        case 'table':
          const tableA = a.order?.table?.label || ''
          const tableB = b.order?.table?.label || ''
          return tableA.localeCompare(tableB)
        default:
          return new Date(a.routed_at).getTime() - new Date(b.routed_at).getTime()
      }
    })
    
    return filtered
  }, [kdsState.orders, kdsState.filterBy, kdsState.sortBy])
}

// Optimized action handlers with error boundaries
const useOrderActions = () => {
  const kdsState = useKDSState()
  const { toast } = useToast()

  return useMemo(() => ({
    handleBumpOrder: async (routingId: string) => {
      try {
        const user = await getClientUser()
        const userId = user?.id || 'unknown-user'
        
        // Optimistic update
        kdsState.optimisticUpdate(routingId, {
          completed_at: new Date().toISOString(),
          bumped_at: new Date().toISOString()
        })
        
        await bumpOrder(routingId, userId)
        toast({
          title: 'Order completed',
          description: 'Order marked as ready for pickup',
        })
      } catch (_error) {
        console.error('Error bumping order:', _error)
        kdsState.refetch()
        toast({
          title: 'Error',
          description: 'Failed to bump order',
          variant: 'destructive',
        })
      }
    },

    handleRecallOrder: async (routingId: string) => {
      try {
        kdsState.optimisticUpdate(routingId, {
          completed_at: null,
          bumped_at: null,
          recalled_at: new Date().toISOString()
        })
        
        await recallOrder(routingId)
        toast({
          title: 'Order recalled',
          description: 'Order has been recalled to the kitchen',
        })
      } catch (_error) {
        console.error('Error recalling order:', _error)
        kdsState.refetch()
        toast({
          title: 'Error',
          description: 'Failed to recall order',
          variant: 'destructive',
        })
      }
    },

    handleStartPrep: async (routingId: string) => {
      try {
        kdsState.optimisticUpdate(routingId, {
          started_at: new Date().toISOString()
        })
        
        await startOrderPrep(routingId)
        toast({
          title: 'Preparation started',
          description: 'Order preparation has begun',
        })
      } catch (_error) {
        console.error('Error starting prep:', _error)
        kdsState.refetch()
        toast({
          title: 'Error',
          description: 'Failed to start preparation',
          variant: 'destructive',
        })
      }
    },

    handleUpdatePriority: async (routingId: string, priority: number) => {
      try {
        kdsState.optimisticUpdate(routingId, { priority })
        
        await updateOrderPriority(routingId, priority)
        toast({
          title: 'Priority updated',
          description: `Order priority set to ${priority}`,
        })
      } catch (_error) {
        console.error('Error updating priority:', _error)
        kdsState.refetch()
        toast({
          title: 'Error',
          description: 'Failed to update priority',
          variant: 'destructive',
        })
      }
    },

    handleAddNotes: async (routingId: string, notes: string) => {
      try {
        kdsState.optimisticUpdate(routingId, { notes })
        
        await addOrderNotes(routingId, notes)
        toast({
          title: 'Notes saved',
          description: 'Order notes have been updated',
        })
      } catch (_error) {
        console.error('Error adding notes:', _error)
        kdsState.refetch()
        toast({
          title: 'Error',
          description: 'Failed to save notes',
          variant: 'destructive',
        })
      }
    },

    handleBumpTable: async (tableId: string, orderIds: string[]) => {
      try {
        const user = await getClientUser()
        const userId = user?.id || 'unknown-user'
        
        // Optimistic updates for all orders
        orderIds.forEach(orderId => {
          kdsState.optimisticUpdate(orderId, {
            completed_at: new Date().toISOString(),
            bumped_at: new Date().toISOString()
          })
        })
        
        await Promise.all(orderIds.map(orderId => bumpOrder(orderId, userId)))
        
        toast({
          title: 'Table completed',
          description: `All orders for table ${tableId} marked as ready`,
        })
      } catch (_error) {
        console.error('Error bumping table:', _error)
        kdsState.refetch()
        toast({
          title: 'Error',
          description: 'Failed to bump table orders',
          variant: 'destructive',
        })
      }
    }
  }), [kdsState, toast])
}

// Main optimized component
export const OptimizedKDSMainContent = memo<OptimizedKDSMainContentProps>(({ 
  className, 
  orders: propsOrders = [], 
  loading: propsLoading = false, 
  error: propsError = null, 
  viewMode: propsViewMode = 'table',
  filterBy: propsFilterBy = 'all',
  sortBy: propsSortBy = 'time',
  enableVirtualization = true,
  enableLazyLoading = true,
  infiniteScrollThreshold = 10,
  preloadOffscreenItems = false
}) => {
  // State management
  const kdsState = useKDSState()
  const fallbackOrders = useOptimizedFilteredOrders()
  const tableGroups = useTableGroupedOrders(propsOrders.length > 0 ? propsOrders : fallbackOrders)
  const actions = useOrderActions()
  
  // Use props if provided, otherwise fall back to hook
  const actualOrders = propsOrders.length > 0 ? propsOrders : fallbackOrders
  const actualLoading = propsOrders.length > 0 ? propsLoading : kdsState.loading
  const actualError = propsError || kdsState.error
  const actualViewMode = propsViewMode || kdsState.viewMode
  const actualFilterBy = propsFilterBy || kdsState.filterBy

  // Memoize the data based on view mode
  const displayData = useMemo(() => {
    return actualViewMode === 'table' ? tableGroups : actualOrders
  }, [actualViewMode, tableGroups, actualOrders])

  // Early returns for loading and error states
  if (actualLoading) {
    return (
      <div className={cn("flex-1", className)}>
        <OrdersLoadingState viewMode={actualViewMode} />
      </div>
    )
  }
  
  if (actualError) {
    return (
      <div className={cn("flex-1", className)}>
        <ErrorDisplay error={actualError} />
      </div>
    )
  }
  
  if (displayData.length === 0) {
    return (
      <div className={cn("flex-1", className)}>
        <EmptyState filterBy={actualFilterBy} />
      </div>
    )
  }

  // Render optimized content
  return (
    <div className={cn("flex-1", className)}>
      <OrderListErrorBoundary>
        <KDSSuspenseBoundary 
          level="section"
          fallback={<OrdersLoadingState viewMode={actualViewMode} />}
        >
          {enableVirtualization ? (
            <VirtualizedOrderList
              orders={actualViewMode !== 'table' ? actualOrders : undefined}
              tableGroups={actualViewMode === 'table' ? tableGroups : undefined}
              viewMode={actualViewMode as any}
              loading={actualLoading}
              hasNextPage={false} // Implement pagination as needed
              onBumpOrder={actions.handleBumpOrder}
              onRecallOrder={actions.handleRecallOrder}
              onStartPrep={actions.handleStartPrep}
              onUpdatePriority={actions.handleUpdatePriority}
              onAddNotes={actions.handleAddNotes}
              onBumpTable={actions.handleBumpTable}
            />
          ) : (
            // Fallback to non-virtualized rendering for simpler cases
            <div className="h-full overflow-auto">
              <div className={cn(
                "p-4",
                actualViewMode === 'table' ? "space-y-4" : "grid gap-4",
                actualViewMode === 'list' && "grid-cols-1",
                actualViewMode === 'grid' && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              )}>
                {/* Render items here if not using virtualization */}
                <div className="text-center py-8 text-gray-500">
                  Non-virtualized rendering not implemented in this optimized version.
                  Enable virtualization for best performance.
                </div>
              </div>
            </div>
          )}
        </KDSSuspenseBoundary>
      </OrderListErrorBoundary>
    </div>
  )
})

OptimizedKDSMainContent.displayName = 'OptimizedKDSMainContent'

// Export performance metrics hook for monitoring
export const useKDSPerformanceMetrics = () => {
  const kdsState = useKDSState()
  
  return useMemo(() => ({
    totalOrders: kdsState.orders?.length || 0,
    renderTime: performance.now(), // Simple timing
    memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
    isVirtualized: true,
    hasLazyLoading: true,
  }), [kdsState.orders])
}