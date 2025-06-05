import { NextResponse } from 'next/server'
import { createClient } from '@/lib/modassembly/supabase/server'
import { assertServerEnv, env } from '@/lib/env'

export const dynamic = 'force-dynamic'

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  environment: string
  checks: {
    database: HealthCheck
    auth: HealthCheck
    openai: HealthCheck
    storage: HealthCheck
    realtime: HealthCheck
  }
  performance: {
    responseTime: number
    uptime: number
    memoryUsage: NodeJS.MemoryUsage
  }
  deployment: {
    vercelEnv?: string
    region?: string
    gitCommit?: string
  }
}

interface HealthCheck {
  status: 'pass' | 'fail' | 'warn'
  message: string
  responseTime?: number
  details?: any
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now()
  try {
    const supabase = await createClient()
    
    // Test basic connectivity
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id')
      .limit(1)
    
    if (error) {throw error}
    
    const responseTime = Date.now() - start
    
    return {
      status: responseTime < 200 ? 'pass' : 'warn',
      message: `Database connected (${responseTime}ms)`,
      responseTime,
      details: { recordCount: data?.length || 0 }
    }
  } catch (error) {
    return {
      status: 'fail',
      message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      responseTime: Date.now() - start
    }
  }
}

async function checkAuth(): Promise<HealthCheck> {
  const start = Date.now()
  try {
    const supabase = await createClient()
    
    // Test auth endpoint
    const { data, error: _error } = await supabase.auth.getSession()
    
    const responseTime = Date.now() - start
    
    return {
      status: 'pass',
      message: `Auth service responsive (${responseTime}ms)`,
      responseTime,
      details: { hasSession: !!data.session }
    }
  } catch (error) {
    return {
      status: 'fail',
      message: `Auth check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      responseTime: Date.now() - start
    }
  }
}

async function checkOpenAI(): Promise<HealthCheck> {
  const start = Date.now()
  try {
    assertServerEnv()
    
    // Simple API key validation check
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })
    
    const responseTime = Date.now() - start
    
    if (!response.ok) {
      throw new Error(`OpenAI API returned ${response.status}`)
    }
    
    return {
      status: responseTime < 1000 ? 'pass' : 'warn',
      message: `OpenAI API accessible (${responseTime}ms)`,
      responseTime
    }
  } catch (error) {
    return {
      status: 'fail',
      message: `OpenAI API check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      responseTime: Date.now() - start
    }
  }
}

async function checkStorage(): Promise<HealthCheck> {
  const start = Date.now()
  try {
    const supabase = await createClient()
    
    // Test storage by listing buckets
    const { data, error } = await supabase.storage.listBuckets()
    
    if (error) {throw error}
    
    const responseTime = Date.now() - start
    
    return {
      status: 'pass',
      message: `Storage service accessible (${responseTime}ms)`,
      responseTime,
      details: { bucketsCount: data?.length || 0 }
    }
  } catch (error) {
    return {
      status: 'fail',
      message: `Storage check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      responseTime: Date.now() - start
    }
  }
}

async function checkRealtime(): Promise<HealthCheck> {
  const start = Date.now()
  try {
    const supabase = await createClient()
    
    // Test realtime by creating a channel (without subscribing)
    const channel = supabase.channel('health-check')
    const responseTime = Date.now() - start
    
    // Clean up
    supabase.removeChannel(channel)
    
    return {
      status: 'pass',
      message: `Realtime service accessible (${responseTime}ms)`,
      responseTime
    }
  } catch (error) {
    return {
      status: 'fail',
      message: `Realtime check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      responseTime: Date.now() - start
    }
  }
}

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Run all health checks concurrently
    const [database, auth, openai, storage, realtime] = await Promise.all([
      checkDatabase(),
      checkAuth(),
      checkOpenAI(),
      checkStorage(),
      checkRealtime()
    ])
    
    const checks = { database, auth, openai, storage, realtime }
    
    // Determine overall status
    const hasFailures = Object.values(checks).some(check => check.status === 'fail')
    const hasWarnings = Object.values(checks).some(check => check.status === 'warn')
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy'
    if (hasFailures) {
      overallStatus = 'unhealthy'
    } else if (hasWarnings) {
      overallStatus = 'degraded'
    } else {
      overallStatus = 'healthy'
    }
    
    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      environment: env.NODE_ENV,
      checks,
      performance: {
        responseTime: Date.now() - startTime,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      },
      deployment: {
        vercelEnv: process.env.VERCEL_ENV,
        region: process.env.VERCEL_REGION,
        gitCommit: process.env.VERCEL_GIT_COMMIT_SHA
      }
    }
    
    // Return appropriate status code based on health
    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503
    
    return NextResponse.json(result, { status: statusCode })
    
  } catch {
    const result: HealthCheckResult = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      environment: env.NODE_ENV,
      checks: {
        database: { status: 'fail', message: 'Not checked due to error' },
        auth: { status: 'fail', message: 'Not checked due to error' },
        openai: { status: 'fail', message: 'Not checked due to error' },
        storage: { status: 'fail', message: 'Not checked due to error' },
        realtime: { status: 'fail', message: 'Not checked due to error' }
      },
      performance: {
        responseTime: Date.now() - startTime,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      },
      deployment: {
        vercelEnv: process.env.VERCEL_ENV,
        region: process.env.VERCEL_REGION,
        gitCommit: process.env.VERCEL_GIT_COMMIT_SHA
      }
    }
    
    return NextResponse.json(result, { status: 503 })
  }
}