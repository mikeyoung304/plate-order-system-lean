'use client'

import { memo, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  Package,
  Play,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { motion } from 'framer-motion'
import type { TableGroup } from '@/hooks/use-table-grouped-orders'

interface TableGroupAnalyticsProps {
  group: TableGroup
  className?: string
}

interface AnalyticsMetrics {
  efficiency: number
  avgPrepTime: number
  timeToFirstOrder: number
  completionRate: number
  priorityScore: number
  recallRate: number
  seatUtilization: number
}

const MetricCard = memo(({ 
  title, 
  value, 
  unit, 
  icon: Icon, 
  trend, 
  color = 'blue',
  progress,
  index
}: {
  title: string
  value: string | number
  unit?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: 'up' | 'down' | 'stable'
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
  progress?: number
  index: number
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800',
    red: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
    purple: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800',
  }

  const iconColors = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    red: 'text-red-600 dark:text-red-400',
    purple: 'text-purple-600 dark:text-purple-400',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className={cn("p-4 border", colorClasses[color])}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className={cn("h-4 w-4", iconColors[color])} />
            <span className="text-sm font-medium">{title}</span>
          </div>
          {trend && (
            <div className="flex items-center">
              {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
            </div>
          )}
        </div>
        <div className="flex items-end gap-1">
          <span className="text-2xl font-bold">{value}</span>
          {unit && <span className="text-sm text-gray-600 dark:text-gray-400 mb-1">{unit}</span>}
        </div>
        {progress !== undefined && (
          <Progress 
            value={progress} 
            className="mt-2 h-2" 
          />
        )}
      </Card>
    </motion.div>
  )
})
MetricCard.displayName = 'MetricCard'

export const TableGroupAnalytics = memo(function TableGroupAnalytics({
  group,
  className,
}: TableGroupAnalyticsProps) {
  // Calculate analytics metrics
  const metrics = useMemo((): AnalyticsMetrics => {
    const now = Date.now()
    const orders = group.orders

    // Preparation times
    const completedOrders = orders.filter(o => o.completed_at && o.started_at)
    const prepTimes = completedOrders.map(o => {
      const start = new Date(o.started_at!).getTime()
      const end = new Date(o.completed_at!).getTime()
      return (end - start) / 60000 // minutes
    })

    const avgPrepTime = prepTimes.length > 0 
      ? prepTimes.reduce((sum, time) => sum + time, 0) / prepTimes.length 
      : 0

    // Time to first order completion
    const firstCompletedOrder = orders
      .filter(o => o.completed_at)
      .sort((a, b) => new Date(a.completed_at!).getTime() - new Date(b.completed_at!).getTime())[0]
    
    const timeToFirstOrder = firstCompletedOrder
      ? (new Date(firstCompletedOrder.completed_at!).getTime() - group.earliestOrderTime.getTime()) / 60000
      : 0

    // Completion rate
    const completionRate = (orders.filter(o => o.completed_at).length / orders.length) * 100

    // Efficiency score (based on prep time vs expected time)
    const expectedPrepTime = 12 // minutes - could be configurable
    const efficiency = avgPrepTime > 0 
      ? Math.max(0, Math.min(100, (expectedPrepTime / avgPrepTime) * 100))
      : 0

    // Priority score
    const priorityScore = group.maxPriority

    // Recall rate
    const recallRate = (group.totalRecallCount / orders.length) * 100

    // Seat utilization
    const maxPossibleSeats = 8 // Could be table-specific
    const seatUtilization = (group.seatCount / maxPossibleSeats) * 100

    return {
      efficiency,
      avgPrepTime,
      timeToFirstOrder,
      completionRate,
      priorityScore,
      recallRate,
      seatUtilization,
    }
  }, [group])

  // Performance insights
  const insights = useMemo(() => {
    const results = []

    if (metrics.efficiency < 50) {
      results.push({
        type: 'warning' as const,
        message: 'Preparation time is slower than expected',
        icon: Clock,
      })
    }

    if (metrics.recallRate > 10) {
      results.push({
        type: 'error' as const,
        message: 'High recall rate indicates quality issues',
        icon: AlertTriangle,
      })
    }

    if (metrics.completionRate > 80) {
      results.push({
        type: 'success' as const,
        message: 'Excellent completion rate',
        icon: CheckCircle,
      })
    }

    if (group.orders.length > 1 && metrics.timeToFirstOrder < 10) {
      results.push({
        type: 'success' as const,
        message: 'Fast first order completion',
        icon: Zap,
      })
    }

    return results
  }, [metrics, group.orders.length])

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Analytics
          </div>
          <Badge variant={metrics.efficiency > 70 ? 'default' : metrics.efficiency > 50 ? 'secondary' : 'destructive'}>
            {metrics.efficiency.toFixed(0)}% efficiency
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Avg Prep Time"
            value={metrics.avgPrepTime.toFixed(1)}
            unit="min"
            icon={Clock}
            color={metrics.avgPrepTime < 10 ? 'green' : metrics.avgPrepTime < 15 ? 'yellow' : 'red'}
            trend={metrics.avgPrepTime < 12 ? 'up' : 'down'}
            index={0}
          />
          
          <MetricCard
            title="Completion"
            value={metrics.completionRate.toFixed(0)}
            unit="%"
            icon={CheckCircle}
            color={metrics.completionRate > 80 ? 'green' : metrics.completionRate > 50 ? 'yellow' : 'red'}
            progress={metrics.completionRate}
            index={1}
          />
          
          <MetricCard
            title="First Order"
            value={metrics.timeToFirstOrder.toFixed(1)}
            unit="min"
            icon={Zap}
            color={metrics.timeToFirstOrder < 10 ? 'green' : metrics.timeToFirstOrder < 20 ? 'yellow' : 'red'}
            trend={metrics.timeToFirstOrder < 15 ? 'up' : 'down'}
            index={2}
          />
          
          <MetricCard
            title="Seat Usage"
            value={metrics.seatUtilization.toFixed(0)}
            unit="%"
            icon={Users}
            color="blue"
            progress={metrics.seatUtilization}
            index={3}
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <MetricCard
            title="Priority Level"
            value={metrics.priorityScore || 'None'}
            icon={Target}
            color={metrics.priorityScore > 7 ? 'red' : metrics.priorityScore > 4 ? 'yellow' : 'green'}
            index={4}
          />
          
          <MetricCard
            title="Recall Rate"
            value={metrics.recallRate.toFixed(1)}
            unit="%"
            icon={AlertTriangle}
            color={metrics.recallRate < 5 ? 'green' : metrics.recallRate < 15 ? 'yellow' : 'red'}
            index={5}
          />
          
          <MetricCard
            title="Total Items"
            value={group.totalItems}
            icon={Package}
            color="purple"
            index={6}
          />
        </div>

        {/* Performance Insights */}
        {insights.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Performance Insights</h3>
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg text-sm",
                    insight.type === 'success' && "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300",
                    insight.type === 'warning' && "bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300",
                    insight.type === 'error' && "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"
                  )}
                >
                  <insight.icon className="h-4 w-4 flex-shrink-0" />
                  <span>{insight.message}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Time Distribution Chart Placeholder */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Order Timeline</h3>
          <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center relative overflow-hidden">
            {/* Timeline visualization */}
            <div className="absolute inset-0 flex items-center">
              {group.orders.map((order, index) => {
                const startTime = new Date(order.routed_at).getTime()
                const endTime = order.completed_at ? new Date(order.completed_at).getTime() : Date.now()
                const totalDuration = Date.now() - group.earliestOrderTime.getTime()
                const orderDuration = endTime - startTime
                
                const left = ((startTime - group.earliestOrderTime.getTime()) / totalDuration) * 100
                const width = (orderDuration / totalDuration) * 100
                
                return (
                  <motion.div
                    key={order.id}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 1 + index * 0.1 }}
                    className={cn(
                      "absolute h-4 rounded",
                      order.completed_at 
                        ? "bg-green-500" 
                        : order.started_at 
                          ? "bg-yellow-500" 
                          : "bg-blue-500"
                    )}
                    style={{
                      left: `${left}%`,
                      width: `${Math.max(width, 2)}%`,
                      top: `${20 + (index % 3) * 20}px`,
                    }}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})