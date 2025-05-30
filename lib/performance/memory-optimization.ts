// AUTONOMOUS_PERFORMANCE_SESSION: 2025-05-30 - Memory leak prevention
// Reason: Prevent memory leaks that cause degradation over time
// Impact: Stable performance, no memory growth, better user experience
// Risk: None - only adds cleanup that should already exist

import { useEffect, useRef, useCallback } from 'react'

// Memory leak prevention utility
export class MemoryManager {
  private static activeSubscriptions = new Map<string, () => void>()
  private static activeTimers = new Set<NodeJS.Timeout>()
  private static activeIntervals = new Set<NodeJS.Timeout>()

  static addSubscription(id: string, cleanup: () => void) {
    // Clean up existing subscription with same ID
    const existing = this.activeSubscriptions.get(id)
    if (existing) {
      existing()
    }
    this.activeSubscriptions.set(id, cleanup)
  }

  static removeSubscription(id: string) {
    const cleanup = this.activeSubscriptions.get(id)
    if (cleanup) {
      cleanup()
      this.activeSubscriptions.delete(id)
    }
  }

  static addTimer(timer: NodeJS.Timeout) {
    this.activeTimers.add(timer)
  }

  static clearTimer(timer: NodeJS.Timeout) {
    clearTimeout(timer)
    this.activeTimers.delete(timer)
  }

  static addInterval(interval: NodeJS.Timeout) {
    this.activeIntervals.add(interval)
  }

  static clearInterval(interval: NodeJS.Timeout) {
    clearInterval(interval)
    this.activeIntervals.delete(interval)
  }

  static cleanupAll() {
    // Cleanup all subscriptions
    this.activeSubscriptions.forEach(cleanup => cleanup())
    this.activeSubscriptions.clear()

    // Clear all timers
    this.activeTimers.forEach(timer => clearTimeout(timer))
    this.activeTimers.clear()

    // Clear all intervals
    this.activeIntervals.forEach(interval => clearInterval(interval))
    this.activeIntervals.clear()
  }
}

// Hook for automatic cleanup management
export function useCleanup() {
  const cleanupFunctions = useRef<(() => void)[]>([])

  const addCleanup = useCallback((cleanup: () => void) => {
    cleanupFunctions.current.push(cleanup)
  }, [])

  useEffect(() => {
    return () => {
      // Run all cleanup functions
      cleanupFunctions.current.forEach(cleanup => cleanup())
      cleanupFunctions.current = []
    }
  }, [])

  return addCleanup
}

// Safe timer hooks that auto-cleanup
export function useSafeTimeout(callback: () => void, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const addCleanup = useCleanup()

  const start = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(callback, delay)
    MemoryManager.addTimer(timeoutRef.current)
  }, [callback, delay])

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      MemoryManager.clearTimer(timeoutRef.current)
      timeoutRef.current = undefined
    }
  }, [])

  useEffect(() => {
    addCleanup(clear)
  }, [clear, addCleanup])

  return { start, clear }
}

export function useSafeInterval(callback: () => void, delay: number) {
  const intervalRef = useRef<NodeJS.Timeout>()
  const addCleanup = useCleanup()

  const start = useCallback(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(callback, delay)
    MemoryManager.addInterval(intervalRef.current)
  }, [callback, delay])

  const clear = useCallback(() => {
    if (intervalRef.current) {
      MemoryManager.clearInterval(intervalRef.current)
      intervalRef.current = undefined
    }
  }, [])

  useEffect(() => {
    addCleanup(clear)
  }, [clear, addCleanup])

  return { start, clear }
}