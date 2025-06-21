import { NextRequest, NextResponse } from 'next/server'
import { getUsageTracker } from '@/lib/modassembly/openai/usage-tracking'
import { getTranscriptionCache } from '@/lib/modassembly/openai/transcription-cache'
import { getBatchProcessor } from '@/lib/modassembly/openai/batch-processor'
import { Security } from '@/lib/security'
import { createClient } from '@/lib/modassembly/supabase/server'
import { measureApiCall } from '@/lib/performance-utils'
import { ApiResponse } from '@/types/api'

interface AnalyticsData {
  usage: {
    day: any
    week: any
    month: any
  }
  costBreakdown: {
    day: any
    week: any
    month: any
  }
  cacheStats: any
  batchStats: any
  recommendations: any[]
  budgetAlerts: any[]
  trends: {
    dailyCosts: Array<{ date: string; cost: number; requests: number }>
    cacheHitRateOverTime: Array<{ date: string; hitRate: number }>
    errorRateOverTime: Array<{ date: string; errorRate: number }>
  }
}

type AnalyticsResponse = ApiResponse<AnalyticsData>

export async function GET(request: NextRequest) {
  return measureApiCall('transcribe_analytics_api', async () => {
    // 1. Authentication and Admin Check
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        {
          status: 401,
          headers: Security.headers.getHeaders(),
        }
      )
    }

    // 2. Check if user has analytics access (admin only)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        {
          status: 403,
          headers: Security.headers.getHeaders(),
        }
      )
    }

    // 3. Parse Query Parameters
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId') // Optional: filter by specific user
    const includePersonalData =
      url.searchParams.get('includePersonal') === 'true'

    try {
      // 4. Gather Analytics Data
      const tracker = getUsageTracker()
      const cache = getTranscriptionCache()
      const batchProcessor = getBatchProcessor()

      const [
        dayUsage,
        weekUsage,
        monthUsage,
        dayCostBreakdown,
        weekCostBreakdown,
        monthCostBreakdown,
        cacheStats,
        batchStats,
        recommendations,
        budgetAlerts,
      ] = await Promise.all([
        tracker.getUsageStats('day', userId || undefined),
        tracker.getUsageStats('week', userId || undefined),
        tracker.getUsageStats('month', userId || undefined),
        tracker.getCostBreakdown('day', userId || undefined),
        tracker.getCostBreakdown('week', userId || undefined),
        tracker.getCostBreakdown('month', userId || undefined),
        cache.getStats(),
        batchProcessor.getBatchStats(),
        tracker.getOptimizationRecommendations(),
        tracker.checkBudgetAlerts({
          daily: 50, // $50 daily budget
          weekly: 300, // $300 weekly budget
          monthly: 1000, // $1000 monthly budget
        }),
      ])

      // 5. Generate Trend Data
      const trends = await generateTrendData(null, null)

      // 6. Sanitize Data for Response
      const analyticsData: AnalyticsData = {
        usage: {
          day: sanitizeUsageStats(dayUsage, includePersonalData),
          week: sanitizeUsageStats(weekUsage, includePersonalData),
          month: sanitizeUsageStats(monthUsage, includePersonalData),
        },
        costBreakdown: {
          day: dayCostBreakdown,
          week: weekCostBreakdown,
          month: monthCostBreakdown,
        },
        cacheStats,
        batchStats,
        recommendations,
        budgetAlerts,
        trends,
      }

      const response: AnalyticsResponse = {
        success: true,
        data: analyticsData,
        timestamp: new Date().toISOString(),
      }

      return NextResponse.json(response, {
        headers: Security.headers.getHeaders(),
      })
    } catch (error) {
      console.error('Analytics data fetch failed:', {
        error: error instanceof Error ? error.message : error,
        userId: user.id,
        requestedUserId: userId,
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch analytics data',
          timestamp: new Date().toISOString(),
        },
        {
          status: 500,
          headers: Security.headers.getHeaders(),
        }
      )
    }
  })
}

