import { isProduction } from './env'

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Export constants for access
export const { DEBUG, INFO, WARN, ERROR } = LogLevel

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
  error?: Error
  userId?: string
  sessionId?: string
}

class Logger {
  private logLevel: LogLevel

  constructor() {
    this.logLevel = isProduction ? LogLevel.INFO : LogLevel.DEBUG
  }

  private formatMessage(entry: LogEntry): string {
    const levelName = LogLevel[entry.level]
    const contextStr = entry.context ? JSON.stringify(entry.context) : ''
    const errorStr = entry.error
      ? `\nError: ${entry.error.message}\nStack: ${entry.error.stack}`
      : ''

    return `[${entry.timestamp}] ${levelName}: ${entry.message} ${contextStr}${errorStr}`
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ) {
    if (level < this.logLevel) {
      return
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    }

    const formatted = this.formatMessage(entry)

    // Console output
    switch (level) {
      case LogLevel.DEBUG:
        if (!isProduction) {
          console.debug(formatted)
        }
        break
      case LogLevel.INFO:
        if (!isProduction) {
          console.info(formatted)
        }
        break
      case LogLevel.WARN:
        console.warn(formatted)
        break
      case LogLevel.ERROR:
        console.error(formatted)
        break
    }

    // In production, you might want to send logs to an external service
    if (isProduction && level >= LogLevel.ERROR) {
      this.sendToExternalService(entry)
    }
  }

  private sendToExternalService(_entry: LogEntry) {
    // Placeholder for external logging service
    // Example: Sentry, LogRocket, DataDog, etc.
    try {
      // Implementation would go here
    } catch (error) {
      console.error('Failed to send log to external service:', error)
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, context)
  }

  info(message: string, context?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context)
  }

  warn(message: string, context?: Record<string, any>) {
    this.log(LogLevel.WARN, message, context)
  }

  error(message: string, context?: Record<string, any>, error?: Error) {
    this.log(LogLevel.ERROR, message, context, error)
  }

  // Specific logging methods for common scenarios
  authEvent(event: string, userId?: string, context?: Record<string, any>) {
    this.info(`Auth: ${event}`, { ...context, userId })
  }

  apiRequest(
    method: string,
    endpoint: string,
    userId?: string,
    duration?: number
  ) {
    this.info(`API: ${method} ${endpoint}`, { userId, duration })
  }

  dbQuery(query: string, duration?: number, context?: Record<string, any>) {
    this.debug(`DB: ${query}`, { ...context, duration })
  }

  voiceOrder(transcript: string, userId?: string, tableId?: string) {
    this.info('Voice order processed', { transcript, userId, tableId })
  }

  securityEvent(event: string, context?: Record<string, any>) {
    this.warn(`Security: ${event}`, context)
  }
}

// Export singleton instance
export const logger = new Logger()

// Performance monitoring helper
export function withPerformanceLogging<T extends any[], R>(
  fn: (...args: T) => R,
  _name: string
): (...args: T) => R {
  return (..._args: T): R => {
    // Performance logging temporarily disabled for production optimization
    return fn(..._args)
  }
}

// Async performance monitoring helper
export function withAsyncPerformanceLogging<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  _name: string
): (...args: T) => Promise<R> {
  return async (..._args: T): Promise<R> => {
    // Async performance logging temporarily disabled for production optimization
    return await fn(..._args)
  }
}
