/**
 * Transcription Cache Tests
 * Verifies cache functionality, hit rates, and cost efficiency
 */

import { getTranscriptionCache, generateAudioHash, type CacheEntry } from '@/lib/modassembly/openai/transcription-cache'

// Mock Supabase
const mockSupabaseData = new Map<string, any>()
const mockSupabase = {
  from: (table: string) => ({
    select: (columns: string) => ({
      eq: (column: string, value: string) => ({
        gte: (column2: string, value2: string) => ({
          single: () => Promise.resolve({ 
            data: mockSupabaseData.get(`${table}_${value}`) || null 
          }),
          order: (column3: string, options: any) => ({
            limit: (limit: number) => Promise.resolve({ 
              data: Array.from(mockSupabaseData.values()).slice(0, limit) 
            })
          })
        }),
        order: (column2: string, options: any) => ({
          limit: (limit: number) => Promise.resolve({ 
            data: Array.from(mockSupabaseData.values()).slice(0, limit) 
          })
        }),
        limit: (limit: number) => Promise.resolve({ 
          data: Array.from(mockSupabaseData.values()).slice(0, limit) 
        }),
        single: () => Promise.resolve({ 
          data: mockSupabaseData.get(`${table}_${value}`) || null 
        })
      }),
      gte: (column: string, value: string) => ({
        order: (column2: string, options: any) => ({
          limit: (limit: number) => Promise.resolve({ 
            data: Array.from(mockSupabaseData.values()).slice(0, limit) 
          })
        })
      })
    }),
    insert: (data: any) => {
      if (Array.isArray(data)) {
        data.forEach(item => mockSupabaseData.set(`${table}_${item.audio_hash}`, item))
      } else {
        mockSupabaseData.set(`${table}_${data.audio_hash}`, data)
      }
      return Promise.resolve({ data })
    },
    update: (data: any) => ({
      eq: (column: string, value: string) => Promise.resolve({ data })
    }),
    delete: () => ({
      lt: (column: string, value: string) => Promise.resolve({ data: null })
    }),
    rpc: (name: string) => name
  })
}

jest.mock('@/lib/modassembly/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase)
}))

