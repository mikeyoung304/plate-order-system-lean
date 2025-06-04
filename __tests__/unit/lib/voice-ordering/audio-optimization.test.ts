/**
 * Audio Optimization Tests
 * Verifies audio compression, preprocessing, and format optimization
 */

import { createAudioOptimizer, optimizeAudioForTranscription, type AudioAnalysis, type OptimizationResult } from '@/lib/modassembly/audio-recording/audio-optimization'

// Mock Audio APIs for testing
const mockAudioContext = {
  decodeAudioData: jest.fn(),
  close: jest.fn(),
  createBufferSource: jest.fn(),
  destination: {}
}

const mockOfflineAudioContext = {
  createBufferSource: jest.fn(),
  startRendering: jest.fn(),
  destination: {}
}

const mockAudioBuffer = {
  length: 44100, // 1 second at 44.1kHz
  numberOfChannels: 1,
  sampleRate: 44100,
  getChannelData: jest.fn(() => new Float32Array(44100).fill(0.5))
}

// Mock Web Audio API
Object.defineProperty(global.window, 'AudioContext', {
  writable: true,
  value: jest.fn(() => mockAudioContext)
})

Object.defineProperty(global.window, 'OfflineAudioContext', {
  writable: true,
  value: jest.fn(() => mockOfflineAudioContext)
})

beforeEach(() => {
  jest.clearAllMocks()
  mockAudioContext.decodeAudioData.mockResolvedValue(mockAudioBuffer)
  mockOfflineAudioContext.startRendering.mockResolvedValue(mockAudioBuffer)
  mockOfflineAudioContext.createBufferSource.mockReturnValue({
    buffer: null,
    connect: jest.fn(),
    start: jest.fn()
  })
})

