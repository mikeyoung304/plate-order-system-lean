/**
 * Demo-Optimized Logger
 * Reduces console spam during investor demos while maintaining error tracking
 */

interface LogContext {
  component?: string
  operation?: string
  duration?: number
  renderCount?: number
  error?: Error | string
  metadata?: Record<string, any>
}

class DemoOptimizedLogger {
  private isDemoMode = process.env.NODE_ENV === 'production' || process.env.DEMO_MODE === 'true'
  private isDevMode = process.env.NODE_ENV === 'development'
  
  // Critical errors that should always be logged
  error(message: string, context?: LogContext | Error) {
    if (context instanceof Error) {
      console.error(`❌ [ERROR] ${message}:`, context.message)
      if (this.isDevMode) {
        console.error(context.stack)
      }
    } else {
      console.error(`❌ [ERROR] ${message}`, context)
    }
  }

  // Warnings - only in development or for critical performance issues
  warn(message: string, context?: LogContext) {
    if (this.isDevMode) {
      console.warn(`⚠️ [WARN] ${message}`, context)
    } else if (context?.duration && context.duration > 100) {
      // Only log critical performance warnings in demo mode
      console.warn(`🚨 [CRITICAL] ${message} (${context.duration}ms)`)
    }
  }

  // Info logging - development only
  info(message: string, context?: LogContext) {
    if (this.isDevMode) {
      console.log(`ℹ️ [INFO] ${message}`, context)
    }
  }

  // Debug logging - development only
  debug(message: string, context?: LogContext) {
    if (this.isDevMode && process.env.DEBUG_LOGGING === 'true') {
      console.debug(`🔍 [DEBUG] ${message}`, context)
    }
  }

  // Performance logging - only for critical issues in demo mode
  performance(message: string, duration: number, context?: LogContext) {
    if (duration > 100) {
      // Critical performance issue
      console.warn(`🚨 [PERFORMANCE] ${message} took ${duration.toFixed(2)}ms`, context)
    } else if (this.isDevMode && duration > 50) {
      // Development warning
      console.warn(`⚠️ [PERFORMANCE] ${message} took ${duration.toFixed(2)}ms`, context)
    }
  }

  // Success logging - minimal in demo mode
  success(message: string, context?: LogContext) {
    if (this.isDevMode) {
      console.log(`✅ [SUCCESS] ${message}`, context)
    }
  }

  // Network/API logging
  api(method: string, endpoint: string, duration: number, success: boolean, context?: LogContext) {
    if (!success) {
      this.error(`API ${method} ${endpoint} failed`, context)
    } else if (duration > 100) {
      this.performance(`API ${method} ${endpoint}`, duration, context)
    } else if (this.isDevMode) {
      this.debug(`API ${method} ${endpoint} (${duration.toFixed(2)}ms)`, context)
    }
  }

  // Component render logging
  render(componentName: string, duration: number, renderCount: number) {
    if (duration > 50) {
      this.performance(`Component ${componentName} render`, duration, { renderCount })
    } else if (this.isDevMode && renderCount > 100) {
      this.debug(`Component ${componentName} high render count`, { renderCount, duration })
    }
  }

  // Cache logging
  cache(operation: string, hit: boolean, duration?: number) {
    if (this.isDevMode) {
      const status = hit ? 'HIT' : 'MISS'
      const time = duration ? ` (${duration.toFixed(2)}ms)` : ''
      this.debug(`Cache ${operation}: ${status}${time}`)
    }
  }

  // WebSocket connection logging
  websocket(event: string, context?: LogContext) {
    if (event === 'error' || event === 'disconnect') {
      this.warn(`WebSocket ${event}`, context)
    } else if (this.isDevMode) {
      this.debug(`WebSocket ${event}`, context)
    }
  }

  // Database operation logging
  database(operation: string, duration: number, success: boolean, context?: LogContext) {
    if (!success) {
      this.error(`Database ${operation} failed`, context)
    } else if (duration > 100) {
      this.performance(`Database ${operation}`, duration, context)
    } else if (this.isDevMode && duration > 25) {
      this.debug(`Database ${operation} (${duration.toFixed(2)}ms)`, context)
    }
  }
}

// Global instance
export const demoLogger = new DemoOptimizedLogger()

// Convenience functions that match common logging patterns
export const logError = (message: string, error?: Error | LogContext) => demoLogger.error(message, error)
export const logWarn = (message: string, context?: LogContext) => demoLogger.warn(message, context)
export const logInfo = (message: string, context?: LogContext) => demoLogger.info(message, context)
export const logDebug = (message: string, context?: LogContext) => demoLogger.debug(message, context)
export const logPerformance = (message: string, duration: number, context?: LogContext) => 
  demoLogger.performance(message, duration, context)
export const logAPI = (method: string, endpoint: string, duration: number, success: boolean, context?: LogContext) =>
  demoLogger.api(method, endpoint, duration, success, context)

// Migration helper for existing console.error statements
export const replaceConsoleError = (message: string, error?: any) => {
  if (error instanceof Error) {
    demoLogger.error(message, error)
  } else {
    demoLogger.error(message, { metadata: error })
  }
}

// Performance wrapper that automatically logs slow operations
export async function withPerformanceLogging<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const start = performance.now()
  let success = true
  
  try {
    const result = await fn()
    return result
  } catch (error) {
    success = false
    throw error
  } finally {
    const duration = performance.now() - start
    if (success) {
      demoLogger.performance(operation, duration, context)
    } else {
      demoLogger.error(`${operation} failed after ${duration.toFixed(2)}ms`, context)
    }
  }
}

export default demoLogger