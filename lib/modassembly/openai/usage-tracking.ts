/**
 * OpenAI Usage Tracking and Cost Monitoring System
 * Tracks API usage, costs, and provides optimization insights
 */

import { createClient } from '@/lib/modassembly/supabase/server'

export interface UsageMetrics {
  id: string
  userId: string
  operation: 'transcription' | 'chat_completion' | 'batch_processing'
  model: string
  inputTokens?: number
  outputTokens?: number
  audioDuration?: number // in milliseconds
  cost: number
  cached: boolean
  optimized: boolean
  timestamp: Date
  metadata: {
    fileSize?: number
    compressionRatio?: number
    confidence?: number
    retryCount?: number
    errorCode?: string
    latency?: number
  }
}

export interface CostBreakdown {
  totalCost: number
  transcriptionCost: number
  chatCompletionCost: number
  requestCount: number
  avgCostPerRequest: number
  costSavings: {
    fromCaching: number
    fromOptimization: number
    fromBatching: number
    total: number
  }
}

export interface UsageStats {
  period: 'day' | 'week' | 'month'
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  cacheHitRate: number
  avgLatency: number
  totalCost: number
  costByOperation: Record<string, number>
  topUsers: Array<{ userId: string; requestCount: number; cost: number }>
  optimizationImpact: {
    avgCompressionRatio: number
    avgConfidence: number
    costSavingsPercent: number
  }
}

export interface BudgetAlert {
  type: 'daily_limit' | 'weekly_limit' | 'monthly_limit' | 'spike_detected'
  threshold: number
  current: number
  message: string
  severity: 'warning' | 'critical'
}

// Current OpenAI pricing (as of 2024)
const PRICING = {
  'whisper-1': 0.006, // per minute
  'gpt-3.5-turbo': {
    input: 0.0015, // per 1K tokens
    output: 0.002, // per 1K tokens
  },
  'gpt-4': {
    input: 0.03, // per 1K tokens
    output: 0.06, // per 1K tokens
  },
} as const

export class UsageTracker {
  private batchedMetrics: UsageMetrics[] = []
  private readonly batchSize = 10
  private readonly batchTimeoutMs = 30000 // 30 seconds

  constructor() {
    // Start batch processing timer
    setInterval(() => this.flushBatch(), this.batchTimeoutMs)
  }

  /**
   * Record a transcription operation
   */
  async recordTranscription(params: {
    userId: string
    audioDuration: number
    fileSize: number
    cached?: boolean
    optimized?: boolean
    compressionRatio?: number
    confidence?: number
    retryCount?: number
    latency?: number
    errorCode?: string
  }): Promise<void> {
    const cost = this.calculateTranscriptionCost(params.audioDuration, params.cached || false)
    
    const metrics: UsageMetrics = {
      id: crypto.randomUUID(),
      userId: params.userId,
      operation: 'transcription',
      model: 'whisper-1',
      audioDuration: params.audioDuration,
      cost,
      cached: params.cached || false,
      optimized: params.optimized || false,
      timestamp: new Date(),
      metadata: {
        fileSize: params.fileSize,
        compressionRatio: params.compressionRatio,
        confidence: params.confidence,
        retryCount: params.retryCount || 0,
        errorCode: params.errorCode,
        latency: params.latency,
      },
    }

    await this.addToBatch(metrics)
  }

  /**
   * Record a chat completion operation
   */
  async recordChatCompletion(params: {
    userId: string
    model: 'gpt-3.5-turbo' | 'gpt-4'
    inputTokens: number
    outputTokens: number
    cached?: boolean
    latency?: number
    errorCode?: string
  }): Promise<void> {
    const cost = this.calculateChatCompletionCost(params.model, params.inputTokens, params.outputTokens, params.cached || false)
    
    const metrics: UsageMetrics = {
      id: crypto.randomUUID(),
      userId: params.userId,
      operation: 'chat_completion',
      model: params.model,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      cost,
      cached: params.cached || false,
      optimized: false,
      timestamp: new Date(),
      metadata: {
        latency: params.latency,
        errorCode: params.errorCode,
      },
    }

    await this.addToBatch(metrics)
  }

