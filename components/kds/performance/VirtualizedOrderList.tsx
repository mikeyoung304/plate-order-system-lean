'use client'

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FixedSizeList as List } from 'react-window'
import AutoSizer, { Size } from 'react-virtualized-auto-sizer'
import InfiniteLoader from 'react-window-infinite-loader'
import { cn } from '@/lib/utils'
import { OrderCard } from '../order-card'
import { TableGroupCard } from '../table-group-card'
import type { KDSOrderRouting } from '@/lib/modassembly/supabase/database/kds'
import type { TableGroup } from '@/hooks/use-table-grouped-orders'

// Constants for virtualization
const ORDER_CARD_HEIGHT = 280 // Estimated height for order cards
const TABLE_GROUP_HEIGHT = 320 // Estimated height for table group cards
const OVERSCAN_COUNT = 5 // Number of items to render outside visible area
const LOAD_MORE_THRESHOLD = 10 // Load more when this many items from end

interface VirtualizedOrderListProps {
  // Data
  orders?: KDSOrderRouting[]
  tableGroups?: TableGroup[]
  
  // Display mode
  viewMode: 'grid' | 'list' | 'table'
  
  // Loading and pagination
  loading?: boolean
  hasNextPage?: boolean
  loadNextPage?: () => Promise<void>
  
  // Actions for individual orders
  onBumpOrder: (routingId: string) => Promise<void>
  onRecallOrder?: (routingId: string) => Promise<void>
  onStartPrep?: (routingId: string) => Promise<void>
  onUpdatePriority?: (routingId: string, priority: number) => Promise<void>
  onAddNotes?: (routingId: string, notes: string) => Promise<void>
  
  // Actions for table groups
  onBumpTable?: (tableId: string, orderIds: string[]) => Promise<void>
  
  // Styling
  className?: string
}

