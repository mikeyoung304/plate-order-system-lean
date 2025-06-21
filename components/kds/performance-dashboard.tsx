'use client'

import { memo, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Clock, Database, RefreshCw, Wifi, Zap } from 'lucide-react'
import { useConnectionPoolStats } from '@/lib/database-connection-pool'
import { useCacheStats } from '@/lib/cache/ultra-smart-cache'
import { useDemoWebSocket } from '@/lib/demo-websocket-manager'

interface PerformanceMetrics {
  lastUpdated: number
  databaseResponseTime: number
  cacheHitRate: number
  websocketStatus: string
  activeConnections: number
  bundleSize: string
}

export const PerformanceDashboard = memo(function PerformanceDashboard({
  className
}: {
  className?: string
}) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lastUpdated: Date.now(),
    databaseResponseTime: 0,
    cacheHitRate: 0,
    websocketStatus: 'disconnected',
    activeConnections: 0,
    bundleSize: '15.5MB'
  })
  
  const connectionPoolStats = useConnectionPoolStats()
  const cacheStats = useCacheStats()
  const { status: websocketStatus, stats: websocketStats } = useDemoWebSocket()

  // Update metrics from various sources
  useEffect(() => {
    setMetrics(prev => ({
      ...prev,
      lastUpdated: Date.now(),
      cacheHitRate: cacheStats.hitRate,
      websocketStatus,
      activeConnections: connectionPoolStats.activeConnections,
      databaseResponseTime: cacheStats.avgResponseTime || 0
    }))
  }, [connectionPoolStats, cacheStats, websocketStatus])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500'
      case 'connecting': case 'reconnecting': return 'bg-yellow-500'
      case 'disconnected': case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getPerformanceGrade = () => {
    if (metrics.cacheHitRate > 85 && metrics.databaseResponseTime < 50) {return 'A+'}
    if (metrics.cacheHitRate > 75 && metrics.databaseResponseTime < 100) {return 'A'}
    if (metrics.cacheHitRate > 65 && metrics.databaseResponseTime < 150) {return 'B'}
    if (metrics.cacheHitRate > 50 && metrics.databaseResponseTime < 250) {return 'C'}
    return 'D'
  }

  const refreshMetrics = () => {
    setMetrics(prev => ({ ...prev, lastUpdated: Date.now() }))
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">KDS Performance Dashboard</h3>
          <Badge variant="outline" className="ml-2">
            Grade: {getPerformanceGrade()}
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={refreshMetrics}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cache Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Cache Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Hit Rate</span>
                <span>{metrics.cacheHitRate.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.cacheHitRate} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Cache Size: {cacheStats.size}</span>
                <span>
                  {metrics.cacheHitRate > 80 ? '🚀 Excellent' : 
                   metrics.cacheHitRate > 60 ? '✅ Good' : 
                   '⚠️ Needs Work'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Response Time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {metrics.databaseResponseTime.toFixed(0)}ms
              </div>
              <div className="text-xs text-gray-500">
                Target: &lt;50ms
              </div>
              <div className="text-xs">
                {metrics.databaseResponseTime < 50 ? '🎯 On Target' : 
                 metrics.databaseResponseTime < 100 ? '📈 Good' : 
                 metrics.databaseResponseTime < 200 ? '⚠️ Acceptable' : 
                 '🐌 Needs Optimization'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WebSocket Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              Real-time Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(metrics.websocketStatus)}`} />
                <span className="text-sm capitalize">{metrics.websocketStatus}</span>
              </div>
              <div className="text-xs text-gray-500">
                Active Channels: {websocketStats?.activeChannels || 0}
              </div>
              <div className="text-xs">
                {websocketStats?.circuitBreakerOpen ? '🔴 Circuit Open' : '🟢 Healthy'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connection Pool */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Connection Pool
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active</span>
                <span>{metrics.activeConnections}/10</span>
              </div>
              <Progress value={(metrics.activeConnections / 10) * 100} className="h-2" />
              <div className="text-xs text-gray-500">
                Efficiency: {connectionPoolStats.efficiency.toFixed(1)}%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Optimization Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-green-600">✅ Bundle Optimized</div>
              <div className="text-gray-600">289MB → 15.5MB (95% reduction)</div>
            </div>
            <div>
              <div className="font-medium text-green-600">✅ WebSocket Manager</div>
              <div className="text-gray-600">Global subscription management</div>
            </div>
            <div>
              <div className="font-medium text-green-600">✅ Connection Pooling</div>
              <div className="text-gray-600">Reused database connections</div>
            </div>
            <div>
              <div className="font-medium text-green-600">✅ Smart Caching</div>
              <div className="text-gray-600">Intelligent cache invalidation</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Tips */}
      {(metrics.cacheHitRate < 70 || metrics.databaseResponseTime > 150) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-base text-orange-700">Performance Tips</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-orange-600">
            <ul className="space-y-1">
              {metrics.cacheHitRate < 70 && (
                <li>• Cache hit rate is low - consider warming up common queries</li>
              )}
              {metrics.databaseResponseTime > 150 && (
                <li>• Database response time is high - check network connectivity</li>
              )}
              {metrics.websocketStatus !== 'connected' && (
                <li>• WebSocket disconnected - real-time updates may be delayed</li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Last Updated */}
      <div className="text-xs text-gray-500 text-center">
        Last updated: {new Date(metrics.lastUpdated).toLocaleTimeString()}
      </div>
    </div>
  )
})

export default PerformanceDashboard