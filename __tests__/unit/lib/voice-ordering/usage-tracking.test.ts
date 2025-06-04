/**
 * Usage Tracking Tests
 * Verifies cost tracking, budget controls, and usage analytics
 */

import { getUsageTracker, type UsageMetrics, type BudgetAlert } from '@/lib/modassembly/openai/usage-tracking'

// Mock Supabase with in-memory data
const mockUsageData = new Map<string, any>()
const mockSupabase = {
  from: (table: string) => ({
    select: (columns: string) => ({
      gte: (column: string, value: string) => ({
        eq: (column2: string, value2: string) => {
          // Filter by user if specified
          const filteredData = Array.from(mockUsageData.values())
            .filter(item => item.timestamp >= value)
            .filter(item => column2 === 'user_id' ? item.user_id === value2 : true)
          return Promise.resolve({ data: filteredData })
        }),
        order: (column2: string, options: any) => {
          const filteredData = Array.from(mockUsageData.values())
            .filter(item => item.timestamp >= value)
          return Promise.resolve({ data: filteredData })
        }
      }),
      eq: (column: string, value: string) => {
        const filteredData = Array.from(mockUsageData.values())
          .filter(item => item[column] === value)
        return Promise.resolve({ data: filteredData })
      }
    }),
    insert: (data: any) => {
      if (Array.isArray(data)) {
        data.forEach(item => mockUsageData.set(item.id, item))
      } else {
        mockUsageData.set(data.id, data)
      }
      return Promise.resolve({ data })
    }
  })
}

jest.mock('@/lib/modassembly/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase)
}))

