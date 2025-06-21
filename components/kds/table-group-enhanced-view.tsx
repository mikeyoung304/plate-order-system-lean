'use client'

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  Eye,
  EyeOff,
  LayoutGrid,
  List,
  Settings,
  TrendingUp,
} from 'lucide-react'
import { AnimatePresence, Reorder } from 'framer-motion'
import { TableGroupCard } from './table-group-card'
import { TableGroupTimeline } from './table-group-timeline'
import { TableGroupControls } from './table-group-controls'
import { TableGroupAnalytics } from './table-group-analytics'
import type { TableGroup } from '@/hooks/use-table-grouped-orders'

interface TableGroupEnhancedViewProps {
  groups: TableGroup[]
  onBumpOrder: (routingId: string) => Promise<void>
  onBumpTable: (tableId: string, orderIds: string[]) => Promise<void>
  onStartPrep: (routingId: string) => Promise<void>
  onRecallOrder: (routingId: string) => Promise<void>
  onReorderTables?: (newOrder: string[]) => Promise<void>
  onReorderOrders?: (tableId: string, newOrder: string[]) => Promise<void>
  className?: string
}

export const TableGroupEnhancedView = memo(function TableGroupEnhancedView({
  groups,
  onBumpOrder,
  onBumpTable,
  onStartPrep,
  onRecallOrder,
  onReorderTables,
  onReorderOrders,
  className,
}: TableGroupEnhancedViewProps) {
  // View state
  const [isCompactMode, setIsCompactMode] = useState(false)
  const [isAutoCollapse, setIsAutoCollapse] = useState(true)
  const [collapseDelay, setCollapseDelay] = useState(30)
  const [isColorCoding, setIsColorCoding] = useState(true)
  const [isDragReorder, setIsDragReorder] = useState(true)
  const [isTimelineVisible, setIsTimelineVisible] = useState(false)
  const [isAnalyticsVisible, setIsAnalyticsVisible] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)

  // Local state for drag reordering
  const [localGroups, setLocalGroups] = useState(groups)
  
  // Stable timestamp for time-based calculations (update every 30 seconds)
  const [stableTimestamp, setStableTimestamp] = useState(() => Date.now())
  
  // Update local groups when props change
  useEffect(() => {
    setLocalGroups(groups)
  }, [groups])
  
  // Update stable timestamp periodically to refresh auto-collapse
  useEffect(() => {
    const interval = setInterval(() => {
      setStableTimestamp(Date.now())
    }, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  // Handle table reordering
  const handleReorderTables = useCallback(async (newOrder: TableGroup[]) => {
    // Only update if order actually changed
    const currentIds = localGroups.map(g => g.tableId).join(',')
    const newIds = newOrder.map(g => g.tableId).join(',')
    
    if (currentIds !== newIds) {
      setLocalGroups(newOrder)
      if (onReorderTables) {
        const tableIds = newOrder.map(g => g.tableId)
        await onReorderTables(tableIds)
      }
    }
  }, [onReorderTables, localGroups])

  // Filter groups based on auto-collapse setting
  const visibleGroups = useMemo(() => {
    if (!isAutoCollapse) {
      return localGroups
    }

    // Use stable timestamp to prevent infinite re-renders
    const now = stableTimestamp
    const collapseThreshold = collapseDelay * 1000
    
    return localGroups.filter(group => {
      // Always show if not all orders are completed
      if (group.orders.some(o => !o.completed_at)) {
        return true
      }
      
      // Check if any order was completed within the collapse delay
      const hasRecentCompletion = group.orders.some(o => {
        if (!o.completed_at) {
          return false
        }
        const completedTime = new Date(o.completed_at).getTime()
        return (now - completedTime) < collapseThreshold
      })
      
      return hasRecentCompletion
    })
  }, [localGroups, isAutoCollapse, collapseDelay, stableTimestamp])

  // Stats for header
  const stats = useMemo(() => {
    const totalTables = groups.length
    const activeTables = groups.filter(g => g.orders.some(o => !o.completed_at)).length
    const totalOrders = groups.reduce((sum, g) => sum + g.orders.length, 0)
    const activeOrders = groups.reduce((sum, g) => sum + g.orders.filter(o => !o.completed_at).length, 0)
    
    return {
      totalTables,
      activeTables,
      totalOrders,
      activeOrders,
    }
  }, [groups])

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header with Stats and Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-900">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Table Groups</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {stats.activeTables}/{stats.totalTables} active
            </Badge>
            <Badge variant="outline">
              {stats.activeOrders} orders
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View mode toggles */}
          <Button
            variant={isTimelineVisible ? "default" : "outline"}
            size="sm"
            onClick={() => setIsTimelineVisible(!isTimelineVisible)}
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Timeline
          </Button>
          
          <Button
            variant={isAnalyticsVisible ? "default" : "outline"}
            size="sm"
            onClick={() => setIsAnalyticsVisible(!isAnalyticsVisible)}
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            Analytics
          </Button>
          
          <Button
            variant={showControls ? "default" : "outline"}
            size="sm"
            onClick={() => setShowControls(!showControls)}
          >
            <Settings className="h-4 w-4 mr-1" />
            Controls
          </Button>
        </div>
      </div>

      {/* Controls Panel */}
      <AnimatePresence>
        {showControls && (
          <div className="p-4 border-b">
            <TableGroupControls
              onToggleCompactMode={setIsCompactMode}
              onToggleAutoCollapse={setIsAutoCollapse}
              onSetCollapseDelay={setCollapseDelay}
              onToggleColorCoding={setIsColorCoding}
              onToggleDragReorder={setIsDragReorder}
              onToggleTimeline={setIsTimelineVisible}
              onToggleAnalytics={setIsAnalyticsVisible}
              isCompactMode={isCompactMode}
              isAutoCollapse={isAutoCollapse}
              collapseDelay={collapseDelay}
              isColorCoding={isColorCoding}
              isDragReorder={isDragReorder}
              isTimelineVisible={isTimelineVisible}
              isAnalyticsVisible={isAnalyticsVisible}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Table Groups */}
        <div className={cn(
          "flex-1 overflow-auto",
          (isTimelineVisible || isAnalyticsVisible) && "lg:w-2/3"
        )}>
          {visibleGroups.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-xl font-medium mb-2">All caught up!</h3>
                <p className="text-gray-400">
                  {isAutoCollapse 
                    ? "Completed tables auto-collapsed" 
                    : "No active table groups"}
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-4">
                {isDragReorder ? (
                  <Reorder.Group
                    axis="y"
                    values={visibleGroups}
                    onReorder={handleReorderTables}
                    className="space-y-4"
                  >
                    {visibleGroups.map((group) => (
                      <Reorder.Item
                        key={group.tableId}
                        value={group}
                        className="cursor-grab active:cursor-grabbing"
                      >
                        <TableGroupCard
                          group={group}
                          onBumpOrder={onBumpOrder}
                          onBumpTable={onBumpTable}
                          onStartPrep={onStartPrep}
                          onRecallOrder={onRecallOrder}
                          isCompact={isCompactMode}
                          showActions={true}
                          className={cn(
                            !isColorCoding && "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                          )}
                        />
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                ) : (
                  <div className="space-y-4">
                    {visibleGroups.map((group) => (
                      <TableGroupCard
                        key={group.tableId}
                        group={group}
                        onBumpOrder={onBumpOrder}
                        onBumpTable={onBumpTable}
                        onStartPrep={onStartPrep}
                        onRecallOrder={onRecallOrder}
                        isCompact={isCompactMode}
                        showActions={true}
                        className={cn(
                          !isColorCoding && "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Side Panels */}
        {(isTimelineVisible || isAnalyticsVisible) && (
          <div className="hidden lg:flex lg:w-1/3 border-l bg-gray-50 dark:bg-gray-950 flex-col">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {/* Timeline Panel */}
                {isTimelineVisible && selectedGroup && (
                  <TableGroupTimeline
                    group={visibleGroups.find(g => g.tableId === selectedGroup)!}
                  />
                )}
                
                {/* Analytics Panel */}
                {isAnalyticsVisible && (
                  <div className="space-y-4">
                    {selectedGroup ? (
                      <TableGroupAnalytics
                        group={visibleGroups.find(g => g.tableId === selectedGroup)!}
                      />
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Select a table group to view analytics</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  )
})