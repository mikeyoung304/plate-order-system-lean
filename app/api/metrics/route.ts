import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/modassembly/supabase/server'
import { env, assertServerEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

interface SystemMetrics {
  timestamp: string
  cpu: {
    usage: number
    loadAverage: number[]
  }
  memory: {
    used: number
    free: number
    total: number
    heapUsed: number
    heapTotal: number
    external: number
    rss: number
  }
  connections: {
    active: number
    total: number
  }
  requests: {
    count: number
    avgResponseTime: number
    errorRate: number
  }
  database: {
    connections: number
    queryTime: number
    slowQueries: number
  }
  realtime: {
    connections: number
    messagesPerSecond: number
    latency: number
  }
  openai: {
    requestsToday: number
    costToday: number
    cacheHitRate: number
  }
}

// In-memory metrics storage (in production, use Redis or similar)
let metricsHistory: SystemMetrics[] = []
let requestCounter = 0
let totalResponseTime = 0
let errorCounter = 0

// Helper to get CPU usage (simplified for demo)
function getCPUUsage(): number {
  // In production, you'd use a proper CPU monitoring library
  return Math.random() * 100
}

// Helper to get database metrics
async function getDatabaseMetrics() {
  const start = Date.now()
  try {
    const supabase = createClient()
    
    // Test query to measure response time
    await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    const queryTime = Date.now() - start
    
    return {
      connections: 1, // Would come from connection pool
      queryTime,
      slowQueries: queryTime > 500 ? 1 : 0
    }
  } catch (error) {
    return {
      connections: 0,
      queryTime: Date.now() - start,
      slowQueries: 1
    }
  }
}

// Helper to get OpenAI metrics
async function getOpenAIMetrics() {
  try {
    const supabase = createClient()
    
    // Get today's usage from the database
    const today = new Date().toISOString().split('T')[0]
    
    const { data: usage, error } = await supabase
      .from('openai_usage_metrics')
      .select('tokens_used, cost_cents')
      .gte('request_timestamp', `${today}T00:00:00.000Z`)
    
    if (error) throw error
    
    const requestsToday = usage?.length || 0
    const costToday = usage?.reduce((sum, record) => sum + (record.cost_cents || 0), 0) || 0
    
    // Get cache hit rate from transcription cache
    const { data: cacheData, error: cacheError } = await supabase
      .from('transcription_cache')
      .select('created_at')
      .gte('created_at', `${today}T00:00:00.000Z`)
    
    const cacheHits = cacheData?.length || 0
    const cacheHitRate = requestsToday > 0 ? (cacheHits / requestsToday) * 100 : 0
    
    return {
      requestsToday,
      costToday,
      cacheHitRate
    }
  } catch (error) {
    return {
      requestsToday: 0,
      costToday: 0,
      cacheHitRate: 0
    }
  }
}

// Helper to collect system metrics
async function collectMetrics(): Promise<SystemMetrics> {
  const memoryUsage = process.memoryUsage()
  const [dbMetrics, openaiMetrics] = await Promise.all([
    getDatabaseMetrics(),
    getOpenAIMetrics()
  ])
  
  return {
    timestamp: new Date().toISOString(),
    cpu: {
      usage: getCPUUsage(),
      loadAverage: process.platform === 'win32' ? [0, 0, 0] : (process.loadavg?.() || [0, 0, 0])
    },
    memory: {
      used: memoryUsage.rss,
      free: 0, // Would come from OS
      total: 0, // Would come from OS
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      rss: memoryUsage.rss
    },
    connections: {
      active: 1, // Would come from connection tracking
      total: requestCounter
    },
    requests: {
      count: requestCounter,
      avgResponseTime: requestCounter > 0 ? totalResponseTime / requestCounter : 0,
      errorRate: requestCounter > 0 ? (errorCounter / requestCounter) * 100 : 0
    },
    database: dbMetrics,
    realtime: {
      connections: 0, // Would come from Supabase Realtime monitoring
      messagesPerSecond: 0,
      latency: 0
    },
    openai: openaiMetrics
  }
}

export async function GET(request: NextRequest) {
  const start = Date.now()
  requestCounter++
  
  try {
    const searchParams = request.nextUrl.searchParams
    const range = searchParams.get('range') || '1h' // 1h, 6h, 24h, 7d
    const format = searchParams.get('format') || 'json'
    
    // Collect current metrics
    const currentMetrics = await collectMetrics()
    
    // Add to history (keep last 100 entries for demo)
    metricsHistory.push(currentMetrics)
    if (metricsHistory.length > 100) {
      metricsHistory = metricsHistory.slice(-100)
    }
    
    // Filter by time range
    const now = new Date()
    let cutoffTime = new Date()
    
    switch (range) {
      case '1h':
        cutoffTime.setHours(now.getHours() - 1)
        break
      case '6h':
        cutoffTime.setHours(now.getHours() - 6)
        break
      case '24h':
        cutoffTime.setDate(now.getDate() - 1)
        break
      case '7d':
        cutoffTime.setDate(now.getDate() - 7)
        break
    }
    
    const filteredMetrics = metricsHistory.filter(
      m => new Date(m.timestamp) >= cutoffTime
    )
    
    // Calculate aggregates
    const aggregates = {
      avgResponseTime: filteredMetrics.length > 0 ? 
        filteredMetrics.reduce((sum, m) => sum + m.requests.avgResponseTime, 0) / filteredMetrics.length : 0,
      avgMemoryUsage: filteredMetrics.length > 0 ? 
        filteredMetrics.reduce((sum, m) => sum + m.memory.heapUsed, 0) / filteredMetrics.length : 0,
      avgCpuUsage: filteredMetrics.length > 0 ? 
        filteredMetrics.reduce((sum, m) => sum + m.cpu.usage, 0) / filteredMetrics.length : 0,
      totalRequests: filteredMetrics.reduce((sum, m) => sum + m.requests.count, 0),
      totalErrors: filteredMetrics.reduce((sum, m) => sum + (m.requests.errorRate * m.requests.count / 100), 0),
      totalOpenAICost: filteredMetrics.length > 0 ? 
        filteredMetrics[filteredMetrics.length - 1].openai.costToday : 0
    }
    
    const response = {
      current: currentMetrics,
      history: filteredMetrics,
      aggregates,
      meta: {
        range,
        dataPoints: filteredMetrics.length,
        collectedAt: new Date().toISOString()
      }
    }
    
    // Track response time
    const responseTime = Date.now() - start
    totalResponseTime = ((totalResponseTime * (requestCounter - 1)) + responseTime) / requestCounter
    
    if (format === 'prometheus') {
      // Return Prometheus-compatible metrics
      const prometheusMetrics = [
        `# HELP plater_response_time_ms Response time in milliseconds`,
        `# TYPE plater_response_time_ms gauge`,
        `plater_response_time_ms ${currentMetrics.requests.avgResponseTime}`,
        ``,
        `# HELP plater_memory_usage_bytes Memory usage in bytes`,
        `# TYPE plater_memory_usage_bytes gauge`,
        `plater_memory_usage_bytes{type="heap_used"} ${currentMetrics.memory.heapUsed}`,
        `plater_memory_usage_bytes{type="heap_total"} ${currentMetrics.memory.heapTotal}`,
        `plater_memory_usage_bytes{type="rss"} ${currentMetrics.memory.rss}`,
        ``,
        `# HELP plater_requests_total Total number of requests`,
        `# TYPE plater_requests_total counter`,
        `plater_requests_total ${currentMetrics.requests.count}`,
        ``,
        `# HELP plater_cpu_usage_percent CPU usage percentage`,
        `# TYPE plater_cpu_usage_percent gauge`,
        `plater_cpu_usage_percent ${currentMetrics.cpu.usage}`,
        ``,
        `# HELP plater_openai_cost_cents OpenAI cost in cents`,
        `# TYPE plater_openai_cost_cents counter`,
        `plater_openai_cost_cents ${currentMetrics.openai.costToday}`,
        ``,
        `# HELP plater_openai_cache_hit_rate OpenAI cache hit rate percentage`,
        `# TYPE plater_openai_cache_hit_rate gauge`,
        `plater_openai_cache_hit_rate ${currentMetrics.openai.cacheHitRate}`,
      ].join('\n')
      
      return new Response(prometheusMetrics, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        }
      })
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    errorCounter++
    console.error('Metrics collection error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to collect metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST endpoint to record custom metrics
export async function POST(request: NextRequest) {
  const start = Date.now()
  requestCounter++
  
  try {
    assertServerEnv()
    
    const body = await request.json()
    const { event, data, timestamp } = body
    
    // Store custom metric in database
    const supabase = createClient()
    
    const { error } = await supabase
      .from('custom_metrics')
      .insert({
        event_type: event,
        data: data,
        timestamp: timestamp || new Date().toISOString()
      })
    
    if (error) {
      throw error
    }
    
    const responseTime = Date.now() - start
    totalResponseTime = ((totalResponseTime * (requestCounter - 1)) + responseTime) / requestCounter
    
    return NextResponse.json({ 
      success: true,
      recorded_at: new Date().toISOString()
    })
    
  } catch (error) {
    errorCounter++
    console.error('Custom metrics recording error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to record metric',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}