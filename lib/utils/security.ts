// Simple security utilities for restaurant app
// Most security is handled by Supabase (RLS, auth, injection prevention)

import DOMPurify from 'isomorphic-dompurify'

export function sanitizeText(text: unknown): string {
  if (typeof text !== 'string') return ''
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] }).trim()
}

export function sanitizeOrderItems(items: unknown[]): string[] {
  if (!Array.isArray(items)) return []
  
  return items
    .map(item => sanitizeText(item))
    .filter(item => item.length > 0 && item.length <= 200)
    .slice(0, 20) // Max 20 items per order
}

// Rate limiting for auth attempts (5 attempts per 15 minutes)
const authAttempts = new Map<string, { count: number, resetAt: number }>()

export function checkAuthRateLimit(identifier: string): boolean {
  const now = Date.now()
  const record = authAttempts.get(identifier)
  
  // Reset if window expired
  if (!record || now > record.resetAt) {
    authAttempts.set(identifier, { count: 1, resetAt: now + 15 * 60 * 1000 })
    return true
  }
  
  // Block if too many attempts
  if (record.count >= 5) return false
  
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