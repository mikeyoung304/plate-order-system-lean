import DOMPurify from 'isomorphic-dompurify'

/**
 * Input Sanitization - Nothing less than Fort Knox
 */
export class InputSanitizer {
  // XSS prevention that would impress OWASP
  static sanitizeHTML(input: string): string {
    if (typeof input !== 'string') {
      return ''
    }
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // No HTML tags allowed in user input
      ALLOWED_ATTR: [],
      FORBID_TAGS: ['script', 'object', 'embed', 'link', 'style', 'iframe'],
    })
  }

  // SQL injection prevention (though we use Supabase, defense in depth)
  static sanitizeSQL(input: string): string {
    if (typeof input !== 'string') {
      return ''
    }
    return input
      .replace(/['"\\;]/g, '') // Remove dangerous SQL characters
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\/\*/g, '') // Remove block comments
      .replace(/\*\//g, '')
      .trim()
      .slice(0, 1000) // Limit length
  }

  // Order item sanitization with business logic
  static sanitizeOrderItem(input: unknown): string {
    if (typeof input !== 'string') {
      return ''
    }

    return (
      input
        .trim()
        .slice(0, 200) // Order items should be concise
        .replace(/[<>\"']/g, '') // Remove dangerous characters
        .replace(/script/gi, '') // Remove script attempts
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/data:/gi, '') // Remove data: protocol
        .replace(/vbscript:/gi, '') || // Remove vbscript: protocol
      ''
    ) // Fallback to empty string
  }

  // Table/seat identifiers - only alphanumeric and safe characters
  static sanitizeIdentifier(input: unknown): string {
    if (typeof input !== 'string') {
      return ''
    }
    return input.replace(/[^a-zA-Z0-9\-_]/g, '').slice(0, 50)
  }

  // User names with unicode support but XSS protection
  static sanitizeUserName(input: unknown): string {
    if (typeof input !== 'string') {
      return ''
    }
    return this.sanitizeHTML(input)
      .replace(/[<>\"']/g, '')
      .trim()
      .slice(0, 100)
  }
}

/**
 * Rate Limiting - Token bucket algorithm for API calls
 */
interface RateLimitBucket {
  tokens: number
  lastRefill: number
  maxTokens: number
  refillRate: number // tokens per second
}

export class RateLimiter {
  private static buckets = new Map<string, RateLimitBucket>()

  // Check if action is allowed for a user/IP
  static isAllowed(
    identifier: string,
    action: string,
    maxTokens: number = 10,
    refillRate: number = 1
  ): boolean {
    const key = `${identifier}:${action}`
    const now = Date.now()

    let bucket = this.buckets.get(key)
    if (!bucket) {
      bucket = {
        tokens: maxTokens,
        lastRefill: now,
        maxTokens,
        refillRate,
      }
      this.buckets.set(key, bucket)
    }

    // Refill tokens based on time passed
    const timePassed = (now - bucket.lastRefill) / 1000
    const tokensToAdd = Math.floor(timePassed * bucket.refillRate)
    bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + tokensToAdd)
    bucket.lastRefill = now

    // Check if action is allowed
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1
      return true
    }

    return false
  }

  // Clean old buckets to prevent memory leaks
  static cleanup(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.lastRefill < oneHourAgo) {
        this.buckets.delete(key)
      }
    }
  }
}

