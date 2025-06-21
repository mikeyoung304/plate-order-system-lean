'use client'

import { memo, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Package,
  Play,
  UserPlus,
  Users,
} from 'lucide-react'
import { motion } from 'framer-motion'
import type { TableGroup } from '@/hooks/use-table-grouped-orders'
import type { KDSOrderRouting } from '@/lib/modassembly/supabase/database/kds'

interface TableGroupTimelineProps {
  group: TableGroup
  className?: string
}

interface TimelineEvent {
  id: string
  time: Date
  type: 'order_placed' | 'prep_started' | 'order_completed' | 'late_arrival'
  order: KDSOrderRouting
  seatLabel: string
  itemCount: number
}

const TimelineItem = memo(({ event, index }: { event: TimelineEvent; index: number }) => {
  const getEventIcon = () => {
    switch (event.type) {
      case 'order_placed':
        return <Package className="h-4 w-4" />
      case 'prep_started':
        return <Play className="h-4 w-4" />
      case 'order_completed':
        return <CheckCircle className="h-4 w-4" />
      case 'late_arrival':
        return <UserPlus className="h-4 w-4" />
    }
  }

  const getEventColor = () => {
    switch (event.type) {
      case 'order_placed':
        return 'bg-blue-500'
      case 'prep_started':
        return 'bg-yellow-500'
      case 'order_completed':
        return 'bg-green-500'
      case 'late_arrival':
        return 'bg-purple-500'
    }
  }

  const getEventText = () => {
    switch (event.type) {
      case 'order_placed':
        return 'Order placed'
      case 'prep_started':
        return 'Prep started'
      case 'order_completed':
        return 'Order completed'
      case 'late_arrival':
        return 'Late arrival order'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex gap-4 relative"
    >
      {/* Timeline line */}
      <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600" />
      
      {/* Timeline dot */}
      <div
        className={cn(
          "relative z-10 h-8 w-8 rounded-full flex items-center justify-center text-white",
          getEventColor()
        )}
      >
        {getEventIcon()}
      </div>

      {/* Event content */}
      <div className="flex-1 pb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">{getEventText()}</span>
          <span className="text-xs text-gray-500">
            {event.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <Badge variant="outline" className="text-xs">
            Seat {event.seatLabel}
          </Badge>
          <span>{event.itemCount} items</span>
        </div>
      </div>
    </motion.div>
  )
})
TimelineItem.displayName = 'TimelineItem'

export const TableGroupTimeline = memo(function TableGroupTimeline({
  group,
  className,
}: TableGroupTimelineProps) {
  // Generate timeline events from orders
  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = []
    const seenSeats = new Set<string>()

    // Sort orders by time to build timeline
    const sortedOrders = [...group.orders].sort(
      (a, b) => new Date(a.routed_at).getTime() - new Date(b.routed_at).getTime()
    )

    for (const order of sortedOrders) {
      const seatId = order.order?.seat_id || 'unknown'
      const seatLabel = order.order?.seat?.label || seatId.slice(-4)
      const isLateArrival = seenSeats.has(seatId)
      
      // Order placed event
      events.push({
        id: `${order.id}-placed`,
        time: new Date(order.routed_at),
        type: isLateArrival ? 'late_arrival' : 'order_placed',
        order,
        seatLabel,
        itemCount: order.order?.items?.length || 0,
      })

      // Prep started event
      if (order.started_at) {
        events.push({
          id: `${order.id}-started`,
          time: new Date(order.started_at),
          type: 'prep_started',
          order,
          seatLabel,
          itemCount: order.order?.items?.length || 0,
        })
      }

      // Order completed event
      if (order.completed_at) {
        events.push({
          id: `${order.id}-completed`,
          time: new Date(order.completed_at),
          type: 'order_completed',
          order,
          seatLabel,
          itemCount: order.order?.items?.length || 0,
        })
      }

      seenSeats.add(seatId)
    }

    // Sort events by time
    events.sort((a, b) => a.time.getTime() - b.time.getTime())

    return events
  }, [group.orders])

  // Calculate timeline metrics
  const metrics = useMemo(() => {
    const now = Date.now()
    const start = group.earliestOrderTime.getTime()
    const totalDuration = now - start
    const timeSpread = group.latestOrderTime.getTime() - start

    return {
      totalDuration: Math.floor(totalDuration / 60000), // minutes
      timeSpread: Math.floor(timeSpread / 60000), // minutes
      avgPrepTime: group.orders
        .filter(o => o.started_at && o.completed_at)
        .reduce((acc, o) => {
          const prepTime = new Date(o.completed_at!).getTime() - new Date(o.started_at!).getTime()
          return acc + prepTime
        }, 0) / (group.orders.filter(o => o.started_at && o.completed_at).length || 1) / 60000, // minutes
    }
  }, [group])

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Order Timeline
          </div>
          <div className="flex items-center gap-4 text-sm font-normal">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{group.seatCount} seats</span>
            </div>
            <Badge variant="secondary">
              {metrics.totalDuration} min total
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          {/* Timeline metrics */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded bg-gray-100 dark:bg-gray-800">
              <div className="text-2xl font-bold">{metrics.timeSpread}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">min spread</div>
            </div>
            <div className="p-2 rounded bg-gray-100 dark:bg-gray-800">
              <div className="text-2xl font-bold">
                {metrics.avgPrepTime.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">avg prep</div>
            </div>
            <div className="p-2 rounded bg-gray-100 dark:bg-gray-800">
              <div className="text-2xl font-bold">{timelineEvents.length}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">events</div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {timelineEvents.map((event, index) => (
              <TimelineItem key={event.id} event={event} index={index} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
})