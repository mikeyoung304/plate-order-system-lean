"use client"

import { useState, useEffect } from 'react'
import { 
  calculateAveragePrepTimes, 
  fetchStationMetrics,
  type KDSOrderRouting 
} from '@/lib/modassembly/supabase/database/kds'

export interface PrepTimePrediction {
  estimatedSeconds: number
  confidence: number // 0-1 confidence score
  factors: {
    historical: number
    kitchenLoad: number
    orderComplexity: number
    timeOfDay: number
    dayOfWeek: number
  }
  reasoning: string[]
}

export interface PrepTimeModel {
  stationId: string
  baselineMinutes: number
  complexityFactors: Record<string, number>
  loadFactors: { light: number; medium: number; heavy: number }
  timeFactors: Record<number, number> // hour of day adjustments
  dayFactors: Record<number, number> // day of week adjustments
  lastUpdated: Date
}

/**
 * AI-powered prep time prediction service
 */
export class PrepTimePredictionService {
  private models: Map<string, PrepTimeModel> = new Map()
  private readonly defaultModels: Record<string, Partial<PrepTimeModel>> = {
    grill: {
      baselineMinutes: 8,
      complexityFactors: {
        'burger': 1.0,
        'steak': 1.5,
        'chicken': 1.3,
        'fish': 1.2,
        'salad': 0.3,
        'sandwich': 0.7
      },
      loadFactors: { light: 0.8, medium: 1.0, heavy: 1.4 }
    },
    fryer: {
      baselineMinutes: 5,
      complexityFactors: {
        'fries': 1.0,
        'wings': 1.2,
        'onion rings': 0.9,
        'fish': 1.3
      },
      loadFactors: { light: 0.9, medium: 1.0, heavy: 1.3 }
    },
    salad: {
      baselineMinutes: 3,
      complexityFactors: {
        'house salad': 1.0,
        'caesar': 1.2,
        'specialty': 1.5
      },
      loadFactors: { light: 0.8, medium: 1.0, heavy: 1.2 }
    },
    bar: {
      baselineMinutes: 2,
      complexityFactors: {
        'beer': 0.3,
        'wine': 0.4,
        'cocktail': 1.0,
        'specialty drink': 1.5
      },
      loadFactors: { light: 0.7, medium: 1.0, heavy: 1.5 }
    },
    expo: {
      baselineMinutes: 1,
      complexityFactors: {
        'simple': 0.8,
        'complex': 1.2
      },
      loadFactors: { light: 0.8, medium: 1.0, heavy: 1.3 }
    }
  }

  constructor() {
    this.initializeDefaultModels()
  }

  /**
   * Initialize default prediction models for each station type
   */
  private initializeDefaultModels(): void {
    const defaultTimeFactors = {
      6: 0.8,   // 6 AM - breakfast rush prep
      7: 0.9,   // 7 AM
      8: 1.0,   // 8 AM
      9: 0.9,   // 9 AM
      10: 0.8,  // 10 AM
      11: 1.1,  // 11 AM - lunch prep
      12: 1.3,  // 12 PM - lunch rush
      13: 1.2,  // 1 PM
      14: 0.9,  // 2 PM
      15: 0.8,  // 3 PM
      16: 0.9,  // 4 PM
      17: 1.1,  // 5 PM - dinner prep
      18: 1.3,  // 6 PM - dinner rush
      19: 1.2,  // 7 PM
      20: 1.0,  // 8 PM
      21: 0.9   // 9 PM
    }

    const defaultDayFactors = {
      0: 0.8, // Sunday
      1: 1.0, // Monday
      2: 1.0, // Tuesday
      3: 1.0, // Wednesday
      4: 1.1, // Thursday
      5: 1.3, // Friday
      6: 1.2  // Saturday
    }

    for (const [stationType, config] of Object.entries(this.defaultModels)) {
      this.models.set(stationType, {
        stationId: stationType,
        baselineMinutes: config.baselineMinutes || 5,
        complexityFactors: config.complexityFactors || {},
        loadFactors: config.loadFactors || { light: 0.8, medium: 1.0, heavy: 1.3 },
        timeFactors: defaultTimeFactors,
        dayFactors: defaultDayFactors,
        lastUpdated: new Date()
      })
    }
  }

