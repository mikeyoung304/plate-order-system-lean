// Security library for KDS and order routing
// Provides the interface expected by the KDS system

import DOMPurify from 'isomorphic-dompurify'

export const Security = {
  validate: {
    validateRequest(request: Request): { isValid: boolean; error?: string; errors?: string[] } {
      try {
        const errors: string[] = []
        
        // Check content type for POST/PUT requests
        const method = request.method
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
          const contentType = request.headers.get('content-type') || ''
          if (!this.validateContentType(contentType)) {
            errors.push('Invalid content type')
          }
        }
        
        // Check for required headers
        const userAgent = request.headers.get('user-agent')
        if (!userAgent || userAgent.length < 5) {
          errors.push('Invalid user agent')
        }
        
        if (errors.length > 0) {
          return { isValid: false, error: errors[0], errors }
        }
        
        return { isValid: true }
      } catch (error) {
        return { isValid: false, error: 'Request validation failed', errors: ['Request validation failed'] }
      }
    },

    validateContentType(contentType: string): boolean {
      const allowedTypes = [
        'application/json',
        'multipart/form-data',
        'application/x-www-form-urlencoded',
        'text/plain',
        'audio/wav',
        'audio/webm',
        'audio/mp4'
      ]
      return allowedTypes.some(type => contentType.includes(type))
    }
  },

  sanitize: {
    sanitizeIdentifier(id: unknown): string {
      if (typeof id !== 'string') {
        return ''
      }
      // Validate UUID format and basic identifier sanitation
      const sanitized = id.trim()
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      return uuidRegex.test(sanitized) ? sanitized : ''
    },

    sanitizeUserName(name: unknown): string {
      if (typeof name !== 'string') {
        return ''
      }
      return DOMPurify.sanitize(name, { ALLOWED_TAGS: [] })
        .trim()
        .slice(0, 100) // Limit length
    },

    sanitizeHTML(content: unknown): string {
      if (typeof content !== 'string') {
        return ''
      }
      return DOMPurify.sanitize(content, { 
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
      }).trim()
    },

    sanitizeOrderItem(item: unknown): string {
      if (typeof item !== 'string') {
        return ''
      }
      return DOMPurify.sanitize(item, { ALLOWED_TAGS: [] })
        .trim()
        .slice(0, 200) // Limit item length
    }
  },

  headers: {
    validateContentType(contentType: string): boolean {
      const allowedTypes = [
        'application/json',
        'multipart/form-data',
        'application/x-www-form-urlencoded',
        'audio/wav',
        'audio/webm',
        'audio/mp4'
      ]
      return allowedTypes.some(type => contentType.includes(type))
    },

    sanitizeHeader(value: unknown): string {
      if (typeof value !== 'string') {
        return ''
      }
      return value.replace(/[\r\n]/g, '').trim().slice(0, 1000)
    },

    getCORSHeaders() {
      return {
        'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? '*' : 'https://your-domain.com',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    },

    getHeaders(request?: Request) {
      return {
        'Content-Type': 'application/json',
        ...this.getCORSHeaders()
      }
    }
  },

  rateLimit: {
    check(identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
      return checkAuthRateLimit(identifier)
    },

    isAllowed(identifier: string, endpoint?: string, maxRequests?: number, perSeconds?: number): boolean {
      return checkAuthRateLimit(identifier)
    },

    cleanup(): void {
      cleanupRateLimit()
    },

    getAttempts(identifier: string): number {
      const record = authAttempts.get(identifier)
      return record ? record.count : 0
    },

    reset(identifier: string): void {
      authAttempts.delete(identifier)
    }
  }
}

// Re-export individual functions for backward compatibility
export function sanitizeText(text: unknown): string {
  return Security.sanitize.sanitizeHTML(text)
}

export function sanitizeOrderItems(items: unknown[]): string[] {
  if (!Array.isArray(items)) {
    return []
  }

  return items
    .map(item => Security.sanitize.sanitizeOrderItem(item))
    .filter(item => item.length > 0)
    .slice(0, 20) // Max 20 items per order
}

// Rate limiting for auth attempts (5 attempts per 15 minutes)
const authAttempts = new Map<string, { count: number; resetAt: number }>()

export function checkAuthRateLimit(identifier: string): boolean {
  const now = Date.now()
  const record = authAttempts.get(identifier)

  // Reset if window expired
  if (!record || now > record.resetAt) {
    authAttempts.set(identifier, { count: 1, resetAt: now + 15 * 60 * 1000 })
    return true
  }

  // Block if too many attempts
  if (record.count >= 5) {
    return false
  }

  record.count++
  return true
}

// Clean up old rate limit records (call periodically)
export function cleanupRateLimit() {
  const now = Date.now()
  for (const [key, record] of authAttempts.entries()) {
    if (now > record.resetAt) {
      authAttempts.delete(key)
    }
  }
}