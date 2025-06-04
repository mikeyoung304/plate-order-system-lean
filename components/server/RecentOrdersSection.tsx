'use client'

import { memo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Coffee,
  ExternalLink,
  History,
  User,
  Utensils
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useServerPageData } from '@/lib/hooks/use-server-page-data'
import type { Order } from '@/types/database'

interface RecentOrdersSectionProps {
  className?: string
}

function OrderStatusBadge({ status }: { status: Order['status'] }) {
  const statusConfig = {
    new: { 
      label: 'New', 
      className: 'bg-blue-900/40 text-blue-400 border-blue-700',
      icon: AlertCircle 
    },
    in_progress: { 
      label: 'In Progress', 
      className: 'bg-yellow-900/40 text-yellow-400 border-yellow-700',
      icon: Clock 
    },
    ready: { 
      label: 'Ready', 
      className: 'bg-green-900/40 text-green-400 border-green-700',
      icon: CheckCircle 
    },
    delivered: { 
      label: 'Delivered', 
      className: 'bg-gray-700 text-gray-300 border-gray-600',
      icon: CheckCircle 
    },
    cancelled: { 
      label: 'Cancelled', 
      className: 'bg-red-900/40 text-red-400 border-red-700',
      icon: AlertCircle 
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant="outline" className={config.className}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  )
}

function OrderTypeIcon({ type }: { type: Order['type'] }) {
  return type === 'food' ? (
    <Utensils className="h-4 w-4 text-orange-400" />
  ) : (
    <Coffee className="h-4 w-4 text-blue-400" />
  )
}

function formatOrderTime(createdAt: string): string {
  const now = new Date()
  const orderTime = new Date(createdAt)
  const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) {return 'Just now'}
  if (diffInMinutes < 60) {return `${diffInMinutes}m ago`}
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {return `${diffInHours}h ago`}
  
  return orderTime.toLocaleDateString()
}

function OrderItem({ order }: { order: Order }) {
  const tableLabel = (order as any).tables?.label || 'Unknown'
  const residentName = (order as any).resident?.name || 'Unknown'

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
      <div className="flex-shrink-0 mt-0.5">
        <OrderTypeIcon type={order.type} />
      </div>
      
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">
              Table {tableLabel}
            </span>
            <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
              <User className="h-3 w-3 mr-1" />
              {residentName}
            </Badge>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        
        <div className="space-y-1">
          <div className="text-sm text-gray-300">
            {order.items.slice(0, 3).join(', ')}
            {order.items.length > 3 && (
              <span className="text-gray-500">
                {' '}+{order.items.length - 3} more
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatOrderTime(order.created_at)}</span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs hover:bg-gray-700"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function OrderLoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30">
          <Skeleton className="h-4 w-4 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-3 w-32" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyOrdersState() {
  return (
    <div className="text-center py-8">
      <History className="h-12 w-12 mx-auto text-gray-600 mb-4" />
      <p className="text-gray-400 text-sm">No recent orders</p>
      <p className="text-gray-500 text-xs mt-1">
        Orders will appear here as they are created
      </p>
    </div>
  )
}

function RecentOrdersHeader() {
  const { recentOrders, loading } = useServerPageData()
  
  return (
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-blue-400" />
        <h3 className="font-semibold text-white">Recent Orders</h3>
      </div>
      
      {!loading && (
        <Badge variant="secondary" className="bg-gray-700 text-gray-300">
          {recentOrders.length}
        </Badge>
      )}
    </CardHeader>
  )
}

function RecentOrdersContent() {
  const { recentOrders, loading, error } = useServerPageData()

  if (loading) {
    return <OrderLoadingSkeleton />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load recent orders: {error}
        </AlertDescription>
      </Alert>
    )
  }

  if (!recentOrders || recentOrders.length === 0) {
    return <EmptyOrdersState />
  }

  return (
    <ScrollArea className="h-96">
      <div className="space-y-2">
        {recentOrders.map((order: any) => (
          <OrderItem key={order.id} order={order} />
        ))}
      </div>
    </ScrollArea>
  )
}

export const RecentOrdersSection = memo<RecentOrdersSectionProps>(({ className }) => {
  return (
    <Card className={cn(
      "bg-gray-800/40 border-gray-700/30 backdrop-blur-sm",
      className
    )}>
      <RecentOrdersHeader />
      <CardContent>
        <RecentOrdersContent />
      </CardContent>
    </Card>
  )
})

RecentOrdersSection.displayName = 'RecentOrdersSection'