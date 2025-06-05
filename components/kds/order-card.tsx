'use client'

import { memo, useCallback, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  Clock,
  MapPin,
  MessageSquare,
  Play,
  RotateCcw,
  User,
} from 'lucide-react'
import { useOrderTiming } from '@/hooks/use-kds-orders'
import type { KDSOrderRouting } from '@/lib/modassembly/supabase/database/kds'

interface OrderCardProps {
  order: KDSOrderRouting
  onBump: (routingId: string) => Promise<void>
  onRecall?: (routingId: string) => Promise<void>
  onStartPrep?: (routingId: string) => Promise<void>
  onUpdatePriority?: (routingId: string, priority: number) => Promise<void>
  onAddNotes?: (routingId: string, notes: string) => Promise<void>
  isCompact?: boolean
  showActions?: boolean
  className?: string
}

// AI: Memoized for performance optimization in KDS lists
export const OrderCard = memo(
  function OrderCard({
    order,
    onBump,
    onRecall,
    onStartPrep,
    onUpdatePriority,
    onAddNotes,
    isCompact = false,
    showActions = true,
    className,
  }: OrderCardProps) {
    const { timeElapsed, colorStatus, formattedTime, isOverdue } =
      useOrderTiming(order)
    const [isLoading, setIsLoading] = useState(false)
    const [showNotes, setShowNotes] = useState(false)
    const [notes, setNotes] = useState(order.notes || '')

    // Handle bump action
    const handleBump = useCallback(async () => {
      setIsLoading(true)
      try {
        await onBump(order.id)
      } catch (error) {
        console.error('Error bumping order:', error)
      } finally {
        setIsLoading(false)
      }
    }, [order.id, onBump])

    // Handle recall action
    const handleRecall = useCallback(async () => {
      if (!onRecall) {
        return
      }
      setIsLoading(true)
      try {
        await onRecall(order.id)
      } catch (error) {
        console.error('Error recalling order:', error)
      } finally {
        setIsLoading(false)
      }
    }, [order.id, onRecall])

    // Handle start prep action
    const handleStartPrep = useCallback(async () => {
      if (!onStartPrep) {
        return
      }
      setIsLoading(true)
      try {
        await onStartPrep(order.id)
      } catch (error) {
        console.error('Error starting prep:', error)
      } finally {
        setIsLoading(false)
      }
    }, [order.id, onStartPrep])

    // Handle priority changes
    const handlePriorityChange = useCallback(
      async (delta: number) => {
        if (!onUpdatePriority) {
          return
        }
        const newPriority = Math.max(0, Math.min(10, order.priority + delta))
        try {
          await onUpdatePriority(order.id, newPriority)
        } catch (error) {
          console.error('Error updating priority:', error)
        }
      },
      [order.id, order.priority, onUpdatePriority]
    )

    // Handle notes save
    const handleSaveNotes = useCallback(async () => {
      if (!onAddNotes) {
        return
      }
      try {
        await onAddNotes(order.id, notes)
        setShowNotes(false)
      } catch (error) {
        console.error('Error saving notes:', error)
      }
    }, [order.id, notes, onAddNotes])

    // Get color classes based on timing
    const getTimingColors = () => {
      switch (colorStatus) {
        case 'green':
          return {
            border: 'border-green-500',
            bg: 'bg-green-50 dark:bg-green-950',
            text: 'text-green-700 dark:text-green-300',
            badge:
              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          }
        case 'yellow':
          return {
            border: 'border-yellow-500',
            bg: 'bg-yellow-50 dark:bg-yellow-950',
            text: 'text-yellow-700 dark:text-yellow-300',
            badge:
              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          }
        case 'red':
          return {
            border: 'border-red-500',
            bg: 'bg-red-50 dark:bg-red-950',
            text: 'text-red-700 dark:text-red-300',
            badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          }
      }
    }

    const colors = getTimingColors()

    // Get priority badge
    const getPriorityBadge = () => {
      if (order.priority <= 0) {
        return null
      }

      const priorityLevel =
        order.priority >= 8 ? 'urgent' : order.priority >= 5 ? 'high' : 'medium'

      const priorityColors = {
        urgent: 'bg-red-600 text-white',
        high: 'bg-orange-500 text-white',
        medium: 'bg-blue-500 text-white',
      }

      return (
        <Badge className={`${priorityColors[priorityLevel]} text-xs`}>
          Priority {order.priority}
        </Badge>
      )
    }

    // Format order items for display
    const formatOrderItems = () => {
      if (!order.order?.items || !Array.isArray(order.order.items)) {
        return []
      }

      return order.order.items.map((item, index) => (
        <div key={index} className='text-sm'>
          <span className='font-medium'>{item.name || item}</span>
          {item.modifiers && item.modifiers.length > 0 && (
            <div className='text-xs text-gray-600 dark:text-gray-400 ml-2'>
              {item.modifiers.join(', ')}
            </div>
          )}
          {item.notes && (
            <div className='text-xs text-gray-500 dark:text-gray-500 ml-2 italic'>
              {item.notes}
            </div>
          )}
        </div>
      ))
    }

    return (
      <Card
        className={cn(
          'transition-all duration-200 hover:shadow-premium-lg hover:-translate-y-0.5',
          'animate-in', // Subtle entrance animation
          colors.border,
          colors.bg,
          isOverdue && 'animate-pulse',
          order.started_at && 'ring-2 ring-blue-500',
          className
        )}
      >
        {/* Urgency indicator WITHOUT removing existing UI */}
        {(order.priority >= 8 || isOverdue) && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-500 animate-subtle-pulse" />
        )}
        <CardHeader className={cn('pb-2', isCompact && 'p-3')}>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              {/* Order Number */}
              <Badge variant='outline' className='font-mono font-bold text-lg'>
                #{order.order?.id?.slice(-6) || 'N/A'}
              </Badge>

              {/* Timing - Enhanced visual hierarchy */}
              <Badge className={cn(
                colors.badge, 
                'flex items-center gap-1 tabular-nums font-semibold',
                timeElapsed > 15 && 'text-red-600 animate-subtle-pulse',
                timeElapsed > 10 && timeElapsed <= 15 && 'text-orange-600'
              )}>
                <Clock className='h-3 w-3' />
                {formattedTime}
              </Badge>

              {/* Priority */}
              {getPriorityBadge()}

              {/* Recall count */}
              {order.recall_count > 0 && (
                <Badge variant='destructive' className='text-xs'>
                  Recalled {order.recall_count}x
                </Badge>
              )}
            </div>

            {/* Status indicators */}
            <div className='flex items-center gap-1'>
              {order.started_at && (
                <div title='Prep started'>
                  <Play className='h-4 w-4 text-blue-500' />
                </div>
              )}
              {isOverdue && (
                <div title='Overdue'>
                  <AlertTriangle className='h-4 w-4 text-red-500' />
                </div>
              )}
            </div>
          </div>

          {/* Customer and table info */}
          {!isCompact && (
            <div className='flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400'>
              {order.order?.resident?.name && (
                <div className='flex items-center gap-1'>
                  <User className='h-3 w-3' />
                  {order.order.resident.name}
                </div>
              )}
              {order.order?.table?.label && (
                <div className='flex items-center gap-1'>
                  <MapPin className='h-3 w-3' />
                  {order.order.table.label}
                </div>
              )}
              <div className='text-xs text-gray-500'>
                {new Date(order.routed_at).toLocaleTimeString()}
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className={cn('pt-0', isCompact && 'p-3 pt-0')}>
          {/* Order Items */}
          <div className='space-y-1 mb-3'>{formatOrderItems()}</div>

          {/* Notes */}
          {order.notes && !showNotes && (
            <div className='mb-3 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm'>
              <strong>Notes:</strong> {order.notes}
            </div>
          )}

          {/* Notes editor */}
          {showNotes && (
            <div className='mb-3 space-y-2'>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder='Add notes for this order...'
                className='w-full p-2 text-sm border rounded resize-none'
                rows={2}
              />
              <div className='flex gap-2'>
                <Button size='sm' onClick={handleSaveNotes}>
                  Save
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setShowNotes(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Estimated prep time (fallback) */}
          {order.estimated_prep_time && (
            <div className='text-xs text-gray-500 mb-3'>
              Est. prep time: {Math.round(order.estimated_prep_time / 60)} min
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className='flex flex-wrap gap-2'>
              {/* Start prep button - Enhanced interaction */}
              {!order.started_at && onStartPrep && (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={handleStartPrep}
                  disabled={isLoading}
                  className='flex-1 hover:shadow-premium transition-all duration-200 active:scale-[0.98]'
                >
                  <Play className='h-3 w-3 mr-1' />
                  Start
                </Button>
              )}

              {/* Bump button - Enhanced interaction */}
              <Button
                size='sm'
                onClick={handleBump}
                disabled={isLoading}
                className='flex-1 bg-green-600 hover:bg-green-700 text-white active:scale-[0.98] transition-all duration-150'
              >
                <CheckCircle className='h-3 w-3 mr-1' />
                Ready
              </Button>

              {/* Recall button */}
              {onRecall && (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={handleRecall}
                  disabled={isLoading}
                  className='flex-1'
                >
                  <RotateCcw className='h-3 w-3 mr-1' />
                  Recall
                </Button>
              )}

              {/* Priority controls */}
              {onUpdatePriority && (
                <div className='flex gap-1'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => handlePriorityChange(1)}
                    disabled={order.priority >= 10}
                    className='px-2'
                  >
                    <ArrowUp className='h-3 w-3' />
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => handlePriorityChange(-1)}
                    disabled={order.priority <= 0}
                    className='px-2'
                  >
                    <ArrowDown className='h-3 w-3' />
                  </Button>
                </div>
              )}

              {/* Notes button */}
              {onAddNotes && (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setShowNotes(!showNotes)}
                  className='px-2'
                >
                  <MessageSquare className='h-3 w-3' />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  },
  (prevProps, nextProps) => {
    // AI: Custom comparison for optimized re-rendering
    return (
      prevProps.order.id === nextProps.order.id &&
      prevProps.order.started_at === nextProps.order.started_at &&
      prevProps.order.completed_at === nextProps.order.completed_at &&
      prevProps.order.priority === nextProps.order.priority &&
      prevProps.isCompact === nextProps.isCompact &&
      prevProps.showActions === nextProps.showActions
    )
  }
)
