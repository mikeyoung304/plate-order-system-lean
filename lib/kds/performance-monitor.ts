// Performance monitoring utilities for KDS system

interface PerformanceMetrics {
  renderTime: number
  updateTime: number
  orderCount: number
  memoryUsage?: number
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private maxMetrics = 100 // Keep last 100 metrics
  
  // Track render performance
  measureRender(orderCount: number, callback: () => void): void {
    const startTime = performance.now()
    
    callback()
    
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    this.addMetric({
      renderTime,
      updateTime: 0,
      orderCount,
      timestamp: Date.now()
    })
    
    // Log slow renders in development
    if (process.env.NODE_ENV === 'development' && renderTime > 16.67) { // > 1 frame at 60fps
      console.warn(`Slow render detected: ${renderTime.toFixed(2)}ms for ${orderCount} orders`)
    }
  }
  
  // Track update performance
  measureUpdate(orderCount: number, callback: () => Promise<void>): Promise<void> {
    const startTime = performance.now()
    
    return callback().then(() => {
      const endTime = performance.now()
      const updateTime = endTime - startTime
      
      this.addMetric({
        renderTime: 0,
        updateTime,
        orderCount,
        timestamp: Date.now()
      })
      
      // Log slow updates
      if (process.env.NODE_ENV === 'development' && updateTime > 100) {
        console.warn(`Slow update detected: ${updateTime.toFixed(2)}ms for ${orderCount} orders`)
      }
    })
  }
  
  // Add memory usage if available
  private addMetric(metric: PerformanceMetrics): void {
    // Add memory usage if available
    if ('memory' in performance) {
      metric.memoryUsage = (performance as any).memory.usedJSHeapSize / 1048576 // Convert to MB
    }
    
    this.metrics.push(metric)
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }
  
  // Get average metrics
  getAverageMetrics(): {
    avgRenderTime: number
    avgUpdateTime: number
    avgMemoryUsage: number
    totalSamples: number
  } {
    if (this.metrics.length === 0) {
      return {
        avgRenderTime: 0,
        avgUpdateTime: 0,
        avgMemoryUsage: 0,
        totalSamples: 0
      }
    }
    
    const renderMetrics = this.metrics.filter(m => m.renderTime > 0)
    const updateMetrics = this.metrics.filter(m => m.updateTime > 0)
    const memoryMetrics = this.metrics.filter(m => m.memoryUsage !== undefined)
    
    return {
      avgRenderTime: renderMetrics.length > 0
        ? renderMetrics.reduce((sum, m) => sum + m.renderTime, 0) / renderMetrics.length
        : 0,
      avgUpdateTime: updateMetrics.length > 0
        ? updateMetrics.reduce((sum, m) => sum + m.updateTime, 0) / updateMetrics.length
        : 0,
      avgMemoryUsage: memoryMetrics.length > 0
        ? memoryMetrics.reduce((sum, m) => sum + (m.memoryUsage || 0), 0) / memoryMetrics.length
        : 0,
      totalSamples: this.metrics.length
    }
  }
  
  // Get performance warnings
  getWarnings(): string[] {
    const warnings: string[] = []
    const avgMetrics = this.getAverageMetrics()
    
    if (avgMetrics.avgRenderTime > 16.67) {
      warnings.push(`Average render time (${avgMetrics.avgRenderTime.toFixed(2)}ms) exceeds 60fps threshold`)
    }
    
    if (avgMetrics.avgUpdateTime > 100) {
      warnings.push(`Average update time (${avgMetrics.avgUpdateTime.toFixed(2)}ms) may cause UI lag`)
    }
    
    if (avgMetrics.avgMemoryUsage > 500) {
      warnings.push(`High memory usage detected (${avgMetrics.avgMemoryUsage.toFixed(2)}MB)`)
    }
    
    return warnings
  }
  
  // Clear metrics
  clear(): void {
    this.metrics = []
  }
}

// Export singleton instance
export const kdsPerformanceMonitor = new PerformanceMonitor()

// React hook for performance monitoring
export function usePerformanceMonitor() {
  return {
    measureRender: (orderCount: number, callback: () => void) => 
      kdsPerformanceMonitor.measureRender(orderCount, callback),
    measureUpdate: (orderCount: number, callback: () => Promise<void>) => 
      kdsPerformanceMonitor.measureUpdate(orderCount, callback),
    getMetrics: () => kdsPerformanceMonitor.getAverageMetrics(),
    getWarnings: () => kdsPerformanceMonitor.getWarnings(),
    clear: () => kdsPerformanceMonitor.clear()
  }
}