/**
 * Request Validation - Assumes everyone is an attacker
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  sanitizedData?: any
}

export class RequestValidator {
  // Validate API request with comprehensive checks
  static validateRequest(req: Request): ValidationResult {
    const errors: string[] = []

    // Check Content-Type for POST requests
    if (req.method === 'POST' || req.method === 'PUT') {
      const contentType = req.headers.get('content-type')
      if (
        !contentType ||
        (!contentType.includes('application/json') &&
          !contentType.includes('multipart/form-data'))
      ) {
        errors.push('Invalid content type')
      }
    }

    // Check for suspicious headers (but be less restrictive for legitimate proxy headers)
    const suspiciousHeaders = ['x-original-url', 'x-rewrite-url']
    for (const header of suspiciousHeaders) {
      if (req.headers.get(header)) {
        errors.push(`Suspicious header detected: ${header}`)
      }
    }

    // Check User-Agent (basic bot detection) - be more lenient for local development
    const userAgent = req.headers.get('user-agent')
    if (!userAgent) {
      // Only warn in development, don't block
      if (process.env.NODE_ENV === 'development') {
        console.warn('Missing User-Agent header in development')
      } else {
        errors.push('Invalid or missing User-Agent')
      }
    } else if (userAgent.length < 5 && process.env.NODE_ENV !== 'development') {
      errors.push('Invalid User-Agent')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  // Validate order data with business rules
  static validateOrderData(data: any): ValidationResult {
    const errors: string[] = []
    const sanitizedData: any = {}

    // Required fields
    if (!data.table_id) {
      errors.push('Table ID is required')
    } else {
      sanitizedData.table_id = InputSanitizer.sanitizeIdentifier(data.table_id)
    }

    if (!data.seat_id) {
      errors.push('Seat ID is required')
    } else {
      sanitizedData.seat_id = InputSanitizer.sanitizeIdentifier(data.seat_id)
    }

    // Validate items array
    if (!Array.isArray(data.items)) {
      errors.push('Items must be an array')
    } else if (data.items.length === 0) {
      errors.push('Order must contain at least one item')
    } else if (data.items.length > 20) {
      errors.push('Order cannot contain more than 20 items')
    } else {
      sanitizedData.items = data.items
        .map((item: any) => InputSanitizer.sanitizeOrderItem(item))
        .filter((item: string) => item.length > 0)

      if (sanitizedData.items.length === 0) {
        errors.push('No valid items after sanitization')
      }
    }

    // Validate transcript if present
    if (data.transcript) {
      sanitizedData.transcript = InputSanitizer.sanitizeHTML(data.transcript)
      if (sanitizedData.transcript.length > 1000) {
        errors.push('Transcript too long')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? sanitizedData : undefined,
    }
  }
}

/**
 * CSRF Protection
 */
export class CSRFProtection {
  private static secret =
    process.env.CSRF_SECRET || 'default-secret-change-in-production'

  // Generate CSRF token
  static generateToken(sessionId: string): string {
    const timestamp = Date.now().toString()
    const hash = require('crypto')
      .createHmac('sha256', this.secret)
      .update(`${sessionId}:${timestamp}`)
      .digest('hex')

    return `${timestamp}:${hash}`
  }

  // Verify CSRF token
  static verifyToken(token: string, sessionId: string): boolean {
    if (!token || !sessionId) {
      return false
    }

    const [timestamp, hash] = token.split(':')
    if (!timestamp || !hash) {
      return false
    }

    // Check if token is not too old (1 hour max)
    const tokenAge = Date.now() - parseInt(timestamp)
    if (tokenAge > 60 * 60 * 1000) {
      return false
    }

    // Verify hash
    const expectedHash = require('crypto')
      .createHmac('sha256', this.secret)
      .update(`${sessionId}:${timestamp}`)
      .digest('hex')

    return hash === expectedHash
  }
}

/**
 * Security Headers
 */
export class SecurityHeaders {
  // Get security headers for responses
  static getHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(self), geolocation=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.openai.com",
    }
  }
}

/**
 * Unified Security Manager
 */
export const Security = {
  sanitize: InputSanitizer,
  rateLimit: RateLimiter,
  validate: RequestValidator,
  csrf: CSRFProtection,
  headers: SecurityHeaders,

  // Start cleanup interval
  startCleanup(): void {
    setInterval(
      () => {
        RateLimiter.cleanup()
      },
      60 * 60 * 1000
    ) // Clean every hour
  },
}

// Individual components are already exported above
