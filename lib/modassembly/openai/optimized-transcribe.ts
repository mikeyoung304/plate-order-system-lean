/**
 * Optimized OpenAI Transcription Service
 * Combines audio optimization, caching, usage tracking, and fallback mechanisms
 */

import OpenAI from 'openai'
import { type OptimizationResult, createAudioOptimizer } from '../audio-recording/audio-optimization'
import { type CacheEntry, generateAudioHash, getTranscriptionCache } from './transcription-cache'
import { getUsageTracker } from './usage-tracking'

export interface TranscriptionOptions {
  enableOptimization?: boolean
  enableCaching?: boolean
  enableFallback?: boolean
  maxRetries?: number
  retryDelay?: number
  preferredModel?: 'gpt-3.5-turbo' | 'gpt-4'
  confidenceThreshold?: number
  timeout?: number
}

export interface TranscriptionResult {
  items: string[]
  transcription: string
  confidence: number
  metadata: {
    cached: boolean
    optimized: boolean
    compressionRatio: number
    originalSize: number
    optimizedSize: number
    duration: number
    cost: number
    latency: number
    retryCount: number
    model: string
    cacheHit?: boolean
    optimizationApplied?: string[]
  }
}

export interface TranscriptionError extends Error {
  code: 'AUDIO_TOO_LARGE' | 'AUDIO_TOO_SHORT' | 'INVALID_FORMAT' | 'TRANSCRIPTION_FAILED' | 'PARSING_FAILED' | 'RATE_LIMITED' | 'TIMEOUT'
  retryable: boolean
  details?: any
}

const DEFAULT_OPTIONS: Required<TranscriptionOptions> = {
  enableOptimization: true,
  enableCaching: true,
  enableFallback: true,
  maxRetries: 3,
  retryDelay: 1000,
  preferredModel: 'gpt-3.5-turbo',
  confidenceThreshold: 0.7,
  timeout: 30000,
}

export class OptimizedTranscriptionService {
  private openai: OpenAI
  private options: Required<TranscriptionOptions>
  private cache = getTranscriptionCache()
  private tracker = getUsageTracker()
  private optimizer = createAudioOptimizer()

