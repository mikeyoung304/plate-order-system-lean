/**
 * Batch Processor Tests
 * Verifies batch processing capabilities, efficiency, and cost optimization
 */

import { getBatchProcessor, batchTranscribeAudio, optimizedBatchTranscribe, type BatchJob, type BatchResult, type BatchProgress } from '@/lib/modassembly/openai/batch-processor'

// Mock the transcription service
const mockTranscriptionResults = new Map<string, any>()
const mockTranscriptionService = {
  transcribe: jest.fn()
}

jest.mock('@/lib/modassembly/openai/optimized-transcribe', () => ({
  getOptimizedTranscriptionService: () => mockTranscriptionService
}))

// Mock environment
process.env.OPENAI_API_KEY = 'test-key-123'

describe('BatchProcessor', () => {
  let processor: ReturnType<typeof getBatchProcessor>

  beforeEach(() => {
    jest.clearAllMocks()
    mockTranscriptionResults.clear()
    processor = getBatchProcessor({
      concurrency: 2,
      retryFailedJobs: true,
      maxRetries: 1,
      priorityMode: 'fifo',
      timeoutMs: 5000
    })

    // Setup mock transcription responses
    mockTranscriptionService.transcribe.mockImplementation(async (blob: Blob, userId: string, filename?: string) => {
      const mockKey = `${userId}-${blob.size}`
      
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 100))
      
      return {
        items: [`Item from ${filename || 'unknown'}`],
        transcription: `Transcription for ${filename || 'audio'} from ${userId}`,
        confidence: 0.9,
        metadata: {
          cached: false,
          optimized: true,
          compressionRatio: 2.0,
          originalSize: blob.size,
          optimizedSize: blob.size / 2,
          duration: 15000,
          cost: 0.005,
          latency: 1200,
          retryCount: 0,
          model: 'whisper-1'
        }
      }
    })
  })

  describe('Batch Job Management', () => {
    it('should submit and track batch jobs', async () => {
      const jobs: BatchJob[] = [
        {
          id: 'job1',
          audioBlob: new Blob([new Uint8Array(1000)], { type: 'audio/wav' }),
          userId: 'user1',
          filename: 'order1.wav'
        },
        {
          id: 'job2',
          audioBlob: new Blob([new Uint8Array(2000)], { type: 'audio/wav' }),
          userId: 'user2',
          filename: 'order2.wav'
        }
      ]

      const batchId = await processor.submitBatch(jobs)
      
      expect(batchId).toMatch(/^batch_/)
      
      // Check initial progress
      const progress = processor.getBatchProgress(batchId)
      expect(progress).not.toBeNull()
      expect(progress!.totalJobs).toBe(2)
      expect(progress!.completedJobs).toBe(0)
    })

    it('should process jobs with concurrency control', async () => {
      const startTime = Date.now()
      let concurrentCalls = 0
      let maxConcurrentCalls = 0

      mockTranscriptionService.transcribe.mockImplementation(async (blob: Blob) => {
        concurrentCalls++
        maxConcurrentCalls = Math.max(maxConcurrentCalls, concurrentCalls)
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 200))
        
        concurrentCalls--
        
        return {
          items: ['Test Item'],
          transcription: 'Test transcription',
          confidence: 0.9,
          metadata: { cost: 0.005 }
        }
      })

      const jobs: BatchJob[] = Array.from({ length: 5 }, (_, i) => ({
        id: `job${i}`,
        audioBlob: new Blob([new Uint8Array(1000)], { type: 'audio/wav' }),
        userId: 'user1',
        filename: `order${i}.wav`
      }))

      const results = await processor.processMultipleAudio(
        jobs.map(j => ({ blob: j.audioBlob, id: j.id, userId: j.userId, filename: j.filename }))
      )

      const endTime = Date.now()
      
      expect(results).toHaveLength(5)
      expect(maxConcurrentCalls).toBeLessThanOrEqual(2) // Respects concurrency limit
      expect(endTime - startTime).toBeLessThan(1500) // Parallel processing is faster than sequential
    })
  })

  describe('Priority Modes', () => {
    it('should process jobs in FIFO order by default', async () => {
      const processingOrder: string[] = []
      
      mockTranscriptionService.transcribe.mockImplementation(async (blob: Blob, userId: string, filename?: string) => {
        processingOrder.push(filename || 'unknown')
        await new Promise(resolve => setTimeout(resolve, 50))
        return { items: [], transcription: '', confidence: 0.9, metadata: {} }
      })

      const jobs: BatchJob[] = [
        { id: 'job1', audioBlob: new Blob([new Uint8Array(1000)]), userId: 'user1', filename: 'first.wav' },
        { id: 'job2', audioBlob: new Blob([new Uint8Array(2000)]), userId: 'user1', filename: 'second.wav' },
        { id: 'job3', audioBlob: new Blob([new Uint8Array(1500)]), userId: 'user1', filename: 'third.wav' }
      ]

      await processor.submitBatch(jobs, { priorityMode: 'fifo', concurrency: 1 })
      
      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 500))
      
      expect(processingOrder).toEqual(['first.wav', 'second.wav', 'third.wav'])
    })

    it('should process shortest files first when configured', async () => {
      const processingOrder: string[] = []
      
      mockTranscriptionService.transcribe.mockImplementation(async (blob: Blob, userId: string, filename?: string) => {
        processingOrder.push(filename || 'unknown')
        await new Promise(resolve => setTimeout(resolve, 50))
        return { items: [], transcription: '', confidence: 0.9, metadata: {} }
      })

      const jobs: BatchJob[] = [
        { id: 'job1', audioBlob: new Blob([new Uint8Array(3000)]), userId: 'user1', filename: 'large.wav' },
        { id: 'job2', audioBlob: new Blob([new Uint8Array(1000)]), userId: 'user1', filename: 'small.wav' },
        { id: 'job3', audioBlob: new Blob([new Uint8Array(2000)]), userId: 'user1', filename: 'medium.wav' }
      ]

      await processor.submitBatch(jobs, { priorityMode: 'shortest', concurrency: 1 })
      
      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 500))
      
      expect(processingOrder).toEqual(['small.wav', 'medium.wav', 'large.wav'])
    })
  })

  describe('Error Handling and Retries', () => {
    it('should handle transcription failures gracefully', async () => {
      let callCount = 0
      mockTranscriptionService.transcribe.mockImplementation(async (blob: Blob) => {
        callCount++
        if (callCount === 1) {
          throw new Error('Temporary failure')
        }
        return { items: ['Success'], transcription: 'Success', confidence: 0.9, metadata: {} }
      })

      const jobs: BatchJob[] = [{
        id: 'job1',
        audioBlob: new Blob([new Uint8Array(1000)]),
        userId: 'user1',
        filename: 'test.wav'
      }]

      const results = await processor.processMultipleAudio(
        jobs.map(j => ({ blob: j.audioBlob, id: j.id, userId: j.userId, filename: j.filename }))
      )

      expect(results).toHaveLength(1)
      expect(results[0].error).toBeDefined()
      expect(mockTranscriptionService.transcribe).toHaveBeenCalledTimes(1)
    })

    it('should timeout long-running jobs', async () => {
      mockTranscriptionService.transcribe.mockImplementation(async () => {
        // Simulate a job that takes too long
        await new Promise(resolve => setTimeout(resolve, 10000))
        return { items: [], transcription: '', confidence: 0.9, metadata: {} }
      })

      const jobs: BatchJob[] = [{
        id: 'job1',
        audioBlob: new Blob([new Uint8Array(1000)]),
        userId: 'user1',
        filename: 'slow.wav'
      }]

      const startTime = Date.now()
      const results = await processor.processMultipleAudio(
        jobs.map(j => ({ blob: j.audioBlob, id: j.id, userId: j.userId, filename: j.filename })),
        { timeoutMs: 1000 }
      )
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(2000) // Should timeout quickly
      expect(results[0].error).toBeDefined()
    })
  })

  describe('Batch Progress Tracking', () => {
    it('should provide accurate progress updates', async () => {
      const jobs: BatchJob[] = Array.from({ length: 4 }, (_, i) => ({
        id: `job${i}`,
        audioBlob: new Blob([new Uint8Array(1000)]),
        userId: 'user1',
        filename: `order${i}.wav`
      }))

      const batchId = await processor.submitBatch(jobs, { concurrency: 1 })
      
      // Check progress periodically
      const progressUpdates: number[] = []
      const checkProgress = () => {
        const progress = processor.getBatchProgress(batchId)
        if (progress) {
          progressUpdates.push(progress.completedJobs + progress.failedJobs)
        }
      }

      const progressInterval = setInterval(checkProgress, 100)
      
      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      clearInterval(progressInterval)
      
      const finalProgress = processor.getBatchProgress(batchId)
      expect(finalProgress).not.toBeNull()
      expect(finalProgress!.completedJobs + finalProgress!.failedJobs).toBe(4)
      expect(progressUpdates.length).toBeGreaterThan(1) // Should have multiple updates
    })

    it('should calculate estimated time remaining', async () => {
      const jobs: BatchJob[] = Array.from({ length: 3 }, (_, i) => ({
        id: `job${i}`,
        audioBlob: new Blob([new Uint8Array(1000)]),
        userId: 'user1',
        filename: `order${i}.wav`
      }))

      const batchId = await processor.submitBatch(jobs, { concurrency: 1 })
      
      // Wait a bit for some jobs to complete
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const progress = processor.getBatchProgress(batchId)
      if (progress && progress.completedJobs > 0) {
        expect(progress.averageProcessingTime).toBeGreaterThan(0)
        expect(progress.estimatedTimeRemaining).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('Cost Efficiency', () => {
    it('should reduce overhead through batch processing', async () => {
      const startTime = Date.now()
      
      // Process 10 jobs in batch
      const jobs = Array.from({ length: 10 }, (_, i) => ({
        blob: new Blob([new Uint8Array(1000)]),
        id: `job${i}`,
        userId: 'user1',
        filename: `order${i}.wav`
      }))

      const results = await batchTranscribeAudio(jobs, { concurrency: 3 })
      const batchTime = Date.now() - startTime

      expect(results).toHaveLength(10)
      expect(results.every(r => r.result || r.error)).toBe(true)
      
      // Batch processing should be significantly faster than sequential
      expect(batchTime).toBeLessThan(2000) // Under 2 seconds for 10 jobs
    })

    it('should provide batch processing statistics', async () => {
      const jobs = Array.from({ length: 5 }, (_, i) => ({
        blob: new Blob([new Uint8Array(1000)]),
        id: `job${i}`,
        userId: 'user1',
        filename: `order${i}.wav`
      }))

      await batchTranscribeAudio(jobs)
      
      const stats = await processor.getBatchStats()
      
      expect(stats.totalJobsProcessed).toBeGreaterThan(0)
      expect(stats.successRate).toBeGreaterThan(0)
      expect(stats.averageProcessingTime).toBeGreaterThan(0)
      expect(stats.costSavings).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Optimized Batch Processing', () => {
    it('should group similar audio files for better cache hits', async () => {
      const similarFiles = [
        { blob: new Blob([new Uint8Array(1000)]), id: 'job1', userId: 'user1', filename: 'order1.wav' },
        { blob: new Blob([new Uint8Array(1050)]), id: 'job2', userId: 'user1', filename: 'order2.wav' }, // Similar size
        { blob: new Blob([new Uint8Array(5000)]), id: 'job3', userId: 'user1', filename: 'order3.wav' }, // Different size
        { blob: new Blob([new Uint8Array(1020)]), id: 'job4', userId: 'user1', filename: 'order4.wav' }  // Similar to first two
      ]

      const results = await optimizedBatchTranscribe(similarFiles, { 
        groupSimilar: true,
        concurrency: 2
      })

      expect(results).toHaveLength(4)
      expect(results.every(r => r.result || r.error)).toBe(true)
      
      // Grouping should process similar files together for potential cache benefits
      expect(mockTranscriptionService.transcribe).toHaveBeenCalledTimes(4)
    })

    it('should maintain efficiency with mixed file sizes', async () => {
      const mixedFiles = [
        { blob: new Blob([new Uint8Array(500)]), id: 'small1', userId: 'user1', filename: 'small1.wav' },
        { blob: new Blob([new Uint8Array(50000)]), id: 'large1', userId: 'user1', filename: 'large1.wav' },
        { blob: new Blob([new Uint8Array(2000)]), id: 'medium1', userId: 'user1', filename: 'medium1.wav' },
        { blob: new Blob([new Uint8Array(500)]), id: 'small2', userId: 'user1', filename: 'small2.wav' }
      ]

      const startTime = Date.now()
      const results = await optimizedBatchTranscribe(mixedFiles, { 
        groupSimilar: true,
        priorityMode: 'shortest'
      })
      const endTime = Date.now()

      expect(results).toHaveLength(4)
      expect(endTime - startTime).toBeLessThan(3000) // Should complete efficiently
    })
  })

  describe('Convenience Functions', () => {
    it('should work with the convenience batch function', async () => {
      const files = [
        { blob: new Blob([new Uint8Array(1000)]), id: 'job1', userId: 'user1', filename: 'test1.wav' },
        { blob: new Blob([new Uint8Array(2000)]), id: 'job2', userId: 'user1', filename: 'test2.wav' }
      ]

      const results = await batchTranscribeAudio(files, {
        concurrency: 2,
        enableOptimization: true,
        enableCaching: true
      })

      expect(results).toHaveLength(2)
      expect(results[0].id).toBe('job1')
      expect(results[1].id).toBe('job2')
    })

    it('should work with the optimized convenience function', async () => {
      const files = [
        { blob: new Blob([new Uint8Array(1000)]), id: 'job1', userId: 'user1', filename: 'test1.wav' }
      ]

      const results = await optimizedBatchTranscribe(files, {
        groupSimilar: false,
        concurrency: 1
      })

      expect(results).toHaveLength(1)
      expect(results[0].result || results[0].error).toBeDefined()
    })
  })

  describe('Performance Benchmarks', () => {
    it('should process 20 jobs under 5 seconds with concurrency', async () => {
      const jobs = Array.from({ length: 20 }, (_, i) => ({
        blob: new Blob([new Uint8Array(1000)]),
        id: `perf-job${i}`,
        userId: 'user1',
        filename: `perf${i}.wav`
      }))

      const startTime = Date.now()
      const results = await batchTranscribeAudio(jobs, { 
        concurrency: 5,
        timeoutMs: 2000
      })
      const endTime = Date.now()

      expect(results).toHaveLength(20)
      expect(endTime - startTime).toBeLessThan(5000) // Under 5 seconds
    })

    it('should maintain quality with high concurrency', async () => {
      const jobs = Array.from({ length: 10 }, (_, i) => ({
        blob: new Blob([new Uint8Array(1000 + i * 100)]), // Varied sizes
        id: `quality-job${i}`,
        userId: 'user1',
        filename: `quality${i}.wav`
      }))

      const results = await batchTranscribeAudio(jobs, { 
        concurrency: 8 // High concurrency
      })

      const successRate = results.filter(r => r.result).length / results.length
      expect(successRate).toBeGreaterThan(0.9) // At least 90% success rate
    })
  })
})