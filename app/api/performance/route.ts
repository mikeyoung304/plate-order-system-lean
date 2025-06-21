/**
 * Performance Monitoring API Endpoint
 * Real-time access to performance metrics, alerts, and recommendations
 */

import { NextRequest, NextResponse } from 'next/server'
import { performanceDashboard } from '@/lib/benchmarking/performance-dashboard'
import { withAPIOptimization } from '@/lib/api/optimization'

async function handler(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    switch (action) {
      case 'status':
        const status = performanceDashboard.getPerformanceStatus()
        return new NextResponse(JSON.stringify(status), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })

      case 'trends':
        const hours = parseInt(url.searchParams.get('hours') || '24')
        const trends = performanceDashboard.getPerformanceTrends(hours)
        return new NextResponse(JSON.stringify(trends), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })

      case 'alerts':
        const alerts = performanceDashboard.getActiveAlerts()
        return new NextResponse(JSON.stringify(alerts), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })

      case 'recommendations':
        const recommendations = performanceDashboard.getRecommendations()
        return new NextResponse(JSON.stringify(recommendations), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })

      case 'report':
        const report = performanceDashboard.generatePerformanceReport()
        return new NextResponse(report, {
          status: 200,
          headers: { 
            'Content-Type': 'text/plain',
            'Content-Disposition': 'attachment; filename="performance-report.txt"'
          }
        })

      default:
        // Return comprehensive dashboard data
        const dashboardData = {
          status: performanceDashboard.getPerformanceStatus(),
          trends: performanceDashboard.getPerformanceTrends(24),
          alerts: performanceDashboard.getActiveAlerts(),
          recommendations: performanceDashboard.getRecommendations().slice(0, 10)
        }

        return new NextResponse(JSON.stringify(dashboardData), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=30' // 30 second cache
          }
        })
    }
  } catch (error) {
    // Only log critical errors in production
    if (process.env.NODE_ENV !== 'production') {
      console.error('Performance API error:', error)
    }
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to fetch performance data',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Apply optimization middleware
export const GET = withAPIOptimization(handler, {
  enablePagination: false,
  enableFieldSelection: true,
  enableCompression: true,
  enableCaching: true
})