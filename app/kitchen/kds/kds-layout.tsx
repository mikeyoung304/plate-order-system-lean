'use client'

import React, { memo, useCallback, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Activity, 
  BarChart3, 
  Grid3x3, 
  List, 
  Maximize2,
  Minimize2,
  Zap
} from 'lucide-react'

// Import the new modular components
import { KDSStateProvider } from './providers/kds-state-provider'
import { KDSStationGrid } from './components/kds-station-grid'
import { KDSOrderQueue } from './components/kds-order-queue'
import { KDSMetricsDashboard } from './components/kds-metrics-dashboard'

// Import existing components for backwards compatibility
import { KDSHeader } from '@/components/kds/KDSHeader'
import { KDSErrorBoundary } from '@/components/error-boundaries'

// Import voice provider for voice functionality
import { VoiceProvider } from '@/contexts/kds/voice-context'

interface KDSLayoutProps {
  stationId?: string
  className?: string
  showHeader?: boolean
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
}

type ViewMode = 'stations' | 'queue' | 'metrics' | 'hybrid'
type QueueViewMode = 'compact' | 'detailed' | 'minimal'

/**
 * Main KDS Layout Component
 * 
 * This is the new orchestrator component that replaces the 792-line monolithic layout.
 * It provides a clean, modular interface that coordinates between:
 * 
 * - KDSStateProvider: Centralized state management
 * - KDSStationGrid: Visual station layout and management
 * - KDSOrderQueue: High-performance order list with virtual scrolling
 * - KDSMetricsDashboard: Real-time performance metrics
 * - KDSOperations: Business logic and order operations
 * 
 * Features:
 * - Multiple view modes for different workflow needs
 * - Responsive layout that adapts to screen size
 * - Error boundaries for fault tolerance
 * - Performance optimization with React.memo
 * - Intersection observer for efficient rendering
 * - Touch-friendly mobile interface
 */
