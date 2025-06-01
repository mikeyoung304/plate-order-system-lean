'use client'

// DEMO HEALTH MONITORING SYSTEM
// Real-time dashboard for demo status and emergency controls

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Shield,
  Database,
  Mic,
  Wifi,
  Users
} from 'lucide-react'

interface DemoHealthStatus {
  overall: 'healthy' | 'warning' | 'critical'
  lastCheck: string
  systems: {
    database: SystemStatus
    authentication: SystemStatus
    voiceSystem: SystemStatus
    realtime: SystemStatus
    demoData: SystemStatus
  }
  metrics: {
    responseTime: number
    activeConnections: number
    errorRate: number
    demoUsers: number
  }
}

interface SystemStatus {
  status: 'online' | 'degraded' | 'offline'
  message: string
  lastCheck: string
  responseTime?: number
}

const DEMO_SAFE_MODE_KEY = 'demo_safe_mode_enabled'
const HEALTH_CHECK_INTERVAL = 30000 // 30 seconds

export function DemoHealthMonitor() {
  const [healthStatus, setHealthStatus] = useState<DemoHealthStatus | null>(null)
  const [safeMode, setSafeMode] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  // Load safe mode state from localStorage
  useEffect(() => {
    const savedSafeMode = localStorage.getItem(DEMO_SAFE_MODE_KEY)
    setSafeMode(savedSafeMode === 'true')
  }, [])

  // Health check function
  const performHealthCheck = useCallback(async () => {
    setIsChecking(true)
    setLastError(null)

    try {
      const startTime = Date.now()

      // Check API health
      const healthResponse = await fetch('/api/demo/health-check', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      const responseTime = Date.now() - startTime

      if (!healthResponse.ok) {
        throw new Error(`Health check failed: ${healthResponse.status}`)
      }

      const healthData = await healthResponse.json()
      
      setHealthStatus({
        ...healthData,
        metrics: {
          ...healthData.metrics,
          responseTime,
        }
      })

    } catch (error) {
      setLastError(error instanceof Error ? error.message : 'Health check failed')
      
      // Set fallback status
      setHealthStatus({
        overall: 'critical',
        lastCheck: new Date().toISOString(),
        systems: {
          database: { status: 'offline', message: 'Connection failed', lastCheck: new Date().toISOString() },
          authentication: { status: 'offline', message: 'Check failed', lastCheck: new Date().toISOString() },
          voiceSystem: { status: 'offline', message: 'Check failed', lastCheck: new Date().toISOString() },
          realtime: { status: 'offline', message: 'Check failed', lastCheck: new Date().toISOString() },
          demoData: { status: 'offline', message: 'Check failed', lastCheck: new Date().toISOString() },
        },
        metrics: {
          responseTime: 0,
          activeConnections: 0,
          errorRate: 100,
          demoUsers: 0,
        }
      })
    } finally {
      setIsChecking(false)
    }
  }, [])

  // Periodic health checks
  useEffect(() => {
    performHealthCheck()
    const interval = setInterval(performHealthCheck, HEALTH_CHECK_INTERVAL)
    return () => clearInterval(interval)
  }, [performHealthCheck])

  // Safe mode toggle
  const toggleSafeMode = useCallback(() => {
    const newSafeMode = !safeMode
    setSafeMode(newSafeMode)
    localStorage.setItem(DEMO_SAFE_MODE_KEY, newSafeMode.toString())
    
    // Notify the application
    window.dispatchEvent(new CustomEvent('demo-safe-mode-toggle', { 
      detail: { enabled: newSafeMode } 
    }))
  }, [safeMode])

  // Emergency reset
  const emergencyReset = useCallback(async () => {
    try {
      setIsChecking(true)
      const response = await fetch('/api/demo/emergency-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Emergency reset failed')
      }

      // Refresh health status
      await performHealthCheck()
      
      window.dispatchEvent(new CustomEvent('demo-emergency-reset'))
      
    } catch (error) {
      setLastError('Emergency reset failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsChecking(false)
    }
  }, [performHealthCheck])

  // Quick data reset
  const quickDataReset = useCallback(async () => {
    try {
      setIsChecking(true)
      const response = await fetch('/api/demo/quick-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Quick reset failed')
      }

      await performHealthCheck()
      
    } catch (error) {
      setLastError('Quick reset failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsChecking(false)
    }
  }, [performHealthCheck])

  const getStatusIcon = (status: 'online' | 'degraded' | 'offline') => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'offline': return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = (status: 'online' | 'degraded' | 'offline') => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'degraded': return 'bg-yellow-500'
      case 'offline': return 'bg-red-500'
    }
  }

  const getOverallStatusColor = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
    }
  }

  if (!healthStatus) {
    return (
      <Card className="w-full max-w-4xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Checking demo health...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-6xl space-y-6">
      {/* Overall Status Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Demo Health Monitor
            </CardTitle>
            <div className="flex items-center space-x-4">
              <Badge 
                variant={healthStatus.overall === 'healthy' ? 'default' : 'destructive'}
                className={getOverallStatusColor(healthStatus.overall)}
              >
                {healthStatus.overall.toUpperCase()}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={performHealthCheck}
                disabled={isChecking}
              >
                {isChecking ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {lastError && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{lastError}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{healthStatus.metrics.responseTime}ms</div>
              <div className="text-sm text-gray-500">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{healthStatus.metrics.activeConnections}</div>
              <div className="text-sm text-gray-500">Active Connections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{healthStatus.metrics.errorRate}%</div>
              <div className="text-sm text-gray-500">Error Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{healthStatus.metrics.demoUsers}</div>
              <div className="text-sm text-gray-500">Demo Users</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Database Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm">
              <Database className="h-4 w-4 mr-2" />
              Database
              {getStatusIcon(healthStatus.systems.database.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className={`h-2 rounded-full ${getStatusColor(healthStatus.systems.database.status)}`}></div>
              <p className="text-xs text-gray-600">{healthStatus.systems.database.message}</p>
              {healthStatus.systems.database.responseTime && (
                <p className="text-xs text-gray-500">{healthStatus.systems.database.responseTime}ms</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Authentication Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm">
              <Shield className="h-4 w-4 mr-2" />
              Authentication
              {getStatusIcon(healthStatus.systems.authentication.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className={`h-2 rounded-full ${getStatusColor(healthStatus.systems.authentication.status)}`}></div>
              <p className="text-xs text-gray-600">{healthStatus.systems.authentication.message}</p>
            </div>
          </CardContent>
        </Card>

        {/* Voice System Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm">
              <Mic className="h-4 w-4 mr-2" />
              Voice System
              {getStatusIcon(healthStatus.systems.voiceSystem.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className={`h-2 rounded-full ${getStatusColor(healthStatus.systems.voiceSystem.status)}`}></div>
              <p className="text-xs text-gray-600">{healthStatus.systems.voiceSystem.message}</p>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm">
              <Wifi className="h-4 w-4 mr-2" />
              Real-time
              {getStatusIcon(healthStatus.systems.realtime.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className={`h-2 rounded-full ${getStatusColor(healthStatus.systems.realtime.status)}`}></div>
              <p className="text-xs text-gray-600">{healthStatus.systems.realtime.message}</p>
            </div>
          </CardContent>
        </Card>

        {/* Demo Data Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm">
              <Users className="h-4 w-4 mr-2" />
              Demo Data
              {getStatusIcon(healthStatus.systems.demoData.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className={`h-2 rounded-full ${getStatusColor(healthStatus.systems.demoData.status)}`}></div>
              <p className="text-xs text-gray-600">{healthStatus.systems.demoData.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Demo Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              variant={safeMode ? "destructive" : "outline"}
              onClick={toggleSafeMode}
              className="flex items-center"
            >
              <Shield className="h-4 w-4 mr-2" />
              {safeMode ? 'Disable Safe Mode' : 'Enable Safe Mode'}
            </Button>
            
            <Button
              variant="secondary"
              onClick={quickDataReset}
              disabled={isChecking}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Quick Reset
            </Button>
            
            <Button
              variant="destructive"
              onClick={emergencyReset}
              disabled={isChecking}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Emergency Reset
            </Button>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            <p><strong>Safe Mode:</strong> Prevents destructive operations and provides graceful fallbacks</p>
            <p><strong>Quick Reset:</strong> Resets demo orders and sessions (preserves users)</p>
            <p><strong>Emergency Reset:</strong> Full system reset including demo data</p>
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date(healthStatus.lastCheck).toLocaleString()}
      </div>
    </div>
  )
}