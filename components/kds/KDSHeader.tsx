'use client'

import { memo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertCircle,
  Filter,
  Grid3x3,
  List,
  MapPin,
  Maximize,
  Minimize,
  RefreshCw,
  Settings,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useKDSState } from '@/lib/hooks/use-kds-state'

interface KDSHeaderProps {
  className?: string
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
}

// Connection status indicator
const ConnectionStatus = memo(({ status }: { status: string }) => {
  const isConnected = status === 'connected'
  
  return (
    <div className="flex items-center gap-2">
      {isConnected ? (
        <>
          <Wifi className="h-4 w-4 text-green-400" />
          <Badge variant="secondary" className="bg-green-900/40 text-green-400 border-green-700">
            Connected
          </Badge>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-red-400" />
          <Badge variant="secondary" className="bg-red-900/40 text-red-400 border-red-700">
            Disconnected
          </Badge>
        </>
      )}
    </div>
  )
})
ConnectionStatus.displayName = 'ConnectionStatus'

// Station selector component
const StationSelector = memo(() => {
  const kdsState = useKDSState()
  
  return (
    <div className="flex items-center gap-2">
      <MapPin className="h-4 w-4 text-blue-400" />
      <Select value={kdsState.selectedStation || 'all'} onValueChange={kdsState.setSelectedStation}>
        <SelectTrigger className="w-40 bg-gray-800 border-gray-600">
          <SelectValue placeholder="Select station" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Stations</SelectItem>
          <SelectItem value="grill">Grill</SelectItem>
          <SelectItem value="fryer">Fryer</SelectItem>
          <SelectItem value="salad">Salad</SelectItem>
          <SelectItem value="expo">Expo</SelectItem>
          <SelectItem value="bar">Bar</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
})
StationSelector.displayName = 'StationSelector'

// Filter controls component
const FilterControls = memo(() => {
  const kdsState = useKDSState()
  
  return (
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 text-gray-400" />
      <Select value={kdsState.filterBy} onValueChange={kdsState.setFilterBy}>
        <SelectTrigger className="w-32 bg-gray-800 border-gray-600">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Orders</SelectItem>
          <SelectItem value="new">New</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="ready">Ready</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
})
FilterControls.displayName = 'FilterControls'

// View mode controls
const ViewModeControls = memo(() => {
  const kdsState = useKDSState()
  
  return (
    <div className="flex items-center gap-1 bg-gray-800 rounded-md p-1">
      <Button
        variant={kdsState.viewMode === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => kdsState.setViewMode('list')}
        className="h-8 w-8 p-0"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={kdsState.viewMode === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => kdsState.setViewMode('grid')}
        className="h-8 w-8 p-0"
      >
        <Grid3x3 className="h-4 w-4" />
      </Button>
      <Button
        variant={kdsState.viewMode === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => kdsState.setViewMode('table')}
        className="h-8 w-8 p-0"
      >
        <Grid3x3 className="h-4 w-4" />
      </Button>
    </div>
  )
})
ViewModeControls.displayName = 'ViewModeControls'

// Audio controls
const AudioControls = memo(() => {
  const kdsState = useKDSState()
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => kdsState.setSoundEnabled(!kdsState.soundEnabled)}
      className={cn(
        "h-8 w-8 p-0",
        kdsState.soundEnabled ? "text-blue-400" : "text-gray-500"
      )}
    >
      {kdsState.soundEnabled ? (
        <Volume2 className="h-4 w-4" />
      ) : (
        <VolumeX className="h-4 w-4" />
      )}
    </Button>
  )
})
AudioControls.displayName = 'AudioControls'

// Order metrics display
const OrderMetrics = memo(() => {
  const kdsState = useKDSState()
  
  const totalOrders = kdsState.orders?.length || 0
  const activeOrders = kdsState.orders?.filter(
    order => order.status === 'new' || order.status === 'in_progress'
  ).length || 0
  
  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-gray-400">Total:</span>
        <Badge variant="secondary" className="bg-gray-700 text-gray-300">
          {totalOrders}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-400">Active:</span>
        <Badge 
          variant="secondary" 
          className={cn(
            activeOrders > 10 
              ? "bg-red-900/40 text-red-400" 
              : activeOrders > 5 
                ? "bg-yellow-900/40 text-yellow-400"
                : "bg-green-900/40 text-green-400"
          )}
        >
          {activeOrders}
        </Badge>
      </div>
    </div>
  )
})
OrderMetrics.displayName = 'OrderMetrics'

export const KDSHeader = memo<KDSHeaderProps>(({ 
  className, 
  isFullscreen = false, 
  onToggleFullscreen 
}) => {
  const kdsState = useKDSState()
  
  const handleRefresh = useCallback(() => {
    kdsState.refetch()
  }, [kdsState])
  
  return (
    <div className={cn(
      "flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700",
      className
    )}>
      {/* Left section: Title and connection status */}
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-semibold text-white">Kitchen Display</h1>
        <ConnectionStatus status={kdsState.connectionStatus} />
        <OrderMetrics />
      </div>
      
      {/* Center section: Controls */}
      <div className="flex items-center gap-4">
        <StationSelector />
        <FilterControls />
        <ViewModeControls />
      </div>
      
      {/* Right section: Actions */}
      <div className="flex items-center gap-2">
        <AudioControls />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="h-8 w-8 p-0"
          disabled={kdsState.loading}
        >
          <RefreshCw className={cn(
            "h-4 w-4",
            kdsState.loading && "animate-spin"
          )} />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <Settings className="h-4 w-4" />
        </Button>
        
        {onToggleFullscreen && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFullscreen}
            className="h-8 w-8 p-0"
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  )
})

KDSHeader.displayName = 'KDSHeader'