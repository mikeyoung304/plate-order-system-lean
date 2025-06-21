'use client'

import { memo, useCallback, useMemo } from 'react'
import { FixedSizeList as List } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import { OrderCard } from './order-card'
import { TableGroupCard } from './table-group-card'
import type { KDSOrderRouting } from '@/lib/modassembly/supabase/database/kds'
import type { TableGroup } from '@/hooks/use-table-grouped-orders'

interface VirtualizedOrderListProps {
  items: (KDSOrderRouting | TableGroup)[]
  viewMode: 'grid' | 'list' | 'table'
  itemHeight?: number
  onBumpOrder?: (routingId: string) => Promise<void>
  onRecallOrder?: (routingId: string) => Promise<void>
  onStartPrep?: (routingId: string) => Promise<void>
  onBumpTable?: (tableId: string, orderIds: string[]) => Promise<void>
  className?: string
}

// Item renderer for virtualized list
const ItemRenderer = memo<{
  index: number
  style: React.CSSProperties
  data: {
    items: (KDSOrderRouting | TableGroup)[]
    viewMode: 'grid' | 'list' | 'table'
    onBumpOrder?: (routingId: string) => Promise<void>
    onRecallOrder?: (routingId: string) => Promise<void>
    onStartPrep?: (routingId: string) => Promise<void>
    onBumpTable?: (tableId: string, orderIds: string[]) => Promise<void>
  }
}>(({ index, style, data }) => {
  const item = data.items[index]
  
  // Type guard to check if item is a TableGroup
  const isTableGroup = (item: any): item is TableGroup => {
    return 'tableId' in item && 'orders' in item && Array.isArray(item.orders)
  }

  return (
    <div style={style} className="px-2 py-1">
      {isTableGroup(item) ? (
        <TableGroupCard
          key={item.tableId}
          group={item}
          onBumpOrder={data.onBumpOrder || (() => Promise.resolve())}
          onRecallOrder={data.onRecallOrder || (() => Promise.resolve())}
          onStartPrep={data.onStartPrep || (() => Promise.resolve())}
          onBumpTable={data.onBumpTable || (() => Promise.resolve())}
        />
      ) : (
        <OrderCard
          key={item.id}
          order={item}
          onBump={data.onBumpOrder || (() => Promise.resolve())}
          onRecall={data.onRecallOrder || (() => Promise.resolve())}
          onStartPrep={data.onStartPrep || (() => Promise.resolve())}
        />
      )}
    </div>
  )
})

ItemRenderer.displayName = 'VirtualizedItemRenderer'

