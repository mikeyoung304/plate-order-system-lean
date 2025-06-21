"use client"

import * as React from "react"
import { Button, ButtonProps } from "./button"
import { cn } from "@/lib/utils"

export interface EnhancedButtonProps extends ButtonProps {
  loading?: boolean
  success?: boolean
  pulseOnHover?: boolean
}

// Wrapper around existing button - ensures compatibility
export const ButtonEnhanced = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ className, loading, success, pulseOnHover, children, disabled, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          "transition-all duration-200 active:scale-[0.98]",
          "hover:shadow-premium",
          loading && "opacity-70 cursor-wait",
          success && "bg-green-600 hover:bg-green-700",
          pulseOnHover && "hover:animate-subtle-pulse",
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>{children}</span>
          </span>
        ) : children}
      </Button>
    )
  }
)
ButtonEnhanced.displayName = "ButtonEnhanced"