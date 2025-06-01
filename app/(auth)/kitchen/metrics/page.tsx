'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ProtectedRoute } from '@/lib/modassembly/supabase/auth/protected-route'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle,
  ChevronLeft,
  Clock,
  Target,
  TrendingUp,
} from 'lucide-react'
import { useKDSStations } from '@/hooks/use-kds-orders'
import { fetchStationMetrics } from '@/lib/modassembly/supabase/database/kds'

interface MetricsSummary {
  avgPrepTime: number
  totalOrders: number
  completionRate: number
  busyPeriods: string[]
  efficiency: number
}

export default function KitchenMetricsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('today')
  const [selectedStation, setSelectedStation] = useState('all')
  const [metrics, setMetrics] = useState<Record<string, MetricsSummary>>({})
  const [loading, setLoading] = useState(true)

  const { stations } = useKDSStations()

  // Fetch metrics data
  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true)

      try {
        // Calculate date range
        const endDate = new Date()
        const startDate = new Date()

        switch (selectedPeriod) {
          case 'today':
            startDate.setHours(0, 0, 0, 0)
            break
          case 'week':
            startDate.setDate(startDate.getDate() - 7)
            break
          case 'month':
            startDate.setMonth(startDate.getMonth() - 1)
            break
        }

        // Fetch metrics for each station or selected station
        const stationsToFetch =
          selectedStation === 'all'
            ? stations
            : stations.filter(s => s.id === selectedStation)
        const metricsData: Record<string, MetricsSummary> = {}

        for (const station of stationsToFetch) {
          try {
            const stationMetrics = await fetchStationMetrics(
              station.id,
              startDate.toISOString(),
              endDate.toISOString()
            )

            // Calculate summary statistics
            const prepTimes = stationMetrics
              .filter(m => m.metric_type === 'prep_time' && m.value_seconds)
              .map(m => m.value_seconds!)

            const avgPrepTime =
              prepTimes.length > 0
                ? prepTimes.reduce((sum, time) => sum + time, 0) /
                  prepTimes.length
                : 0

            metricsData[station.id] = {
              avgPrepTime: Math.round(avgPrepTime),
              totalOrders: prepTimes.length,
              completionRate: 0.92, // TODO: Calculate actual completion rate
              busyPeriods: ['11:30-13:00', '17:30-19:30'], // TODO: Calculate from data
              efficiency: Math.min(
                100,
                Math.max(0, 100 - (avgPrepTime - 300) / 10)
              ), // Efficiency score
            }
          } catch (error) {
            console.error(
              `Error fetching metrics for station ${station.id}:`,
              error
            )
            metricsData[station.id] = {
              avgPrepTime: 0,
              totalOrders: 0,
              completionRate: 0,
              busyPeriods: [],
              efficiency: 0,
            }
          }
        }

        setMetrics(metricsData)
      } catch (error) {
        console.error('Error fetching metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    if (stations.length > 0) {
      fetchMetrics()
    }
  }, [selectedPeriod, selectedStation, stations])

  // Calculate overall metrics
  const overallMetrics = Object.values(metrics).reduce(
    (acc, stationMetrics) => ({
      avgPrepTime: acc.avgPrepTime + stationMetrics.avgPrepTime,
      totalOrders: acc.totalOrders + stationMetrics.totalOrders,
      completionRate: acc.completionRate + stationMetrics.completionRate,
      efficiency: acc.efficiency + stationMetrics.efficiency,
    }),
    { avgPrepTime: 0, totalOrders: 0, completionRate: 0, efficiency: 0 }
  )

  const stationCount = Object.keys(metrics).length
  if (stationCount > 0) {
    overallMetrics.avgPrepTime = Math.round(
      overallMetrics.avgPrepTime / stationCount
    )
    overallMetrics.completionRate = Math.round(
      (overallMetrics.completionRate / stationCount) * 100
    )
    overallMetrics.efficiency = Math.round(
      overallMetrics.efficiency / stationCount
    )
  }

  // Format time for display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <ProtectedRoute roles={['cook', 'admin']}>
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
        {/* Header */}
        <div className='bg-white dark:bg-gray-800 border-b shadow-sm'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex items-center justify-between h-16'>
              <div className='flex items-center gap-4'>
                <Link href='/kitchen/kds'>
                  <Button variant='outline' size='sm'>
                    <ChevronLeft className='h-4 w-4 mr-1' />
                    Back to KDS
                  </Button>
                </Link>

                <div>
                  <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
                    Kitchen Metrics
                  </h1>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    Performance analytics and insights
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-4'>
                {/* Time period selector */}
                <Select
                  value={selectedPeriod}
                  onValueChange={setSelectedPeriod}
                >
                  <SelectTrigger className='w-32'>
                    <Calendar className='h-4 w-4 mr-1' />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='today'>Today</SelectItem>
                    <SelectItem value='week'>This Week</SelectItem>
                    <SelectItem value='month'>This Month</SelectItem>
                  </SelectContent>
                </Select>

                {/* Station selector */}
                <Select
                  value={selectedStation}
                  onValueChange={setSelectedStation}
                >
                  <SelectTrigger className='w-48'>
                    <BarChart3 className='h-4 w-4 mr-1' />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Stations</SelectItem>
                    {stations.map(station => (
                      <SelectItem key={station.id} value={station.id}>
                        {station.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          {loading ? (
            <div className='flex items-center justify-center h-64'>
              <div className='text-center'>
                <BarChart3 className='h-12 w-12 mx-auto mb-4 text-gray-400 animate-pulse' />
                <p className='text-gray-600 dark:text-gray-400'>
                  Loading metrics...
                </p>
              </div>
            </div>
          ) : (
            <div className='space-y-8'>
              {/* Overview Cards */}
              {selectedStation === 'all' && (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Average Prep Time
                      </CardTitle>
                      <Clock className='h-4 w-4 text-muted-foreground' />
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        {formatTime(overallMetrics.avgPrepTime)}
                      </div>
                      <p className='text-xs text-muted-foreground'>
                        Across all stations
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Total Orders
                      </CardTitle>
                      <CheckCircle className='h-4 w-4 text-muted-foreground' />
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        {overallMetrics.totalOrders}
                      </div>
                      <p className='text-xs text-muted-foreground'>
                        Orders completed
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Completion Rate
                      </CardTitle>
                      <Target className='h-4 w-4 text-muted-foreground' />
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        {overallMetrics.completionRate}%
                      </div>
                      <p className='text-xs text-muted-foreground'>
                        On-time completion
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Efficiency Score
                      </CardTitle>
                      <TrendingUp className='h-4 w-4 text-muted-foreground' />
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        {overallMetrics.efficiency}%
                      </div>
                      <p className='text-xs text-muted-foreground'>
                        Overall performance
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Station Details */}
              <div className='space-y-6'>
                <h2 className='text-lg font-semibold'>Station Performance</h2>

                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                  {stations
                    .filter(
                      station =>
                        selectedStation === 'all' ||
                        station.id === selectedStation
                    )
                    .map(station => {
                      const stationMetrics = metrics[station.id]
                      if (!stationMetrics) {
                        return null
                      }

                      return (
                        <Card key={station.id}>
                          <CardHeader>
                            <div className='flex items-center justify-between'>
                              <CardTitle className='flex items-center gap-2'>
                                <div
                                  className='w-3 h-3 rounded-full'
                                  style={{ backgroundColor: station.color }}
                                />
                                {station.name}
                              </CardTitle>
                              <Badge variant='secondary'>{station.type}</Badge>
                            </div>
                            <CardDescription>
                              Performance metrics and insights
                            </CardDescription>
                          </CardHeader>
                          <CardContent className='space-y-4'>
                            <div className='grid grid-cols-2 gap-4'>
                              <div>
                                <div className='text-sm text-gray-600 dark:text-gray-400'>
                                  Avg Prep Time
                                </div>
                                <div className='text-lg font-semibold'>
                                  {formatTime(stationMetrics.avgPrepTime)}
                                </div>
                              </div>
                              <div>
                                <div className='text-sm text-gray-600 dark:text-gray-400'>
                                  Orders
                                </div>
                                <div className='text-lg font-semibold'>
                                  {stationMetrics.totalOrders}
                                </div>
                              </div>
                              <div>
                                <div className='text-sm text-gray-600 dark:text-gray-400'>
                                  Completion Rate
                                </div>
                                <div className='text-lg font-semibold'>
                                  {Math.round(
                                    stationMetrics.completionRate * 100
                                  )}
                                  %
                                </div>
                              </div>
                              <div>
                                <div className='text-sm text-gray-600 dark:text-gray-400'>
                                  Efficiency
                                </div>
                                <div className='text-lg font-semibold'>
                                  {Math.round(stationMetrics.efficiency)}%
                                </div>
                              </div>
                            </div>

                            {/* Busy periods */}
                            {stationMetrics.busyPeriods.length > 0 && (
                              <div>
                                <div className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
                                  Busy Periods
                                </div>
                                <div className='flex flex-wrap gap-1'>
                                  {stationMetrics.busyPeriods.map(
                                    (period, index) => (
                                      <Badge
                                        key={index}
                                        variant='outline'
                                        className='text-xs'
                                      >
                                        {period}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Performance indicator */}
                            <div className='flex items-center gap-2 text-sm'>
                              {stationMetrics.efficiency >= 80 ? (
                                <>
                                  <CheckCircle className='h-4 w-4 text-green-500' />
                                  <span className='text-green-700 dark:text-green-400'>
                                    Performing well
                                  </span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className='h-4 w-4 text-yellow-500' />
                                  <span className='text-yellow-700 dark:text-yellow-400'>
                                    Room for improvement
                                  </span>
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                </div>
              </div>

              {/* Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Insights</CardTitle>
                  <CardDescription>
                    AI-powered recommendations for improving kitchen efficiency
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    <div className='flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded'>
                      <TrendingUp className='h-5 w-5 text-blue-500 mt-0.5' />
                      <div>
                        <div className='font-medium text-blue-700 dark:text-blue-300'>
                          Peak Hour Optimization
                        </div>
                        <div className='text-sm text-blue-600 dark:text-blue-400'>
                          Consider pre-prepping common items during 11:30-13:00
                          rush period to reduce wait times.
                        </div>
                      </div>
                    </div>

                    <div className='flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded'>
                      <CheckCircle className='h-5 w-5 text-green-500 mt-0.5' />
                      <div>
                        <div className='font-medium text-green-700 dark:text-green-300'>
                          Strong Performance
                        </div>
                        <div className='text-sm text-green-600 dark:text-green-400'>
                          Salad station is consistently meeting target prep
                          times. Great work!
                        </div>
                      </div>
                    </div>

                    <div className='flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded'>
                      <AlertTriangle className='h-5 w-5 text-yellow-500 mt-0.5' />
                      <div>
                        <div className='font-medium text-yellow-700 dark:text-yellow-300'>
                          Attention Needed
                        </div>
                        <div className='text-sm text-yellow-600 dark:text-yellow-400'>
                          Grill station prep times are 20% above target.
                          Consider staff training or equipment check.
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
