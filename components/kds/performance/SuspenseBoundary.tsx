'use client'

import React, { ReactNode, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Clock, Loader2, Package, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SuspenseBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  level?: 'component' | 'section' | 'page'
  loadingText?: string
  className?: string
}

// Loading skeletons for different KDS components
export const OrderCardSkeleton = ({ isCompact = false }: { isCompact?: boolean }) => (
  <Card className="animate-pulse">
    <CardHeader className={cn('pb-2', isCompact && 'p-3')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-16" /> {/* Table badge */}
          <Skeleton className="h-6 w-20" /> {/* Time badge */}
          <Skeleton className="h-6 w-16" /> {/* Priority badge */}
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
      </div>
      {!isCompact && (
        <div className="flex items-center gap-4 pt-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
      )}
    </CardHeader>
    <CardContent className={cn('pt-0', isCompact && 'p-3 pt-0')}>
      <div className="space-y-2 mb-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-16" />
      </div>
    </CardContent>
  </Card>
)

export const TableGroupSkeleton = () => (
  <Card className="animate-pulse">
    <CardHeader className="pb-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="pl-6 space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-2 border-t mt-4">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-24" />
      </div>
    </CardContent>
  </Card>
)

export const OrderListSkeleton = ({ 
  count = 6, 
  viewMode = 'grid' 
}: { 
  count?: number
  viewMode?: 'grid' | 'list' | 'table' 
}) => {
  const gridClasses = viewMode === 'list' 
    ? 'grid-cols-1' 
    : viewMode === 'table'
    ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'

  return (
    <div className={cn("p-4 grid gap-4", gridClasses)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          {viewMode === 'table' ? (
            <TableGroupSkeleton />
          ) : (
            <OrderCardSkeleton isCompact={viewMode === 'list'} />
          )}
        </div>
      ))}
    </div>
  )
}

export const KDSHeaderSkeleton = () => (
  <div className="border-b bg-white dark:bg-gray-950 p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-48" /> {/* Title */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-18" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
    <div className="flex items-center gap-2 mt-4">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-8 w-18" />
    </div>
  </div>
)

// Advanced loading states with context
export const DetailedLoadingFallback = ({ 
  level = 'component',
  loadingText = 'Loading...',
  showProgress = false,
  progress = 0
}: {
  level?: 'component' | 'section' | 'page'
  loadingText?: string
  showProgress?: boolean
  progress?: number
}) => {
  if (level === 'page') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
            {showProgress && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600">
                  {Math.round(progress)}%
                </span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Loading Kitchen Display System
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {loadingText}
            </p>
          </div>
          {showProgress && (
            <div className="w-64 mx-auto">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (level === 'section') {
    return (
      <div className="flex items-center justify-center py-12 px-4">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {loadingText}
          </p>
        </div>
      </div>
    )
  }

  // Component level
  return (
    <div className="flex items-center justify-center p-4">
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        {loadingText}
      </div>
    </div>
  )
}

// Specialized loading states for different KDS features
export const OrdersLoadingState = ({ viewMode = 'grid' }: { viewMode?: string }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-4 px-4 py-2 border-b">
      <Clock className="h-5 w-5 text-blue-600" />
      <span className="text-sm font-medium">Loading orders...</span>
    </div>
    <OrderListSkeleton viewMode={viewMode as any} />
  </div>
)

export const StatsLoadingState = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
    {[
      { icon: Package, label: 'Orders' },
      { icon: Clock, label: 'Avg Time' },
      { icon: Users, label: 'Tables' },
    ].map(({ icon: Icon, label }, i) => (
      <Card key={i} className="animate-pulse">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-12" />
            </div>
            <Icon className="h-8 w-8 text-gray-300" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)

// Main suspense boundary component
export const KDSSuspenseBoundary: React.FC<SuspenseBoundaryProps> = ({
  children,
  fallback,
  level = 'component',
  loadingText = 'Loading...',
  className
}) => {
  const defaultFallback = fallback || (
    <DetailedLoadingFallback 
      level={level} 
      loadingText={loadingText}
    />
  )

  return (
    <div className={className}>
      <Suspense fallback={defaultFallback}>
        {children}
      </Suspense>
    </div>
  )
}

// HOC for wrapping components with suspense boundaries
export function withSuspense<P extends object>(
  Component: React.ComponentType<P>,
  suspenseProps?: Omit<SuspenseBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <KDSSuspenseBoundary {...suspenseProps}>
      <Component {...props} />
    </KDSSuspenseBoundary>
  )

  WrappedComponent.displayName = `withSuspense(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Specialized suspense boundaries for code splitting
export const LazyOrderCard = React.lazy(() => 
  import('./OptimizedOrderCard').then(module => ({ default: module.OptimizedOrderCard }))
)

export const LazyVirtualizedList = React.lazy(() => 
  import('./VirtualizedOrderList').then(module => ({ default: module.VirtualizedOrderList }))
)

export const LazyTableGroupCard = React.lazy(() => 
  import('../table-group-card').then(module => ({ default: module.TableGroupCard }))
)

// Suspense-wrapped lazy components ready for use
export const SuspendedOrderCard: React.FC<any> = (props) => (
  <KDSSuspenseBoundary level="component" fallback={<OrderCardSkeleton />}>
    <LazyOrderCard {...props} />
  </KDSSuspenseBoundary>
)

export const SuspendedVirtualizedList: React.FC<any> = (props) => (
  <KDSSuspenseBoundary level="section" fallback={<OrdersLoadingState />}>
    <LazyVirtualizedList {...props} />
  </KDSSuspenseBoundary>
)

export const SuspendedTableGroupCard: React.FC<any> = (props) => (
  <KDSSuspenseBoundary level="component" fallback={<TableGroupSkeleton />}>
    <LazyTableGroupCard {...props} />
  </KDSSuspenseBoundary>
)