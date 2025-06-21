'use client'

import { memo, useMemo } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OrderCard } from './order-card'
import { TableGroupCard } from './table-group-card'
import { useKDSState } from '@/lib/hooks/use-kds-state'
import { useTableGroupedOrders } from '@/hooks/use-table-grouped-orders'
import {
  bumpOrder,
  recallOrder,
  startOrderPrep,
  updateOrderPriority,
  addOrderNotes,
} from '@/lib/modassembly/supabase/database/kds'
import { getClientUser } from '@/lib/modassembly/supabase/auth/session'
import { useToast } from '@/hooks/use-toast'

interface KDSMainContentProps {
  className?: string
  orders?: any[]
  loading?: boolean
  error?: string
  viewMode?: string
  filterBy?: string
  sortBy?: string
}

// Loading skeleton component
const LoadingSkeleton = memo(() => (
  <div className="p-4 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
    {[...Array(6)].map((_, i) => (
      <Skeleton key={i} className="h-48 w-full" />
    ))}
  </div>
))
LoadingSkeleton.displayName = 'LoadingSkeleton'

// Empty state component
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

// Error display component
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

// Grid layout for different view modes
const getGridClasses = (viewMode: string, orderCount: number) => {
  switch (viewMode) {
    case 'list':
      return 'grid-cols-1'
    case 'grid':
      if (orderCount <= 4) {return 'grid-cols-1 md:grid-cols-2'}
      if (orderCount <= 9) {return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    case 'table':
      return 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
    default:
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  }
}

// Individual order view
const IndividualOrderView = memo(({ orders }: { orders: any[] }) => {
  const kdsState = useKDSState()
  const { toast } = useToast()
  
  // Real action handlers connected to KDS database functions
  const handleBump = async (routingId: string) => {
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
    } catch (error) {
      console.error('Error bumping order:', error)
      kdsState.refetch() // Restore correct state
      toast({
        title: 'Error',
        description: 'Failed to bump order',
        variant: 'destructive',
      })
    }
  }
  
  const handleRecall = async (routingId: string) => {
    try {
      // Optimistic update
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
    } catch (error) {
      console.error('Error recalling order:', error)
      kdsState.refetch()
      toast({
        title: 'Error',
        description: 'Failed to recall order',
        variant: 'destructive',
      })
    }
  }
  
  const handleStartPrep = async (routingId: string) => {
    try {
      // Optimistic update
      kdsState.optimisticUpdate(routingId, {
        started_at: new Date().toISOString()
      })
      
      await startOrderPrep(routingId)
      toast({
        title: 'Preparation started',
        description: 'Order preparation has begun',
      })
    } catch (error) {
      console.error('Error starting prep:', error)
      kdsState.refetch()
      toast({
        title: 'Error',
        description: 'Failed to start preparation',
        variant: 'destructive',
      })
    }
  }
  
  const handleUpdatePriority = async (routingId: string, priority: number) => {
    try {
      // Optimistic update
      kdsState.optimisticUpdate(routingId, { priority })
      
      await updateOrderPriority(routingId, priority)
      toast({
        title: 'Priority updated',
        description: `Order priority set to ${priority}`,
      })
    } catch (error) {
      console.error('Error updating priority:', error)
      kdsState.refetch()
      toast({
        title: 'Error',
        description: 'Failed to update priority',
        variant: 'destructive',
      })
    }
  }
  
  const handleAddNotes = async (routingId: string, notes: string) => {
    try {
      // Optimistic update
      kdsState.optimisticUpdate(routingId, { notes })
      
      await addOrderNotes(routingId, notes)
      toast({
        title: 'Notes saved',
        description: 'Order notes have been updated',
      })
    } catch (error) {
      console.error('Error adding notes:', error)
      kdsState.refetch()
      toast({
        title: 'Error',
        description: 'Failed to save notes',
        variant: 'destructive',
      })
    }
  }
  
  return (
    <>
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onBump={handleBump}
          onRecall={handleRecall}
          onStartPrep={handleStartPrep}
          onUpdatePriority={handleUpdatePriority}
          onAddNotes={handleAddNotes}
          isCompact={kdsState.viewMode === 'list'}
        />
      ))}
    </>
  )
})
IndividualOrderView.displayName = 'IndividualOrderView'