  /**
   * Predict prep time for an order at a specific station
   */
  async predictPrepTime(
    order: KDSOrderRouting,
    currentKitchenLoad: number = 0
  ): Promise<PrepTimePrediction> {
    const stationType = order.station?.type || 'grill'
    const model = this.models.get(stationType)

    if (!model) {
      return this.getDefaultPrediction()
    }

    const now = new Date()
    const hour = now.getHours()
    const dayOfWeek = now.getDay()

    // Calculate base time from historical data
    let historicalFactor = 1.0
    try {
      const avgPrepTime = await calculateAveragePrepTimes(order.station_id, 7)
      historicalFactor = avgPrepTime / (model.baselineMinutes * 60)
    } catch (error) {
      console.warn('Could not fetch historical data for prediction:', error)
    }

    // Analyze order complexity
    const complexityFactor = this.calculateComplexityFactor(order, model)

    // Determine kitchen load factor
    const loadFactor = this.getLoadFactor(currentKitchenLoad, model)

    // Apply time of day factor
    const timeFactor = model.timeFactors[hour] || 1.0

    // Apply day of week factor
    const dayFactor = model.dayFactors[dayOfWeek] || 1.0

    // Calculate final prediction
    const basePrepTime = model.baselineMinutes * 60 // Convert to seconds
    const estimatedSeconds = Math.round(
      basePrepTime * 
      historicalFactor * 
      complexityFactor * 
      loadFactor * 
      timeFactor * 
      dayFactor
    )

    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence(
      order,
      currentKitchenLoad,
      historicalFactor
    )

    // Generate reasoning
    const reasoning = this.generateReasoning(
      model,
      historicalFactor,
      complexityFactor,
      loadFactor,
      timeFactor,
      dayFactor
    )

    return {
      estimatedSeconds: Math.max(30, estimatedSeconds), // Minimum 30 seconds
      confidence,
      factors: {
        historical: historicalFactor,
        kitchenLoad: loadFactor,
        orderComplexity: complexityFactor,
        timeOfDay: timeFactor,
        dayOfWeek: dayFactor
      },
      reasoning
    }
  }

  /**
   * Calculate order complexity factor based on items
   */
  private calculateComplexityFactor(
    order: KDSOrderRouting,
    model: PrepTimeModel
  ): number {
    if (!order.order?.items || !Array.isArray(order.order.items)) {
      return 1.0
    }

    let totalComplexity = 0
    let itemCount = 0

    for (const item of order.order.items) {
      const itemName = typeof item === 'string' ? item : item.name || ''
      const itemLower = itemName.toLowerCase()

      // Find matching complexity factor
      let itemComplexity = 1.0
      for (const [keyword, factor] of Object.entries(model.complexityFactors)) {
        if (itemLower.includes(keyword.toLowerCase())) {
          itemComplexity = factor
          break
        }
      }

      // Account for modifications
      if (typeof item === 'object' && item.modifiers && item.modifiers.length > 0) {
        itemComplexity *= (1 + item.modifiers.length * 0.1) // 10% per modifier
      }

      totalComplexity += itemComplexity
      itemCount++
    }

    return itemCount > 0 ? totalComplexity / itemCount : 1.0
  }

  /**
   * Get load factor based on current kitchen load
   */
  private getLoadFactor(currentLoad: number, model: PrepTimeModel): number {
    if (currentLoad <= 3) return model.loadFactors.light
    if (currentLoad <= 8) return model.loadFactors.medium
    return model.loadFactors.heavy
  }

