import { NextResponse } from 'next/server'
import { createClient } from '@/lib/modassembly/supabase/server'
import { env, assertServerEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

interface OpenAIUsageResponse {
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

export async function GET() {
  try {
    assertServerEnv()
    const supabase = await createClient()
    
    // Date ranges
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    
    // Budget settings (in cents)
    const budget = {
      daily: parseInt(process.env.OPENAI_DAILY_BUDGET_CENTS || '500'),
      weekly: parseInt(process.env.OPENAI_WEEKLY_BUDGET_CENTS || '3500'),
      monthly: parseInt(process.env.OPENAI_MONTHLY_BUDGET_CENTS || '15000')
    }
    
    // Fetch usage metrics
    const [todayUsage, weekUsage, monthUsage] = await Promise.all([
      supabase
        .from('openai_usage_metrics')
        .select('*')
        .gte('request_timestamp', today.toISOString()),
      supabase
        .from('openai_usage_metrics')
        .select('*')
        .gte('request_timestamp', weekStart.toISOString()),
      supabase
        .from('openai_usage_metrics')
        .select('*')
        .gte('request_timestamp', monthStart.toISOString())
    ])
    
    if (todayUsage.error || weekUsage.error || monthUsage.error) {
      throw new Error('Failed to fetch usage data')
    }
    
    // Calculate today's stats
    const todayData = todayUsage.data || []
    const todayStats = {
      requests: todayData.length,
      tokens: todayData.reduce((sum, record) => sum + (record.tokens_used || 0), 0),
      cost: todayData.reduce((sum, record) => sum + (record.cost_cents || 0), 0),
      cacheHitRate: 0 // Will calculate below
    }
    
    // Calculate cache hit rate for today
    const { data: todayCache } = await supabase
      .from('transcription_cache')
      .select('created_at')
      .gte('created_at', today.toISOString())
    
    const todayCacheHits = todayCache?.length || 0
    todayStats.cacheHitRate = todayStats.requests > 0 ? (todayCacheHits / (todayStats.requests + todayCacheHits)) * 100 : 0
    
    // Calculate week stats
    const weekData = weekUsage.data || []
    const weekStats = {
      requests: weekData.length,
      tokens: weekData.reduce((sum, record) => sum + (record.tokens_used || 0), 0),
      cost: weekData.reduce((sum, record) => sum + (record.cost_cents || 0), 0),
      avgCacheHitRate: 0
    }
    
    // Calculate cache hit rate for week
    const { data: weekCache } = await supabase
      .from('transcription_cache')
      .select('created_at')
      .gte('created_at', weekStart.toISOString())
    
    const weekCacheHits = weekCache?.length || 0
    weekStats.avgCacheHitRate = weekStats.requests > 0 ? (weekCacheHits / (weekStats.requests + weekCacheHits)) * 100 : 0
    
    // Calculate month stats
    const monthData = monthUsage.data || []
    const monthStats = {
      requests: monthData.length,
      tokens: monthData.reduce((sum, record) => sum + (record.tokens_used || 0), 0),
      cost: monthData.reduce((sum, record) => sum + (record.cost_cents || 0), 0),
      avgCacheHitRate: 0
    }
    
    // Calculate cache hit rate for month
    const { data: monthCache } = await supabase
      .from('transcription_cache')
      .select('created_at')
      .gte('created_at', monthStart.toISOString())
    
    const monthCacheHits = monthCache?.length || 0
    monthStats.avgCacheHitRate = monthStats.requests > 0 ? (monthCacheHits / (monthStats.requests + monthCacheHits)) * 100 : 0
    
    // Generate daily cost trends (last 30 days)
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    const { data: trendData } = await supabase
      .from('openai_usage_metrics')
      .select('request_timestamp, cost_cents')
      .gte('request_timestamp', thirtyDaysAgo.toISOString())
      .order('request_timestamp', { ascending: true })
    
    // Group by day
    const dailyCosts: { [key: string]: { cost: number; requests: number } } = {}
    
    if (trendData) {
      trendData.forEach(record => {
        const date = new Date(record.request_timestamp).toISOString().split('T')[0]
        if (!dailyCosts[date]) {
          dailyCosts[date] = { cost: 0, requests: 0 }
        }
        dailyCosts[date].cost += record.cost_cents || 0
        dailyCosts[date].requests += 1
      })
    }
    
    const dailyCostTrends = Object.entries(dailyCosts).map(([date, data]) => ({
      date,
      cost: data.cost,
      requests: data.requests
    }))
    
    // Generate hourly distribution for today
    const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => {
      const hourData = todayData.filter(record => {
        const recordHour = new Date(record.request_timestamp).getHours()
        return recordHour === hour
      })
      
      return {
        hour,
        requests: hourData.length,
        cost: hourData.reduce((sum, record) => sum + (record.cost_cents || 0), 0)
      }
    })
    
    // Mock cache performance data (would be calculated from actual cache metrics)
    const cachePerformance = dailyCostTrends.slice(-7).map((day, index) => ({
      date: day.date,
      hitRate: Math.max(30, Math.min(90, 60 + Math.random() * 30)), // Mock data
      savings: day.cost * (Math.random() * 0.3) // Mock savings
    }))
    
    // Calculate top endpoints (mock data for now)
    const topEndpoints = [
      {
        endpoint: '/api/transcribe',
        requests: Math.floor(todayStats.requests * 0.7),
        cost: Math.floor(todayStats.cost * 0.7),
        avgResponseTime: 1200
      },
      {
        endpoint: '/api/transcribe/batch',
        requests: Math.floor(todayStats.requests * 0.2),
        cost: Math.floor(todayStats.cost * 0.2),
        avgResponseTime: 800
      },
      {
        endpoint: '/api/transcribe/analytics',
        requests: Math.floor(todayStats.requests * 0.1),
        cost: Math.floor(todayStats.cost * 0.1),
        avgResponseTime: 600
      }
    ]
    
    // Generate alerts
    const alerts = {
      budgetWarnings: todayStats.cost > budget.daily * 0.8 || weekStats.cost > budget.weekly * 0.8 || monthStats.cost > budget.monthly * 0.8,
      anomalies: todayStats.cost > (weekStats.cost / 7) * 2, // Today's cost is more than 2x average daily
      lowCacheHitRate: todayStats.cacheHitRate < 60
    }
    
    const response: OpenAIUsageResponse = {
      today: todayStats,
      thisWeek: weekStats,
      thisMonth: monthStats,
      budget,
      trends: {
        dailyCosts: dailyCostTrends,
        hourlyDistribution,
        cachePerformance
      },
      topEndpoints,
      alerts
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('OpenAI usage API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch OpenAI usage data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}