// POST endpoint for updating budget limits
export async function POST(request: NextRequest) {
  return measureApiCall('update_budget_limits', async () => {
    // 1. Authentication and Admin Check
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        {
          status: 401,
          headers: Security.headers.getHeaders(),
        }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        {
          status: 403,
          headers: Security.headers.getHeaders(),
        }
      )
    }

    // 2. Parse and Validate Request Body
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        {
          status: 400,
          headers: Security.headers.getHeaders(),
        }
      )
    }

    const { budgetLimits } = body
    if (!budgetLimits || typeof budgetLimits !== 'object') {
      return NextResponse.json(
        { error: 'Budget limits object required' },
        {
          status: 400,
          headers: Security.headers.getHeaders(),
        }
      )
    }

    // 3. Validate Budget Values
    const validatedLimits: any = {}
    if (budgetLimits.daily !== undefined) {
      if (typeof budgetLimits.daily !== 'number' || budgetLimits.daily < 0) {
        return NextResponse.json(
          { error: 'Daily budget must be a positive number' },
          { status: 400, headers: Security.headers.getHeaders() }
        )
      }
      validatedLimits.daily = budgetLimits.daily
    }

    if (budgetLimits.weekly !== undefined) {
      if (typeof budgetLimits.weekly !== 'number' || budgetLimits.weekly < 0) {
        return NextResponse.json(
          { error: 'Weekly budget must be a positive number' },
          { status: 400, headers: Security.headers.getHeaders() }
        )
      }
      validatedLimits.weekly = budgetLimits.weekly
    }

    if (budgetLimits.monthly !== undefined) {
      if (
        typeof budgetLimits.monthly !== 'number' ||
        budgetLimits.monthly < 0
      ) {
        return NextResponse.json(
          { error: 'Monthly budget must be a positive number' },
          { status: 400, headers: Security.headers.getHeaders() }
        )
      }
      validatedLimits.monthly = budgetLimits.monthly
    }

    // 4. Store Budget Limits (in a real app, would save to database)
    // console.log('Budget limits updated:', {
    //   updatedBy: user.id,
    //   limits: validatedLimits,
    //   timestamp: new Date().toISOString(),
    // })

    return NextResponse.json(
      {
        success: true,
        data: { budgetLimits: validatedLimits },
        timestamp: new Date().toISOString(),
      },
      {
        headers: Security.headers.getHeaders(),
      }
    )
  })
}

// Helper function to sanitize usage stats
function sanitizeUsageStats(stats: any, includePersonalData: boolean) {
  if (!includePersonalData) {
    // Remove user-specific data for privacy
    const sanitized = { ...stats }
    delete sanitized.topUsers
    return sanitized
  }
  return stats
}

// Helper function to generate trend data
async function generateTrendData(_tracker: any, _userId?: string | null) {
  // Generate sample trend data (in production, would query historical data)
  const now = new Date()
  const dailyCosts = []
  const cacheHitRates = []
  const errorRates = []

  // Generate last 30 days of data
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split('T')[0]

    // Simulate trend data (in production, would fetch from database)
    dailyCosts.push({
      date: dateStr,
      cost: Math.random() * 10 + 5, // $5-15 per day
      requests: Math.floor(Math.random() * 100 + 50), // 50-150 requests
    })

    cacheHitRates.push({
      date: dateStr,
      hitRate: Math.random() * 0.4 + 0.4, // 40-80% hit rate
    })

    errorRates.push({
      date: dateStr,
      errorRate: Math.random() * 0.05, // 0-5% error rate
    })
  }

  return {
    dailyCosts,
    cacheHitRateOverTime: cacheHitRates,
    errorRateOverTime: errorRates,
  }
}

// Only GET and POST methods allowed
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    {
      status: 405,
      headers: {
        ...Security.headers.getHeaders(),
        Allow: 'GET, POST',
      },
    }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    {
      status: 405,
      headers: {
        ...Security.headers.getHeaders(),
        Allow: 'GET, POST',
      },
    }
  )
}