  /**
   * Calculate confidence score for the prediction
   */
  private calculateConfidence(
    order: KDSOrderRouting,
    currentKitchenLoad: number,
    historicalFactor: number
  ): number {
    let confidence = 0.7 // Base confidence

    // Higher confidence if we have historical data
    if (historicalFactor !== 1.0) {
      confidence += 0.2
    }

    // Lower confidence for very complex orders
    if (order.order?.items && order.order.items.length > 5) {
      confidence -= 0.1
    }

    // Lower confidence during very busy periods
    if (currentKitchenLoad > 15) {
      confidence -= 0.2
    }

    // Higher confidence for known order patterns
    if (order.recall_count === 0) {
      confidence += 0.1
    }

    return Math.max(0.1, Math.min(1.0, confidence))
  }

  /**
   * Generate human-readable reasoning for the prediction
   */
  private generateReasoning(
    model: PrepTimeModel,
    historicalFactor: number,
    complexityFactor: number,
    loadFactor: number,
    timeFactor: number,
    dayFactor: number
  ): string[] {
    const reasoning: string[] = []

    reasoning.push(`Base prep time: ${model.baselineMinutes} minutes`)

    if (historicalFactor > 1.1) {
      reasoning.push('Slower than usual based on recent performance')
    } else if (historicalFactor < 0.9) {
      reasoning.push('Faster than usual based on recent performance')
    }

    if (complexityFactor > 1.2) {
      reasoning.push('Complex order with multiple modifications')
    } else if (complexityFactor < 0.8) {
      reasoning.push('Simple, quick-to-prepare items')
    }

    if (loadFactor > 1.2) {
      reasoning.push('Kitchen is busy, expect delays')
    } else if (loadFactor < 0.9) {
      reasoning.push('Light kitchen load, faster service expected')
    }

    if (timeFactor > 1.1) {
      reasoning.push('Peak service time, slower prep expected')
    } else if (timeFactor < 0.9) {
      reasoning.push('Off-peak hours, faster prep expected')
    }

    return reasoning
  }

  /**
   * Get default prediction when no model is available
   */
  private getDefaultPrediction(): PrepTimePrediction {
    return {
      estimatedSeconds: 300, // 5 minutes default
      confidence: 0.3,
      factors: {
        historical: 1.0,
        kitchenLoad: 1.0,
        orderComplexity: 1.0,
        timeOfDay: 1.0,
        dayOfWeek: 1.0
      },
      reasoning: ['Using default prep time estimate', 'No historical data available']
    }
  }

  /**
   * Update model with actual prep time data
   */
  async updateModel(
    stationId: string,
    actualPrepTime: number,
    order: KDSOrderRouting
  ): Promise<void> {
    const stationType = order.station?.type
    if (!stationType) return

    const model = this.models.get(stationType)
    if (!model) return

    // Simple learning: adjust baseline based on recent actuals
    const currentBaseline = model.baselineMinutes * 60
    const adjustment = (actualPrepTime - currentBaseline) * 0.1 // 10% learning rate
    model.baselineMinutes = Math.max(0.5, (currentBaseline + adjustment) / 60)
    model.lastUpdated = new Date()

    console.log(`Updated ${stationType} model baseline to ${model.baselineMinutes.toFixed(1)} minutes`)
  }

  /**
   * Get model performance metrics
   */
  getModelPerformance(stationType: string): {
    accuracy: number
    lastUpdated: Date
    predictionsCount: number
  } {
    const model = this.models.get(stationType)
    return {
      accuracy: 0.75, // TODO: Calculate actual accuracy from historical predictions
      lastUpdated: model?.lastUpdated || new Date(),
      predictionsCount: 0 // TODO: Track prediction count
    }
  }
}

// Singleton instance
export const prepTimePredictionService = new PrepTimePredictionService()

/**
 * React hook for prep time predictions
 */
export function usePrepTimePrediction(order: KDSOrderRouting, kitchenLoad: number = 0) {
  const [prediction, setPrediction] = useState<PrepTimePrediction | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const generatePrediction = async () => {
      setLoading(true)
      try {
        const result = await prepTimePredictionService.predictPrepTime(order, kitchenLoad)
        setPrediction(result)
      } catch (error) {
        console.error('Error generating prep time prediction:', error)
        setPrediction(null)
      } finally {
        setLoading(false)
      }
    }

    generatePrediction()
  }, [order.id, order.order?.items, kitchenLoad])

  return { prediction, loading }
}