/**
 * Batch Processing System for OpenAI Transcriptions
 * Handles multiple audio files efficiently with queuing and rate limiting
 */

import { type TranscriptionError, type TranscriptionResult, getOptimizedTranscriptionService } from './optimized-transcribe'
import { getUsageTracker } from './usage-tracking'

export interface BatchJob {
  id: string
  audioBlob: Blob
  userId: string
  filename?: string
  metadata?: Record<string, any>
}

export interface BatchResult {
  jobId: string
  success: boolean
  result?: TranscriptionResult
  error?: TranscriptionError
  processingTime: number
}

export interface BatchProgress {
  batchId: string
  totalJobs: number
  completedJobs: number
  failedJobs: number
  estimatedTimeRemaining: number
  averageProcessingTime: number
  results: BatchResult[]
}

export interface BatchOptions {
  concurrency?: number // Number of concurrent transcriptions
  retryFailedJobs?: boolean
  maxRetries?: number
  priorityMode?: 'fifo' | 'shortest' | 'user_priority'
  timeoutMs?: number
  enableOptimization?: boolean
  enableCaching?: boolean
}

const DEFAULT_BATCH_OPTIONS: Required<BatchOptions> = {
  concurrency: 3,
  retryFailedJobs: true,
  maxRetries: 2,
  priorityMode: 'fifo',
  timeoutMs: 60000,
  enableOptimization: true,
  enableCaching: true,
}

export class BatchProcessor {
  private activeJobs = new Map<string, Promise<BatchResult>>()
  private jobQueue: BatchJob[] = []
  private results = new Map<string, BatchResult[]>()
  private batchProgress = new Map<string, BatchProgress>()
  private options: Required<BatchOptions>
  private tracker = getUsageTracker()

  constructor(options: BatchOptions = {}) {
    this.options = { ...DEFAULT_BATCH_OPTIONS, ...options }
  }

  /**
   * Submit a batch of transcription jobs
   */
  async submitBatch(jobs: BatchJob[], options?: Partial<BatchOptions>): Promise<string> {
    const batchId = this.generateBatchId()
    const batchOptions = { ...this.options, ...options }

    // Initialize batch progress
    this.batchProgress.set(batchId, {
      batchId,
      totalJobs: jobs.length,
      completedJobs: 0,
      failedJobs: 0,
      estimatedTimeRemaining: 0,
      averageProcessingTime: 0,
      results: [],
    })

    this.results.set(batchId, [])

    // Sort jobs based on priority mode
    const sortedJobs = this.sortJobsByPriority(jobs, batchOptions.priorityMode)

    // Process jobs with concurrency control
    this.processBatchJobs(batchId, sortedJobs, batchOptions)

    return batchId
  }

  /**
   * Get batch progress and results
   */
  getBatchProgress(batchId: string): BatchProgress | null {
    return this.batchProgress.get(batchId) || null
  }

  /**
   * Get final batch results
   */
  getBatchResults(batchId: string): BatchResult[] {
    return this.results.get(batchId) || []
  }

  /**
   * Cancel a running batch
   */
  async cancelBatch(batchId: string): Promise<void> {
    const progress = this.batchProgress.get(batchId)
    if (!progress) {return}

    // Mark as cancelled and stop processing new jobs
    progress.estimatedTimeRemaining = 0
    
    // Wait for active jobs to complete (they can't be interrupted)
    const activePromises = Array.from(this.activeJobs.values())
    await Promise.allSettled(activePromises)
  }

  /**
   * Process multiple audio files with smart queuing
   */
  async processMultipleAudio(
    audioFiles: Array<{ blob: Blob; id: string; userId: string; filename?: string }>,
    options?: BatchOptions
  ): Promise<Array<{ id: string; result?: TranscriptionResult; error?: TranscriptionError }>> {
    const jobs: BatchJob[] = audioFiles.map(file => ({
      id: file.id,
      audioBlob: file.blob,
      userId: file.userId,
      filename: file.filename,
    }))

    const batchId = await this.submitBatch(jobs, options)

    // Wait for batch completion
    return new Promise((resolve) => {
      const checkProgress = () => {
        const progress = this.getBatchProgress(batchId)
        if (progress && progress.completedJobs + progress.failedJobs >= progress.totalJobs) {
          const results = this.getBatchResults(batchId)
          resolve(results.map(result => ({
            id: result.jobId,
            result: result.success ? result.result : undefined,
            error: result.success ? undefined : result.error,
          })))
        } else {
          setTimeout(checkProgress, 1000)
        }
      }
      checkProgress()
    })
  }

