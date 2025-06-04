'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Activity, 
  Clock, 
  Database, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Refresh,
  TrendingUp,
  TrendingDown,
  Server,
  Zap,
  Users,
  BarChart3
} from 'lucide-react'

interface PerformanceMetrics {
  timestamp: string
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    checks: {
      database: { status: string; responseTime?: number; message: string }
      auth: { status: string; responseTime?: number; message: string }
      openai: { status: string; responseTime?: number; message: string }
      storage: { status: string; responseTime?: number; message: string }
      realtime: { status: string; responseTime?: number; message: string }
    }
  }
  performance: {
    responseTime: number
    uptime: number
    memoryUsage: {
      used: number
      total: number
      external: number
      heapUsed: number
      heapTotal: number
    }
  }
  system: {
    nodeVersion?: string
    platform?: string
    cpuUsage?: number
    activeConnections?: number
  }
  deployment: {
    vercelEnv?: string
    region?: string
    gitCommit?: string
  }
}

interface MetricsHistory {
  timestamps: string[]
  responseTime: number[]
  memoryUsage: number[]
  errors: number[]
}

const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [history, setHistory] = useState<MetricsHistory>({
    timestamps: [],
    responseTime: [],
    memoryUsage: [],
    errors: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  const fetchMetrics = async () => {
    try {
      setError(null)
      const response = await fetch('/api/health')
      const data = await response.json()
      
      setMetrics({
        timestamp: data.timestamp,
        health: {
          status: data.status,
          checks: data.checks
        },
        performance: {
          responseTime: data.performance.responseTime,
          uptime: data.performance.uptime,
          memoryUsage: {
            used: data.performance.memoryUsage.rss || 0,
            total: data.performance.memoryUsage.heapTotal || 0,
            external: data.performance.memoryUsage.external || 0,
            heapUsed: data.performance.memoryUsage.heapUsed || 0,
            heapTotal: data.performance.memoryUsage.heapTotal || 0
          }
        },
        system: {
          nodeVersion: process.version,
          platform: typeof window !== 'undefined' ? navigator.platform : 'server',
          activeConnections: 0 // Would come from server metrics
        },
        deployment: data.deployment
      })

      // Update history
      setHistory(prev => {
        const newHistory = {
          timestamps: [...prev.timestamps, data.timestamp].slice(-20),
          responseTime: [...prev.responseTime, data.performance.responseTime].slice(-20),
          memoryUsage: [...prev.memoryUsage, data.performance.memoryUsage.heapUsed || 0].slice(-20),
          errors: [...prev.errors, Object.values(data.checks).filter((check: any) => check.status === 'fail').length].slice(-20)
        }
        return newHistory
      })
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, 30000) // 30 seconds
      setRefreshInterval(interval)
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval)
        setRefreshInterval(null)
      }
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [autoRefresh])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warn':
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'fail':
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
      case 'healthy':
        return 'bg-green-100 text-green-800'
      case 'warn':
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800'
      case 'fail':
      case 'unhealthy':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="border-red-200">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load performance metrics: {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchMetrics}
            className="ml-2"
          >
            <Refresh className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!metrics) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <p className="text-muted-foreground">
            Last updated: {new Date(metrics.timestamp).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'text-green-500' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchMetrics}>
            <Refresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(metrics.health.status)}
            System Health Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge className={getStatusColor(metrics.health.status)}>
              {metrics.health.status.toUpperCase()}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Response Time: {metrics.performance.responseTime}ms
            </span>
            <span className="text-sm text-muted-foreground">
              Uptime: {formatUptime(metrics.performance.uptime)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Response Time */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.performance.responseTime}ms</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.performance.responseTime < 200 ? 'Excellent' : 
                   metrics.performance.responseTime < 500 ? 'Good' : 
                   metrics.performance.responseTime < 1000 ? 'Fair' : 'Poor'}
                </p>
              </CardContent>
            </Card>

            {/* Memory Usage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBytes(metrics.performance.memoryUsage.heapUsed)}</div>
                <div className="mt-2">
                  <Progress 
                    value={(metrics.performance.memoryUsage.heapUsed / metrics.performance.memoryUsage.heapTotal) * 100} 
                    className="h-2"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatBytes(metrics.performance.memoryUsage.heapTotal)} total
                </p>
              </CardContent>
            </Card>

            {/* Uptime */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatUptime(metrics.performance.uptime)}</div>
                <p className="text-xs text-muted-foreground">
                  Since last restart
                </p>
              </CardContent>
            </Card>

            {/* Service Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Services</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.values(metrics.health.checks).filter(check => check.status === 'pass').length}/
                  {Object.values(metrics.health.checks).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Services healthy
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(metrics.health.checks).map(([name, check]) => (
              <Card key={name}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {getStatusIcon(check.status)}
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status:</span>
                      <Badge className={getStatusColor(check.status)}>
                        {check.status.toUpperCase()}
                      </Badge>
                    </div>
                    {check.responseTime && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Response Time:</span>
                        <span className="text-sm font-mono">{check.responseTime}ms</span>
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      {check.message}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Memory Details */}
            <Card>
              <CardHeader>
                <CardTitle>Memory Usage Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Heap Used:</span>
                    <span className="font-mono">{formatBytes(metrics.performance.memoryUsage.heapUsed)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Heap Total:</span>
                    <span className="font-mono">{formatBytes(metrics.performance.memoryUsage.heapTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>External:</span>
                    <span className="font-mono">{formatBytes(metrics.performance.memoryUsage.external)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>RSS:</span>
                    <span className="font-mono">{formatBytes(metrics.performance.memoryUsage.used)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Trends</CardTitle>
                <CardDescription>
                  Last {history.timestamps.length} data points
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>Avg Response Time:</span>
                      <span className="font-mono">
                        {history.responseTime.length > 0 ? 
                          Math.round(history.responseTime.reduce((a, b) => a + b, 0) / history.responseTime.length) + 'ms' : 
                          'No data'
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>Error Rate:</span>
                      <span className="font-mono">
                        {history.errors.length > 0 ? 
                          Math.round((history.errors.reduce((a, b) => a + b, 0) / (history.errors.length * 5)) * 100) + '%' : 
                          '0%'
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Memory Trend:</span>
                      <span className="flex items-center gap-1">
                        {history.memoryUsage.length > 1 && 
                         history.memoryUsage[history.memoryUsage.length - 1] > history.memoryUsage[0] ? (
                          <TrendingUp className="h-3 w-3 text-red-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-green-500" />
                        )}
                        <span className="font-mono text-xs">
                          {history.memoryUsage.length > 1 ? 'Tracked' : 'No data'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="deployment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Environment:</span>
                    <Badge variant="outline">
                      {metrics.deployment.vercelEnv || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Region:</span>
                    <span className="font-mono">{metrics.deployment.region || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Git Commit:</span>
                    <span className="font-mono text-xs">
                      {metrics.deployment.gitCommit ? 
                        metrics.deployment.gitCommit.substring(0, 8) : 
                        'Unknown'
                      }
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Node Version:</span>
                    <span className="font-mono">{metrics.system.nodeVersion || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Platform:</span>
                    <span className="font-mono">{metrics.system.platform || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Last Health Check:</span>
                    <span className="font-mono text-xs">
                      {new Date(metrics.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default PerformanceDashboard