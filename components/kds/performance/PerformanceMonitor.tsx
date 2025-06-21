'use client'

import React, { memo, useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  Clock, 
  Cpu, 
  Eye, 
  EyeOff, 
  MemoryStick, 
  Monitor,
  Zap
} from 'lucide-react'

interface PerformanceMetrics {
  fps: number
  renderTime: number
  memoryUsage: number
  componentCount: number
  virtualizedItems: number
  totalItems: number
  scrollPosition: number
  isVirtualizing: boolean
}

interface PerformanceMonitorProps {
  enabled?: boolean
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  showDetailedMetrics?: boolean
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void
}

// FPS counter hook
const useFPS = () => {
  const [fps, setFps] = useState(0)
  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())
  
  useEffect(() => {
    let animationId: number
    
    const measureFPS = () => {
      frameCount.current++
      const currentTime = performance.now()
      
      if (currentTime >= lastTime.current + 1000) {
        setFps(Math.round((frameCount.current * 1000) / (currentTime - lastTime.current)))
        frameCount.current = 0
        lastTime.current = currentTime
      }
      
      animationId = requestAnimationFrame(measureFPS)
    }
    
    animationId = requestAnimationFrame(measureFPS)
    
    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [])
  
  return fps
}

// Memory usage hook
const useMemoryUsage = () => {
  const [memoryUsage, setMemoryUsage] = useState(0)
  
  useEffect(() => {
    const updateMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        setMemoryUsage(Math.round(memory.usedJSHeapSize / 1024 / 1024))
      }
    }
    
    updateMemory()
    const interval = setInterval(updateMemory, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  return memoryUsage
}

// Render time measurement hook
const useRenderTime = () => {
  const [renderTime, setRenderTime] = useState(0)
  const renderStart = useRef(0)
  
  useEffect(() => {
    renderStart.current = performance.now()
  })
  
  useEffect(() => {
    const endTime = performance.now()
    setRenderTime(endTime - renderStart.current)
  })
  
  return renderTime
}

// Component count observer
const useComponentCount = () => {
  const [componentCount, setComponentCount] = useState(0)
  
  useEffect(() => {
    const updateCount = () => {
      const elements = document.querySelectorAll('[data-component]')
      setComponentCount(elements.length)
    }
    
    updateCount()
    const interval = setInterval(updateCount, 2000)
    
    return () => clearInterval(interval)
  }, [])
  
  return componentCount
}

// Virtualization metrics
const useVirtualizationMetrics = () => {
  const [metrics, setMetrics] = useState({
    virtualizedItems: 0,
    totalItems: 0,
    isVirtualizing: false
  })
  
  useEffect(() => {
    const updateMetrics = () => {
      const virtualLists = document.querySelectorAll('[data-virtualized="true"]')
      const totalVirtualized = Array.from(virtualLists).reduce((acc, list) => {
        const visible = list.querySelectorAll('[data-virtual-item]').length
        return acc + visible
      }, 0)
      
      const totalItems = Array.from(virtualLists).reduce((acc, list) => {
        const total = parseInt(list.getAttribute('data-total-items') || '0')
        return acc + total
      }, 0)
      
      setMetrics({
        virtualizedItems: totalVirtualized,
        totalItems,
        isVirtualizing: virtualLists.length > 0
      })
    }
    
    updateMetrics()
    const interval = setInterval(updateMetrics, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  return metrics
}

// Main performance monitor component
export const PerformanceMonitor = memo<PerformanceMonitorProps>(({
  enabled = process.env.NODE_ENV === 'development',
  position = 'top-right',
  showDetailedMetrics = false,
  onMetricsUpdate
}) => {
  const [isVisible, setIsVisible] = useState(enabled)
  const [isDetailedView, setIsDetailedView] = useState(showDetailedMetrics)
  
  const fps = useFPS()
  const memoryUsage = useMemoryUsage()
  const renderTime = useRenderTime()
  const componentCount = useComponentCount()
  const virtualizationMetrics = useVirtualizationMetrics()
  
  const metrics: PerformanceMetrics = {
    fps,
    renderTime,
    memoryUsage,
    componentCount,
    virtualizedItems: virtualizationMetrics.virtualizedItems,
    totalItems: virtualizationMetrics.totalItems,
    scrollPosition: window.scrollY,
    isVirtualizing: virtualizationMetrics.isVirtualizing
  }
  
  useEffect(() => {
    if (onMetricsUpdate) {
      onMetricsUpdate(metrics)
    }
  }, [metrics, onMetricsUpdate])
  
  if (!enabled || !isVisible) {
    return null
  }
  
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  }
  
  const getFPSColor = (fps: number) => {
    if (fps >= 55) {return 'text-green-600'}
    if (fps >= 30) {return 'text-yellow-600'}
    return 'text-red-600'
  }
  
  const getMemoryColor = (memory: number) => {
    if (memory < 50) {return 'text-green-600'}
    if (memory < 100) {return 'text-yellow-600'}
    return 'text-red-600'
  }
  
  const getRenderTimeColor = (time: number) => {
    if (time < 16) {return 'text-green-600'}
    if (time < 33) {return 'text-yellow-600'}
    return 'text-red-600'
  }
  
  if (!isDetailedView) {
    // Compact view
    return (
      <div className={`fixed ${positionClasses[position]} z-50`}>
        <Card className="bg-black/80 text-white border-gray-600 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-3 text-sm font-mono">
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                <span className={getFPSColor(fps)}>{fps} FPS</span>
              </div>
              <div className="flex items-center gap-1">
                <MemoryStick className="h-3 w-3" />
                <span className={getMemoryColor(memoryUsage)}>{memoryUsage}MB</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className={getRenderTimeColor(renderTime)}>{renderTime.toFixed(1)}ms</span>
              </div>
              {virtualizationMetrics.isVirtualizing && (
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-blue-400" />
                  <span className="text-blue-400">Virtual</span>
                </div>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsDetailedView(true)}
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
              >
                <Eye className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
              >
                <EyeOff className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Detailed view
  return (
    <div className={`fixed ${positionClasses[position]} z-50 w-80`}>
      <Card className="bg-black/90 text-white border-gray-600 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Performance Monitor
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsDetailedView(false)}
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
              >
                <EyeOff className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
              >
                ✕
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* FPS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Frame Rate
              </span>
              <span className={`font-mono ${getFPSColor(fps)}`}>
                {fps} FPS
              </span>
            </div>
            <Progress 
              value={Math.min(fps / 60 * 100, 100)} 
              className="h-1"
            />
          </div>
          
          {/* Memory Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <MemoryStick className="h-3 w-3" />
                Memory Usage
              </span>
              <span className={`font-mono ${getMemoryColor(memoryUsage)}`}>
                {memoryUsage} MB
              </span>
            </div>
            <Progress 
              value={Math.min(memoryUsage / 200 * 100, 100)} 
              className="h-1"
            />
          </div>
          
          {/* Render Time */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Render Time
              </span>
              <span className={`font-mono ${getRenderTimeColor(renderTime)}`}>
                {renderTime.toFixed(1)} ms
              </span>
            </div>
            <Progress 
              value={Math.min(renderTime / 50 * 100, 100)} 
              className="h-1"
            />
          </div>
          
          {/* Component Count */}
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <Cpu className="h-3 w-3" />
              Components
            </span>
            <span className="font-mono text-blue-400">
              {componentCount}
            </span>
          </div>
          
          {/* Virtualization Status */}
          {virtualizationMetrics.isVirtualizing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-blue-400" />
                  Virtualization
                </span>
                <Badge variant="secondary" className="text-xs">
                  Active
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Rendered Items</span>
                <span className="font-mono">
                  {virtualizationMetrics.virtualizedItems} / {virtualizationMetrics.totalItems}
                </span>
              </div>
              <Progress 
                value={virtualizationMetrics.totalItems > 0 
                  ? (virtualizationMetrics.virtualizedItems / virtualizationMetrics.totalItems) * 100 
                  : 0
                } 
                className="h-1"
              />
            </div>
          )}
          
          {/* Performance Status */}
          <div className="pt-2 border-t border-gray-600">
            <div className="flex items-center justify-between text-xs">
              <span>Overall Status</span>
              <Badge 
                variant={fps >= 55 && memoryUsage < 100 && renderTime < 16 ? 'default' : 'destructive'}
                className="text-xs"
              >
                {fps >= 55 && memoryUsage < 100 && renderTime < 16 ? 'Optimal' : 'Needs Attention'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

PerformanceMonitor.displayName = 'PerformanceMonitor'

// Performance test utilities
export const performanceTest = {
  measureRenderTime: async (component: React.ComponentType, props: any = {}) => {
    const start = performance.now()
    // This would need to be implemented with a testing library
    const end = performance.now()
    return end - start
  },
  
  simulateHighLoad: (itemCount: number = 1000) => {
    const items = Array.from({ length: itemCount }, (_, i) => ({
      id: `test-${i}`,
      name: `Test Item ${i}`,
      value: Math.random() * 100
    }))
    return items
  },
  
  benchmarkVirtualization: (itemCount: number) => {
    console.time(`Virtualization-${itemCount}`)
    // Simulate virtualization setup
    console.timeEnd(`Virtualization-${itemCount}`)
  }
}

// Performance context for global monitoring
export const PerformanceContext = React.createContext<{
  metrics: PerformanceMetrics | null
  isMonitoring: boolean
  startMonitoring: () => void
  stopMonitoring: () => void
}>({
  metrics: null,
  isMonitoring: false,
  startMonitoring: () => {},
  stopMonitoring: () => {}
})

export const usePerformanceMonitoring = () => {
  const context = React.useContext(PerformanceContext)
  if (!context) {
    throw new Error('usePerformanceMonitoring must be used within PerformanceProvider')
  }
  return context
}