  /**
   * Optimize batch processing by grouping similar audio files
   */
  async optimizedBatchProcess(
    audioFiles: Array<{ blob: Blob; id: string; userId: string; filename?: string }>,
    options?: BatchOptions & { groupSimilar?: boolean }
  ): Promise<Array<{ id: string; result?: TranscriptionResult; error?: TranscriptionError }>> {
    if (options?.groupSimilar) {
      // Group similar audio files for potential cache hits
      const groupedFiles = await this.groupSimilarAudio(audioFiles)
      const results: Array<{ id: string; result?: TranscriptionResult; error?: TranscriptionError }> = []

      for (const group of groupedFiles) {
        const groupResults = await this.processMultipleAudio(group, options)
        results.push(...groupResults)
      }

      return results
    }

    return this.processMultipleAudio(audioFiles, options)
  }

  /**
   * Get batch processing statistics
   */
  async getBatchStats(): Promise<{
    activeBatches: number
    totalJobsProcessed: number
    successRate: number
    averageProcessingTime: number
    costSavings: number
  }> {
    const activeBatches = this.batchProgress.size
    let totalJobs = 0
    let successfulJobs = 0
    let totalProcessingTime = 0

    for (const results of this.results.values()) {
      totalJobs += results.length
      successfulJobs += results.filter(r => r.success).length
      totalProcessingTime += results.reduce((sum, r) => sum + r.processingTime, 0)
    }

    const successRate = totalJobs > 0 ? successfulJobs / totalJobs : 0
    const averageProcessingTime = totalJobs > 0 ? totalProcessingTime / totalJobs : 0

    // Estimate cost savings from batch processing (reduced overhead)
    const estimatedSavings = totalJobs * 0.001 // Rough estimate: $0.001 savings per job from batching

    return {
      activeBatches,
      totalJobsProcessed: totalJobs,
      successRate,
      averageProcessingTime,
      costSavings: estimatedSavings,
    }
  }

  private async processBatchJobs(
    batchId: string,
    jobs: BatchJob[],
    options: Required<BatchOptions>
  ): Promise<void> {
    const service = getOptimizedTranscriptionService(process.env.OPENAI_API_KEY!, {
      enableOptimization: options.enableOptimization,
      enableCaching: options.enableCaching,
    })

    const semaphore = new Semaphore(options.concurrency)
    const jobPromises = jobs.map(job => 
      semaphore.acquire(() => this.processJob(batchId, job, service, options))
    )

    await Promise.allSettled(jobPromises)
  }

  private async processJob(
    batchId: string,
    job: BatchJob,
    service: any,
    options: Required<BatchOptions>
  ): Promise<void> {
    const startTime = Date.now()
    let result: BatchResult

    try {
      const transcriptionResult = await Promise.race([
        service.transcribe(job.audioBlob, job.userId, job.filename),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Job timeout')), options.timeoutMs)
        )
      ])

      result = {
        jobId: job.id,
        success: true,
        result: transcriptionResult,
        processingTime: Date.now() - startTime,
      }

    } catch (error) {
      result = {
        jobId: job.id,
        success: false,
        error: error as TranscriptionError,
        processingTime: Date.now() - startTime,
      }

      // Retry failed jobs if enabled
      if (options.retryFailedJobs && (error as TranscriptionError).retryable) {
        // Add retry logic here if needed
      }
    }

