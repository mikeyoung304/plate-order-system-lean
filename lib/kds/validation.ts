// Input validation utilities for KDS system

import DOMPurify from 'isomorphic-dompurify'

// Validate and sanitize order notes
export function sanitizeOrderNotes(notes: string): string {
  if (!notes || typeof notes !== 'string') return ''
  
  // Remove any HTML/script tags
  const sanitized = DOMPurify.sanitize(notes, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  })
  
  // Trim and limit length
  return sanitized.trim().substring(0, 500)
}

// Validate priority value
export function validatePriority(priority: unknown): number {
  const num = Number(priority)
  
  if (isNaN(num) || !isFinite(num)) return 0
  if (num < 0) return 0
  if (num > 10) return 10
  
  return Math.floor(num)
}

// Validate order number for voice commands
export function validateOrderNumber(orderNumber: string): string | null {
  if (!orderNumber || typeof orderNumber !== 'string') return null
  
  // Remove any non-alphanumeric characters
  const cleaned = orderNumber.replace(/[^a-zA-Z0-9]/g, '')
  
  // Check if it's a valid format (expecting 6 characters)
  if (cleaned.length < 3 || cleaned.length > 10) return null
  
  return cleaned.toLowerCase()
}

// Validate station ID
export function validateStationId(stationId: unknown): string | null {
  if (!stationId || typeof stationId !== 'string') return null
  
  // UUID format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  
  if (!uuidRegex.test(stationId)) return null
  
  return stationId.toLowerCase()
}

// Validate filter type
export function validateFilterType(filter: string): 'all' | 'new' | 'preparing' | 'overdue' {
  const normalized = filter.toLowerCase().trim()
  
  switch (normalized) {
    case 'new':
    case 'preparing':
    case 'overdue':
      return normalized as 'new' | 'preparing' | 'overdue'
    default:
      return 'all'
  }
}

// Validate sort type
export function validateSortType(sort: string): 'time' | 'priority' | 'table' {
  const normalized = sort.toLowerCase().trim()
  
  switch (normalized) {
    case 'priority':
    case 'table':
      return normalized as 'priority' | 'table'
    default:
      return 'time'
  }
}

// Validate view mode
export function validateViewMode(mode: string): 'grid' | 'list' | 'table' {
  const normalized = mode.toLowerCase().trim()
  
  switch (normalized) {
    case 'list':
    case 'table':
      return normalized as 'list' | 'table'
    default:
      return 'grid'
  }
}

// Sanitize display text (for order items, names, etc.)
export function sanitizeDisplayText(text: unknown): string {
  if (!text) return ''
  
  const str = String(text)
  
  // Remove any HTML/script tags but allow basic formatting
  const sanitized = DOMPurify.sanitize(str, { 
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
    ALLOWED_ATTR: []
  })
  
  return sanitized.trim()
}

// Validate timestamp
export function validateTimestamp(timestamp: unknown): Date | null {
  if (!timestamp) return null
  
  const date = new Date(String(timestamp))
  
  // Check if valid date
  if (isNaN(date.getTime())) return null
  
  // Check if reasonable date (not too far in past or future)
  const now = Date.now()
  const diff = Math.abs(now - date.getTime())
  const oneYear = 365 * 24 * 60 * 60 * 1000
  
  if (diff > oneYear) return null
  
  return date
}

// Validate array of order IDs
export function validateOrderIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return []
  
  return ids
    .filter(id => typeof id === 'string' && id.length > 0)
    .map(id => id.trim())
    .filter(id => {
      // Basic UUID validation
      return /^[0-9a-f-]{36}$/i.test(id)
    })
}

// Input sanitization for voice commands
export function sanitizeVoiceCommand(command: string): string {
  if (!command || typeof command !== 'string') return ''
  
  // Remove special characters but keep spaces
  const sanitized = command
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .toLowerCase()
  
  // Limit length
  return sanitized.substring(0, 200)
}