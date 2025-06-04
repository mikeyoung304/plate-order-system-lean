'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Clock, 
  Zap, 
  AlertTriangle, 
  CheckCircle,
  Refresh,
  Calendar,
  BarChart3,
  PieChart,
  Settings
} from 'lucide-react'

interface OpenAIUsageData {
  today: {
    requests: number
    tokens: number
    cost: number
    cacheHitRate: number
  }
  thisWeek: {
    requests: number
    tokens: number
    cost: number
    avgCacheHitRate: number
  }
  thisMonth: {
    requests: number
    tokens: number
    cost: number
    avgCacheHitRate: number
  }
  budget: {
    daily: number
    weekly: number
    monthly: number
  }
  trends: {
    dailyCosts: { date: string; cost: number; requests: number }[]
    hourlyDistribution: { hour: number; requests: number; cost: number }[]
    cachePerformance: { date: string; hitRate: number; savings: number }[]
  }
  topEndpoints: {
    endpoint: string
    requests: number
    cost: number
    avgResponseTime: number
  }[]
  alerts: {
    budgetWarnings: boolean
    anomalies: boolean
    lowCacheHitRate: boolean
  }
}

const OpenAICostDashboard: React.FC = () => {
  const [data, setData] = useState<OpenAIUsageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  const fetchUsageData = async () => {
    try {
      setError(null)
      const response = await fetch('/api/openai/usage')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch usage data: ${response.status}`)
      }
      
      const usageData = await response.json()
      setData(usageData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch usage data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsageData()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchUsageData, 60000) // 1 minute
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

  const formatCurrency = (cents: number): string => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const getBudgetStatus = (used: number, budget: number) => {
    const percentage = (used / budget) * 100
    if (percentage >= 90) return { color: 'red', status: 'Critical' }
    if (percentage >= 75) return { color: 'yellow', status: 'Warning' }
    return { color: 'green', status: 'Good' }
  }

  const getCacheHitRateStatus = (rate: number) => {
    if (rate >= 80) return { color: 'green', status: 'Excellent' }
    if (rate >= 60) return { color: 'yellow', status: 'Good' }
    if (rate >= 40) return { color: 'orange', status: 'Fair' }
    return { color: 'red', status: 'Poor' }
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
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchUsageData}
            className="ml-2"
          >
            <Refresh className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!data) return null

  const dailyBudgetStatus = getBudgetStatus(data.today.cost, data.budget.daily)
  const weeklyBudgetStatus = getBudgetStatus(data.thisWeek.cost, data.budget.weekly)
  const monthlyBudgetStatus = getBudgetStatus(data.thisMonth.cost, data.budget.monthly)
  const cacheStatus = getCacheHitRateStatus(data.today.cacheHitRate)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">OpenAI Cost Monitoring</h2>
          <p className="text-muted-foreground">
            Track usage, costs, and optimization opportunities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Clock className={`h-4 w-4 mr-2 ${autoRefresh ? 'text-green-500' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchUsageData}>
            <Refresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {(data.alerts.budgetWarnings || data.alerts.anomalies || data.alerts.lowCacheHitRate) && (
        <div className="space-y-2">
          {data.alerts.budgetWarnings && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                You're approaching your daily budget limit. Consider optimizing cache usage or increasing budget.
              </AlertDescription>
            </Alert>
          )}
          {data.alerts.lowCacheHitRate && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription>
                Cache hit rate is below 60%. Review audio preprocessing and caching strategies.
              </AlertDescription>
            </Alert>
          )}
          {data.alerts.anomalies && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                Unusual spending pattern detected. Review recent usage for potential issues.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.today.cost)}</div>
            <div className="mt-2">
              <Progress 
                value={(data.today.cost / data.budget.daily) * 100} 
                className="h-2"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(data.budget.daily)} budget • {dailyBudgetStatus.status}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Budget</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.thisWeek.cost)}</div>
            <div className="mt-2">
              <Progress 
                value={(data.thisWeek.cost / data.budget.weekly) * 100} 
                className="h-2"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(data.budget.weekly)} budget • {weeklyBudgetStatus.status}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.thisMonth.cost)}</div>
            <div className="mt-2">
              <Progress 
                value={(data.thisMonth.cost / data.budget.monthly) * 100} 
                className="h-2"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(data.budget.monthly)} budget • {monthlyBudgetStatus.status}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Today's Usage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Requests</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(data.today.requests)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(data.today.tokens)} tokens used
                </p>
              </CardContent>
            </Card>

            {/* Cache Hit Rate */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
                <CheckCircle className={`h-4 w-4 text-${cacheStatus.color}-500`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.today.cacheHitRate.toFixed(1)}%</div>
                <div className="mt-2">
                  <Progress 
                    value={data.today.cacheHitRate} 
                    className="h-2"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {cacheStatus.status} performance
                </p>
              </CardContent>
            </Card>

            {/* Weekly Trend */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Weekly Trend</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.thisWeek.cost)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(data.thisWeek.requests)} requests this week
                </p>
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Trend</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.thisMonth.cost)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(data.thisMonth.requests)} requests this month
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Daily Cost Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Cost Trend</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.trends.dailyCosts.slice(-7).map((day, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{new Date(day.date).toLocaleDateString()}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{formatCurrency(day.cost)}</span>
                        <span className="text-muted-foreground">({day.requests} req)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Hourly Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Hourly Distribution</CardTitle>
                <CardDescription>Today's usage pattern</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.trends.hourlyDistribution.slice(0, 12).map((hour, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{hour.hour}:00</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min((hour.requests / Math.max(...data.trends.hourlyDistribution.map(h => h.requests))) * 100, 100)}%` 
                            }}
                          />
                        </div>
                        <span className="font-mono w-12 text-right">{hour.requests}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Cache Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Cache Performance</CardTitle>
                <CardDescription>Potential cost savings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Current Hit Rate:</span>
                    <Badge className={`bg-${cacheStatus.color}-100 text-${cacheStatus.color}-800`}>
                      {data.today.cacheHitRate.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Potential Savings (80% target):</span>
                    <span className="font-mono">
                      {formatCurrency(data.today.cost * ((80 - data.today.cacheHitRate) / 100))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Weekly Savings Potential:</span>
                    <span className="font-mono">
                      {formatCurrency(data.thisWeek.cost * ((80 - data.thisWeek.avgCacheHitRate) / 100))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Optimization Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>Ways to reduce costs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.today.cacheHitRate < 70 && (
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-medium">Improve cache hit rate</div>
                        <div className="text-muted-foreground">
                          Review audio preprocessing to generate more consistent hashes
                        </div>
                      </div>
                    </div>
                  )}
                  {data.today.cost > data.budget.daily * 0.8 && (
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-medium">Monitor daily usage</div>
                        <div className="text-muted-foreground">
                          Consider implementing rate limiting or request batching
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium">Use batch processing</div>
                      <div className="text-muted-foreground">
                        Group multiple requests to reduce API overhead
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Endpoints by Usage</CardTitle>
              <CardDescription>Most expensive API endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.topEndpoints.map((endpoint, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{endpoint.endpoint}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatNumber(endpoint.requests)} requests • Avg: {endpoint.avgResponseTime}ms
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono">{formatCurrency(endpoint.cost)}</div>
                      <div className="text-sm text-muted-foreground">
                        {((endpoint.cost / data.today.cost) * 100).toFixed(1)}% of total
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default OpenAICostDashboard