    // Update batch progress
    this.updateBatchProgress(batchId, result)
  }

  private updateBatchProgress(batchId: string, result: BatchResult): void {
    const progress = this.batchProgress.get(batchId)
    const results = this.results.get(batchId)
    
    if (!progress || !results) {return}

    results.push(result)
    progress.results = [...results]

    if (result.success) {
      progress.completedJobs++
    } else {
      progress.failedJobs++
    }

    // Update average processing time
    const totalCompleted = progress.completedJobs + progress.failedJobs
    progress.averageProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / totalCompleted

    // Estimate remaining time
    const remainingJobs = progress.totalJobs - totalCompleted
    progress.estimatedTimeRemaining = remainingJobs * progress.averageProcessingTime
  }

  private sortJobsByPriority(jobs: BatchJob[], priorityMode: BatchOptions['priorityMode']): BatchJob[] {
    switch (priorityMode) {
      case 'shortest':
        return [...jobs].sort((a, b) => a.audioBlob.size - b.audioBlob.size)
      
      case 'user_priority':
        // Could implement user-based priority here
        return jobs
      
      case 'fifo':
      default:
        return jobs
    }
  }

  private async groupSimilarAudio(
    audioFiles: Array<{ blob: Blob; id: string; userId: string; filename?: string }>
  ): Promise<Array<Array<{ blob: Blob; id: string; userId: string; filename?: string }>>> {
    // Simple grouping by file size (in production, would use audio fingerprinting)
    const sizeGroups = new Map<string, Array<{ blob: Blob; id: string; userId: string; filename?: string }>>()

    for (const file of audioFiles) {
      const sizeCategory = this.categorizeFileSize(file.blob.size)
      if (!sizeGroups.has(sizeCategory)) {
        sizeGroups.set(sizeCategory, [])
      }
      sizeGroups.get(sizeCategory)!.push(file)
    }

    return Array.from(sizeGroups.values())
  }

  private categorizeFileSize(size: number): string {
    if (size < 50000) {return 'small'}        // < 50KB
    if (size < 500000) {return 'medium'}      // < 500KB
    if (size < 2000000) {return 'large'}      // < 2MB
    return 'extra-large'                    // >= 2MB
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * Semaphore for controlling concurrency
 */
class Semaphore {
  private permits: number
  private waitingQueue: Array<() => void> = []

  constructor(permits: number) {
    this.permits = permits
  }

  async acquire<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      if (this.permits > 0) {
        this.permits--
        this.execute(fn, resolve, reject)
      } else {
        this.waitingQueue.push(() => {
          this.permits--
          this.execute(fn, resolve, reject)
        })
      }
    })
  }

  private async execute<T>(
    fn: () => Promise<T>,
    resolve: (value: T) => void,
    reject: (error: any) => void
  ): Promise<void> {
    try {
      const result = await fn()
      resolve(result)
    } catch (error) {
      reject(error)
    } finally {
      this.permits++
      if (this.waitingQueue.length > 0) {
        const next = this.waitingQueue.shift()!
        next()
      }
    }
  }
}

// Singleton instance
let batchProcessorInstance: BatchProcessor | null = null

export function getBatchProcessor(options?: BatchOptions): BatchProcessor {
  if (!batchProcessorInstance) {
    batchProcessorInstance = new BatchProcessor(options)
  }
  return batchProcessorInstance
}

// Convenience functions
export async function batchTranscribeAudio(
  audioFiles: Array<{ blob: Blob; id: string; userId: string; filename?: string }>,
  options?: BatchOptions
): Promise<Array<{ id: string; result?: TranscriptionResult; error?: TranscriptionError }>> {
  const processor = getBatchProcessor(options)
  return processor.processMultipleAudio(audioFiles, options)
}

export async function optimizedBatchTranscribe(
  audioFiles: Array<{ blob: Blob; id: string; userId: string; filename?: string }>,
  options?: BatchOptions & { groupSimilar?: boolean }
): Promise<Array<{ id: string; result?: TranscriptionResult; error?: TranscriptionError }>> {
  const processor = getBatchProcessor(options)
  return processor.optimizedBatchProcess(audioFiles, options)
}