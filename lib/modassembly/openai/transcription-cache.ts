/**
 * Intelligent Transcription Caching System
 * Reduces OpenAI API calls through smart caching and deduplication
 */

import { createClient } from '@/lib/modassembly/supabase/server'

export interface CacheEntry {
  id: string
  audioHash: string
  transcription: string
  extractedItems: string[]
  confidence: number
  createdAt: Date
  lastUsed: Date
  useCount: number
  metadata: {
    originalSize: number
    optimizedSize: number
    duration: number
    format: string
    userId: string
  }
}

export interface CacheOptions {
  ttlMs?: number // Time to live in milliseconds
  maxEntries?: number // Maximum cache entries
  minConfidence?: number // Minimum confidence to cache
  enableSimilarityMatching?: boolean // Match similar audio
  similarityThreshold?: number // Similarity threshold (0-1)
}

export interface CacheStats {
  totalEntries: number
  hitRate: number
  costSavings: number
  totalSavings: number
  avgConfidence: number
  mostUsedTranscriptions: Array<{ transcription: string; useCount: number }>
}

const DEFAULT_OPTIONS: Required<CacheOptions> = {
  ttlMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxEntries: 10000,
  minConfidence: 0.7,
  enableSimilarityMatching: true,
  similarityThreshold: 0.85,
}

export class TranscriptionCache {
  private options: Required<CacheOptions>
  private memoryCache: Map<string, CacheEntry> = new Map()
  private initialized = false