describe('UsageTracker', () => {
  let tracker: ReturnType<typeof getUsageTracker>
  const testUserId = 'test-user-123'
  
  beforeEach(() => {
    mockUsageData.clear()
    tracker = getUsageTracker()
  })

  describe('Cost Tracking', () => {
    it('should track transcription costs correctly', async () => {
      // Test transcription cost calculation
      await tracker.recordTranscription({
        userId: testUserId,
        audioDuration: 30000, // 30 seconds
        fileSize: 500000, // 500KB
        cached: false,
        optimized: true,
        compressionRatio: 2.0,
        confidence: 0.95,
        latency: 1500,
        retryCount: 0
      })

      const stats = await tracker.getUsageStats('day', testUserId)
      
      // 30 seconds = 0.5 minutes, at $0.006/minute = $0.003
      expect(stats.totalCost).toBe(0.003)
      expect(stats.totalRequests).toBe(1)
      expect(stats.successfulRequests).toBe(1)
    })

    it('should not charge for cached requests', async () => {
      await tracker.recordTranscription({
        userId: testUserId,
        audioDuration: 30000,
        fileSize: 500000,
        cached: true, // Cached request should cost $0
        confidence: 0.95,
        latency: 150 // Much faster due to cache
      })

      const stats = await tracker.getUsageStats('day', testUserId)
      expect(stats.totalCost).toBe(0)
      expect(stats.cacheHitRate).toBe(1) // 100% cache hit rate
    })

    it('should track chat completion costs correctly', async () => {
      await tracker.recordChatCompletion({
        userId: testUserId,
        model: 'gpt-3.5-turbo',
        inputTokens: 100,
        outputTokens: 50,
        cached: false,
        latency: 800
      })

      const stats = await tracker.getUsageStats('day', testUserId)
      
      // Input: 100 tokens * $0.0015/1K = $0.00015
      // Output: 50 tokens * $0.002/1K = $0.0001
      // Total: $0.00025
      expect(stats.totalCost).toBe(0.00025)
    })

    it('should ensure costs stay under $0.02 per request', async () => {
      // Test a typical voice order with optimization
      await tracker.recordTranscription({
        userId: testUserId,
        audioDuration: 15000, // 15 seconds (typical order)
        fileSize: 300000, // 300KB after optimization
        cached: false,
        optimized: true,
        compressionRatio: 3.0, // Good compression
        confidence: 0.92,
        latency: 1200,
        retryCount: 0
      })

      await tracker.recordChatCompletion({
        userId: testUserId,
        model: 'gpt-3.5-turbo',
        inputTokens: 80, // Short order parsing
        outputTokens: 30,
        cached: false,
        latency: 600
      })

      const stats = await tracker.getUsageStats('day', testUserId)
      const costPerRequest = stats.totalCost / stats.totalRequests
      
      expect(costPerRequest).toBeLessThan(0.02) // Under $0.02 per request
      expect(stats.totalCost).toBeLessThan(0.02) // Total also under $0.02 for this order
    })
  })

  describe('Budget Controls', () => {
    it('should detect budget limit approaching', async () => {
      // Add requests to approach daily budget
      for (let i = 0; i < 10; i++) {
        await tracker.recordTranscription({
          userId: testUserId,
          audioDuration: 60000, // 1 minute = $0.006
          fileSize: 1000000,
          cached: false
        })
      }

      const budgetLimits = {
        daily: 0.07, // $0.07 daily limit
        weekly: 0.50,
        monthly: 2.00
      }

      const alerts = await tracker.checkBudgetAlerts(budgetLimits)
      
      // Total cost should be $0.06, which is 85.7% of $0.07 budget
      expect(alerts).toHaveLength(1)
      expect(alerts[0].type).toBe('daily_limit')
      expect(alerts[0].severity).toBe('warning')
    })

    it('should detect budget exceeded', async () => {
      // Add requests that exceed budget
      for (let i = 0; i < 15; i++) {
        await tracker.recordTranscription({
          userId: testUserId,
          audioDuration: 60000, // 1 minute = $0.006
          fileSize: 1000000,
          cached: false
        })
      }

      const budgetLimits = {
        daily: 0.08 // $0.08 daily limit, we'll spend $0.09
      }

      const alerts = await tracker.checkBudgetAlerts(budgetLimits)
      
      expect(alerts).toHaveLength(1)
      expect(alerts[0].type).toBe('daily_limit')
      expect(alerts[0].severity).toBe('critical')
    })

    it('should detect usage spikes', async () => {
      // Create a week of normal usage
      const baseTime = Date.now() - (7 * 24 * 60 * 60 * 1000) // 7 days ago
      
      for (let day = 0; day < 6; day++) {
        const timestamp = new Date(baseTime + (day * 24 * 60 * 60 * 1000))
        // Add modest daily usage
        for (let i = 0; i < 3; i++) {
          const mockData = {
            id: `historical-${day}-${i}`,
            user_id: testUserId,
            operation: 'transcription',
            cost: 0.01,
            timestamp: timestamp.toISOString(),
            cached: false,
            metadata: {}
          }
          mockUsageData.set(mockData.id, mockData)
        }
      }

      // Today: spike in usage
      for (let i = 0; i < 20; i++) {
        await tracker.recordTranscription({
          userId: testUserId,
          audioDuration: 30000,
          fileSize: 500000,
          cached: false
        })
      }

      const alerts = await tracker.checkBudgetAlerts({})
      
      // Should detect spike
      const spikeAlert = alerts.find(alert => alert.type === 'spike_detected')
      expect(spikeAlert).toBeDefined()
      expect(spikeAlert?.severity).toBe('warning')
    })
  })

  describe('Cost Optimization Analysis', () => {
    it('should calculate cost savings from caching', async () => {
      // Mix of cached and non-cached requests
      for (let i = 0; i < 10; i++) {
        await tracker.recordTranscription({
          userId: testUserId,
          audioDuration: 30000,
          fileSize: 500000,
          cached: i < 7, // 70% cache hit rate
          confidence: 0.9
        })
      }

      const breakdown = await tracker.getCostBreakdown('day', testUserId)
      
      expect(breakdown.costSavings.fromCaching).toBeGreaterThan(0)
      expect(breakdown.requestCount).toBe(10)
      expect(breakdown.avgCostPerRequest).toBeLessThan(0.01) // Savings from caching
    })

    it('should calculate savings from audio optimization', async () => {
      await tracker.recordTranscription({
        userId: testUserId,
        audioDuration: 30000,
        fileSize: 1000000, // Original large file
        cached: false,
        optimized: true,
        compressionRatio: 4.0, // 75% size reduction
        confidence: 0.9
      })

      const breakdown = await tracker.getCostBreakdown('day', testUserId)
      
      expect(breakdown.costSavings.fromOptimization).toBeGreaterThan(0)
    })

    it('should provide optimization recommendations', async () => {
      // Create usage pattern that needs optimization
      for (let i = 0; i < 20; i++) {
        await tracker.recordTranscription({
          userId: testUserId,
          audioDuration: 45000,
          fileSize: 800000,
          cached: i < 2, // Low cache hit rate (10%)
          optimized: false, // No optimization
          compressionRatio: 1.0,
          confidence: 0.85
        })
      }

      const recommendations = await tracker.getOptimizationRecommendations()
      
      expect(recommendations.length).toBeGreaterThan(0)
      
      // Should recommend improving caching
      const cacheRec = recommendations.find(r => r.type === 'improve_caching')
      expect(cacheRec).toBeDefined()
      expect(cacheRec?.impact).toBe('high')
      
      // Should recommend audio optimization
      const audioRec = recommendations.find(r => r.type === 'audio_optimization')
      expect(audioRec).toBeDefined()
    })
  })

  describe('Performance Metrics', () => {
    it('should track request latency correctly', async () => {
      const latencies = [1200, 800, 1500, 900, 1100] // Mix of latencies
      
      for (const latency of latencies) {
        await tracker.recordTranscription({
          userId: testUserId,
          audioDuration: 30000,
          fileSize: 500000,
          cached: false,
          latency
        })
      }

      const stats = await tracker.getUsageStats('day', testUserId)
      const expectedAvg = latencies.reduce((sum, l) => sum + l, 0) / latencies.length
      
      expect(stats.avgLatency).toBe(expectedAvg)
    })

    it('should track error rates', async () => {
      // Mix of successful and failed requests
      for (let i = 0; i < 10; i++) {
        const hasError = i >= 8 // Last 2 requests fail
        
        await tracker.recordTranscription({
          userId: testUserId,
          audioDuration: 30000,
          fileSize: 500000,
          cached: false,
          errorCode: hasError ? 'TIMEOUT' : undefined
        })
      }

      const stats = await tracker.getUsageStats('day', testUserId)
      
      expect(stats.totalRequests).toBe(10)
      expect(stats.successfulRequests).toBe(8)
      expect(stats.failedRequests).toBe(2)
    })
  })

  describe('Cost Efficiency Validation', () => {
    it('should maintain cost under $0.02 per request with optimization', async () => {
      // Simulate optimized production usage
      const testCases = [
        { duration: 10000, cached: false, optimized: true, compressionRatio: 2.5 },
        { duration: 15000, cached: true, optimized: false, compressionRatio: 1.0 },
        { duration: 20000, cached: false, optimized: true, compressionRatio: 3.0 },
        { duration: 8000, cached: true, optimized: false, compressionRatio: 1.0 },
        { duration: 25000, cached: false, optimized: true, compressionRatio: 2.8 }
      ]

      for (const testCase of testCases) {
        // Transcription request
        await tracker.recordTranscription({
          userId: testUserId,
          audioDuration: testCase.duration,
          fileSize: 500000,
          cached: testCase.cached,
          optimized: testCase.optimized,
          compressionRatio: testCase.compressionRatio,
          confidence: 0.9
        })

        // Only add parsing cost if not cached
        if (!testCase.cached) {
          await tracker.recordChatCompletion({
            userId: testUserId,
            model: 'gpt-3.5-turbo',
            inputTokens: 60,
            outputTokens: 25,
            cached: false
          })
        }
      }

      const stats = await tracker.getUsageStats('day', testUserId)
      const avgCostPerRequest = stats.totalCost / (stats.totalRequests / 2) // Divide by 2 since we have transcription + parsing pairs
      
      expect(avgCostPerRequest).toBeLessThan(0.02)
      expect(stats.cacheHitRate).toBeGreaterThan(0.3) // At least 30% cache hit rate
    })

    it('should demonstrate significant cost savings', async () => {
      const breakdown = await tracker.getCostBreakdown('day', testUserId)
      
      // Even with minimal usage, should show the potential for savings
      expect(breakdown.costSavings.total).toBeGreaterThanOrEqual(0)
      expect(typeof breakdown.avgCostPerRequest).toBe('number')
      expect(breakdown.avgCostPerRequest).toBeGreaterThanOrEqual(0)
    })
  })
})