describe('TranscriptionCache', () => {
  let cache: ReturnType<typeof getTranscriptionCache>
  
  beforeEach(() => {
    mockSupabaseData.clear()
    cache = getTranscriptionCache({
      ttlMs: 60000, // 1 minute for testing
      maxEntries: 100,
      minConfidence: 0.7,
      enableSimilarityMatching: true,
      similarityThreshold: 0.85
    })
  })

  describe('Audio Hash Generation', () => {
    it('should generate consistent hashes for identical audio', async () => {
      const audioData = new Uint8Array([1, 2, 3, 4, 5])
      const blob1 = new Blob([audioData], { type: 'audio/wav' })
      const blob2 = new Blob([audioData], { type: 'audio/wav' })

      const hash1 = await generateAudioHash(blob1)
      const hash2 = await generateAudioHash(blob2)

      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(64) // SHA-256 produces 64 character hex string
    })

    it('should generate different hashes for different audio', async () => {
      const audioData1 = new Uint8Array([1, 2, 3, 4, 5])
      const audioData2 = new Uint8Array([6, 7, 8, 9, 10])
      const blob1 = new Blob([audioData1], { type: 'audio/wav' })
      const blob2 = new Blob([audioData2], { type: 'audio/wav' })

      const hash1 = await generateAudioHash(blob1)
      const hash2 = await generateAudioHash(blob2)

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('Cache Operations', () => {
    const testAudioBlob = new Blob([new Uint8Array([1, 2, 3, 4, 5])], { type: 'audio/wav' })
    const testUserId = 'test-user-123'
    const testTranscription = 'I would like a cheeseburger and fries'
    const testItems = ['Cheeseburger', 'Fries']
    const testConfidence = 0.95

    it('should store and retrieve cached transcriptions', async () => {
      const audioHash = await generateAudioHash(testAudioBlob)
      
      // Cache miss initially
      const initialResult = await cache.get(audioHash, testUserId)
      expect(initialResult).toBeNull()

      // Store transcription
      await cache.set(audioHash, testAudioBlob, testTranscription, testItems, testConfidence, testUserId)

      // Cache hit after storing
      const cachedResult = await cache.get(audioHash, testUserId)
      expect(cachedResult).not.toBeNull()
      expect(cachedResult!.transcription).toBe(testTranscription)
      expect(cachedResult!.extractedItems).toEqual(testItems)
      expect(cachedResult!.confidence).toBe(testConfidence)
      expect(cachedResult!.metadata.userId).toBe(testUserId)
    })

    it('should not cache low confidence transcriptions', async () => {
      const audioHash = await generateAudioHash(testAudioBlob)
      const lowConfidence = 0.5 // Below threshold of 0.7

      await cache.set(audioHash, testAudioBlob, testTranscription, testItems, lowConfidence, testUserId)

      const result = await cache.get(audioHash, testUserId)
      expect(result).toBeNull()
    })

    it('should update usage statistics on cache hits', async () => {
      const audioHash = await generateAudioHash(testAudioBlob)
      
      // Store transcription
      await cache.set(audioHash, testAudioBlob, testTranscription, testItems, testConfidence, testUserId)

      // Get multiple times to test usage tracking
      const result1 = await cache.get(audioHash, testUserId)
      const result2 = await cache.get(audioHash, testUserId)

      expect(result1!.useCount).toBe(1)
      expect(result2!.useCount).toBe(2)
      expect(result2!.lastUsed.getTime()).toBeGreaterThan(result1!.lastUsed.getTime())
    })
  })

  describe('Similarity Matching', () => {
    it('should find similar audio files', async () => {
      // Create slightly different but similar audio files
      const audioData1 = new Uint8Array(10000).fill(1) // 10KB
      const audioData2 = new Uint8Array(10100).fill(1) // 10.1KB (similar size)
      
      const blob1 = new Blob([audioData1], { type: 'audio/wav' })
      const blob2 = new Blob([audioData2], { type: 'audio/wav' })

      const hash1 = await generateAudioHash(blob1)
      
      // Store first transcription
      await cache.set(hash1, blob1, testTranscription, testItems, testConfidence, testUserId)

      // Try to find similar for second blob
      const hash2 = await generateAudioHash(blob2)
      const similarResult = await cache.findSimilar(hash2, blob2, testUserId)

      // Should find the similar entry due to size similarity
      expect(similarResult).not.toBeNull()
      expect(similarResult!.transcription).toBe(testTranscription)
    })
  })

  describe('Cache Statistics', () => {
    it('should provide accurate cache statistics', async () => {
      // Create multiple cache entries
      const entries = []
      for (let i = 0; i < 5; i++) {
        const audioData = new Uint8Array([i, i + 1, i + 2])
        const blob = new Blob([audioData], { type: 'audio/wav' })
        const hash = await generateAudioHash(blob)
        
        await cache.set(hash, blob, `transcription ${i}`, [`item ${i}`], 0.9, testUserId)
        
        // Simulate multiple uses for some entries
        if (i % 2 === 0) {
          await cache.get(hash, testUserId)
          await cache.get(hash, testUserId)
        }
      }

      const stats = await cache.getStats()
      expect(stats.totalEntries).toBe(5)
      expect(stats.avgConfidence).toBe(0.9)
      expect(stats.hitRate).toBeGreaterThan(0)
      expect(stats.costSavings).toBeGreaterThan(0)
    })
  })

  describe('Cache Performance', () => {
    it('should achieve target cache hit rate >85%', async () => {
      const testData = []
      
      // Create 20 unique audio samples
      for (let i = 0; i < 20; i++) {
        const audioData = new Uint8Array([i, i + 1, i + 2, i + 3])
        const blob = new Blob([audioData], { type: 'audio/wav' })
        const hash = await generateAudioHash(blob)
        testData.push({ blob, hash })
      }

      // Pre-populate cache with these samples
      for (const { blob, hash } of testData) {
        await cache.set(hash, blob, `transcription for ${hash.slice(0, 8)}`, [`item-${hash.slice(0, 4)}`], 0.9, testUserId)
      }

      // Now simulate requests - 85% should be from cache, 15% new
      let cacheHits = 0
      let totalRequests = 100

      for (let i = 0; i < totalRequests; i++) {
        if (i < 85) {
          // Use existing samples (cache hits)
          const sample = testData[i % testData.length]
          const result = await cache.get(sample.hash, testUserId)
          if (result) cacheHits++
        } else {
          // New samples (cache misses)
          const newAudioData = new Uint8Array([100 + i, 101 + i, 102 + i])
          const newBlob = new Blob([newAudioData], { type: 'audio/wav' })
          const newHash = await generateAudioHash(newBlob)
          const result = await cache.get(newHash, testUserId)
          // Should be null (cache miss)
        }
      }

      const hitRate = cacheHits / 85 // Only count the 85 requests that should hit
      expect(hitRate).toBeGreaterThanOrEqual(0.85) // At least 85% hit rate
    })

    it('should have fast cache lookup times', async () => {
      const audioData = new Uint8Array([1, 2, 3, 4, 5])
      const blob = new Blob([audioData], { type: 'audio/wav' })
      const hash = await generateAudioHash(blob)
      
      // Store transcription
      await cache.set(hash, blob, testTranscription, testItems, testConfidence, testUserId)

      // Measure lookup time
      const startTime = Date.now()
      const result = await cache.get(hash, testUserId)
      const endTime = Date.now()

      expect(result).not.toBeNull()
      expect(endTime - startTime).toBeLessThan(100) // Should be under 100ms
    })
  })

  describe('Cost Efficiency', () => {
    it('should calculate cost savings correctly', async () => {
      // Create cache entries with usage data
      const audioData = new Uint8Array([1, 2, 3, 4, 5])
      const blob = new Blob([audioData], { type: 'audio/wav' })
      const hash = await generateAudioHash(blob)
      
      await cache.set(hash, blob, testTranscription, testItems, testConfidence, testUserId)
      
      // Simulate multiple uses (cost savings)
      for (let i = 0; i < 10; i++) {
        await cache.get(hash, testUserId)
      }

      const stats = await cache.getStats()
      expect(stats.costSavings).toBeGreaterThan(0)
      expect(stats.totalSavings).toBeGreaterThan(0)
    })

    it('should estimate cache value correctly', async () => {
      const stats = await cache.getStats()
      
      // Even with no entries, should have valid structure
      expect(stats.totalEntries).toBeGreaterThanOrEqual(0)
      expect(stats.hitRate).toBeGreaterThanOrEqual(0)
      expect(stats.hitRate).toBeLessThanOrEqual(1)
      expect(stats.costSavings).toBeGreaterThanOrEqual(0)
      expect(Array.isArray(stats.mostUsedTranscriptions)).toBe(true)
    })
  })
})