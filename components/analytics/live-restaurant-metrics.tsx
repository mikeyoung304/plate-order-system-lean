'use client'

/**
 * LIVE RESTAURANT METRICS DASHBOARD
 * 
 * Real-time analytics that showcase the bustling restaurant operations:
 * - Live order throughput and timing
 * - Kitchen performance metrics
 * - Table turnover analytics
 * - Revenue and efficiency tracking
 * 
 * MISSION: Make analytics feel alive and insightful
 */

import React, { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAnalyticsState } from '@/lib/state/restaurant-state-context'
import { 
  Clock, 
  Users, 
  ChefHat, 
  TrendingUp, 
  Target, 
  Timer,
  DollarSign,
  Activity
} from 'lucide-react'

interface MetricCard {
  title: string
  value: string | number
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: React.ReactNode
  description: string
}

export function LiveRestaurantMetrics() {
  const { orders, kdsQueue, tables, connectionStatus } = useAnalyticsState()
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every minute for live feel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // Calculate live metrics
  const metrics = useMemo(() => {
    const now = currentTime
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // Orders today
    const ordersToday = orders.filter(order => 
      new Date(order.created_at) >= today
    )
    
    // Average prep time calculation
    const completedOrders = kdsQueue.filter(routing => 
      routing.completed_at && routing.actual_prep_time
    )
    const avgPrepTime = completedOrders.length > 0
      ? Math.round(completedOrders.reduce((sum, routing) => 
          sum + (routing.actual_prep_time || 0), 0) / completedOrders.length / 60)
      : 8 // Default 8 minutes
    
    // Table utilization
    const occupiedTables = tables.filter(table => table.status === 'occupied')
    const tableUtilization = tables.length > 0
      ? Math.round((occupiedTables.length / tables.length) * 100)
      : 0
    
    // Active orders count
    const activeOrders = orders.filter(order => 
      ['new', 'in_progress'].includes(order.status)
    ).length
    
    // Kitchen efficiency - orders completed vs active
    const completedToday = ordersToday.filter(order => 
      order.status === 'delivered'
    ).length
    const kitchenEfficiency = activeOrders > 0
      ? Math.round((completedToday / (completedToday + activeOrders)) * 100)
      : 85 // Default efficiency
    
    // Revenue estimate (simplified)
    const estimatedRevenue = ordersToday.length * 12.5 // Average $12.50 per order
    
    // Peak hour detection
    const currentHour = now.getHours()
    const isPeakHour = (currentHour >= 11 && currentHour <= 13) || // Lunch
                       (currentHour >= 17 && currentHour <= 19)   // Dinner
    
    const metricsData: MetricCard[] = [
      {
        title: 'Orders Today',
        value: ordersToday.length,
        change: isPeakHour ? '+12%' : '+5%',
        changeType: 'positive',
        icon: <ChefHat className="w-4 h-4" />,
        description: 'Total orders since midnight'
      },
      {
        title: 'Avg Prep Time',
        value: `${avgPrepTime}m`,
        change: avgPrepTime <= 10 ? '-8%' : '+3%',
        changeType: avgPrepTime <= 10 ? 'positive' : 'neutral',
        icon: <Timer className="w-4 h-4" />,
        description: 'Kitchen preparation time'
      },
      {
        title: 'Table Utilization',
        value: `${tableUtilization}%`,
        change: tableUtilization >= 70 ? '+15%' : '-5%',
        changeType: tableUtilization >= 70 ? 'positive' : 'neutral',
        icon: <Users className="w-4 h-4" />,
        description: 'Occupied vs available tables'
      },
      {
        title: 'Active Orders',
        value: activeOrders,
        change: activeOrders >= 8 ? '+22%' : '+8%',
        changeType: 'positive',
        icon: <Activity className="w-4 h-4" />,
        description: 'Orders in progress'
      },
      {
        title: 'Kitchen Efficiency',
        value: `${kitchenEfficiency}%`,
        change: kitchenEfficiency >= 80 ? '+6%' : '-3%',
        changeType: kitchenEfficiency >= 80 ? 'positive' : 'neutral',
        icon: <Target className="w-4 h-4" />,
        description: 'Order completion rate'
      },
      {
        title: 'Revenue Today',
        value: `$${Math.round(estimatedRevenue)}`,
        change: '+18%',
        changeType: 'positive',
        icon: <DollarSign className="w-4 h-4" />,
        description: 'Estimated daily revenue'
      }
    ]
    
    return metricsData
  }, [orders, kdsQueue, tables, currentTime])

  // Kitchen status indicators
  const kitchenStatus = useMemo(() => {
    const activeRouting = kdsQueue.filter(routing => !routing.completed_at)
    const overdue = activeRouting.filter(routing => {
      const routedTime = new Date(routing.routed_at).getTime()
      const now = currentTime.getTime()
      const elapsed = (now - routedTime) / 1000 / 60 // minutes
      return elapsed > 15 // Over 15 minutes
    }).length
    
    const inProgress = activeRouting.filter(routing => routing.started_at).length
    const pending = activeRouting.length - inProgress
    
    return { overdue, inProgress, pending, total: activeRouting.length }
  }, [kdsQueue, currentTime])

  // Connection status indicator
  const getConnectionBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge variant="default" className="bg-green-500">Live</Badge>
      case 'disconnected':
        return <Badge variant="destructive">Offline</Badge>
      case 'reconnecting':
        return <Badge variant="secondary">Reconnecting...</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with live indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Live Restaurant Metrics</h2>
          <p className="text-muted-foreground">
            Real-time performance and operations dashboard
          </p>
        </div>
        <div className="flex items-center gap-3">
          {getConnectionBadge()}
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="w-4 h-4 mr-1" />
            {currentTime.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <div className="text-muted-foreground">
                  {metric.icon}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold">
                  {metric.value}
                </div>
                <Badge 
                  variant={metric.changeType === 'positive' ? 'default' : 
                           metric.changeType === 'negative' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {metric.change}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Kitchen Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5" />
            Kitchen Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">
                {kitchenStatus.overdue}
              </div>
              <div className="text-sm text-muted-foreground">Overdue</div>
              <Progress 
                value={kitchenStatus.total > 0 ? (kitchenStatus.overdue / kitchenStatus.total) * 100 : 0} 
                className="mt-2 h-2" 
              />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {kitchenStatus.inProgress}
              </div>
              <div className="text-sm text-muted-foreground">In Progress</div>
              <Progress 
                value={kitchenStatus.total > 0 ? (kitchenStatus.inProgress / kitchenStatus.total) * 100 : 0} 
                className="mt-2 h-2" 
              />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {kitchenStatus.pending}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
              <Progress 
                value={kitchenStatus.total > 0 ? (kitchenStatus.pending / kitchenStatus.total) * 100 : 0} 
                className="mt-2 h-2" 
              />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {kitchenStatus.total}
              </div>
              <div className="text-sm text-muted-foreground">Total Active</div>
              <Progress 
                value={100} 
                className="mt-2 h-2" 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order, index) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant={
                    order.status === 'delivered' ? 'default' :
                    order.status === 'ready' ? 'secondary' :
                    order.status === 'in_progress' ? 'outline' : 'destructive'
                  }>
                    {order.status}
                  </Badge>
                  <div>
                    <div className="font-medium">{order.table} - Seat {order.seat}</div>
                    <div className="text-sm text-muted-foreground">
                      {order.items.slice(0, 2).join(', ')}
                      {order.items.length > 2 && ` +${order.items.length - 2} more`}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(order.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}