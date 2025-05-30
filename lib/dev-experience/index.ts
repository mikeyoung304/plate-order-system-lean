// OVERNIGHT_SESSION: 2025-05-30 - Developer Experience Excellence
// Reason: Great DX leads to better code quality and faster development
// Impact: Enhanced debugging, better error messages, improved development workflow

// Enhanced console logging with context
export class DevLogger {
  private static isDev = process.env.NODE_ENV === 'development'
  private static prefix = '🍽️ Plater'

  static info(message: string, context?: any) {
    if (this.isDev) {
      console.info(`${this.prefix} [INFO]`, message, context || '')
    }
  }

  static warn(message: string, context?: any) {
    if (this.isDev) {
      console.warn(`${this.prefix} [WARN]`, message, context || '')
    }
  }

  static error(message: string, error?: any) {
    console.error(`${this.prefix} [ERROR]`, message, error || '')
  }

  static debug(message: string, data?: any) {
    if (this.isDev) {
      console.debug(`${this.prefix} [DEBUG]`, message, data || '')
    }
  }

  static trace(operation: string, startTime: number) {
    if (this.isDev) {
      const duration = Date.now() - startTime
      console.info(`${this.prefix} [TRACE]`, `${operation} took ${duration}ms`)
    }
  }
}

// Type-safe environment configuration
export const ENV = {
  NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test',
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTesting: process.env.NODE_ENV === 'test'
} as const