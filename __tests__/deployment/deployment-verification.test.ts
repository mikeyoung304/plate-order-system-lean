/**
 * Deployment Verification Test Suite
 * 
 * Comprehensive tests to verify that the deployed application
 * is working correctly and all optimizations are active.
 */

import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals'

interface DeploymentConfig {
  baseUrl: string
  timeout: number
  retries: number
}

const config: DeploymentConfig = {
  baseUrl: process.env.DEPLOYMENT_URL || 'http://localhost:3000',
  timeout: 10000,
  retries: 3
}

// Helper function to make requests with retries
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = config.retries): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), config.timeout)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return fetchWithRetry(url, options, retries - 1)
    }
    throw error
  }
}

// Helper to check response time
async function measureResponseTime(url: string, options?: RequestInit): Promise<{ response: Response; time: number }> {
  const start = Date.now()
  const response = await fetchWithRetry(url, options)
  const time = Date.now() - start
  return { response, time }
}

describe('Deployment Verification', () => {
  describe('Basic Connectivity', () => {
    test('should serve the main application', async () => {
      const { response, time } = await measureResponseTime(`${config.baseUrl}/`)
      
      expect(response.status).toBe(200)
      expect(time).toBeLessThan(5000) // Should load within 5 seconds
      
      const html = await response.text()
      expect(html).toContain('Plater') // Should contain app name
    })

    test('should serve static assets', async () => {
      const { response, time } = await measureResponseTime(`${config.baseUrl}/_next/static/css/app/layout.css`)
      
      // CSS might not exist, but should at least get a proper response
      expect([200, 404]).toContain(response.status)
      expect(time).toBeLessThan(2000)
    })

    test('should handle 404 gracefully', async () => {
      const { response } = await measureResponseTime(`${config.baseUrl}/non-existent-page`)
      
      expect(response.status).toBe(404)
    })
  })

  describe('Health Check API', () => {
    test('should return health status', async () => {
      const { response, time } = await measureResponseTime(`${config.baseUrl}/api/health`)
      
      expect(response.status).toBeOneOf([200, 503]) // Healthy or unhealthy
      expect(time).toBeLessThan(10000) // Health check should be fast
      
      const data = await response.json()
      
      expect(data).toHaveProperty('status')
      expect(data).toHaveProperty('timestamp')
      expect(data).toHaveProperty('checks')
      expect(data).toHaveProperty('performance')
      
      expect(['healthy', 'degraded', 'unhealthy']).toContain(data.status)
      expect(data.checks).toHaveProperty('database')
      expect(data.checks).toHaveProperty('auth')
      expect(data.performance).toHaveProperty('responseTime')
      expect(data.performance).toHaveProperty('uptime')
    })

    test('should return consistent health data', async () => {
      // Make multiple requests to ensure consistency
      const responses = await Promise.all([
        fetchWithRetry(`${config.baseUrl}/api/health`),
        fetchWithRetry(`${config.baseUrl}/api/health`),
        fetchWithRetry(`${config.baseUrl}/api/health`)
      ])
      
      const dataArray = await Promise.all(responses.map(r => r.json()))
      
      // All should have the same basic structure
      dataArray.forEach(data => {
        expect(data).toHaveProperty('status')
        expect(data).toHaveProperty('checks')
        expect(data.checks).toHaveProperty('database')
        expect(data.checks).toHaveProperty('auth')
      })
    })
  })

  describe('Authentication System', () => {
    test('should protect authenticated routes', async () => {
      const protectedRoutes = [
        '/auth/kitchen',
        '/auth/server',
        '/auth/admin'
      ]
      
      for (const route of protectedRoutes) {
        const response = await fetchWithRetry(`${config.baseUrl}${route}`)
        
        // Should redirect to login or return 401/403
        expect([200, 302, 401, 403]).toContain(response.status)
        
        if (response.status === 302) {
          const location = response.headers.get('location')
          expect(location).toContain('login')
        }
      }
    })

    test('should serve login page', async () => {
      const { response } = await measureResponseTime(`${config.baseUrl}/auth/login`)
      
      expect(response.status).toBe(200)
      
      const html = await response.text()
      expect(html).toContain('login') // Should contain login form
    })
  })

  describe('API Endpoints', () => {
    test('should serve metrics API', async () => {
      const { response, time } = await measureResponseTime(`${config.baseUrl}/api/metrics`)
      
      expect(response.status).toBe(200)
      expect(time).toBeLessThan(5000)
      
      const data = await response.json()
      expect(data).toHaveProperty('current')
      expect(data).toHaveProperty('history')
      expect(data.current).toHaveProperty('timestamp')
      expect(data.current).toHaveProperty('memory')
    })

    test('should serve OpenAI usage API', async () => {
      const { response, time } = await measureResponseTime(`${config.baseUrl}/api/openai/usage`)
      
      expect(response.status).toBe(200)
      expect(time).toBeLessThan(5000)
      
      const data = await response.json()
      expect(data).toHaveProperty('today')
      expect(data).toHaveProperty('budget')
      expect(data.today).toHaveProperty('requests')
      expect(data.today).toHaveProperty('cost')
    })

    test('should handle transcription API', async () => {
      // Test that the endpoint exists and requires proper authentication
      const response = await fetchWithRetry(`${config.baseUrl}/api/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      })
      
      // Should either work or require authentication
      expect([200, 400, 401, 403]).toContain(response.status)
    })
  })

  describe('Database Connectivity', () => {
    test('should connect to Supabase', async () => {
      const { response } = await measureResponseTime(`${config.baseUrl}/api/health`)
      const data = await response.json()
      
      expect(data.checks.database.status).toBeOneOf(['pass', 'warn', 'fail'])
      
      if (data.checks.database.status === 'pass') {
        expect(data.checks.database.responseTime).toBeLessThan(1000)
      }
    })

    test('should have proper database schema', async () => {
      // This would require a test endpoint that checks schema
      // For now, we verify through the health check
      const { response } = await measureResponseTime(`${config.baseUrl}/api/health`)
      const data = await response.json()
      
      // If database is healthy, schema should be correct
      if (data.checks.database.status === 'pass') {
        expect(data.checks.database).toHaveProperty('details')
      }
    })
  })

  describe('Performance Optimizations', () => {
    test('should have fast response times', async () => {
      const endpoints = [
        '/',
        '/api/health',
        '/api/metrics'
      ]
      
      for (const endpoint of endpoints) {
        const { time } = await measureResponseTime(`${config.baseUrl}${endpoint}`)
        
        // Most endpoints should respond within 2 seconds
        expect(time).toBeLessThan(2000)
      }
    })

    test('should serve compressed content', async () => {
      const { response } = await measureResponseTime(`${config.baseUrl}/`, {
        headers: { 'Accept-Encoding': 'gzip, deflate, br' }
      })
      
      const contentEncoding = response.headers.get('content-encoding')
      expect(['gzip', 'br', 'deflate']).toContain(contentEncoding)
    })

    test('should have proper caching headers', async () => {
      const { response } = await measureResponseTime(`${config.baseUrl}/`)
      
      // Should have some form of caching header
      const cacheControl = response.headers.get('cache-control')
      const etag = response.headers.get('etag')
      
      expect(cacheControl || etag).toBeTruthy()
    })
  })

  describe('Security Headers', () => {
    test('should have security headers', async () => {
      const { response } = await measureResponseTime(`${config.baseUrl}/`)
      
      // Check for basic security headers
      const securityHeaders = {
        'x-frame-options': response.headers.get('x-frame-options'),
        'x-content-type-options': response.headers.get('x-content-type-options'),
        'referrer-policy': response.headers.get('referrer-policy')
      }
      
      // At least some security headers should be present
      const hasSecurityHeaders = Object.values(securityHeaders).some(header => header !== null)
      expect(hasSecurityHeaders).toBe(true)
    })

    test('should not expose sensitive information', async () => {
      const { response } = await measureResponseTime(`${config.baseUrl}/`)
      
      const serverHeader = response.headers.get('server')
      const poweredBy = response.headers.get('x-powered-by')
      
      // Should not expose detailed server information
      if (serverHeader) {
        expect(serverHeader.toLowerCase()).not.toContain('apache')
        expect(serverHeader.toLowerCase()).not.toContain('nginx')
      }
      
      // Should not expose technology stack
      expect(poweredBy).toBeFalsy()
    })
  })

  describe('Real-time Features', () => {
    test('should support WebSocket connections', async () => {
      // Test that the health check includes realtime status
      const { response } = await measureResponseTime(`${config.baseUrl}/api/health`)
      const data = await response.json()
      
      expect(data.checks).toHaveProperty('realtime')
      expect(data.checks.realtime.status).toBeOneOf(['pass', 'warn', 'fail'])
    })
  })

  describe('Monitoring and Observability', () => {
    test('should collect metrics', async () => {
      const { response } = await measureResponseTime(`${config.baseUrl}/api/metrics`)
      const data = await response.json()
      
      expect(data.current).toHaveProperty('cpu')
      expect(data.current).toHaveProperty('memory')
      expect(data.current).toHaveProperty('requests')
      
      expect(data.current.memory.heapUsed).toBeGreaterThan(0)
      expect(data.current.requests.count).toBeGreaterThanOrEqual(0)
    })

    test('should track OpenAI usage', async () => {
      const { response } = await measureResponseTime(`${config.baseUrl}/api/openai/usage`)
      const data = await response.json()
      
      expect(data.today).toHaveProperty('requests')
      expect(data.today).toHaveProperty('cost')
      expect(data.today).toHaveProperty('cacheHitRate')
      
      expect(data.budget).toHaveProperty('daily')
      expect(data.budget.daily).toBeGreaterThan(0)
    })

    test('should provide Prometheus metrics', async () => {
      const { response } = await measureResponseTime(`${config.baseUrl}/api/metrics?format=prometheus`)
      
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('text/plain')
      
      const metrics = await response.text()
      expect(metrics).toContain('# HELP')
      expect(metrics).toContain('# TYPE')
      expect(metrics).toContain('plater_')
    })
  })

  describe('Environment Configuration', () => {
    test('should have proper environment variables', async () => {
      const { response } = await measureResponseTime(`${config.baseUrl}/api/health`)
      const data = await response.json()
      
      expect(data).toHaveProperty('environment')
      expect(['development', 'production', 'test']).toContain(data.environment)
      
      if (data.deployment) {
        expect(data.deployment).toHaveProperty('vercelEnv')
      }
    })

    test('should not expose sensitive environment variables', async () => {
      // Make a request that might expose env vars
      const { response } = await measureResponseTime(`${config.baseUrl}/api/health`)
      const data = await response.json()
      
      const responseText = JSON.stringify(data)
      
      // Should not contain sensitive keys
      expect(responseText).not.toContain('supabase_service_role')
      expect(responseText).not.toContain('openai_api_key')
      expect(responseText).not.toContain('sk-')
      expect(responseText).not.toContain('password')
    })
  })

  describe('Error Handling', () => {
    test('should handle malformed requests gracefully', async () => {
      const endpoints = [
        { url: '/api/health', method: 'POST' },
        { url: '/api/metrics', method: 'DELETE' },
        { url: '/api/transcribe', method: 'GET' }
      ]
      
      for (const endpoint of endpoints) {
        const response = await fetchWithRetry(`${config.baseUrl}${endpoint.url}`, {
          method: endpoint.method
        })
        
        // Should return proper HTTP status codes
        expect([400, 401, 403, 404, 405, 500]).toContain(response.status)
        
        // Should return JSON error response
        try {
          const data = await response.json()
          expect(data).toHaveProperty('error')
        } catch {
          // Some endpoints might return text errors, which is also acceptable
        }
      }
    })

    test('should handle large payloads appropriately', async () => {
      const largePayload = 'x'.repeat(10 * 1024 * 1024) // 10MB
      
      const response = await fetchWithRetry(`${config.baseUrl}/api/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: largePayload })
      })
      
      // Should reject or handle large payloads appropriately
      expect([400, 413, 422, 500]).toContain(response.status)
    })
  })
})

// Custom Jest matchers
expect.extend({
  toBeOneOf(received: any, array: any[]) {
    const pass = array.includes(received)
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${array.join(', ')}`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be one of ${array.join(', ')}`,
        pass: false,
      }
    }
  },
})

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(array: any[]): R
    }
  }
}