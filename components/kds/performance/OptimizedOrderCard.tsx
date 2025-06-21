'use client'

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { useSimpleSwipe } from '@/hooks/use-simple-swipe'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import type { KDSOrderRouting } from '@/lib/modassembly/supabase/database/kds'

interface OptimizedOrderCardProps {
  order: KDSOrderRouting
  onBump: (routingId: string) => Promise<void>
  onRecall?: (routingId: string) => Promise<void>
  onStartPrep?: (routingId: string) => Promise<void>
  onUpdatePriority?: (routingId: string, priority: number) => Promise<void>
  onAddNotes?: (routingId: string, notes: string) => Promise<void>
  isCompact?: boolean
  showActions?: boolean
  className?: string
  
  // Performance optimization props
  lazyLoad?: boolean
  preloadOffscreen?: boolean
}

// Memoized order items component for performance
const OrderItems = memo(({ items }: { items: any[] }) => {
  return useMemo(() => {
    if (!items || !Array.isArray(items)) {
      return <div className="text-sm text-gray-500">No items</div>
    }

    return (
      <div className="space-y-1">
        {items.map((item, index) => {
          const itemName = typeof item === 'object' ? item.name : item
          const itemPrice = typeof item === 'object' ? item.price : null
          const itemCategory = typeof item === 'object' ? item.category : null
          
          return (
            <div key={index} className='text-sm border-l-2 border-blue-500 pl-3 py-1'>
              <div className='flex items-center justify-between'>
                <span className='font-medium text-gray-900 dark:text-gray-100'>
                  {itemName || 'Unknown Item'}
                </span>
                {itemPrice && (
                  <span className='text-xs text-gray-500 font-mono'>
                    ${itemPrice.toFixed(2)}
                  </span>
                )}
              </div>
              {itemCategory && (
                <div className='text-xs text-blue-600 dark:text-blue-400 capitalize'>
                  {itemCategory} station
                </div>
              )}
              {item.modifiers && item.modifiers.length > 0 && (
                <div className='text-xs text-gray-600 dark:text-gray-400 ml-2'>
                  + {item.modifiers.join(', ')}
                </div>
              )}
              {item.notes && (
                <div className='text-xs text-gray-500 dark:text-gray-500 ml-2 italic'>
                  Note: {item.notes}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }, [items])
})
OrderItems.displayName = 'OrderItems'

// Memoized timing display component
const TimingDisplay = memo(({ 
  timeElapsed, 
  colorStatus, 
  formattedTime, 
  isOverdue 
}: {
  timeElapsed: number
  colorStatus: string
  formattedTime: string
  isOverdue: boolean
}) => {
  const colors = useMemo(() => {
    switch (colorStatus) {
      case 'green':
        return {
          badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        }
      case 'yellow':
        return {
          badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        }
      case 'red':
        return {
          badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        }
      default:
        return {
          badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        }
    }
  }, [colorStatus])

  return (
    <Badge className={cn(
      colors.badge, 
      'flex items-center gap-1 tabular-nums font-semibold',
      timeElapsed > 15 && 'text-red-600 animate-subtle-pulse',
      timeElapsed > 10 && timeElapsed <= 15 && 'text-orange-600'
    )}>
      <Clock className='h-3 w-3' />
      {formattedTime}
    </Badge>
  )
})
TimingDisplay.displayName = 'TimingDisplay'

// Memoized action buttons component
const ActionButtons = memo(({
  order,
  onBump,
  onRecall,
  onStartPrep,
  onUpdatePriority,
  onAddNotes,
  isLoading,
  setIsLoading,
  showNotes,
  setShowNotes
}: {
  order: KDSOrderRouting
  onBump: (routingId: string) => Promise<void>
  onRecall?: (routingId: string) => Promise<void>
  onStartPrep?: (routingId: string) => Promise<void>
  onUpdatePriority?: (routingId: string, priority: number) => Promise<void>
  onAddNotes?: (routingId: string, notes: string) => Promise<void>
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  showNotes: boolean
  setShowNotes: (show: boolean) => void
}) => {
  const handleBump = useCallback(async () => {
    setIsLoading(true)
    try {
      await onBump(order.id)
    } catch (_error) {
      console.error('Error bumping order:', _error)
    } finally {
      setIsLoading(false)
    }
  }, [order.id, onBump, setIsLoading])

  const handleRecall = useCallback(async () => {
    if (!onRecall) {return}
    setIsLoading(true)
    try {
      await onRecall(order.id)
    } catch (_error) {
      console.error('Error recalling order:', _error)
    } finally {
      setIsLoading(false)
    }
  }, [order.id, onRecall, setIsLoading])

  const handleStartPrep = useCallback(async () => {
    if (!onStartPrep) {return}
    setIsLoading(true)
    try {
      await onStartPrep(order.id)
    } catch (_error) {
      console.error('Error starting prep:', _error)
    } finally {
      setIsLoading(false)
    }
  }, [order.id, onStartPrep, setIsLoading])

  const handlePriorityChange = useCallback(
    async (delta: number) => {
      if (!onUpdatePriority) {return}
      const newPriority = Math.max(0, Math.min(10, order.priority + delta))
      try {
        await onUpdatePriority(order.id, newPriority)
      } catch (_error) {
        console.error('Error updating priority:', _error)
      }
    },
    [order.id, order.priority, onUpdatePriority]
  )

  return (
    <div className={cn(
      'flex gap-2',
      'mobile-stack md:flex-row',
      'touch-safe'
    )}>
      {/* Start prep button */}
      {!order.started_at && onStartPrep && (
        <Button
          size='sm'
          variant='outline'
          onClick={handleStartPrep}
          disabled={isLoading}
          className={cn(
            'flex-1 hover:shadow-premium transition-all duration-200 active:scale-[0.98]',
            'touch-safe-mobile',
            'min-h-[44px]'
          )}
        >
          <Play className='h-3 w-3 mr-1' />
          Start
        </Button>
      )}

      {/* Bump button */}
      <Button
        size='sm'
        onClick={handleBump}
        disabled={isLoading}
        className={cn(
          'flex-1 bg-green-600 hover:bg-green-700 text-white active:scale-[0.98] transition-all duration-150',
          'touch-safe-mobile min-h-[44px]',
          'font-semibold'
        )}
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
  )
})
ActionButtons.displayName = 'ActionButtons'

// Main optimized order card component with intersection observer and lazy loading
export const OptimizedOrderCard = memo<OptimizedOrderCardProps>(({
  order,
  onBump,
  onRecall,
  onStartPrep,
  onUpdatePriority,
  onAddNotes,
  isCompact = false,
  showActions = true,
  className,
  lazyLoad = true,
  preloadOffscreen = false
}) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState(order.notes || '')
  
  // Intersection observer for lazy loading
  const { isIntersecting, hasIntersected } = useIntersectionObserver(
    cardRef as React.RefObject<Element>, 
    {
      threshold: 0.1,
      rootMargin: preloadOffscreen ? '100px' : '0px'
    }
  )
  
  // Order timing hook - memoized
  const { timeElapsed, colorStatus, formattedTime, isOverdue } = useOrderTiming(order)
  
  // Simple swipe to complete (mobile only)
  const { handleTouchStart, handleTouchEnd } = useSimpleSwipe(() => {
    if (!isLoading) {
      handleBump()
    }
  })

  // Handle bump action
  const handleBump = useCallback(async () => {
    setIsLoading(true)
    try {
      await onBump(order.id)
    } catch (_error) {
      console.error('Error bumping order:', _error)
    } finally {
      setIsLoading(false)
    }
  }, [order.id, onBump])

  // Handle notes save
  const handleSaveNotes = useCallback(async () => {
    if (!onAddNotes) {return}
    try {
      await onAddNotes(order.id, notes)
      setShowNotes(false)
    } catch (_error) {
      console.error('Error saving notes:', _error)
    }
  }, [order.id, notes, onAddNotes])

  // Get color classes based on timing - memoized
  const colors = useMemo(() => {
    switch (colorStatus) {
      case 'green':
        return {
          border: 'border-green-500',
          bg: 'bg-green-50 dark:bg-green-950',
          text: 'text-green-700 dark:text-green-300',
        }
      case 'yellow':
        return {
          border: 'border-yellow-500',
          bg: 'bg-yellow-50 dark:bg-yellow-950',
          text: 'text-yellow-700 dark:text-yellow-300',
        }
      case 'red':
        return {
          border: 'border-red-500',
          bg: 'bg-red-50 dark:bg-red-950',
          text: 'text-red-700 dark:text-red-300',
        }
      default:
        return {
          border: 'border-gray-200',
          bg: 'bg-white dark:bg-gray-900',
          text: 'text-gray-700 dark:text-gray-300',
        }
    }
  }, [colorStatus])

  // Get priority badge - memoized
  const priorityBadge = useMemo(() => {
    if (order.priority <= 0) {return null}

    const priorityLevel = order.priority >= 8 ? 'urgent' : order.priority >= 5 ? 'high' : 'medium'
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
  }, [order.priority])

  // Lazy loading - don't render full content until visible
  const shouldRenderContent = !lazyLoad || hasIntersected || isIntersecting

  if (lazyLoad && !shouldRenderContent) {
    return (
      <div ref={cardRef} className={cn("animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg", className)}>
        <div className="h-64 rounded-lg" />
      </div>
    )
  }

  return (
    <Card
      ref={cardRef}
      className={cn(
        'transition-all duration-200 hover:shadow-premium-lg hover:-translate-y-0.5',
        'animate-in',
        colors.border,
        colors.bg,
        isOverdue && 'animate-pulse',
        order.started_at && 'ring-2 ring-blue-500',
        'scroll-container',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Urgency indicator */}
      {(order.priority >= 8 || isOverdue) && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-500 animate-subtle-pulse" />
      )}
      
      <CardHeader className={cn('pb-2', isCompact && 'p-3')}>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            {/* Order Number */}
            <Badge variant='outline' className='font-mono font-bold text-lg'>
              T{order.order?.table?.label || '?'}-S{order.order?.seat?.label || '?'}
            </Badge>

            {/* Timing */}
            <TimingDisplay 
              timeElapsed={timeElapsed}
              colorStatus={colorStatus}
              formattedTime={formattedTime}
              isOverdue={isOverdue}
            />

            {/* Priority */}
            {priorityBadge}

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
            <div className='flex items-center gap-1'>
              <MapPin className='h-3 w-3 text-blue-500' />
              <span className='font-medium'>
                Table {order.order?.table?.label || '?'}, Seat {order.order?.seat?.label || '?'}
              </span>
            </div>
            {order.order?.resident?.name && (
              <div className='flex items-center gap-1'>
                <User className='h-3 w-3' />
                {order.order.resident.name}
              </div>
            )}
            <div className='text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded'>
              Ordered: {new Date(order.order?.created_at || order.routed_at).toLocaleTimeString()}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className={cn('pt-0', isCompact && 'p-3 pt-0')}>
        {/* Order Items - Memoized for performance */}
        <div className='mb-3'>
          <OrderItems items={order.order?.items || []} />
        </div>

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

        {/* Estimated prep time */}
        {order.estimated_prep_time && (
          <div className='text-xs text-gray-500 mb-3'>
            Est. prep time: {Math.round(order.estimated_prep_time / 60)} min
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <ActionButtons
            order={order}
            onBump={onBump}
            onRecall={onRecall}
            onStartPrep={onStartPrep}
            onUpdatePriority={onUpdatePriority}
            onAddNotes={onAddNotes}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            showNotes={showNotes}
            setShowNotes={setShowNotes}
          />
        )}
      </CardContent>
    </Card>
  )
}, (prevProps, nextProps) => {
  // Enhanced custom comparison for optimized re-rendering
  return (
    prevProps.order.id === nextProps.order.id &&
    prevProps.order.started_at === nextProps.order.started_at &&
    prevProps.order.completed_at === nextProps.order.completed_at &&
    prevProps.order.priority === nextProps.order.priority &&
    prevProps.order.notes === nextProps.order.notes &&
    prevProps.order.recall_count === nextProps.order.recall_count &&
    prevProps.isCompact === nextProps.isCompact &&
    prevProps.showActions === nextProps.showActions &&
    prevProps.lazyLoad === nextProps.lazyLoad &&
    prevProps.preloadOffscreen === nextProps.preloadOffscreen
  )
})

OptimizedOrderCard.displayName = 'OptimizedOrderCard'