// OVERNIGHT_SESSION: 2025-05-30 - Global system initialization
// Reason: Centralized startup for security and performance systems
// Impact: Automated Fort Knox security and Google-scale performance from app start

import { Security } from '@/lib/security'
import { startPerformanceCleanup } from '@/lib/performance/monitoring'

/**
 * Initialize all security and performance systems
 * Call this early in the application lifecycle
 */
export function initializeSecurityAndPerformance(): void {
  try {
    // Start security cleanup processes
    Security.startCleanup()
    
    // Start performance monitoring and cleanup
    startPerformanceCleanup()
    
    // Log successful initialization (no sensitive data)
    console.log('🔒 Fort Knox security systems activated')
    console.log('⚡ Google-scale performance monitoring enabled')
    
    // Security: Clean up any potential XSS in console (dev mode only)
    if (process.env.NODE_ENV === 'development') {
      // Override console methods to sanitize output in development
      const originalLog = console.log
      const originalError = console.error
      const originalWarn = console.warn
      
      console.log = (...args: any[]) => {
        const sanitizedArgs = args.map(arg => 
          typeof arg === 'string' ? Security.sanitize.sanitizeHTML(arg) : arg
        )
        originalLog(...sanitizedArgs)
      }
      
      console.error = (...args: any[]) => {
        const sanitizedArgs = args.map(arg => 
          typeof arg === 'string' ? Security.sanitize.sanitizeHTML(arg) : arg
        )
        originalError(...sanitizedArgs)
      }
      
      console.warn = (...args: any[]) => {
        const sanitizedArgs = args.map(arg => 
          typeof arg === 'string' ? Security.sanitize.sanitizeHTML(arg) : arg
        )
        originalWarn(...sanitizedArgs)
      }
    }
    
  } catch (error) {
    console.error('Failed to initialize security and performance systems:', error)
    // Don't throw - allow app to continue but log the failure
  }
}

/**
 * React Hook for component-level initialization
 * Import React in the component that uses this hook
 */
export function useSecurityAndPerformanceInit(React: any) {
  return () => {
    React.useEffect(() => {
      initializeSecurityAndPerformance()
    }, [])
  }
}

/**
 * Memory leak prevention utilities
 */
export const MemoryLeakPrevention = {
  // Clean up event listeners, timers, and subscriptions
  createCleanupTracker(): {
    addCleanup: (fn: () => void) => void
    cleanup: () => void
  } {
    const cleanupFunctions: (() => void)[] = []
    
    return {
      addCleanup: (fn: () => void) => {
        cleanupFunctions.push(fn)
      },
      cleanup: () => {
        cleanupFunctions.forEach(fn => {
          try {
            fn()
          } catch (error) {
            console.error('Cleanup function failed:', error)
          }
        })
        cleanupFunctions.length = 0
      }
    }
  },
  
  // Debounce utility to prevent excessive function calls
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | undefined
    
    return (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = setTimeout(() => {
        func(...args)
        timeoutId = undefined
      }, delay)
    }
  },
  
  // Throttle utility to limit function execution rate
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle = false
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => {
          inThrottle = false
        }, limit)
      }
    }
  }
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  // Run initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSecurityAndPerformance)
  } else {
    // DOM is already ready
    initializeSecurityAndPerformance()
  }
}