// Memoized order item renderer for virtual list
const OrderItemRenderer = memo(({ 
  index, 
  style, 
  data 
}: { 
  index: number
  style: React.CSSProperties
  data: any 
}) => {
  const { 
    items, 
    viewMode, 
    onBumpOrder, 
    onRecallOrder, 
    onStartPrep, 
    onUpdatePriority, 
    onAddNotes,
    onBumpTable 
  } = data
  
  const item = items[index]
  
  if (!item) {
    return (
      <div style={style} className="p-4">
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-64" />
      </div>
    )
  }
  
  return (
    <div style={style} className="p-2">
      {viewMode === 'table' && 'tableLabel' in item ? (
        <TableGroupCard
          group={item as TableGroup}
          onBumpOrder={onBumpOrder}
          onBumpTable={onBumpTable!}
          onStartPrep={onStartPrep}
          onRecallOrder={onRecallOrder!}
          isCompact={viewMode === 'list'}
        />
      ) : (
        <OrderCard
          order={item as KDSOrderRouting}
          onBump={onBumpOrder}
          onRecall={onRecallOrder}
          onStartPrep={onStartPrep}
          onUpdatePriority={onUpdatePriority}
          onAddNotes={onAddNotes}
          isCompact={viewMode === 'list'}
        />
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.index === nextProps.index &&
    prevProps.data.items === nextProps.data.items &&
    prevProps.data.viewMode === nextProps.data.viewMode
  )
})
OrderItemRenderer.displayName = 'OrderItemRenderer'

// Grid layout renderer for multiple columns
const GridItemRenderer = memo(({ 
  columnIndex, 
  rowIndex, 
  style, 
  data 
}: { 
  columnIndex: number
  rowIndex: number
  style: React.CSSProperties
  data: any 
}) => {
  const { items, columns, ...actionProps } = data
  const index = rowIndex * columns + columnIndex
  const item = items[index]
  
  if (!item) {
    return <div style={style} />
  }
  
  return (
    <div style={style} className="p-2">
      {data.viewMode === 'table' && 'tableLabel' in item ? (
        <TableGroupCard
          group={item as TableGroup}
          {...actionProps}
          isCompact={false}
        />
      ) : (
        <OrderCard
          order={item as KDSOrderRouting}
          onBump={actionProps.onBumpOrder}
          onRecall={actionProps.onRecallOrder}
          onStartPrep={actionProps.onStartPrep}
          onUpdatePriority={actionProps.onUpdatePriority}
          onAddNotes={actionProps.onAddNotes}
          isCompact={false}
        />
      )}
    </div>
  )
})
GridItemRenderer.displayName = 'GridItemRenderer'

// Main virtualized order list component
export const VirtualizedOrderList = memo<VirtualizedOrderListProps>(({
  orders = [],
  tableGroups = [],
  viewMode,
  loading = false,
  hasNextPage = false,
  loadNextPage,
  onBumpOrder,
  onRecallOrder,
  onStartPrep,
  onUpdatePriority,
  onAddNotes,
  onBumpTable,
  className
}) => {
  const listRef = useRef<any>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  // Determine items to render based on view mode
  const items = useMemo(() => {
    return viewMode === 'table' ? tableGroups : orders
  }, [viewMode, tableGroups, orders])
  
  // Memoize window usage
  const windowObj = typeof window !== 'undefined' ? window : { innerWidth: 1200 }
  
  // Calculate item height based on view mode
  const itemHeight = useMemo(() => {
    if (viewMode === 'list') {return ORDER_CARD_HEIGHT * 0.7} // Compact mode
    if (viewMode === 'table') {return TABLE_GROUP_HEIGHT}
    return ORDER_CARD_HEIGHT
  }, [viewMode])
  
  // Calculate grid dimensions for grid view
  const { columns, rowCount } = useMemo(() => {
    if (viewMode === 'list' || viewMode === 'table') {
      return { columns: 1, rowCount: items.length }
    }
    
    // Grid view - calculate responsive columns
    const cols = Math.max(1, Math.min(4, Math.floor(windowObj.innerWidth / 400)))
    const rows = Math.ceil(items.length / cols)
    return { columns: cols, rowCount: rows }
  }, [viewMode, items.length])
  
  // Infinite loading handler
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasNextPage || !loadNextPage) {return}
    
    setIsLoadingMore(true)
    try {
      await loadNextPage()
    } catch (_error) {
      console.error('Error loading more items:', _error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, hasNextPage, loadNextPage])
  
  // Check if item is loaded for infinite loader
  const isItemLoaded = useCallback((index: number) => {
    return index < items.length
  }, [items.length])
  
  // Data for renderers
  const itemData = useMemo(() => ({
    items,
    viewMode,
    columns,
    onBumpOrder,
    onRecallOrder,
    onStartPrep,
    onUpdatePriority,
    onAddNotes,
    onBumpTable
  }), [
    items,
    viewMode,
    columns,
    onBumpOrder,
    onRecallOrder,
    onStartPrep,
    onUpdatePriority,
    onAddNotes,
    onBumpTable
  ])
  
  // Reset scroll position when items change significantly
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(0, 'start')
    }
  }, [viewMode])
  
  if (items.length === 0 && !loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] text-gray-500">
        <div className="text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-xl font-medium mb-2">No orders</h3>
          <p className="text-gray-400">All caught up! No pending orders.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className={cn("h-full w-full", className)}>
      <AutoSizer disableHeight={false}>
        {({ height, width }: Size) => {
          if (viewMode === 'grid' && columns > 1) {
            // Grid layout with FixedSizeGrid
            const { FixedSizeGrid } = require('react-window')
            return (
              <FixedSizeGrid
                ref={listRef}
                height={height || 600}
                width={width}
                columnCount={columns}
                columnWidth={Math.floor(width / columns)}
                rowCount={rowCount}
                rowHeight={itemHeight}
                itemData={itemData}
                overscanRowCount={OVERSCAN_COUNT}
                overscanColumnCount={1}
              >
                {GridItemRenderer}
              </FixedSizeGrid>
            )
          }
          
          // List layout with infinite loading
          const itemCount = hasNextPage ? items.length + 1 : items.length
          
          return (
            <InfiniteLoader
              isItemLoaded={isItemLoaded}
              itemCount={itemCount}
              loadMoreItems={handleLoadMore}
              threshold={LOAD_MORE_THRESHOLD}
            >
              {({ onItemsRendered, ref }: any) => (
                <List
                  ref={(list) => {
                    listRef.current = list
                    ref(list)
                  }}
                  height={height || 600}
                  width={width}
                  itemCount={itemCount}
                  itemSize={itemHeight}
                  itemData={itemData}
                  onItemsRendered={onItemsRendered}
                  overscanCount={OVERSCAN_COUNT}
                >
                  {OrderItemRenderer}
                </List>
              )}
            </InfiniteLoader>
          )
        }}
      </AutoSizer>
      
      {/* Loading indicator for infinite scroll */}
      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}
    </div>
  )
})

VirtualizedOrderList.displayName = 'VirtualizedOrderList'