// Table grouped view
const TableGroupedView = memo(({ orders }: { orders: any[] }) => {
  const kdsState = useKDSState()
  const tableGroups = useTableGroupedOrders(orders)
  const { toast } = useToast()

  // 🔥 DEBUG: Log table grouping results
  console.log('🔥 TableGroupedView DEBUG:', {
    inputOrders: orders.length,
    tableGroups: tableGroups.length,
    firstGroup: tableGroups[0] ? {
      tableLabel: tableGroups[0].tableLabel,
      ordersCount: tableGroups[0].orders?.length || 0
    } : 'No groups',
    groupDetails: tableGroups.map(g => ({
      table: g.tableLabel,
      orders: g.orders?.length || 0
    }))
  });
  
  // Real action handlers for table operations
  const handleBumpOrder = async (routingId: string) => {
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
    } catch (error) {
      console.error('Error bumping order:', error)
      kdsState.refetch()
      toast({
        title: 'Error',
        description: 'Failed to bump order',
        variant: 'destructive',
      })
    }
  }
  
  const handleBumpTable = async (tableId: string, orderIds: string[]) => {
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
      
      // Bump all orders in the table
      await Promise.all(orderIds.map(orderId => bumpOrder(orderId, userId)))
      
      toast({
        title: 'Table completed',
        description: `All orders for table ${tableId} marked as ready`,
      })
    } catch (error) {
      console.error('Error bumping table:', error)
      kdsState.refetch()
      toast({
        title: 'Error',
        description: 'Failed to bump table orders',
        variant: 'destructive',
      })
    }
  }
  
  const handleStartPrep = async (routingId: string) => {
    try {
      // Optimistic update
      kdsState.optimisticUpdate(routingId, {
        started_at: new Date().toISOString()
      })
      
      await startOrderPrep(routingId)
      toast({
        title: 'Preparation started',
        description: 'Order preparation has begun',
      })
    } catch (error) {
      console.error('Error starting prep:', error)
      kdsState.refetch()
      toast({
        title: 'Error',
        description: 'Failed to start preparation',
        variant: 'destructive',
      })
    }
  }
  
  const handleRecallOrder = async (routingId: string) => {
    try {
      // Optimistic update
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
    } catch (error) {
      console.error('Error recalling order:', error)
      kdsState.refetch()
      toast({
        title: 'Error',
        description: 'Failed to recall order',
        variant: 'destructive',
      })
    }
  }
  
  return (
    <>
      <div style={{backgroundColor: 'green', color: 'white', padding: '10px', margin: '10px'}}>
        🔥 DEBUG: TableGroupedView rendering {tableGroups.length} groups
      </div>
      {tableGroups.map((group) => (
        <TableGroupCard
          key={`${group.tableId}-${group.earliestOrderTime.getTime()}`}
          group={group}
          onBumpOrder={handleBumpOrder}
          onBumpTable={handleBumpTable}
          onStartPrep={handleStartPrep}
          onRecallOrder={handleRecallOrder}
        />
      ))}
    </>
  )
})
TableGroupedView.displayName = 'TableGroupedView'

// Helper function to derive order status from KDS routing fields
const getOrderStatus = (order: any) => {
  if (order.completed_at) {return 'ready'}
  if (order.started_at) {return 'preparing'}  // Match KDSFilterBy type
  return 'new'
}

// Filter and sort orders
function useFilteredAndSortedOrders() {
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
          // Access table information through the order relationship
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

export const KDSMainContent = memo<KDSMainContentProps>(({ 
  className, 
  orders = [], 
  loading = false, 
  error = null, 
  viewMode = 'table',
  filterBy = 'all',
  sortBy = 'time'
}) => {
  // Fall back to useKDSState if no props provided (for backwards compatibility)
  const kdsState = useKDSState()
  const fallbackOrders = useFilteredAndSortedOrders()
  
  // Use props if provided, otherwise fall back to hook
  const actualOrders = orders.length > 0 ? orders : fallbackOrders
  const actualLoading = orders.length > 0 ? loading : kdsState.loading  // Only use prop loading if orders provided via props
  const actualError = error || kdsState.error
  const actualViewMode = viewMode || kdsState.viewMode
  const actualFilterBy = filterBy || kdsState.filterBy

  // 🔥 DEBUG: Log component rendering data with decision path
  console.log('🔥 KDSMainContent Render DEBUG:', {
    propsOrders: orders.length,
    fallbackOrders: fallbackOrders.length,
    actualOrders: actualOrders.length,
    actualLoading,
    actualError,
    actualViewMode,
    actualFilterBy,
    firstActualOrder: actualOrders?.[0] ? {
      id: actualOrders[0].id,
      orderExists: !!actualOrders[0].order,
      tableLabel: actualOrders[0].order?.table?.label,
      seatLabel: actualOrders[0].order?.seat?.label,
      items: actualOrders[0].order?.items?.length || 0
    } : 'No actual orders',
    // Decision path debugging
    willShowLoading: actualLoading,
    willShowError: !!actualError,
    willShowEmpty: actualOrders.length === 0,
    willShowOrders: !actualLoading && !actualError && actualOrders.length > 0,
    actuallyRendering: !actualLoading && !actualError && actualOrders.length > 0 ? 'YES - SHOULD RENDER ORDERS' : 'NO - SHOWING LOADING/ERROR/EMPTY'
  });
  
  if (actualLoading) {
    return (
      <div className={cn("flex-1", className)}>
        <LoadingSkeleton />
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
  
  if (actualOrders.length === 0) {
    return (
      <div className={cn("flex-1", className)}>
        <EmptyState filterBy={actualFilterBy} />
      </div>
    )
  }
  
  // 🔥 DEBUG: Log which render path is being taken
  console.log('🔥 KDSMainContent Final Render Path:', {
    actualViewMode,
    willRenderTable: actualViewMode === 'table',
    ordersForTableView: actualViewMode === 'table' ? actualOrders.length : 'N/A',
    ordersForGridView: actualViewMode !== 'table' ? actualOrders.length : 'N/A'
  });

  return (
    <div className={cn("flex-1", className)}>
      <div className="h-full overflow-auto">
        {actualViewMode === 'table' ? (
          <div className="p-4 space-y-4">
            <div style={{backgroundColor: 'red', color: 'white', padding: '10px', margin: '10px'}}>
              🔥 DEBUG: Table View - {actualOrders.length} orders
            </div>
            <TableGroupedView orders={actualOrders} />
          </div>
        ) : (
          <div className={cn(
            "p-4 grid gap-4",
            getGridClasses(actualViewMode, actualOrders.length)
          )}>
            <div style={{backgroundColor: 'blue', color: 'white', padding: '10px', margin: '10px'}}>
              🔥 DEBUG: Grid View - {actualOrders.length} orders
            </div>
            <IndividualOrderView orders={actualOrders} />
          </div>
        )}
      </div>
    </div>
  )
})

KDSMainContent.displayName = 'KDSMainContent'