const KDSLayoutContent = memo<KDSLayoutProps>(({
  stationId,
  className,
  showHeader = true,
  isFullscreen = false,
  onToggleFullscreen
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('hybrid')
  const [selectedStationId, setSelectedStationId] = useState<string>(stationId || '')
  const [queueViewMode, setQueueViewMode] = useState<QueueViewMode>('compact')
  const [showMetrics, setShowMetrics] = useState(false)

  // Handle view mode changes
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode)
  }, [])

  // Handle station selection
  const handleStationSelect = useCallback((stationId: string) => {
    setSelectedStationId(stationId)
  }, [])

  // Calculate layout configuration based on view mode and screen size
  const layoutConfig = useMemo(() => {
    switch (viewMode) {
      case 'stations':
        return {
          showStations: true,
          showQueue: false,
          showMetrics: false,
          stationLayout: 'grid' as const,
          queueHeight: 0
        }
      case 'queue':
        return {
          showStations: false,
          showQueue: true,
          showMetrics: false,
          stationLayout: 'compact' as const,
          queueHeight: 600
        }
      case 'metrics':
        return {
          showStations: false,
          showQueue: false,
          showMetrics: true,
          stationLayout: 'compact' as const,
          queueHeight: 0
        }
      case 'hybrid':
      default:
        return {
          showStations: true,
          showQueue: true,
          showMetrics: showMetrics,
          stationLayout: 'compact' as const,
          queueHeight: 400
        }
    }
  }, [viewMode, showMetrics])

  // Get responsive grid classes
  const getMainGridClasses = () => {
    if (viewMode === 'stations') {return 'grid-cols-1'}
    if (viewMode === 'queue') {return 'grid-cols-1'}
    if (viewMode === 'metrics') {return 'grid-cols-1'}
    
    // Hybrid mode
    return 'grid-cols-1 lg:grid-cols-3 xl:grid-cols-4'
  }

  return (
    <div className={cn(
      'h-full flex flex-col bg-gray-50 dark:bg-gray-900',
      className
    )}>
      {/* Header */}
      {showHeader && (
        <KDSHeader 
          isFullscreen={isFullscreen}
          onToggleFullscreen={onToggleFullscreen}
          className="flex-shrink-0 border-b"
        />
      )}

      {/* View Mode Controls */}
      <div className="flex-shrink-0 p-4 bg-white dark:bg-gray-800 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Tabs value={viewMode} onValueChange={(value) => handleViewModeChange(value as ViewMode)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="hybrid" className="flex items-center gap-2">
                  <Grid3x3 className="w-4 h-4" />
                  Hybrid
                </TabsTrigger>
                <TabsTrigger value="stations" className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Stations
                </TabsTrigger>
                <TabsTrigger value="queue" className="flex items-center gap-2">
                  <List className="w-4 h-4" />
                  Queue
                </TabsTrigger>
                <TabsTrigger value="metrics" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Metrics
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Queue view mode selector */}
            {layoutConfig.showQueue && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Queue View:</span>
                <div className="flex border rounded-lg">
                  {(['minimal', 'compact', 'detailed'] as const).map((mode) => (
                    <Button
                      key={mode}
                      variant={queueViewMode === mode ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setQueueViewMode(mode)}
                      className="capitalize"
                    >
                      {mode}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Metrics toggle for hybrid mode */}
            {viewMode === 'hybrid' && (
              <Button
                variant={showMetrics ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowMetrics(!showMetrics)}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Metrics
              </Button>
            )}

            {/* Fullscreen toggle */}
            {onToggleFullscreen && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4 mr-2" />
                ) : (
                  <Maximize2 className="w-4 h-4 mr-2" />
                )}
                {isFullscreen ? 'Exit' : 'Fullscreen'}
              </Button>
            )}
          </div>
        </div>

        {/* Station selection indicator */}
        {selectedStationId && (
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Station: {selectedStationId}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedStationId('')}
            >
              View All
            </Button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <div className={cn(
          'h-full grid gap-4 p-4',
          getMainGridClasses()
        )}>
          {/* Station Grid */}
          {layoutConfig.showStations && (
            <Card className={cn(
              'overflow-hidden',
              viewMode === 'hybrid' ? 'lg:col-span-2' : 'col-span-full'
            )}>
              <div className="h-full p-4">
                <KDSStationGrid
                  selectedStationId={selectedStationId}
                  onStationSelect={handleStationSelect}
                  layoutMode={layoutConfig.stationLayout}
                  className="h-full"
                />
              </div>
            </Card>
          )}

          {/* Order Queue */}
          {layoutConfig.showQueue && (
            <Card className={cn(
              'overflow-hidden',
              viewMode === 'hybrid' ? 'lg:col-span-1' : 'col-span-full'
            )}>
              <KDSOrderQueue
                stationId={selectedStationId}
                height={layoutConfig.queueHeight}
                viewMode={queueViewMode}
                className="h-full"
              />
            </Card>
          )}

          {/* Metrics Dashboard */}
          {layoutConfig.showMetrics && (
            <Card className={cn(
              'overflow-hidden',
              viewMode === 'hybrid' ? 'lg:col-span-4' : 'col-span-full'
            )}>
              <div className="h-full p-4">
                <KDSMetricsDashboard
                  compact={viewMode === 'hybrid'}
                  className="h-full"
                />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
})

KDSLayoutContent.displayName = 'KDSLayoutContent'

/**
 * Main KDS Layout Export
 * 
 * Wraps the layout content with the state provider, voice provider, and error boundary.
 * This ensures proper provider order and includes voice functionality for the KDSHeader.
 */
export const KDSLayout = memo<KDSLayoutProps>((props) => {
  return (
    <KDSErrorBoundary>
      <KDSStateProvider stationId={props.stationId}>
        <VoiceProvider>
          <KDSLayoutContent {...props} />
        </VoiceProvider>
      </KDSStateProvider>
    </KDSErrorBoundary>
  )
})

KDSLayout.displayName = 'KDSLayout'

export default KDSLayout