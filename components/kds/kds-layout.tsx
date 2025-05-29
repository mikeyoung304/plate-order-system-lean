"use client"

import { useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { 
  RefreshCw, 
  Settings, 
  Grid3x3, 
  List, 
  Wifi, 
  WifiOff, 
  Volume2, 
  VolumeX,
  Maximize,
  Minimize,
  Filter
} from 'lucide-react'
import { OrderCard } from './order-card'
import { VoiceCommandPanel } from './voice-command-panel'
import { useKDSOrders, useKDSStations } from '@/hooks/use-kds-orders'
import { 
  bumpOrder, 
  recallOrder, 
  startOrderPrep, 
  updateOrderPriority, 
  addOrderNotes,
  type KDSOrderRouting 
} from '@/lib/modassembly/supabase/database/kds'

interface KDSLayoutProps {
  stationId?: string
  className?: string
  showHeader?: boolean
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
}

type ViewMode = 'grid' | 'list'
type SortBy = 'time' | 'priority' | 'table'
type FilterBy = 'all' | 'new' | 'preparing' | 'overdue'

export function KDSLayout({ 
  stationId, 
  className,
  showHeader = true,
  isFullscreen = false,
  onToggleFullscreen
}: KDSLayoutProps) {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortBy>('time')
  const [filterBy, setFilterBy] = useState<FilterBy>('all')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  // Hooks
  const { 
    orders, 
    loading, 
    error, 
    connectionStatus, 
    refetch,
    optimisticUpdate 
  } = useKDSOrders({ stationId })
  
  const { stations } = useKDSStations()

  // Get current station info
  const currentStation = useMemo(() => {
    if (!stationId) return null
    return stations.find(station => station.id === stationId)
  }, [stationId, stations])

  // Filter and sort orders
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = [...orders]

    // Apply filters
    switch (filterBy) {
      case 'new':
        filtered = filtered.filter(order => !order.started_at)
        break
      case 'preparing':
        filtered = filtered.filter(order => order.started_at && !order.completed_at)
        break
      case 'overdue':
        const now = new Date()
        filtered = filtered.filter(order => {
          const startTime = order.started_at ? new Date(order.started_at) : new Date(order.routed_at)
          const elapsed = (now.getTime() - startTime.getTime()) / 1000
          return elapsed > 600 // Over 10 minutes
        })
        break
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return b.priority - a.priority
        case 'table':
          const tableA = a.order?.table?.label || ''
          const tableB = b.order?.table?.label || ''
          return tableA.localeCompare(tableB)
        case 'time':
        default:
          return new Date(a.routed_at).getTime() - new Date(b.routed_at).getTime()
      }
    })

    return filtered
  }, [orders, filterBy, sortBy])

  // Order actions with optimistic updates
  const handleBumpOrder = useCallback(async (routingId: string) => {
    // Optimistic update
    optimisticUpdate(routingId, { 
      completed_at: new Date().toISOString(),
      bumped_at: new Date().toISOString()
    })
    
    try {
      // TODO: Get actual user ID from auth context
      await bumpOrder(routingId, 'current-user-id')
      
      // Play sound if enabled
      if (soundEnabled) {
        // Create a simple beep sound
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.value = 800
        oscillator.type = 'sine'
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.1)
      }
    } catch (error) {
      console.error('Error bumping order:', error)
      // Revert optimistic update on error
      refetch()
    }
  }, [optimisticUpdate, soundEnabled, refetch])

  const handleRecallOrder = useCallback(async (routingId: string) => {
    // Optimistic update
    optimisticUpdate(routingId, { 
      completed_at: undefined,
      bumped_at: undefined,
      recalled_at: new Date().toISOString()
    })
    
    try {
      await recallOrder(routingId)
    } catch (error) {
      console.error('Error recalling order:', error)
      refetch()
    }
  }, [optimisticUpdate, refetch])

  const handleStartPrep = useCallback(async (routingId: string) => {
    // Optimistic update
    optimisticUpdate(routingId, { 
      started_at: new Date().toISOString()
    })
    
    try {
      await startOrderPrep(routingId)
    } catch (error) {
      console.error('Error starting prep:', error)
      refetch()
    }
  }, [optimisticUpdate, refetch])

  const handleUpdatePriority = useCallback(async (routingId: string, priority: number) => {
    // Optimistic update
    optimisticUpdate(routingId, { priority })
    
    try {
      await updateOrderPriority(routingId, priority)
    } catch (error) {
      console.error('Error updating priority:', error)
      refetch()
    }
  }, [optimisticUpdate, refetch])

  const handleAddNotes = useCallback(async (routingId: string, notes: string) => {
    // Optimistic update
    optimisticUpdate(routingId, { notes })
    
    try {
      await addOrderNotes(routingId, notes)
    } catch (error) {
      console.error('Error adding notes:', error)
      refetch()
    }
  }, [optimisticUpdate, refetch])

  // Voice command handlers
  const handleVoiceBumpOrder = useCallback(async (orderNumber: string) => {
    const order = filteredAndSortedOrders.find(o => 
      o.order?.id?.endsWith(orderNumber) || 
      o.order?.id?.slice(-6) === orderNumber
    )
    if (order) {
      await handleBumpOrder(order.id)
    }
  }, [filteredAndSortedOrders, handleBumpOrder])

  const handleVoiceRecallOrder = useCallback(async (orderNumber: string) => {
    const order = filteredAndSortedOrders.find(o => 
      o.order?.id?.endsWith(orderNumber) || 
      o.order?.id?.slice(-6) === orderNumber
    )
    if (order) {
      await handleRecallOrder(order.id)
    }
  }, [filteredAndSortedOrders, handleRecallOrder])

  const handleVoiceStartOrder = useCallback(async (orderNumber: string) => {
    const order = filteredAndSortedOrders.find(o => 
      o.order?.id?.endsWith(orderNumber) || 
      o.order?.id?.slice(-6) === orderNumber
    )
    if (order) {
      await handleStartPrep(order.id)
    }
  }, [filteredAndSortedOrders, handleStartPrep])

  const handleVoiceSetPriority = useCallback(async (orderNumber: string, priority: number) => {
    const order = filteredAndSortedOrders.find(o => 
      o.order?.id?.endsWith(orderNumber) || 
      o.order?.id?.slice(-6) === orderNumber
    )
    if (order) {
      await handleUpdatePriority(order.id, priority)
    }
  }, [filteredAndSortedOrders, handleUpdatePriority])

  const handleVoiceFilter = useCallback((filter: string) => {
    switch (filter.toLowerCase()) {
      case 'new':
        setFilterBy('new')
        break
      case 'preparing':
        setFilterBy('preparing')
        break
      case 'overdue':
        setFilterBy('overdue')
        break
      case 'all':
        setFilterBy('all')
        break
      default:
        setFilterBy('all')
    }
  }, [])

  // Connection status indicator
  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />
      case 'reconnecting':
        return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-red-500" />
    }
  }

  // Get grid classes based on order count and view mode
  const getGridClasses = () => {
    if (viewMode === 'list') return 'grid-cols-1'
    
    const orderCount = filteredAndSortedOrders.length
    if (orderCount <= 4) return 'grid-cols-1 md:grid-cols-2'
    if (orderCount <= 9) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    if (orderCount <= 16) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
  }

  return (
    <div className={cn('flex flex-col h-full bg-gray-50 dark:bg-gray-900', className)}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b shadow-sm">
          <div className="flex items-center gap-4">
            {/* Station info */}
            <div className="flex items-center gap-2">
              {currentStation && (
                <Badge 
                  className="text-lg px-3 py-1"
                  style={{ backgroundColor: currentStation.color }}
                >
                  {currentStation.name}
                </Badge>
              )}
              {!stationId && (
                <Badge variant="outline" className="text-lg px-3 py-1">
                  All Stations
                </Badge>
              )}
            </div>

            {/* Order count */}
            <Badge variant="secondary">
              {filteredAndSortedOrders.length} orders
            </Badge>

            {/* Connection status */}
            <div className="flex items-center gap-1">
              {getConnectionIcon()}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {connectionStatus}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter */}
            <Select value={filterBy} onValueChange={(value: FilterBy) => setFilterBy(value)}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time">By Time</SelectItem>
                <SelectItem value="priority">By Priority</SelectItem>
                <SelectItem value="table">By Table</SelectItem>
              </SelectContent>
            </Select>

            {/* View mode */}
            <div className="flex border rounded">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Voice commands */}
            <VoiceCommandPanel
              onBumpOrder={handleVoiceBumpOrder}
              onRecallOrder={handleVoiceRecallOrder}
              onStartOrder={handleVoiceStartOrder}
              onSetPriority={handleVoiceSetPriority}
              onFilter={handleVoiceFilter}
              orders={filteredAndSortedOrders}
            />

            {/* Sound toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>

            {/* Fullscreen toggle */}
            {onToggleFullscreen && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleFullscreen}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            )}

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={loading}
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>

            {/* Settings */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950 border-b border-red-200 dark:border-red-800">
          <div className="text-red-800 dark:text-red-200">
            Error loading orders: {error}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {loading && filteredAndSortedOrders.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredAndSortedOrders.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-xl font-medium mb-2">No orders</h3>
              <p className="text-gray-400">
                {filterBy === 'all' 
                  ? 'All caught up! No pending orders.'
                  : `No ${filterBy} orders at the moment.`}
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className={cn(
              'p-4 grid gap-4',
              getGridClasses()
            )}>
              {filteredAndSortedOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onBump={handleBumpOrder}
                  onRecall={handleRecallOrder}
                  onStartPrep={handleStartPrep}
                  onUpdatePriority={handleUpdatePriority}
                  onAddNotes={handleAddNotes}
                  isCompact={viewMode === 'list'}
                  className="w-full"
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="border-t bg-white dark:bg-gray-800 p-4">
          <h4 className="font-medium mb-3">Display Settings</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Auto-refresh</label>
              <div className="text-sm">Every 5 seconds</div>
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Sound alerts</label>
              <div className="text-sm">{soundEnabled ? 'Enabled' : 'Disabled'}</div>
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">View mode</label>
              <div className="text-sm capitalize">{viewMode}</div>
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Connection</label>
              <div className="text-sm capitalize">{connectionStatus}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}