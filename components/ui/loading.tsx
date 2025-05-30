// AI: Created loading components for Plate Order System

import { cn } from "@/lib/utils"

export function LoadingSpinner({ 
  size = 'md',
  className = '' 
}: { 
  size?: 'sm' | 'md' | 'lg'
  className?: string 
}) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  }
  
  return (
    <div className={cn("inline-flex items-center justify-center", className)}>
      <div className={cn("animate-spin rounded-full border-b-2 border-current", sizes[size])} />
    </div>
  )
}

export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 flex flex-col items-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  )
}

export function LoadingButton({ 
  isLoading, 
  children, 
  loadingText = 'Loading...',
  ...props 
}: { 
  isLoading: boolean
  children: React.ReactNode
  loadingText?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} disabled={isLoading || props.disabled}>
      {isLoading ? (
        <span className="flex items-center justify-center">
          <LoadingSpinner size="sm" className="mr-2" />
          {loadingText}
        </span>
      ) : children}
    </button>
  )
}

export function LoadingCard({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="p-8 text-center">
      <LoadingSpinner size="lg" className="mx-auto mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  )
}