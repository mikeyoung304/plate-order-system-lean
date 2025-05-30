// OVERNIGHT_SESSION: 2025-05-30 - Enhanced security utilities with backward compatibility
// Reason: Upgrade existing security while maintaining API compatibility
// Impact: World-class security with no breaking changes

import { Security } from '@/lib/security'

export const LIMITS = {
  ORDER_ITEM_LENGTH: 200,
  TABLE_NAME_LENGTH: 50,
  TRANSCRIPT_LENGTH: 1000,
  API_CALLS_PER_MINUTE: 10
} as const

// Backward compatible functions using enhanced security
export function sanitizeOrderItem(input: unknown): string {
  return Security.sanitize.sanitizeOrderItem(input)
}

export function sanitizeTableName(input: unknown): string {
  return Security.sanitize.sanitizeIdentifier(input)
}

export function sanitizeTranscript(input: unknown): string {
  return Security.sanitize.sanitizeHTML(input as string).slice(0, LIMITS.TRANSCRIPT_LENGTH)
}

// Enhanced rate limiter with backward compatibility
export function checkRateLimit(userId: string, action: string = 'api'): void {
  const isAllowed = Security.rateLimit.isAllowed(
    userId, 
    action, 
    LIMITS.API_CALLS_PER_MINUTE, 
    LIMITS.API_CALLS_PER_MINUTE / 60 // Convert to per-second rate
  )
  
  if (!isAllowed) {
    throw new Error('Please wait a moment before trying again')
  }
}

// Input validation helpers
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

export function validateTableId(tableId: string): boolean {
  // UUID format or simple alphanumeric
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const simpleIdRegex = /^[a-zA-Z0-9-_]{1,50}$/
  return uuidRegex.test(tableId) || simpleIdRegex.test(tableId)
}

export function validateSeatNumber(seat: number): boolean {
  return Number.isInteger(seat) && seat >= 1 && seat <= 20 // Max 20 seats per table
}

// SQL injection prevention for dynamic queries
export function escapeSearchTerm(term: string): string {
  if (typeof term !== 'string') return ''
  return term
    .replace(/[%_\\]/g, '\\$&') // Escape SQL LIKE wildcards
    .replace(/['"]/g, '') // Remove quotes
    .trim()
    .slice(0, 100) // Limit length
}