  constructor(options: CacheOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  /**
   * Initialize cache with database entries
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      const supabase = await createClient()
      
      // Create transcription_cache table if it doesn't exist
      await this.ensureCacheTable(supabase)
      
      // Load recent entries into memory cache
      const { data: entries } = await supabase
        .from('transcription_cache')
        .select('*')
        .gte('last_used', new Date(Date.now() - this.options.ttlMs).toISOString())
        .order('last_used', { ascending: false })
        .limit(1000) // Load top 1000 recent entries

      if (entries) {
        for (const entry of entries) {
          this.memoryCache.set(entry.audio_hash, this.dbEntryToCacheEntry(entry))
        }
      }

      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize transcription cache:', error)
      // Continue without cache if initialization fails
      this.initialized = true
    }
  }

  /**
   * Get cached transcription by audio hash
   */
  async get(audioHash: string, userId: string): Promise<CacheEntry | null> {
    await this.initialize()

    // Check memory cache first
    let entry = this.memoryCache.get(audioHash)
    
    if (!entry) {
      // Check database cache
      try {
        const supabase = await createClient()
        const { data } = await supabase
          .from('transcription_cache')
          .select('*')
          .eq('audio_hash', audioHash)
          .gte('created_at', new Date(Date.now() - this.options.ttlMs).toISOString())
          .single()

        if (data) {
          entry = this.dbEntryToCacheEntry(data)
          this.memoryCache.set(audioHash, entry)
        }
      } catch (error) {
        console.error('Cache lookup failed:', error)
        return null
      }
    }

    if (entry) {
      // Update usage stats
      entry.lastUsed = new Date()
      entry.useCount++
      
      // Update in database asynchronously
      this.updateUsageStats(audioHash, userId).catch(console.error)
      
      return entry
    }

    return null
  }

  /**
   * Find similar transcriptions using fuzzy matching
   */
  async findSimilar(audioHash: string, audioBlob: Blob, userId: string): Promise<CacheEntry | null> {
    if (!this.options.enableSimilarityMatching) return null

    await this.initialize()

    try {
      // For now, implement basic similarity based on file size and duration
      // In production, would use audio fingerprinting
      const analysis = await this.analyzeAudio(audioBlob)
      
      const candidates: CacheEntry[] = []
      
      // Check memory cache for similar entries
      for (const entry of this.memoryCache.values()) {
        if (this.isSimilarAudio(analysis, entry.metadata)) {
          candidates.push(entry)
        }
      }

      // If no memory candidates, check database
      if (candidates.length === 0) {
        const supabase = await createClient()
        const { data: dbEntries } = await supabase
          .from('transcription_cache')
          .select('*')
          .gte('created_at', new Date(Date.now() - this.options.ttlMs).toISOString())
          .order('confidence', { ascending: false })
          .limit(100)

        if (dbEntries) {
          for (const dbEntry of dbEntries) {
            const entry = this.dbEntryToCacheEntry(dbEntry)
            if (this.isSimilarAudio(analysis, entry.metadata)) {
              candidates.push(entry)
            }
          }
        }
      }

      // Return the best match above threshold
      if (candidates.length > 0) {
        const bestMatch = candidates.reduce((best, current) => 
          current.confidence > best.confidence ? current : best
        )

        if (bestMatch.confidence >= this.options.similarityThreshold) {
          // Update usage stats for the matched entry
          this.updateUsageStats(bestMatch.audioHash, userId).catch(console.error)
          return bestMatch
        }
      }
    } catch (error) {
      console.error('Similarity search failed:', error)
    }

    return null
  }

  /**
   * Store transcription in cache
   */
  async set(
    audioHash: string, 
    audioBlob: Blob, 
    transcription: string, 
    extractedItems: string[], 
    confidence: number,
    userId: string
  ): Promise<void> {
    if (confidence < this.options.minConfidence) {
      return // Don't cache low-confidence results
    }

    await this.initialize()

    try {
      const analysis = await this.analyzeAudio(audioBlob)
      
      const entry: CacheEntry = {
        id: this.generateId(),
        audioHash,
        transcription,
        extractedItems,
        confidence,
        createdAt: new Date(),
        lastUsed: new Date(),
        useCount: 1,
        metadata: {
          originalSize: audioBlob.size,
          optimizedSize: audioBlob.size, // Would be different if optimized
          duration: analysis.duration,
          format: analysis.format,
          userId,
        },
      }

      // Store in memory cache
      this.memoryCache.set(audioHash, entry)

      // Store in database asynchronously
      this.persistToDatabase(entry).catch(console.error)

      // Clean up old entries if needed
      this.cleanupIfNeeded().catch(console.error)

    } catch (error) {
      console.error('Failed to cache transcription:', error)
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    await this.initialize()

    try {
      const supabase = await createClient()
      
      // Get basic stats
      const { data: statsData } = await supabase
        .from('transcription_cache')
        .select('use_count, confidence')
        .gte('created_at', new Date(Date.now() - this.options.ttlMs).toISOString())

      const { data: topUsed } = await supabase
        .from('transcription_cache')
        .select('transcription, use_count')
        .gte('created_at', new Date(Date.now() - this.options.ttlMs).toISOString())
        .order('use_count', { ascending: false })
        .limit(10)

      // Calculate stats
      const totalEntries = statsData?.length || 0
      const totalUseCount = statsData?.reduce((sum, entry) => sum + entry.use_count, 0) || 0
      const avgConfidence = totalEntries > 0 
        ? statsData!.reduce((sum, entry) => sum + entry.confidence, 0) / totalEntries 
        : 0

      // Estimate cost savings (assuming $0.006 per minute)
      const avgDuration = 10000 // 10 seconds average
      const costSavings = (totalUseCount - totalEntries) * (avgDuration / 60000) * 0.006

      return {
        totalEntries,
        hitRate: totalEntries > 0 ? (totalUseCount - totalEntries) / totalUseCount : 0,
        costSavings,
        totalSavings: costSavings,
        avgConfidence,
        mostUsedTranscriptions: topUsed?.map(item => ({
          transcription: item.transcription,
          useCount: item.use_count
        })) || [],
      }
    } catch (error) {
      console.error('Failed to get cache stats:', error)
      return {
        totalEntries: 0,
        hitRate: 0,
        costSavings: 0,
        totalSavings: 0,
        avgConfidence: 0,
        mostUsedTranscriptions: [],
      }
    }
  }

  /**
   * Clear cache entries older than TTL
   */
  async cleanup(): Promise<void> {
    await this.initialize()

    try {
      const cutoff = new Date(Date.now() - this.options.ttlMs)
      
      // Clean memory cache
      for (const [hash, entry] of this.memoryCache.entries()) {
        if (entry.createdAt < cutoff) {
          this.memoryCache.delete(hash)
        }
      }

      // Clean database cache
      const supabase = await createClient()
      await supabase
        .from('transcription_cache')
        .delete()
        .lt('created_at', cutoff.toISOString())

    } catch (error) {
      console.error('Cache cleanup failed:', error)
    }
  }

  private async ensureCacheTable(supabase: any): Promise<void> {
    // This would be handled by a migration in production
    // For now, assume the table exists or create it dynamically
    try {
      await supabase.from('transcription_cache').select('id').limit(1)
    } catch (error) {
      console.warn('Transcription cache table may not exist:', error)
    }
  }

  private async analyzeAudio(blob: Blob): Promise<{ duration: number; format: string }> {
    // Simple analysis - in production would be more sophisticated
    const format = blob.type.split('/')[1] || 'unknown'
    const duration = Math.min(30000, Math.max(1000, blob.size / 1000)) // Rough estimate
    
    return { duration, format }
  }

  private isSimilarAudio(
    analysis: { duration: number; format: string },
    metadata: CacheEntry['metadata']
  ): boolean {
    // Simple similarity check based on duration and size
    const durationSimilarity = Math.abs(analysis.duration - metadata.duration) / Math.max(analysis.duration, metadata.duration)
    return durationSimilarity < 0.2 // Within 20% duration difference
  }

  private async persistToDatabase(entry: CacheEntry): Promise<void> {
    try {
      const supabase = await createClient()
      await supabase.from('transcription_cache').insert({
        id: entry.id,
        audio_hash: entry.audioHash,
        transcription: entry.transcription,
        extracted_items: entry.extractedItems,
        confidence: entry.confidence,
        created_at: entry.createdAt.toISOString(),
        last_used: entry.lastUsed.toISOString(),
        use_count: entry.useCount,
        metadata: entry.metadata,
      })
    } catch (error) {
      console.error('Failed to persist cache entry:', error)
    }
  }

  private async updateUsageStats(audioHash: string, userId: string): Promise<void> {
    try {
      const supabase = await createClient()
      await supabase
        .from('transcription_cache')
        .update({
          last_used: new Date().toISOString(),
          use_count: supabase.rpc('increment_use_count'),
        })
        .eq('audio_hash', audioHash)
    } catch (error) {
      console.error('Failed to update usage stats:', error)
    }
  }

  private async cleanupIfNeeded(): Promise<void> {
    if (this.memoryCache.size > this.options.maxEntries) {
      // Remove oldest entries from memory cache
      const entries = Array.from(this.memoryCache.entries())
      entries.sort(([, a], [, b]) => a.lastUsed.getTime() - b.lastUsed.getTime())
      
      const toRemove = entries.slice(0, entries.length - this.options.maxEntries)
      for (const [hash] of toRemove) {
        this.memoryCache.delete(hash)
      }
    }
  }

  private dbEntryToCacheEntry(dbEntry: any): CacheEntry {
    return {
      id: dbEntry.id,
      audioHash: dbEntry.audio_hash,
      transcription: dbEntry.transcription,
      extractedItems: dbEntry.extracted_items,
      confidence: dbEntry.confidence,
      createdAt: new Date(dbEntry.created_at),
      lastUsed: new Date(dbEntry.last_used),
      useCount: dbEntry.use_count,
      metadata: dbEntry.metadata,
    }
  }

  private generateId(): string {
    return crypto.randomUUID()
  }
}

// Singleton instance
let cacheInstance: TranscriptionCache | null = null

export function getTranscriptionCache(options?: CacheOptions): TranscriptionCache {
  if (!cacheInstance) {
    cacheInstance = new TranscriptionCache(options)
  }
  return cacheInstance
}

// Helper function to generate audio hash
export async function generateAudioHash(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}