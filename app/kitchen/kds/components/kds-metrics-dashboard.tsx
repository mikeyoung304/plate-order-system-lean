'use client'

import React, { memo, useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  AlertTriangle,
  BarChart3, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react'
import { useKDSContext } from '../providers/kds-state-provider'

interface MetricsDashboardProps {
  className?: string
  compact?: boolean
  refreshInterval?: number
}

interface KitchenMetrics {
  // Order metrics
  totalOrders: number
  activeOrders: number
  completedOrders: number
  overdueOrders: number
  
  // Timing metrics
  averagePrepTime: number
  averageWaitTime: number
  longestWaitTime: number
  
  // Performance metrics
  ordersPerHour: number
  completionRate: number
  efficiency: number
  
  // Station metrics
  stationLoad: { [stationId: string]: number }
  stationPerformance: { [stationId: string]: number }
  
  // Trends
  orderTrend: 'up' | 'down' | 'stable'
  timeTrend: 'up' | 'down' | 'stable'
  
  // Alerts
  criticalAlerts: number
  warningAlerts: number
}

/**
 * Metric Card Component
 */
const MetricCard = memo<{
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<any>
  trend?: 'up' | 'down' | 'stable'
  variant?: 'default' | 'success' | 'warning' | 'destructive'
  className?: string
}>(({ title, value, subtitle, icon: Icon, trend, variant = 'default', className }) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-green-500" />
      case 'down':
        return <TrendingDown className="w-3 h-3 text-red-500" />
      default:
        return null
    }
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:bg-green-950'
      case 'warning':
        return 'border-orange-200 bg-orange-50 dark:bg-orange-950'
      case 'destructive':
        return 'border-red-200 bg-red-50 dark:bg-red-950'
      default:
        return 'border-gray-200 bg-white dark:bg-gray-800'
    }
  }

  return (
    <Card className={cn(getVariantStyles(), className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-600">{title}</span>
          </div>
          {getTrendIcon()}
        </div>
        
        <div className="mt-2">
          <div className="text-2xl font-bold">{value}</div>
          {subtitle && (
            <div className="text-sm text-gray-500 mt-1">{subtitle}</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})

MetricCard.displayName = 'MetricCard'

/**
 * Station Performance Chart Component
 */
const StationPerformanceChart = memo<{
  stations: { id: string; name: string; load: number; performance: number }[]
}>(({ stations }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Station Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stations.map((station) => (
          <div key={station.id} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{station.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {station.load}% load
                </span>
                <Badge 
                  variant={
                    station.performance >= 90 ? 'default' :
                    station.performance >= 70 ? 'secondary' : 'destructive'
                  }
                  className="text-xs"
                >
                  {station.performance}%
                </Badge>
              </div>
            </div>
            <Progress 
              value={station.performance} 
              className="h-2"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
})

StationPerformanceChart.displayName = 'StationPerformanceChart'

/**
 * KDS Metrics Dashboard Component
 * 
 * Real-time performance dashboard for kitchen operations.
 * Features:
 * - Live metrics calculation from order data
 * - Performance indicators and trends
 * - Station-specific analytics
 * - Alert system for critical issues
 * - Responsive layout for different screen sizes
 * - Auto-refresh capabilities
 */
export const KDSMetricsDashboard = memo<MetricsDashboardProps>(({
  className,
  compact = false,
  refreshInterval = 30000 // 30 seconds
}) => {
  const { orders, loading, connectionStatus } = useKDSContext()
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Calculate comprehensive kitchen metrics
  const metrics = useMemo((): KitchenMetrics => {
    if (!orders || orders.length === 0) {
      return {
        totalOrders: 0,
        activeOrders: 0,
        completedOrders: 0,
        overdueOrders: 0,
        averagePrepTime: 0,
        averageWaitTime: 0,
        longestWaitTime: 0,
        ordersPerHour: 0,
        completionRate: 0,
        efficiency: 0,
        stationLoad: {},
        stationPerformance: {},
        orderTrend: 'stable',
        timeTrend: 'stable',
        criticalAlerts: 0,
        warningAlerts: 0
      }
    }

    const now = Date.now()
    const oneHourAgo = now - (60 * 60 * 1000)
    
    // Basic order counts
    const totalOrders = orders.length
    const activeOrders = orders.filter(order => !order.completed_at && !order.bumped_at)
    const completedOrders = orders.filter(order => order.completed_at || order.bumped_at)
    
    // Overdue orders (over 10 minutes without completion)
    const overdueOrders = activeOrders.filter(order => {
      const startTime = order.started_at ? 
        new Date(order.started_at).getTime() : 
        new Date(order.routed_at).getTime()
      return (now - startTime) / 1000 > 600
    })

    // Timing calculations
    const completedWithTimes = completedOrders.filter(order => 
      order.started_at && (order.completed_at || order.bumped_at)
    )
    
    const prepTimes = completedWithTimes.map(order => {
      const start = new Date(order.started_at!).getTime()
      const end = new Date(order.completed_at || order.bumped_at!).getTime()
      return (end - start) / 1000 / 60 // Minutes
    })

    const waitTimes = orders.map(order => {
      const start = new Date(order.routed_at).getTime()
      const end = order.completed_at ? 
        new Date(order.completed_at).getTime() : now
      return (end - start) / 1000 / 60 // Minutes
    })

    const averagePrepTime = prepTimes.length > 0 ? 
      prepTimes.reduce((sum, time) => sum + time, 0) / prepTimes.length : 0
    
    const averageWaitTime = waitTimes.length > 0 ?
      waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length : 0
    
    const longestWaitTime = waitTimes.length > 0 ? Math.max(...waitTimes) : 0

    // Performance metrics
    const recentOrders = orders.filter(order => 
      new Date(order.routed_at).getTime() > oneHourAgo
    )
    const ordersPerHour = recentOrders.length

    const completionRate = totalOrders > 0 ? 
      (completedOrders.length / totalOrders) * 100 : 0

    // Efficiency calculation (orders completed vs expected based on timing)
    const expectedCompletions = activeOrders.filter(order => {
      const elapsed = (now - new Date(order.routed_at).getTime()) / 1000 / 60
      return elapsed > 8 // Should be done by now
    }).length
    
    const efficiency = expectedCompletions > 0 ? 
      Math.max(0, 100 - (overdueOrders.length / expectedCompletions * 100)) : 100

    // Station metrics
    const stations = ['grill', 'fryer', 'salad', 'expo', 'bar']
    const stationLoad: { [key: string]: number } = {}
    const stationPerformance: { [key: string]: number } = {}

    stations.forEach(stationId => {
      const stationOrders = orders.filter(order => 
        order.station?.id === stationId || 
        order.station?.name?.toLowerCase().includes(stationId)
      )
      const stationActive = stationOrders.filter(order => !order.completed_at)
      const stationCompleted = stationOrders.filter(order => order.completed_at)
      
      stationLoad[stationId] = stationActive.length
      stationPerformance[stationId] = stationOrders.length > 0 ? 
        (stationCompleted.length / stationOrders.length) * 100 : 100
    })

    // Trend calculation (simplified)
    const recentCompletionRate = recentOrders.length > 0 ? 
      (recentOrders.filter(o => o.completed_at).length / recentOrders.length) * 100 : 0
    
    const orderTrend = recentCompletionRate > completionRate ? 'up' : 
                      recentCompletionRate < completionRate ? 'down' : 'stable'
    
    const recentAvgTime = recentOrders.length > 0 ? 
      recentOrders.reduce((sum, order) => {
        const elapsed = (now - new Date(order.routed_at).getTime()) / 1000 / 60
        return sum + elapsed
      }, 0) / recentOrders.length : 0
    
    const timeTrend = recentAvgTime > averageWaitTime ? 'up' : 
                     recentAvgTime < averageWaitTime ? 'down' : 'stable'

    // Alerts
    const criticalAlerts = overdueOrders.length + 
      (efficiency < 50 ? 1 : 0) + 
      (longestWaitTime > 20 ? 1 : 0)
    
    const warningAlerts = (averagePrepTime > 12 ? 1 : 0) + 
      (activeOrders.length > 15 ? 1 : 0) + 
      Object.values(stationLoad).filter(load => load > 8).length

    return {
      totalOrders,
      activeOrders: activeOrders.length,
      completedOrders: completedOrders.length,
      overdueOrders: overdueOrders.length,
      averagePrepTime: Math.round(averagePrepTime * 10) / 10,
      averageWaitTime: Math.round(averageWaitTime * 10) / 10,
      longestWaitTime: Math.round(longestWaitTime * 10) / 10,
      ordersPerHour,
      completionRate: Math.round(completionRate * 10) / 10,
      efficiency: Math.round(efficiency * 10) / 10,
      stationLoad,
      stationPerformance,
      orderTrend,
      timeTrend,
      criticalAlerts,
      warningAlerts
    }
  }, [orders])

  // Station data for charts
  const stationData = useMemo(() => {
    return [
      { id: 'grill', name: 'Grill Station', load: metrics.stationLoad.grill || 0, performance: metrics.stationPerformance.grill || 100 },
      { id: 'fryer', name: 'Fryer Station', load: metrics.stationLoad.fryer || 0, performance: metrics.stationPerformance.fryer || 100 },
      { id: 'salad', name: 'Cold Station', load: metrics.stationLoad.salad || 0, performance: metrics.stationPerformance.salad || 100 },
      { id: 'expo', name: 'Expo Station', load: metrics.stationLoad.expo || 0, performance: metrics.stationPerformance.expo || 100 },
      { id: 'bar', name: 'Bar Station', load: metrics.stationLoad.bar || 0, performance: metrics.stationPerformance.bar || 100 }
    ]
  }, [metrics])

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date())
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval])

  if (loading) {
    return (
      <div className={cn('grid gap-4', compact ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4', className)}>
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-300 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const gridCols = compact ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'

  return (
    <div className={cn('space-y-4', className)}>
      {/* Status header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Kitchen Metrics</h3>
          <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
            {connectionStatus}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <RefreshCw className="w-4 h-4" />
          <span>Updated {lastUpdate.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Alert badges */}
      {(metrics.criticalAlerts > 0 || metrics.warningAlerts > 0) && (
        <div className="flex gap-2">
          {metrics.criticalAlerts > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {metrics.criticalAlerts} Critical
            </Badge>
          )}
          {metrics.warningAlerts > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1 bg-orange-100 text-orange-800">
              <AlertTriangle className="w-3 h-3" />
              {metrics.warningAlerts} Warnings
            </Badge>
          )}
        </div>
      )}

      {/* Main metrics grid */}
      <div className={cn('grid gap-4', gridCols)}>
        <MetricCard
          title="Active Orders"
          value={metrics.activeOrders}
          subtitle={`${metrics.totalOrders} total today`}
          icon={Users}
          variant={metrics.activeOrders > 15 ? 'warning' : 'default'}
        />
        
        <MetricCard
          title="Completed Orders"
          value={metrics.completedOrders}
          subtitle={`${metrics.completionRate}% completion rate`}
          icon={CheckCircle}
          trend={metrics.orderTrend}
          variant="success"
        />
        
        <MetricCard
          title="Average Prep Time"
          value={`${metrics.averagePrepTime}min`}
          subtitle="Target: <8min"
          icon={Timer}
          trend={metrics.timeTrend}
          variant={metrics.averagePrepTime > 12 ? 'warning' : 'default'}
        />
        
        <MetricCard
          title="Overdue Orders"
          value={metrics.overdueOrders}
          subtitle={`Longest: ${metrics.longestWaitTime}min`}
          icon={AlertTriangle}
          variant={metrics.overdueOrders > 0 ? 'destructive' : 'success'}
        />

        {!compact && (
          <>
            <MetricCard
              title="Orders/Hour"
              value={metrics.ordersPerHour}
              subtitle="Last 60 minutes"
              icon={TrendingUp}
              variant="default"
            />

            <MetricCard
              title="Kitchen Efficiency"
              value={`${metrics.efficiency}%`}
              subtitle="Target: >85%"
              icon={Zap}
              variant={metrics.efficiency < 70 ? 'warning' : 'success'}
            />

            <MetricCard
              title="Average Wait"
              value={`${metrics.averageWaitTime}min`}
              subtitle="From order to ready"
              icon={Clock}
              trend={metrics.timeTrend}
            />

            <MetricCard
              title="Performance"
              value={`${Math.round((metrics.efficiency + metrics.completionRate) / 2)}%`}
              subtitle="Overall score"
              icon={Target}
              variant="default"
            />
          </>
        )}
      </div>

      {/* Station performance chart */}
      {!compact && (
        <StationPerformanceChart stations={stationData} />
      )}
    </div>
  )
})

KDSMetricsDashboard.displayName = 'KDSMetricsDashboard'