  constructor(apiKey: string, options: TranscriptionOptions = {}) {
    this.openai = new OpenAI({ apiKey })
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  /**
   * Transcribe audio with full optimization pipeline
   */
  async transcribe(audioBlob: Blob, userId: string, filename?: string): Promise<TranscriptionResult> {
    const startTime = Date.now()
    let retryCount = 0
    let lastError: TranscriptionError | null = null

    while (retryCount <= this.options.maxRetries) {
      try {
        return await this.attemptTranscription(audioBlob, userId, filename, startTime, retryCount)
      } catch (error) {
        lastError = this.normalizeError(error)
        
        if (!lastError.retryable || retryCount >= this.options.maxRetries) {
          // Track failed attempt
          await this.tracker.recordTranscription({
            userId,
            audioDuration: this.estimateDuration(audioBlob.size),
            fileSize: audioBlob.size,
            latency: Date.now() - startTime,
            errorCode: lastError.code,
            retryCount,
          })
          
          throw lastError
        }

        retryCount++
        await this.delay(this.options.retryDelay * Math.pow(2, retryCount - 1)) // Exponential backoff
      }
    }

    throw lastError!
  }

  /**
   * Batch transcribe multiple audio files
   */
  async batchTranscribe(
    audioBlobs: Array<{ blob: Blob; id: string; filename?: string }>,
    userId: string
  ): Promise<Array<{ id: string; result?: TranscriptionResult; error?: TranscriptionError }>> {
    const results = []
    const batchSize = 5 // Process 5 at a time to avoid rate limits
    
    for (let i = 0; i < audioBlobs.length; i += batchSize) {
      const batch = audioBlobs.slice(i, i + batchSize)
      const batchPromises = batch.map(async ({ blob, id, filename }) => {
        try {
          const result = await this.transcribe(blob, userId, filename)
          return { id, result }
        } catch (error) {
          return { id, error: error as TranscriptionError }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      // Small delay between batches
      if (i + batchSize < audioBlobs.length) {
        await this.delay(1000)
      }
    }

    return results
  }

  /**
   * Get service statistics and recommendations
   */
  async getOptimizationReport(userId?: string): Promise<{
    usage: any
    costBreakdown: any
    cacheStats: any
    recommendations: any[]
  }> {
    const [usage, costBreakdown, cacheStats, recommendations] = await Promise.all([
      this.tracker.getUsageStats('week', userId),
      this.tracker.getCostBreakdown('week', userId),
      this.cache.getStats(),
      this.tracker.getOptimizationRecommendations(),
    ])

    return {
      usage,
      costBreakdown,
      cacheStats,
      recommendations,
    }
  }

  private async attemptTranscription(
    audioBlob: Blob,
    userId: string,
    filename: string | undefined,
    startTime: number,
    retryCount: number
  ): Promise<TranscriptionResult> {
    let optimizationResult: OptimizationResult | null = null
    let workingBlob = audioBlob
    const cached = false
    let cacheHit = false

    // Step 1: Generate audio hash for caching
    const audioHash = await generateAudioHash(audioBlob)

    // Step 2: Check cache first
    if (this.options.enableCaching) {
      const cacheEntry = await this.cache.get(audioHash, userId)
      if (cacheEntry) {
        await this.tracker.recordTranscription({
          userId,
          audioDuration: cacheEntry.metadata.duration,
          fileSize: cacheEntry.metadata.originalSize,
          cached: true,
          confidence: cacheEntry.confidence,
          latency: Date.now() - startTime,
          retryCount,
        })

        return {
          items: cacheEntry.extractedItems,
          transcription: cacheEntry.transcription,
          confidence: cacheEntry.confidence,
          metadata: {
            cached: true,
            optimized: false,
            compressionRatio: 1,
            originalSize: cacheEntry.metadata.originalSize,
            optimizedSize: cacheEntry.metadata.optimizedSize,
            duration: cacheEntry.metadata.duration,
            cost: 0,
            latency: Date.now() - startTime,
            retryCount,
            model: 'cached',
            cacheHit: true,
          },
        }
      }

      // Check for similar audio
      const similarEntry = await this.cache.findSimilar(audioHash, audioBlob, userId)
      if (similarEntry && similarEntry.confidence >= this.options.confidenceThreshold) {
        cacheHit = true
        return {
          items: similarEntry.extractedItems,
          transcription: similarEntry.transcription,
          confidence: similarEntry.confidence,
          metadata: {
            cached: true,
            optimized: false,
            compressionRatio: 1,
            originalSize: similarEntry.metadata.originalSize,
            optimizedSize: similarEntry.metadata.optimizedSize,
            duration: similarEntry.metadata.duration,
            cost: 0,
            latency: Date.now() - startTime,
            retryCount,
            model: 'similar-cached',
            cacheHit: true,
          },
        }
      }
    }

    // Step 3: Optimize audio if enabled
    if (this.options.enableOptimization) {
      optimizationResult = await this.optimizer.optimizeAudio(audioBlob)
      workingBlob = optimizationResult.optimizedBlob
    }

    // Step 4: Validate audio file
    this.validateAudioFile(workingBlob)

    // Step 5: Perform transcription with timeout
    const transcriptionPromise = this.performTranscription(workingBlob, filename)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), this.options.timeout)
    })

    const { transcription, confidence } = await Promise.race([transcriptionPromise, timeoutPromise])

    // Step 6: Parse items with fallback
    const items = await this.parseTranscriptionItems(transcription, userId)

    // Step 7: Cache result if confidence is high enough
    if (this.options.enableCaching && confidence >= this.options.confidenceThreshold) {
      await this.cache.set(audioHash, audioBlob, transcription, items, confidence, userId)
    }

    // Step 8: Track usage
    const duration = optimizationResult?.analysis.duration || this.estimateDuration(audioBlob.size)
    await this.tracker.recordTranscription({
      userId,
      audioDuration: duration,
      fileSize: audioBlob.size,
      cached: false,
      optimized: !!optimizationResult,
      compressionRatio: optimizationResult?.compressionRatio || 1,
      confidence,
      latency: Date.now() - startTime,
      retryCount,
    })

    return {
      items,
      transcription,
      confidence,
      metadata: {
        cached,
        optimized: !!optimizationResult,
        compressionRatio: optimizationResult?.compressionRatio || 1,
        originalSize: audioBlob.size,
        optimizedSize: workingBlob.size,
        duration,
        cost: (duration / 60000) * 0.006, // Whisper pricing
        latency: Date.now() - startTime,
        retryCount,
        model: 'whisper-1',
        cacheHit,
        optimizationApplied: optimizationResult?.optimizationApplied,
      },
    }
  }

