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
  
  // Placeholder action handlers matching OrderCard interface
  const handleBump = async (routingId: string) => {
    console.log('Bump order:', routingId)
  }
  
  const handleRecall = async (routingId: string) => {
    console.log('Recall order:', routingId)
  }
  
  const handleStartPrep = async (routingId: string) => {
    console.log('Start prep:', routingId)
  }
  
  const handleUpdatePriority = async (routingId: string, priority: number) => {
    console.log('Update priority:', routingId, priority)
  }
  
  const handleAddNotes = async (routingId: string, notes: string) => {
    console.log('Add notes:', routingId, notes)
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
  
  // Placeholder action handlers matching TableGroupCard interface
  const handleBumpOrder = async (routingId: string) => {
    console.log('Bump order:', routingId)
  }
  
  const handleBumpTable = async (tableId: string, orderIds: string[]) => {
    console.log('Bump table:', tableId, orderIds)
  }
  
  const handleStartPrep = async (routingId: string) => {
    console.log('Start prep:', routingId)
  }
  
  const handleRecallOrder = async (routingId: string) => {
    console.log('Recall order:', routingId)
  }
  
  return (
    <>
      {tableGroups.map((group) => (
        <TableGroupCard
          key={group.tableId}
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
  const actualLoading = loading || kdsState.loading
  const actualError = error || kdsState.error
  const actualViewMode = viewMode || kdsState.viewMode
  const actualFilterBy = filterBy || kdsState.filterBy
  
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
  
  return (
    <div className={cn("flex-1", className)}>
      <ScrollArea className="h-full">
        <div className={cn(
          "p-4 grid gap-4",
          getGridClasses(actualViewMode, actualOrders.length)
        )}>
          {actualViewMode === 'table' ? (
            <TableGroupedView orders={actualOrders} />
          ) : (
            <IndividualOrderView orders={actualOrders} />
          )}
        </div>
      </ScrollArea>
    </div>
  )
})

KDSMainContent.displayName = 'KDSMainContent'