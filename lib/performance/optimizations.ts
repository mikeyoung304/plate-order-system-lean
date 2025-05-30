// OVERNIGHT_SESSION: 2025-05-30 - Performance optimizations for production excellence
// Reason: World-class applications require blazing fast performance
// Impact: Reduced bundle size, faster loads, smoother interactions

import { useCallback, useMemo, useRef, useEffect } from 'react'

// Bundle size optimization utilities
export class BundleOptimizer {
  // Dynamic imports for heavy components
  static loadKDSLayout = () => import('@/components/kds/kds-layout')
  static loadFloorPlanEditor = () => import('@/components/floor-plan-editor')
  static loadVoiceOrderPanel = () => import('@/components/voice-order-panel')
  static loadNotificationSystem = () => import('@/components/notification-system')

  // Preload critical components
  static preloadCriticalComponents() {
    // Preload likely-to-be-used components based on user role
    const userRole = this.getCurrentUserRole()
    
    if (userRole === 'server') {
      this.loadVoiceOrderPanel()
    } else if (userRole === 'cook') {
      this.loadKDSLayout()
    } else if (userRole === 'admin') {
      this.loadFloorPlanEditor()
    }
  }

  private static getCurrentUserRole(): string {
    // Get from auth context or local storage
    return 'server' // Default fallback
  }
}

// Memory leak prevention
export function useMemoryOptimization() {
  const subscriptions = useRef<Array<() => void>>([])
  const timeouts = useRef<Set<NodeJS.Timeout>>(new Set())
  const intervals = useRef<Set<NodeJS.Timeout>>(new Set())

  const addSubscription = useCallback((cleanup: () => void) => {
    subscriptions.current.push(cleanup)
  }, [])

  const addTimeout = useCallback((timeout: NodeJS.Timeout) => {
    timeouts.current.add(timeout)
  }, [])

  const addInterval = useCallback((interval: NodeJS.Timeout) => {
    intervals.current.add(interval)
  }, [])

  useEffect(() => {
    return () => {
      // Cleanup all subscriptions
      subscriptions.current.forEach(cleanup => cleanup())
      
      // Clear all timeouts
      timeouts.current.forEach(timeout => clearTimeout(timeout))
      
      // Clear all intervals
      intervals.current.forEach(interval => clearInterval(interval))
    }
  }, [])

  return { addSubscription, addTimeout, addInterval }
}

// Intelligent caching system
class SmartCache {
  private cache = new Map<string, { data: any, timestamp: number, ttl: number }>()
  private maxSize = 100

  set(key: string, data: any, ttlMs: number = 300000) { // 5 min default
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.getOldestKey()
      if (oldestKey) this.cache.delete(oldestKey)
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    })
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  private getOldestKey(): string | null {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp
        oldestKey = key
      }
    }

    return oldestKey
  }

  clear() {
    this.cache.clear()
  }
}

export const globalCache = new SmartCache()

// React render optimization
export function useRenderOptimization<T>(
  value: T,
  deps: React.DependencyList = []
): T {
  return useMemo(() => value, deps)
}

// Debounced callbacks for performance
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>()

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }, [callback, delay]) as T
}

// Intersection observer for lazy loading
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const targetRef = useRef<HTMLElement>(null)
  const isVisible = useRef(false)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    const observer = new IntersectionObserver(([entry]) => {
      isVisible.current = entry.isIntersecting
    }, options)

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [options])

  return { targetRef, isVisible: isVisible.current }
}

// Performance monitoring hooks
export function usePerformanceMetrics() {
  const startTime = useRef<number>(Date.now())
  const metrics = useRef<Record<string, number>>({})

  const markTime = useCallback((label: string) => {
    metrics.current[label] = Date.now() - startTime.current
  }, [])

  const getMetrics = useCallback(() => {
    return { ...metrics.current }
  }, [])

  const reset = useCallback(() => {
    startTime.current = Date.now()
    metrics.current = {}
  }, [])

  return { markTime, getMetrics, reset }
}

// Image optimization helpers
export const ImageOptimizer = {
  // Generate srcSet for responsive images
  generateSrcSet(basePath: string, sizes: number[]): string {
    return sizes
      .map(size => `${basePath}?w=${size} ${size}w`)
      .join(', ')
  },

  // Get optimized image props
  getOptimizedProps(
    src: string,
    alt: string,
    sizes: string = '(max-width: 768px) 100vw, 50vw'
  ) {
    return {
      src,
      alt,
      sizes,
      loading: 'lazy' as const,
      decoding: 'async' as const
    }
  }
}

// Database query optimization
export function useOptimizedQuery<T>(
  queryFn: () => Promise<T>,
  cacheKey: string,
  dependencies: any[] = []
) {
  const { data, error, isLoading } = useMemo(() => {
    const cached = globalCache.get(cacheKey)
    if (cached) {
      return { data: cached, error: null, isLoading: false }
    }

    let isCancelled = false
    let data: T | null = null
    let error: Error | null = null
    let isLoading = true

    queryFn()
      .then(result => {
        if (!isCancelled) {
          data = result
          globalCache.set(cacheKey, result)
          isLoading = false
        }
      })
      .catch(err => {
        if (!isCancelled) {
          error = err
          isLoading = false
        }
      })

    return { data, error, isLoading }
  }, dependencies)

  return { data, error, isLoading }
}

// Service Worker utilities for offline support
export class ServiceWorkerManager {
  static async register() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('ServiceWorker registered:', registration.scope)
        return registration
      } catch (error) {
        console.error('ServiceWorker registration failed:', error)
      }
    }
  }

  static async skipWaiting() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' })
    }
  }
}