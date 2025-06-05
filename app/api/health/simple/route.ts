import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Simple Health Check Endpoint
 * Basic system health without complex dependency checks
 */

interface SimpleHealthCheck {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  uptime: number
  environment: string
  version: string
  memory: {
    used: number
    total: number
    percentage: number
  }
}

export async function GET() {
  try {
    const memoryUsage = process.memoryUsage()
    const uptime = process.uptime()
    
    const result: SimpleHealthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '0.1.0',
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
      }
    }
    
    return NextResponse.json(result, { status: 200 })
    
  } catch (error) {
    const result: SimpleHealthCheck = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: 0,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '0.1.0',
      memory: {
        used: 0,
        total: 0,
        percentage: 0
      }
    }
    
    return NextResponse.json(result, { status: 503 })
  }
}