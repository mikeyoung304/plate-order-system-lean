/**
 * Rate limiting implementation for API endpoints
 * Uses in-memory storage for simplicity (consider Redis for production)
 */

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  max: number // Max requests per window
  message?: string // Custom error message
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.limits.entries()) {
        if (entry.resetTime < now) {
          this.limits.delete(key)
        }
      }
    }, 60000) // 1 minute
  }

  /**
   * Check if request should be rate limited
   * @returns true if request should be allowed, false if rate limited
   */
  check(identifier: string, config: RateLimitConfig): boolean {
    const now = Date.now()
    const entry = this.limits.get(identifier)

    if (!entry || entry.resetTime < now) {
      // New window
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + config.windowMs
      })
      return true
    }

    if (entry.count >= config.max) {
      // Rate limit exceeded
      return false
    }

    // Increment count
    entry.count++
    return true
  }

  /**
   * Get remaining requests for identifier
   */
  getRemaining(identifier: string, config: RateLimitConfig): number {
    const entry = this.limits.get(identifier)
    if (!entry || entry.resetTime < Date.now()) {
      return config.max
    }
    return Math.max(0, config.max - entry.count)
  }

  /**
   * Get reset time for identifier
   */
  getResetTime(identifier: string): number | null {
    const entry = this.limits.get(identifier)
    return entry?.resetTime || null
  }

  /**
   * Clean up resources
   */
  destroy() {
    clearInterval(this.cleanupInterval)
    this.limits.clear()
  }
}

// Singleton instance
let rateLimiterInstance: RateLimiter | null = null

export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter()
  }
  return rateLimiterInstance
}

// Preset configurations
export const RateLimitConfigs = {
  // Auth endpoints - strict limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many authentication attempts, please try again later'
  },
  
  // API endpoints - moderate limits
  api: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60,
    message: 'Too many requests, please slow down'
  },
  
  // Voice transcription - expensive operation
  voice: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10,
    message: 'Voice transcription rate limit exceeded'
  },
  
  // Order creation - prevent spam
  orders: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30,
    message: 'Too many orders, please wait before creating more'
  },
  
  // Data fetching - generous limits
  read: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100,
    message: 'Too many read requests'
  }
} as const

// Helper function to create rate limit response
export function createRateLimitResponse(message?: string): Response {
  return new Response(
    JSON.stringify({ 
      error: message || 'Too many requests', 
      code: 'RATE_LIMIT_EXCEEDED' 
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60'
      }
    }
  )
}

// Express/Next.js middleware wrapper
export function rateLimitMiddleware(config: RateLimitConfig) {
  const limiter = getRateLimiter()
  
  return (req: Request): Response | null => {
    // Extract identifier (IP or user ID)
    const identifier = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'anonymous'
    
    if (!limiter.check(identifier, config)) {
      const resetTime = limiter.getResetTime(identifier)
      const retryAfter = resetTime ? Math.ceil((resetTime - Date.now()) / 1000) : 60
      
      return new Response(
        JSON.stringify({ 
          error: config.message || 'Too many requests', 
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter 
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime?.toString() || ''
          }
        }
      )
    }
    
    // Add rate limit headers to response
    const remaining = limiter.getRemaining(identifier, config)
    const resetTime = limiter.getResetTime(identifier)
    
    // Return null to continue processing
    // Headers will be added in the API route
    return null
  }
}