describe('AudioOptimizer', () => {
  let optimizer: ReturnType<typeof createAudioOptimizer>

  beforeEach(() => {
    optimizer = createAudioOptimizer({
      maxSizeKB: 500,
      targetBitrate: 64000,
      maxDurationMs: 30000,
      minDurationMs: 500,
      preferredFormat: 'mp3',
      enableDenoising: false
    })
  })

  describe('Audio Analysis', () => {
    it('should analyze audio file properties correctly', async () => {
      const testData = new Uint8Array(1024 * 1024) // 1MB file
      const blob = new Blob([testData], { type: 'audio/wav' })

      const analysis = await optimizer.analyzeAudio(blob)

      expect(analysis.size).toBe(1024 * 1024)
      expect(analysis.format).toBe('wav')
      expect(analysis.duration).toBeGreaterThan(0)
      expect(analysis.estimatedCost).toBeGreaterThan(0)
      expect(analysis.needsOptimization).toBe(true) // Large file needs optimization
    })

    it('should detect different audio formats', async () => {
      const formats = [
        { type: 'audio/mpeg', expected: 'mp3' },
        { type: 'audio/wav', expected: 'wav' },
        { type: 'audio/webm', expected: 'webm' },
        { type: 'audio/ogg', expected: 'ogg' },
        { type: 'audio/mp4', expected: 'mp4' },
        { type: 'audio/unknown', expected: 'unknown' }
      ]

      for (const { type, expected } of formats) {
        const blob = new Blob([new Uint8Array(1000)], { type })
        const analysis = await optimizer.analyzeAudio(blob)
        expect(analysis.format).toBe(expected)
      }
    })

    it('should calculate estimated transcription cost', async () => {
      const testData = new Uint8Array(128000) // ~1 second at 128kbps
      const blob = new Blob([testData], { type: 'audio/mp3' })

      const analysis = await optimizer.analyzeAudio(blob)

      // Should be approximately $0.006 per minute for Whisper
      expect(analysis.estimatedCost).toBeGreaterThan(0)
      expect(analysis.estimatedCost).toBeLessThan(0.01) // Less than 1 cent for short audio
    })
  })

  describe('Optimization Detection', () => {
    it('should identify files that need optimization', async () => {
      const largeFile = new Blob([new Uint8Array(1024 * 1024)], { type: 'audio/wav' }) // 1MB
      const longFile = new Blob([new Uint8Array(100000)], { type: 'audio/wav' }) // Simulated long duration
      const wrongFormat = new Blob([new Uint8Array(50000)], { type: 'audio/webm' })

      const largeAnalysis = await optimizer.analyzeAudio(largeFile)
      const longAnalysis = await optimizer.analyzeAudio(longFile)
      const formatAnalysis = await optimizer.analyzeAudio(wrongFormat)

      expect(largeAnalysis.needsOptimization).toBe(true)
      expect(formatAnalysis.needsOptimization).toBe(true)
    })

    it('should not optimize files that are already optimal', async () => {
      const optimalFile = new Blob([new Uint8Array(50000)], { type: 'audio/mp3' }) // Small MP3

      const analysis = await optimizer.analyzeAudio(optimalFile)
      expect(analysis.needsOptimization).toBe(false)
    })
  })

  describe('Audio Optimization', () => {
    it('should compress large audio files', async () => {
      const largeData = new Uint8Array(1024 * 1024) // 1MB
      const blob = new Blob([largeData], { type: 'audio/wav' })

      const result = await optimizer.optimizeAudio(blob)

      expect(result.compressionRatio).toBeGreaterThan(1)
      expect(result.optimizedBlob.size).toBeLessThanOrEqual(result.originalBlob.size)
      expect(result.costSavings).toBeGreaterThanOrEqual(0)
      expect(result.optimizationApplied.length).toBeGreaterThan(0)
    })

    it('should skip optimization for already optimal files', async () => {
      const optimalData = new Uint8Array(50000) // 50KB - under limit
      const blob = new Blob([optimalData], { type: 'audio/mp3' })

      const result = await optimizer.optimizeAudio(blob)

      expect(result.compressionRatio).toBe(1)
      expect(result.optimizedBlob).toBe(result.originalBlob)
      expect(result.optimizationApplied).toContain('no-optimization-needed')
    })

    it('should apply multiple optimizations when needed', async () => {
      const largeData = new Uint8Array(2 * 1024 * 1024) // 2MB WebM file
      const blob = new Blob([largeData], { type: 'audio/webm' })

      const result = await optimizer.optimizeAudio(blob)

      // Should apply format conversion and compression
      expect(result.optimizationApplied.length).toBeGreaterThan(1)
      expect(result.optimizationApplied).toContain('format-conversion')
      expect(result.compressionRatio).toBeGreaterThan(1)
    })

    it('should handle optimization failures gracefully', async () => {
      // Force an error in Web Audio processing
      mockAudioContext.decodeAudioData.mockRejectedValue(new Error('Decode failed'))

      const blob = new Blob([new Uint8Array(1024 * 1024)], { type: 'audio/wav' })
      const result = await optimizer.optimizeAudio(blob)

      // Should fallback to original blob when optimization fails
      expect(result.optimizedBlob).toBe(result.originalBlob)
      expect(result.optimizationApplied).toContain('optimization-failed')
    })
  })

  describe('Compression Effectiveness', () => {
    it('should achieve target compression ratios', async () => {
      const testCases = [
        { size: 1024 * 1024, type: 'audio/wav', expectedMinRatio: 1.5 }, // 1MB WAV
        { size: 2048 * 1024, type: 'audio/wav', expectedMinRatio: 2.0 }, // 2MB WAV
        { size: 512 * 1024, type: 'audio/webm', expectedMinRatio: 1.2 }   // 512KB WebM
      ]

      for (const testCase of testCases) {
        const blob = new Blob([new Uint8Array(testCase.size)], { type: testCase.type })
        const result = await optimizer.optimizeAudio(blob)

        if (result.analysis.needsOptimization) {
          expect(result.compressionRatio).toBeGreaterThanOrEqual(testCase.expectedMinRatio)
        }
      }
    })

    it('should reduce file sizes by at least 30% for large files', async () => {
      const largeBlob = new Blob([new Uint8Array(1024 * 1024)], { type: 'audio/wav' })
      const result = await optimizer.optimizeAudio(largeBlob)

      if (result.analysis.needsOptimization) {
        const sizeReduction = (result.originalBlob.size - result.optimizedBlob.size) / result.originalBlob.size
        expect(sizeReduction).toBeGreaterThan(0.3) // At least 30% reduction
      }
    })
  })

  describe('Cost Optimization', () => {
    it('should calculate cost savings from optimization', async () => {
      const largeBlob = new Blob([new Uint8Array(1024 * 1024)], { type: 'audio/wav' })
      const result = await optimizer.optimizeAudio(largeBlob)

      expect(result.costSavings).toBeGreaterThanOrEqual(0)
      
      if (result.analysis.needsOptimization) {
        expect(result.costSavings).toBeGreaterThan(0)
      }
    })

    it('should maintain transcription quality while reducing costs', async () => {
      const testBlob = new Blob([new Uint8Array(800000)], { type: 'audio/wav' })
      const result = await optimizer.optimizeAudio(testBlob)

      // Optimization should balance cost savings with quality
      expect(result.compressionRatio).toBeGreaterThan(1)
      expect(result.compressionRatio).toBeLessThan(10) // Don't over-compress
    })
  })

  describe('Format Optimization', () => {
    it('should convert to optimal formats', async () => {
      const optimizer = createAudioOptimizer({
        preferredFormat: 'mp3'
      })

      const webmBlob = new Blob([new Uint8Array(100000)], { type: 'audio/webm' })
      const result = await optimizer.optimizeAudio(webmBlob)

      expect(result.optimizationApplied).toContain('format-conversion')
      expect(result.optimizedBlob.type).toContain('mpeg') // Converted to MP3
    })
  })

  describe('Performance Requirements', () => {
    it('should optimize audio files quickly', async () => {
      const blob = new Blob([new Uint8Array(500000)], { type: 'audio/wav' })
      
      const startTime = Date.now()
      const result = await optimizer.optimizeAudio(blob)
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(5000) // Under 5 seconds
    })

    it('should handle multiple file sizes efficiently', async () => {
      const fileSizes = [50000, 200000, 500000, 1000000] // 50KB to 1MB
      
      for (const size of fileSizes) {
        const blob = new Blob([new Uint8Array(size)], { type: 'audio/wav' })
        
        const startTime = Date.now()
        const result = await optimizer.optimizeAudio(blob)
        const endTime = Date.now()

        // Processing time should scale reasonably with file size
        expect(endTime - startTime).toBeLessThan(10000) // Under 10 seconds even for largest
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle very small audio files', async () => {
      const tinyBlob = new Blob([new Uint8Array(100)], { type: 'audio/wav' })
      const result = await optimizer.optimizeAudio(tinyBlob)

      // Should not break with tiny files
      expect(result.originalBlob).toBe(tinyBlob)
      expect(result.compressionRatio).toBeGreaterThan(0)
    })

    it('should handle unsupported formats gracefully', async () => {
      const unsupportedBlob = new Blob([new Uint8Array(1000)], { type: 'video/mp4' })
      const result = await optimizer.optimizeAudio(unsupportedBlob)

      // Should still provide some result
      expect(result.analysis.format).toBe('unknown')
      expect(result.optimizedBlob).toBeDefined()
    })

    it('should handle corrupted audio data', async () => {
      // Create invalid audio data
      const corruptedData = new Uint8Array(1000)
      corruptedData.fill(255) // Invalid audio pattern
      const blob = new Blob([corruptedData], { type: 'audio/wav' })

      const result = await optimizer.optimizeAudio(blob)

      // Should not crash, fallback gracefully
      expect(result.optimizedBlob).toBeDefined()
    })
  })

  describe('Integration with Transcription Pipeline', () => {
    it('should integrate with the convenience function', async () => {
      const blob = new Blob([new Uint8Array(500000)], { type: 'audio/wav' })
      
      const result = await optimizeAudioForTranscription(blob, {
        maxSizeKB: 300,
        preferredFormat: 'mp3'
      })

      expect(result.originalBlob).toBe(blob)
      expect(result.optimizedBlob).toBeDefined()
      expect(result.analysis.needsOptimization).toBeDefined()
    })

    it('should provide detailed metadata for tracking', async () => {
      const blob = new Blob([new Uint8Array(800000)], { type: 'audio/wav' })
      const result = await optimizer.optimizeAudio(blob)

      // Verify all required metadata is present
      expect(result.analysis.size).toBeDefined()
      expect(result.analysis.duration).toBeDefined()
      expect(result.analysis.estimatedCost).toBeDefined()
      expect(result.compressionRatio).toBeDefined()
      expect(result.costSavings).toBeDefined()
      expect(Array.isArray(result.optimizationApplied)).toBe(true)
    })
  })
})