export const VirtualizedOrderList = memo<VirtualizedOrderListProps>(({
  items,
  viewMode,
  itemHeight = 200,
  onBumpOrder,
  onRecallOrder,
  onStartPrep,
  onBumpTable,
  className = ''
}) => {
  // Memoize the data passed to the virtualized list
  const listData = useMemo(() => ({
    items,
    viewMode,
    onBumpOrder,
    onRecallOrder,
    onStartPrep,
    onBumpTable,
  }), [items, viewMode, onBumpOrder, onRecallOrder, onStartPrep, onBumpTable])

  // Calculate dynamic item height based on view mode and content
  const getItemHeight = useCallback((index: number) => {
    const item = items[index]
    
    // Table groups are generally larger
    if ('tableId' in item) {
      const tableGroup = item as TableGroup
      const baseHeight = 120
      const orderHeight = 60
      const maxOrdersToShow = 3
      const ordersToRender = Math.min(tableGroup.orders.length, maxOrdersToShow)
      return baseHeight + (ordersToRender * orderHeight)
    }
    
    // Regular orders
    const order = item as KDSOrderRouting
    const baseHeight = 140
    const itemHeight = 30
    const maxItemsToShow = 5
    const itemsCount = order.order?.items?.length || 0
    const itemsToRender = Math.min(itemsCount, maxItemsToShow)
    return baseHeight + (itemsToRender * itemHeight)
  }, [items])

  // Use dynamic height for better performance
  const averageItemHeight = useMemo(() => {
    if (items.length === 0) {return itemHeight}
    
    const totalHeight = items.reduce((sum, _, index) => sum + getItemHeight(index), 0)
    return Math.max(totalHeight / items.length, 140) // Minimum height of 140px
  }, [items, getItemHeight, itemHeight])

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">
            No orders to display
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Orders will appear here when they come in
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full w-full ${className}`}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            width={width}
            itemCount={items.length}
            itemSize={averageItemHeight}
            itemData={listData}
            overscanCount={5} // Render 5 extra items above/below viewport
          >
            {ItemRenderer}
          </List>
        )}
      </AutoSizer>
    </div>
  )
})

VirtualizedOrderList.displayName = 'VirtualizedOrderList'

// Grid virtualization for larger screens
interface VirtualizedGridProps extends VirtualizedOrderListProps {
  columnCount?: number
  columnWidth?: number
}

export const VirtualizedOrderGrid = memo<VirtualizedGridProps>(({
  items,
  viewMode,
  columnCount = 3,
  columnWidth = 300,
  itemHeight = 200,
  onBumpOrder,
  onRecallOrder,
  onStartPrep,
  onBumpTable,
  className = ''
}) => {
  // Calculate grid dimensions
  const rowCount = Math.ceil(items.length / columnCount)
  
  // Grid item renderer
  const GridItemRenderer = useCallback(({ 
    columnIndex, 
    rowIndex, 
    style 
  }: {
    columnIndex: number
    rowIndex: number
    style: React.CSSProperties
  }) => {
    const itemIndex = rowIndex * columnCount + columnIndex
    
    if (itemIndex >= items.length) {
      return <div style={style} />
    }
    
    const item = items[itemIndex]
    const isTableGroup = 'tableId' in item && 'orders' in item
    
    return (
      <div style={style} className="p-2">
        {isTableGroup ? (
          <TableGroupCard
            key={(item as TableGroup).tableId}
            group={item as TableGroup}
            onBumpOrder={onBumpOrder || (() => Promise.resolve())}
            onRecallOrder={onRecallOrder || (() => Promise.resolve())}
            onStartPrep={onStartPrep || (() => Promise.resolve())}
            onBumpTable={onBumpTable || (() => Promise.resolve())}
          />
        ) : (
          <OrderCard
            key={item.id}
            order={item as KDSOrderRouting}
            onBump={onBumpOrder || (() => Promise.resolve())}
            onRecall={onRecallOrder || (() => Promise.resolve())}
            onStartPrep={onStartPrep || (() => Promise.resolve())}
          />
        )}
      </div>
    )
  }, [items, columnCount, onBumpOrder, onRecallOrder, onStartPrep, onBumpTable])

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">
            No orders to display
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Orders will appear here when they come in
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full w-full ${className}`}>
      <AutoSizer>
        {({ height, width }) => {
          // Dynamically calculate column count based on available width
          const dynamicColumnCount = Math.max(1, Math.floor(width / columnWidth))
          const actualColumnWidth = width / dynamicColumnCount
          const actualRowCount = Math.ceil(items.length / dynamicColumnCount)
          
          return (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${dynamicColumnCount}, 1fr)`,
                gap: '16px',
                height,
                overflowY: 'auto',
                padding: '16px'
              }}
            >
              {items.map((item, index) => {
                const isTableGroup = 'tableId' in item && 'orders' in item
                
                return (
                  <div key={isTableGroup ? (item as TableGroup).tableId : item.id}>
                    {isTableGroup ? (
                      <TableGroupCard
                        group={item as TableGroup}
                        onBumpOrder={onBumpOrder || (() => Promise.resolve())}
                        onRecallOrder={onRecallOrder || (() => Promise.resolve())}
                        onStartPrep={onStartPrep || (() => Promise.resolve())}
                        onBumpTable={onBumpTable || (() => Promise.resolve())}
                      />
                    ) : (
                      <OrderCard
                        order={item as KDSOrderRouting}
                        onBump={onBumpOrder || (() => Promise.resolve())}
                        onRecall={onRecallOrder || (() => Promise.resolve())}
                        onStartPrep={onStartPrep || (() => Promise.resolve())}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )
        }}
      </AutoSizer>
    </div>
  )
})

VirtualizedOrderGrid.displayName = 'VirtualizedOrderGrid'