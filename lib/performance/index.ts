// AUTONOMOUS_PERFORMANCE_SESSION: 2025-05-30 - Performance optimization suite
// Reason: Centralized performance utilities for easy application-wide use
// Impact: Easy adoption of all performance patterns across the codebase
// Usage: Import what you need, everything is tree-shakeable

// Re-export all performance utilities
export * from './bundle-optimization'
export * from './react-optimization'  
export * from './database-optimization'
export * from './memory-optimization'
export * from './motion-optimization'

// Performance initialization
export function initializePerformance() {
  if (typeof window !== 'undefined') {
    // Initialize performance monitoring
    console.log('🚀 Plater Performance Suite Initialized')
    
    // Setup performance observers for development
    if (process.env.NODE_ENV === 'development') {
      // Monitor long tasks
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) { // Tasks longer than 50ms
              console.warn(`⚠️ Long task detected: ${entry.duration}ms`)
            }
          })
        })
        observer.observe({ entryTypes: ['longtask'] })
      }

      // Monitor layout shifts
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (entry.value > 0.1) { // CLS threshold
              console.warn(`⚠️ Layout shift detected: ${entry.value}`)
            }
          })
        })
        observer.observe({ entryTypes: ['layout-shift'] })
      }
    }
  }
}

// Performance best practices reminder
export const PERFORMANCE_CHECKLIST = {
  REACT: [
    '✅ Use React.memo for expensive components',
    '✅ Use useCallback for functions passed to children',
    '✅ Use useMemo for expensive calculations',
    '✅ Use useReducer instead of multiple useState',
    '✅ Implement proper cleanup in useEffect'
  ],
  BUNDLE: [
    '✅ Use dynamic imports for heavy components',
    '✅ Import only what you need from libraries',
    '✅ Remove unused dependencies',
    '✅ Use tree-shaking friendly imports',
    '✅ Optimize images and assets'
  ],
  DATABASE: [
    '✅ Use joins instead of multiple queries',
    '✅ Implement query batching where possible',
    '✅ Add proper indexes on frequently queried columns',
    '✅ Use pagination for large datasets',
    '✅ Cache frequently accessed data'
  ],
  GENERAL: [
    '✅ Minimize re-renders with proper state management',
    '✅ Use proper loading states for better UX',
    '✅ Implement error boundaries for graceful failures',
    '✅ Optimize animations for performance',
    '✅ Use compression and caching strategies'
  ]
} as const

// Performance metrics collection
export class PerformanceTracker {
  private static metrics: Record<string, number[]> = {}

  static mark(name: string) {
    const time = performance.now()
    if (!this.metrics[name]) {
      this.metrics[name] = []
    }
    this.metrics[name].push(time)
  }

  static measure(name: string, startMark: string, endMark?: string) {
    try {
      performance.measure(name, startMark, endMark)
    } catch (error) {
      console.warn(`Performance measurement failed: ${name}`, error)
    }
  }

  static getMetrics() {
    return this.metrics
  }

  static clearMetrics() {
    this.metrics = {}
    performance.clearMarks()
    performance.clearMeasures()
  }
}