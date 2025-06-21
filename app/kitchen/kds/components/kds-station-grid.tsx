'use client'

import React, { memo, useEffect, useMemo, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Users,
  Zap
} from 'lucide-react'
import { useKDSContext } from '../providers/kds-state-provider'
import { useKDSOperations } from '../hooks/use-kds-operations'
// import { type KDSOrderRouting } from '@/lib/modassembly/supabase/database/kds/types'

interface StationGridProps {
  className?: string
  selectedStationId?: string
  onStationSelect?: (_stationId: string) => void
  layoutMode?: 'grid' | 'list' | 'compact'
}

interface StationMetrics {
  id: string
  name: string
  color: string
  totalOrders: number
  activeOrders: number
  completedOrders: number
  averageTime: number
  overdueOrders: number
  efficiency: number
}

/**
 * KDS Station Grid Component
 * 
 * Displays a grid of kitchen stations with real-time metrics and performance indicators.
 * Features:
 * - Visual station layout with color coding
 * - Real-time order counts and timing
 * - Performance metrics (efficiency, average time)
 * - Interactive station selection
 * - Responsive grid layout
 * - Station-specific quick actions
 */
export const KDSStationGrid = memo<StationGridProps>(({
  className,
  selectedStationId,
  onStationSelect,
  layoutMode = 'grid'
}) => {
  const { orders, loading } = useKDSContext()
  const { completeAllForStation, playOrderSound } = useKDSOperations()
  const gridRef = useRef<HTMLDivElement>(null)

  // Calculate station metrics
  const stationMetrics = useMemo(() => {
    if (!orders || orders.length === 0) {return []}

    // Define station configurations
    const stationConfigs = [
      { id: 'grill', name: 'Grill Station', color: '#ef4444' },
      { id: 'fryer', name: 'Fryer Station', color: '#f97316' },
      { id: 'salad', name: 'Cold Station', color: '#22c55e' },
      { id: 'expo', name: 'Expo Station', color: '#3b82f6' },
      { id: 'bar', name: 'Bar Station', color: '#8b5cf6' },
    ]

    return stationConfigs.map(config => {
      const stationOrders = orders.filter(order => 
        order.station?.id === config.id || 
        order.station?.name?.toLowerCase().includes(config.id)
      )

      const activeOrders = stationOrders.filter(order => 
        !order.completed_at && !order.bumped_at
      )
      
      const completedOrders = stationOrders.filter(order => 
        order.completed_at || order.bumped_at
      )

      const overdueOrders = stationOrders.filter(order => {
        if (order.completed_at) {return false}
        const startTime = order.started_at ? 
          new Date(order.started_at).getTime() : 
          new Date(order.routed_at).getTime()
        return (Date.now() - startTime) / 1000 > 600 // Over 10 minutes
      })

      // Calculate average preparation time
      const completedWithTimes = completedOrders.filter(order => 
        order.started_at && order.completed_at
      )
      
      const avgTime = completedWithTimes.length > 0 ?
        completedWithTimes.reduce((sum, order) => {
          const start = new Date(order.started_at!).getTime()
          const end = new Date(order.completed_at!).getTime()
          return sum + (end - start) / 1000 / 60 // Convert to minutes
        }, 0) / completedWithTimes.length : 0

      // Calculate efficiency (completed vs total ratio)
      const efficiency = stationOrders.length > 0 ? 
        (completedOrders.length / stationOrders.length) * 100 : 100

      return {
        ...config,
        totalOrders: stationOrders.length,
        activeOrders: activeOrders.length,
        completedOrders: completedOrders.length,
        averageTime: Math.round(avgTime * 10) / 10,
        overdueOrders: overdueOrders.length,
        efficiency: Math.round(efficiency * 10) / 10
      } as StationMetrics
    })
  }, [orders])

  // Handle station selection
  const handleStationClick = (stationId: string) => {
    onStationSelect?.(stationId)
    playOrderSound('new')
  }

  // Handle complete all orders for station
  const handleCompleteAll = async (stationId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    await completeAllForStation(stationId)
  }

  // Get grid layout classes
  const getGridClasses = () => {
    switch (layoutMode) {
      case 'list':
        return 'grid-cols-1'
      case 'compact':
        return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
      case 'grid':
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
    }
  }

  // Get station status
  const getStationStatus = (station: StationMetrics) => {
    if (station.overdueOrders > 0) {return 'critical'}
    if (station.activeOrders > 5) {return 'busy'}
    if (station.activeOrders > 0) {return 'active'}
    return 'idle'
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-500'
      case 'busy':
        return 'bg-orange-500'
      case 'active':
        return 'bg-blue-500'
      case 'idle':
        return 'bg-gray-400'
      default:
        return 'bg-gray-400'
    }
  }

  // Intersection observer for performance monitoring
  useEffect(() => {
    if (!gridRef.current) {return}

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const stationCard = entry.target as HTMLElement
          if (entry.isIntersecting) {
            stationCard.classList.add('animate-fade-in')
          }
        })
      },
      { threshold: 0.1 }
    )

    const stationCards = gridRef.current.querySelectorAll('.station-card')
    stationCards.forEach(card => observer.observe(card))

    return () => observer.disconnect()
  }, [stationMetrics])

  if (loading) {
    return (
      <div className={cn('grid gap-4', getGridClasses(), className)}>
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                <div className="h-3 bg-gray-300 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div 
      ref={gridRef}
      className={cn('grid gap-4', getGridClasses(), className)}
    >
      {stationMetrics.map((station) => {
        const status = getStationStatus(station)
        const isSelected = selectedStationId === station.id
        
        return (
          <Card
            key={station.id}
            className={cn(
              'station-card cursor-pointer transition-all duration-200 hover:shadow-lg',
              'border-2 hover:border-opacity-80',
              isSelected && 'ring-2 ring-blue-500 ring-opacity-50',
              status === 'critical' && 'border-red-500 bg-red-50 dark:bg-red-950',
              status === 'busy' && 'border-orange-500 bg-orange-50 dark:bg-orange-950',
              status === 'active' && 'border-blue-500 bg-blue-50 dark:bg-blue-950',
              status === 'idle' && 'border-gray-300 bg-gray-50 dark:bg-gray-900'
            )}
            onClick={() => handleStationClick(station.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: station.color }}
                  />
                  {station.name}
                </CardTitle>
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  getStatusColor(status)
                )} />
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Order counts */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-semibold text-blue-600">
                    {station.activeOrders}
                  </div>
                  <div className="text-gray-500">Active</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-green-600">
                    {station.completedOrders}
                  </div>
                  <div className="text-gray-500">Done</div>
                </div>
                <div className="text-center">
                  <div className={cn(
                    'font-semibold',
                    station.overdueOrders > 0 ? 'text-red-600' : 'text-gray-400'
                  )}>
                    {station.overdueOrders}
                  </div>
                  <div className="text-gray-500">Late</div>
                </div>
              </div>

              {/* Performance metrics */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Avg Time
                  </span>
                  <span className="font-medium">
                    {station.averageTime}min
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Efficiency
                  </span>
                  <span className="font-medium">
                    {station.efficiency}%
                  </span>
                </div>
              </div>

              {/* Quick actions */}
              {station.activeOrders > 0 && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={(e) => handleCompleteAll(station.id, e)}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Complete All
                  </Button>
                </div>
              )}

              {/* Status badges */}
              <div className="flex gap-1 flex-wrap">
                {status === 'critical' && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Critical
                  </Badge>
                )}
                {status === 'busy' && (
                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                    <Users className="w-3 h-3 mr-1" />
                    Busy
                  </Badge>
                )}
                {station.efficiency > 90 && (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                    <Zap className="w-3 h-3 mr-1" />
                    Efficient
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
})

KDSStationGrid.displayName = 'KDSStationGrid'