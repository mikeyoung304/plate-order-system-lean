// AI: Created security utilities for Plate Order System

export const LIMITS = {
  ORDER_ITEM_LENGTH: 200,
  TABLE_NAME_LENGTH: 50,
  TRANSCRIPT_LENGTH: 1000,
  API_CALLS_PER_MINUTE: 10
} as const

export function sanitizeOrderItem(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input
    .trim()
    .slice(0, LIMITS.ORDER_ITEM_LENGTH)
    .replace(/[<>\"]/g, '')
    .replace(/script/gi, '')
}

export function sanitizeTableName(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input
    .trim()
    .slice(0, LIMITS.TABLE_NAME_LENGTH)
    .replace(/[^a-zA-Z0-9\s-]/g, '')
}

export function sanitizeTranscript(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input
    .trim()
    .slice(0, LIMITS.TRANSCRIPT_LENGTH)
    .replace(/[<>\"']/g, '')
    .replace(/script/gi, '')
    .replace(/javascript:/gi, '')
}

// Simple rate limiter
const rateLimitMap = new Map<string, number[]>()

export function checkRateLimit(userId: string, action: string = 'api'): void {
  const key = `${userId}:${action}`
  const now = Date.now()
  const calls = rateLimitMap.get(key) || []
  const recentCalls = calls.filter(time => now - time < 60000)
  
  if (recentCalls.length >= LIMITS.API_CALLS_PER_MINUTE) {
    throw new Error('Please wait a moment before trying again')
  }
  
  rateLimitMap.set(key, [...recentCalls, now])
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