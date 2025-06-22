/**
 * Simple performance utility replacements
 * These are minimal implementations to replace the deleted performance library
 */

// Enhanced API call measurement with performance tracking
export async function measureApiCall<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now()
  
  try {
    const result = await fn()
    performanceMonitor.track(name, startTime, true)
    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    performanceMonitor.track(name, startTime, false, errorMessage)
    throw error
  }
}

// Empty hook for render performance (does nothing)
export function useRenderPerformance(componentName: string): void {
  // No-op: Performance monitoring removed
}

// Simple animation variants for Framer Motion
export const optimizedVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
  },
  scale: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
  },
  pulse: {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: 'reverse' as const,
      },
    },
  },
}

// Simple throttle implementation
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  let previous = 0

  return function(...args: Parameters<T>) {
    const now = Date.now()
    const remaining = wait - (now - previous)

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      func.apply(this, args)
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now()
        timeout = null
        func.apply(this, args)
      }, remaining)
    }
  }
}

// Simple debounce implementation
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      func.apply(this, args)
    }, wait)
  }
}

// Simple performance tracking
interface PerformanceMetric {
  name: string
  duration: number
  timestamp: Date
  success: boolean
  error?: string
}

class SimplePerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private readonly maxMetrics = 1000 // Keep last 1000 metrics

  track(name: string, startTime: number, success: boolean = true, error?: string) {
    const duration = Date.now() - startTime
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: new Date(),
      success,
      error
    }
    
    this.metrics.push(metric)
    
    // Keep only recent metrics to prevent memory issues
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name)
    }
    return [...this.metrics]
  }

  getAverageTime(name: string): number {
    const nameMetrics = this.getMetrics(name)
    if (nameMetrics.length === 0) return 0
    
    const total = nameMetrics.reduce((sum, m) => sum + m.duration, 0)
    return total / nameMetrics.length
  }

  getSuccessRate(name: string): number {
    const nameMetrics = this.getMetrics(name)
    if (nameMetrics.length === 0) return 1
    
    const successful = nameMetrics.filter(m => m.success).length
    return successful / nameMetrics.length
  }

  clear() {
    this.metrics = []
  }
}

// Enhanced performance monitor object
export const performanceMonitor = new SimplePerformanceMonitor()
