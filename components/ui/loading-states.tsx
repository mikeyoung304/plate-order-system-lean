"use client"

import { cn } from "@/lib/utils"

export interface SkeletonProps {
  className?: string
}

// Lightweight skeleton loader
export const Skeleton = ({ className }: SkeletonProps) => (
  <div className={cn("bg-gray-200 rounded animate-pulse", className)} />
)

// Reusable loading patterns
export const LoadingDots = () => (
  <span className="inline-flex space-x-1">
    {[0, 1, 2].map(i => (
      <span
        key={i}
        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"
        style={{ animationDelay: `${i * 150}ms` }}
      />
    ))}
  </span>
)

export interface EmptyStateProps {
  message: string
  className?: string
}

// Clean, maintainable empty states
export const EmptyState = ({ message, className }: EmptyStateProps) => (
  <div className={cn("text-center py-12 text-gray-500", className)}>
    <p className="text-lg">{message}</p>
  </div>
)

// Enhanced skeleton for card layouts
export const CardSkeleton = ({ className }: SkeletonProps) => (
  <div className={cn("animate-pulse", className)}>
    <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
    <div className="bg-gray-200 h-3 rounded w-1/2 mb-1"></div>
    <div className="bg-gray-200 h-3 rounded w-2/3"></div>
  </div>
)

// Enhanced skeleton for list items
export const ListItemSkeleton = ({ className }: SkeletonProps) => (
  <div className={cn("animate-pulse flex items-center space-x-3", className)}>
    <div className="bg-gray-200 h-10 w-10 rounded-full"></div>
    <div className="flex-1 space-y-2">
      <div className="bg-gray-200 h-3 rounded w-3/4"></div>
      <div className="bg-gray-200 h-3 rounded w-1/2"></div>
    </div>
  </div>
)

// Premium loading spinner
export const LoadingSpinner = ({ size = "default" }: { size?: "sm" | "default" | "lg" }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6", 
    lg: "h-8 w-8"
  }
  
  return (
    <div className={cn("animate-spin rounded-full border-2 border-primary border-t-transparent", sizeClasses[size])} />
  )
}

// Enhanced page loading with skeleton
export const PageLoadingSkeleton = ({ title }: { title?: string }) => (
  <div className="space-y-6 animate-in">
    {title && (
      <div className="space-y-2">
        <div className="skeleton-loading h-8 w-64 rounded"></div>
        <div className="skeleton-loading h-4 w-96 rounded"></div>
      </div>
    )}
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="skeleton-loading h-48 rounded-lg shadow-premium"></div>
          <div className="skeleton-loading h-4 w-3/4 rounded"></div>
          <div className="skeleton-loading h-3 w-1/2 rounded"></div>
        </div>
      ))}
    </div>
  </div>
)