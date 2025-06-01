import { cleanupRateLimit } from '@/lib/utils/security'

export function initializeSecurityAndPerformance(): void {
  // Start periodic cleanup of rate limiting records
  const interval = setInterval(cleanupRateLimit, 60 * 60 * 1000) // Every hour

  // Clean up on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      clearInterval(interval)
    })
  }
}

// Simple utilities (only include what's actually used)
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | undefined

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => func(...args), delay)
  }
}