  private async performTranscription(
    audioBlob: Blob,
    filename?: string
  ): Promise<{ transcription: string; confidence: number }> {
    // Create file object for OpenAI
    const audioFile = new File([audioBlob], filename || 'audio.webm', { type: audioBlob.type })

    // Transcribe with Whisper
    const whisperResult = await this.openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'verbose_json',
      temperature: 0.1, // Lower temperature for more consistent results
    })

    // Extract confidence from segments if available
    const confidence = this.calculateConfidence(whisperResult)
    const transcription = typeof whisperResult === 'string' 
      ? whisperResult 
      : whisperResult.text

    return { transcription, confidence }
  }

  private async parseTranscriptionItems(transcription: string, userId: string): Promise<string[]> {
    if (!transcription.trim()) {
      return []
    }

    try {
      // Use GPT to extract menu items
      const completion = await this.openai.chat.completions.create({
        model: this.options.preferredModel,
        messages: [
          {
            role: 'system',
            content: `You are a restaurant order parser. Extract menu items with their modifications from the customer's speech. 
                      Remove filler words like "I'd like", "please", "can I have", but KEEP all modifications, special requests, and specifications.
                      Return ONLY a JSON array of food/drink items with their modifications. 
                      
                      Examples:
                      "I'd like a cheeseburger with no onions" → ["Cheeseburger - no onions"]
                      "Can I get a salad with ranch dressing on the side" → ["Salad - ranch dressing on the side"]
                      "I want the grilled chicken, extra crispy, with no salt" → ["Grilled Chicken - extra crispy, no salt"]
                      "Two coffees, one black and one with cream" → ["Coffee - black", "Coffee - with cream"]`,
          },
          {
            role: 'user',
            content: transcription,
          },
        ],
        temperature: 0.1,
        max_tokens: 200,
      })

      // Track chat completion usage
      const inputTokens = this.estimateTokens(transcription)
      const outputTokens = this.estimateTokens(completion.choices[0].message.content || '')
      
      await this.tracker.recordChatCompletion({
        userId,
        model: this.options.preferredModel,
        inputTokens,
        outputTokens,
      })

      // Parse response
      const content = completion.choices[0].message.content
      if (content) {
        const parsed = JSON.parse(content)
        if (Array.isArray(parsed)) {
          return parsed.filter(item => typeof item === 'string' && item.trim().length > 0)
        }
      }
    } catch (error) {
      console.warn('GPT parsing failed, using fallback:', error)
    }

    // Fallback to simple parsing
    return this.fallbackParsing(transcription)
  }

  private fallbackParsing(transcription: string): string[] {
    const cleanText = transcription.toLowerCase()
    return cleanText
      .split(/[,\n]|and/)
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .map(item => {
        // Remove common filler words
        item = item.replace(/^(i want|i'd like|please|give me|can i have)\s+/i, '')
        // Capitalize first letter
        return item.charAt(0).toUpperCase() + item.slice(1)
      })
      .filter(item => item.length > 2) // Remove very short items
  }

  private calculateConfidence(whisperResult: any): number {
    // If verbose_json format, calculate from segments
    if (whisperResult.segments && Array.isArray(whisperResult.segments)) {
      const avgConfidence = whisperResult.segments.reduce((sum: number, segment: any) => {
        return sum + (segment.avg_logprob || 0)
      }, 0) / whisperResult.segments.length

      // Convert log probability to confidence (0-1)
      return Math.max(0, Math.min(1, Math.exp(avgConfidence)))
    }

    // Default confidence if no segments available
    return 0.8
  }

  private validateAudioFile(blob: Blob): void {
    const maxSize = 25 * 1024 * 1024 // 25MB OpenAI limit
    const minSize = 100 // 100 bytes minimum

    if (blob.size > maxSize) {
      throw this.createError('AUDIO_TOO_LARGE', `Audio file too large: ${blob.size} bytes (max: ${maxSize})`, false)
    }

    if (blob.size < minSize) {
      throw this.createError('AUDIO_TOO_SHORT', `Audio file too small: ${blob.size} bytes (min: ${minSize})`, false)
    }

    const supportedTypes = ['audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/ogg']
    if (!supportedTypes.some(type => blob.type.includes(type))) {
      throw this.createError('INVALID_FORMAT', `Unsupported audio format: ${blob.type}`, false)
    }
  }

  private estimateDuration(sizeBytes: number): number {
    // Rough estimation: assuming 128kbps average bitrate
    return (sizeBytes * 8) / (128000 / 1000) // Convert to milliseconds
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4)
  }

  private normalizeError(error: any): TranscriptionError {
    if (error.code && error.retryable !== undefined) {
      return error as TranscriptionError
    }

    const message = error.message || error.toString()
    
    if (message.includes('timeout') || message.includes('TIMEOUT')) {
      return this.createError('TIMEOUT', 'Request timed out', true)
    }
    
    if (message.includes('rate limit') || message.includes('429')) {
      return this.createError('RATE_LIMITED', 'Rate limit exceeded', true)
    }
    
    if (message.includes('audio') && message.includes('large')) {
      return this.createError('AUDIO_TOO_LARGE', message, false)
    }
    
    if (message.includes('format') || message.includes('type')) {
      return this.createError('INVALID_FORMAT', message, false)
    }

    return this.createError('TRANSCRIPTION_FAILED', message, true)
  }

  private createError(code: TranscriptionError['code'], message: string, retryable: boolean): TranscriptionError {
    const error = new Error(message) as TranscriptionError
    error.code = code
    error.retryable = retryable
    return error
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Factory function and singleton
let serviceInstance: OptimizedTranscriptionService | null = null

export function getOptimizedTranscriptionService(apiKey?: string, options?: TranscriptionOptions): OptimizedTranscriptionService {
  if (!serviceInstance) {
    if (!apiKey) {
      throw new Error('OpenAI API key required for first initialization')
    }
    serviceInstance = new OptimizedTranscriptionService(apiKey, options)
  }
  return serviceInstance
}

// Convenience function for the existing API
export async function optimizedTranscribeAudioFile(
  audioBlob: Blob,
  userId: string,
  filename?: string,
  options?: TranscriptionOptions
): Promise<{ items: string[]; transcription: string }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable not set')
  }

  const service = getOptimizedTranscriptionService(apiKey, options)
  const result = await service.transcribe(audioBlob, userId, filename)
  
  return {
    items: result.items,
    transcription: result.transcription,
  }
}