  /**
   * Get usage statistics for a period
   */
  async getUsageStats(
    period: 'day' | 'week' | 'month',
    userId?: string
  ): Promise<UsageStats> {
    const periodMs = this.getPeriodMs(period)
    const startDate = new Date(Date.now() - periodMs)

    try {
      const supabase = await createClient()
      
      let query = supabase
        .from('openai_usage_metrics')
        .select('*')
        .gte('timestamp', startDate.toISOString())

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data: metrics } = await query

      if (!metrics) {
        return this.getEmptyStats(period)
      }

      return this.calculateStats(metrics, period)
    } catch (error) {
      console.error('Failed to get usage stats:', error)
      return this.getEmptyStats(period)
    }
  }

  /**
   * Get cost breakdown for a period
   */
  async getCostBreakdown(
    period: 'day' | 'week' | 'month',
    userId?: string
  ): Promise<CostBreakdown> {
    const stats = await this.getUsageStats(period, userId)
    
    const transcriptionCost = stats.costByOperation.transcription || 0
    const chatCompletionCost = stats.costByOperation.chat_completion || 0
    const totalCost = stats.totalCost

    // Calculate savings (estimated)
    const avgCompressionSavings = (stats.optimizationImpact.avgCompressionRatio - 1) * 0.3 * totalCost
    const cachingSavings = stats.cacheHitRate * totalCost * 0.9 // 90% savings from cache hits
    
    return {
      totalCost,
      transcriptionCost,
      chatCompletionCost,
      requestCount: stats.totalRequests,
      avgCostPerRequest: stats.totalRequests > 0 ? totalCost / stats.totalRequests : 0,
      costSavings: {
        fromCaching: cachingSavings,
        fromOptimization: avgCompressionSavings,
        fromBatching: 0, // Would calculate based on batch processing
        total: cachingSavings + avgCompressionSavings,
      },
    }
  }

  /**
   * Check for budget alerts
   */
  async checkBudgetAlerts(budgetLimits: {
    daily?: number
    weekly?: number
    monthly?: number
  }): Promise<BudgetAlert[]> {
    const alerts: BudgetAlert[] = []

    try {
      if (budgetLimits.daily) {
        const dailyStats = await this.getUsageStats('day')
        if (dailyStats.totalCost >= budgetLimits.daily * 0.8) {
          alerts.push({
            type: 'daily_limit',
            threshold: budgetLimits.daily,
            current: dailyStats.totalCost,
            message: `Daily spending is ${Math.round((dailyStats.totalCost / budgetLimits.daily) * 100)}% of budget`,
            severity: dailyStats.totalCost >= budgetLimits.daily ? 'critical' : 'warning',
          })
        }
      }

      if (budgetLimits.weekly) {
        const weeklyStats = await this.getUsageStats('week')
        if (weeklyStats.totalCost >= budgetLimits.weekly * 0.8) {
          alerts.push({
            type: 'weekly_limit',
            threshold: budgetLimits.weekly,
            current: weeklyStats.totalCost,
            message: `Weekly spending is ${Math.round((weeklyStats.totalCost / budgetLimits.weekly) * 100)}% of budget`,
            severity: weeklyStats.totalCost >= budgetLimits.weekly ? 'critical' : 'warning',
          })
        }
      }

      if (budgetLimits.monthly) {
        const monthlyStats = await this.getUsageStats('month')
        if (monthlyStats.totalCost >= budgetLimits.monthly * 0.8) {
          alerts.push({
            type: 'monthly_limit',
            threshold: budgetLimits.monthly,
            current: monthlyStats.totalCost,
            message: `Monthly spending is ${Math.round((monthlyStats.totalCost / budgetLimits.monthly) * 100)}% of budget`,
            severity: monthlyStats.totalCost >= budgetLimits.monthly ? 'critical' : 'warning',
          })
        }
      }

      // Check for usage spikes
      const todayStats = await this.getUsageStats('day')
      const avgDailyCost = (await this.getUsageStats('week')).totalCost / 7
      
      if (todayStats.totalCost > avgDailyCost * 2) {
        alerts.push({
          type: 'spike_detected',
          threshold: avgDailyCost * 2,
          current: todayStats.totalCost,
          message: `Today's usage is ${Math.round((todayStats.totalCost / avgDailyCost) * 100)}% above weekly average`,
          severity: 'warning',
        })
      }
    } catch (error) {
      console.error('Failed to check budget alerts:', error)
    }

    return alerts
  }

  /**
   * Get optimization recommendations
   */
  async getOptimizationRecommendations(): Promise<Array<{
    type: string
    impact: 'high' | 'medium' | 'low'
    description: string
    estimatedSavings: number
  }>> {
    const recommendations = []
    
    try {
      const weeklyStats = await this.getUsageStats('week')
      
      // Cache hit rate recommendations
      if (weeklyStats.cacheHitRate < 0.3) {
        recommendations.push({
          type: 'improve_caching',
          impact: 'high' as const,
          description: 'Cache hit rate is low. Consider implementing better audio fingerprinting or extending cache TTL.',
          estimatedSavings: weeklyStats.totalCost * 0.4,
        })
      }

      // Audio optimization recommendations
      if (weeklyStats.optimizationImpact.avgCompressionRatio < 1.5) {
        recommendations.push({
          type: 'audio_optimization',
          impact: 'medium' as const,
          description: 'Audio files could be compressed more effectively to reduce transcription costs.',
          estimatedSavings: weeklyStats.totalCost * 0.2,
        })
      }

      // Model selection recommendations
      const breakdown = await this.getCostBreakdown('week')
      if (breakdown.chatCompletionCost > breakdown.transcriptionCost * 2) {
        recommendations.push({
          type: 'model_optimization',
          impact: 'medium' as const,
          description: 'Consider using GPT-3.5-turbo instead of GPT-4 for simple parsing tasks.',
          estimatedSavings: breakdown.chatCompletionCost * 0.5,
        })
      }

      // Error rate recommendations
      if (weeklyStats.successfulRequests / weeklyStats.totalRequests < 0.95) {
        recommendations.push({
          type: 'error_reduction',
          impact: 'low' as const,
          description: 'High error rate detected. Implement better input validation and retry logic.',
          estimatedSavings: weeklyStats.totalCost * 0.05,
        })
      }
    } catch (error) {
      console.error('Failed to generate recommendations:', error)
    }

    return recommendations
  }

  private async addToBatch(metrics: UsageMetrics): Promise<void> {
    this.batchedMetrics.push(metrics)
    
    if (this.batchedMetrics.length >= this.batchSize) {
      await this.flushBatch()
    }
  }

  private async flushBatch(): Promise<void> {
    if (this.batchedMetrics.length === 0) return

    try {
      const supabase = await createClient()
      const batch = [...this.batchedMetrics]
      this.batchedMetrics = []

      const dbRecords = batch.map(metrics => ({
        id: metrics.id,
        user_id: metrics.userId,
        operation: metrics.operation,
        model: metrics.model,
        input_tokens: metrics.inputTokens,
        output_tokens: metrics.outputTokens,
        audio_duration: metrics.audioDuration,
        cost: metrics.cost,
        cached: metrics.cached,
        optimized: metrics.optimized,
        timestamp: metrics.timestamp.toISOString(),
        metadata: metrics.metadata,
      }))

      await supabase.from('openai_usage_metrics').insert(dbRecords)
    } catch (error) {
      console.error('Failed to flush metrics batch:', error)
      // Re-add failed metrics to batch for retry
      this.batchedMetrics.unshift(...this.batchedMetrics)
    }
  }

  private calculateTranscriptionCost(durationMs: number, cached: boolean): number {
    if (cached) return 0
    const minutes = durationMs / 60000
    return minutes * PRICING['whisper-1']
  }

  private calculateChatCompletionCost(
    model: 'gpt-3.5-turbo' | 'gpt-4',
    inputTokens: number,
    outputTokens: number,
    cached: boolean
  ): number {
    if (cached) return 0
    
    const pricing = PRICING[model]
    const inputCost = (inputTokens / 1000) * pricing.input
    const outputCost = (outputTokens / 1000) * pricing.output
    return inputCost + outputCost
  }

  private getPeriodMs(period: 'day' | 'week' | 'month'): number {
    switch (period) {
      case 'day': return 24 * 60 * 60 * 1000
      case 'week': return 7 * 24 * 60 * 60 * 1000
      case 'month': return 30 * 24 * 60 * 60 * 1000
    }
  }

  private calculateStats(metrics: any[], period: 'day' | 'week' | 'month'): UsageStats {
    const totalRequests = metrics.length
    const successfulRequests = metrics.filter(m => !m.metadata?.errorCode).length
    const failedRequests = totalRequests - successfulRequests
    const cacheHits = metrics.filter(m => m.cached).length
    const cacheHitRate = totalRequests > 0 ? cacheHits / totalRequests : 0
    
    const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0)
    const avgLatency = metrics
      .filter(m => m.metadata?.latency)
      .reduce((sum, m, _, arr) => sum + m.metadata.latency / arr.length, 0)

    const costByOperation = metrics.reduce((acc, m) => {
      acc[m.operation] = (acc[m.operation] || 0) + m.cost
      return acc
    }, {} as Record<string, number>)

    const userStats = metrics.reduce((acc, m) => {
      if (!acc[m.user_id]) {
        acc[m.user_id] = { requestCount: 0, cost: 0 }
      }
      acc[m.user_id].requestCount++
      acc[m.user_id].cost += m.cost
      return acc
    }, {} as Record<string, { requestCount: number; cost: number }>)

    const topUsers = Object.entries(userStats)
      .map(([userId, stats]) => ({ 
        userId, 
        requestCount: (stats as { requestCount: number; cost: number }).requestCount, 
        cost: (stats as { requestCount: number; cost: number }).cost 
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10)

    const optimizedMetrics = metrics.filter(m => m.optimized)
    const avgCompressionRatio = optimizedMetrics.length > 0
      ? optimizedMetrics.reduce((sum, m) => sum + (m.metadata?.compressionRatio || 1), 0) / optimizedMetrics.length
      : 1

    const avgConfidence = metrics
      .filter(m => m.metadata?.confidence)
      .reduce((sum, m, _, arr) => sum + m.metadata.confidence / arr.length, 0)

    const costSavingsPercent = cacheHitRate * 90 + (avgCompressionRatio - 1) * 30

    return {
      period,
      totalRequests,
      successfulRequests,
      failedRequests,
      cacheHitRate,
      avgLatency,
      totalCost,
      costByOperation,
      topUsers,
      optimizationImpact: {
        avgCompressionRatio,
        avgConfidence,
        costSavingsPercent,
      },
    }
  }

  private getEmptyStats(period: 'day' | 'week' | 'month'): UsageStats {
    return {
      period,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHitRate: 0,
      avgLatency: 0,
      totalCost: 0,
      costByOperation: {},
      topUsers: [],
      optimizationImpact: {
        avgCompressionRatio: 1,
        avgConfidence: 0,
        costSavingsPercent: 0,
      },
    }
  }
}

// Singleton instance
let trackerInstance: UsageTracker | null = null

export function getUsageTracker(): UsageTracker {
  if (!trackerInstance) {
    trackerInstance = new UsageTracker()
  }
  return trackerInstance
}