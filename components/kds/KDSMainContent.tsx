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
  
  return (
    <>
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onOrderAction={kdsState.handleOrderAction}
          showTableInfo={true}
          compact={kdsState.viewMode === 'list'}
        />
      ))}
    </>
  )
})
IndividualOrderView.displayName = 'IndividualOrderView'

// Table grouped view
const TableGroupedView = memo(({ orders }: { orders: any[] }) => {
  const kdsState = useKDSState()
  const { groupedOrders } = useTableGroupedOrders(orders)
  
  return (
    <>
      {Object.entries(groupedOrders).map(([tableId, tableOrders]) => (
        <TableGroupCard
          key={tableId}
          tableOrders={tableOrders as any}
          onOrderAction={kdsState.handleOrderAction}
          onBulkAction={kdsState.handleBulkAction}
        />
      ))}
    </>
  )
})
TableGroupedView.displayName = 'TableGroupedView'

// Filter and sort orders
function useFilteredAndSortedOrders() {
  const kdsState = useKDSState()
  
  return useMemo(() => {
    if (!kdsState.orders) {return []}
    
    let filtered = [...kdsState.orders]
    
    // Apply filters
    if (kdsState.filterBy !== 'all') {
      filtered = filtered.filter(order => {
        if (kdsState.filterBy === 'in_progress') {
          return order.status === 'in_progress' || order.status === 'started'
        }
        return order.status === kdsState.filterBy
      })
    }
    
    if (kdsState.selectedStation && kdsState.selectedStation !== 'all') {
      filtered = filtered.filter(order => 
        order.station_type === kdsState.selectedStation
      )
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (kdsState.sortBy) {
        case 'priority':
          return (b.priority || 0) - (a.priority || 0)
        case 'time':
          return new Date(a.routed_at).getTime() - new Date(b.routed_at).getTime()
        case 'table':
          return (a.table_label || '').localeCompare(b.table_label || '')
        default:
          return new Date(a.routed_at).getTime() - new Date(b.routed_at).getTime()
      }
    })
    
    return filtered
  }, [kdsState.orders, kdsState.filterBy, kdsState.selectedStation, kdsState.sortBy])
}

export const KDSMainContent = memo<KDSMainContentProps>(({ className }) => {
  const kdsState = useKDSState()
  const filteredAndSortedOrders = useFilteredAndSortedOrders()
  
  if (kdsState.loading) {
    return (
      <div className={cn("flex-1", className)}>
        <LoadingSkeleton />
      </div>
    )
  }
  
  if (kdsState.error) {
    return (
      <div className={cn("flex-1", className)}>
        <ErrorDisplay error={kdsState.error} />
      </div>
    )
  }
  
  if (filteredAndSortedOrders.length === 0) {
    return (
      <div className={cn("flex-1", className)}>
        <EmptyState filterBy={kdsState.filterBy} />
      </div>
    )
  }
  
  return (
    <div className={cn("flex-1", className)}>
      <ScrollArea className="h-full">
        <div className={cn(
          "p-4 grid gap-4",
          getGridClasses(kdsState.viewMode, filteredAndSortedOrders.length)
        )}>
          {kdsState.viewMode === 'table' ? (
            <TableGroupedView orders={filteredAndSortedOrders} />
          ) : (
            <IndividualOrderView orders={filteredAndSortedOrders} />
          )}
        </div>
      </ScrollArea>
    </div>
  )
})

KDSMainContent.displayName = 'KDSMainContent'