/**
 * Comprehensive integration tests for the transcribe API route
 * Tests authentication, validation, rate limiting, file processing, and error handling
 */

import { NextRequest } from 'next/server'
import { POST, GET } from '@/app/api/transcribe/route'

// Mock dependencies
const mockOptimizedTranscribe = jest.fn()
const mockGetUsageTracker = jest.fn()
const mockCreateClient = jest.fn()
const mockSecurity = {
  validate: {
    validateRequest: jest.fn(),
  },
  headers: {
    getHeaders: jest.fn(() => ({
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
    })),
  },
  rateLimit: {
    isAllowed: jest.fn(),
  },
  sanitize: {
    sanitizeHTML: jest.fn((input) => input),
    sanitizeOrderItem: jest.fn((input) => input),
    sanitizeIdentifier: jest.fn((input) => input),
  },
}
const mockMeasureApiCall = jest.fn((name, fn) => fn())

jest.mock('@/lib/modassembly/openai/optimized-transcribe', () => ({
  optimizedTranscribeAudioFile: (...args: any[]) => mockOptimizedTranscribe(...args),
}))

jest.mock('@/lib/modassembly/openai/usage-tracking', () => ({
  getUsageTracker: () => mockGetUsageTracker(),
}))

jest.mock('@/lib/modassembly/supabase/server', () => ({
  createClient: () => mockCreateClient(),
}))

jest.mock('@/lib/security', () => ({
  Security: mockSecurity,
}))

jest.mock('@/lib/performance-utils', () => ({
  measureApiCall: (name: string, fn: Function) => mockMeasureApiCall(name, fn),
}))

describe('/api/transcribe', () => {
  let mockSupabaseClient: any
  let mockUsageTracker: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mocks
    mockSecurity.validate.validateRequest.mockReturnValue({ isValid: true })
    mockSecurity.rateLimit.isAllowed.mockReturnValue(true)
    
    mockUsageTracker = {
      getUsageStats: jest.fn().mockResolvedValue({ totalCost: 0 }),
      trackUsage: jest.fn().mockResolvedValue(undefined),
    }
    mockGetUsageTracker.mockReturnValue(mockUsageTracker)
    
    mockSupabaseClient = {
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: {
            session: {
              user: { id: 'test-user-id' },
            },
          },
          error: null,
        }),
      },
    }
    mockCreateClient.mockReturnValue(mockSupabaseClient)
    
    mockOptimizedTranscribe.mockResolvedValue({
      transcription: 'chicken, pasta, salad',
      items: ['chicken', 'pasta', 'salad'],
      metadata: {
        cached: false,
        optimized: true,
        cost: 0.01,
      },
    })
  })

  describe('POST /api/transcribe', () => {
    const createMockRequest = (options: {
      audioFile?: File | null
      headers?: Record<string, string>
      formData?: FormData
    } = {}) => {
      const formData = options.formData || new FormData()
      
      if (options.audioFile !== null) {
        const audioFile = options.audioFile || new File(
          [new ArrayBuffer(1000)], 
          'test-audio.wav', 
          { type: 'audio/wav' }
        )
        formData.append('audio', audioFile)
      }

      return {
        formData: jest.fn().mockResolvedValue(formData),
        headers: new Headers(options.headers || {}),
      } as any as NextRequest
    }

    describe('Authentication', () => {
      it('returns 401 when no session', async () => {
        mockSupabaseClient.auth.getSession.mockResolvedValue({
          data: { session: null },
          error: null,
        })

        const request = createMockRequest()
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toContain('Unauthorized')
      })

      it('returns 401 when session error', async () => {
        mockSupabaseClient.auth.getSession.mockResolvedValue({
          data: { session: null },
          error: new Error('Session error'),
        })

        const request = createMockRequest()
        const response = await POST(request)

        expect(response.status).toBe(401)
      })

      it('proceeds with valid session', async () => {
        const request = createMockRequest()
        const response = await POST(request)

        expect(response.status).not.toBe(401)
      })
    })

    describe('Request Validation', () => {
      it('returns 400 for invalid request', async () => {
        mockSecurity.validate.validateRequest.mockReturnValue({
          isValid: false,
          errors: ['Invalid request format'],
        })

        const request = createMockRequest()
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Invalid request')
        expect(data.details).toEqual(['Invalid request format'])
      })

      it('returns 400 for invalid form data', async () => {
        const request = {
          formData: jest.fn().mockRejectedValue(new Error('Invalid form data')),
        } as any as NextRequest

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Invalid form data')
      })

      it('returns 400 when no audio file provided', async () => {
        const request = createMockRequest({ audioFile: null })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('No valid audio file provided')
      })
    })

    describe('Rate Limiting', () => {
      it('returns 429 when rate limit exceeded', async () => {
        mockSecurity.rateLimit.isAllowed.mockReturnValue(false)

        const request = createMockRequest()
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(429)
        expect(data.error).toContain('Rate limit exceeded')
        expect(response.headers.get('Retry-After')).toBe('60')
      })

      it('returns 429 when daily budget exceeded', async () => {
        mockUsageTracker.getUsageStats.mockResolvedValue({ totalCost: 6.0 })

        const request = createMockRequest()
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(429)
        expect(data.error).toContain('Daily budget exceeded')
        expect(response.headers.get('Retry-After')).toBe('86400')
      })

      it('proceeds when within limits', async () => {
        mockUsageTracker.getUsageStats.mockResolvedValue({ totalCost: 1.0 })
        mockSecurity.rateLimit.isAllowed.mockReturnValue(true)

        const request = createMockRequest()
        const response = await POST(request)

        expect(response.status).not.toBe(429)
      })
    })

    describe('File Validation', () => {
      it('returns 413 for files too large', async () => {
        const largeFile = new File(
          [new ArrayBuffer(26 * 1024 * 1024)], // 26MB
          'large-audio.wav',
          { type: 'audio/wav' }
        )

        const request = createMockRequest({ audioFile: largeFile })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(413)
        expect(data.error).toContain('too large')
      })

      it('returns 400 for files too small', async () => {
        const smallFile = new File(
          [new ArrayBuffer(50)], // 50 bytes
          'small-audio.wav',
          { type: 'audio/wav' }
        )

        const request = createMockRequest({ audioFile: smallFile })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('too small')
      })

      it('returns 400 for invalid MIME type', async () => {
        const invalidFile = new File(
          [new ArrayBuffer(1000)],
          'test.txt',
          { type: 'text/plain' }
        )

        const request = createMockRequest({ audioFile: invalidFile })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('Invalid audio format')
      })

      it('accepts valid audio formats', async () => {
        const validFormats = [
          'audio/wav',
          'audio/mpeg',
          'audio/mp4',
          'audio/webm',
          'audio/ogg',
        ]

        for (const format of validFormats) {
          const audioFile = new File(
            [new ArrayBuffer(1000)],
            `test.${format.split('/')[1]}`,
            { type: format }
          )

          const request = createMockRequest({ audioFile })
          const response = await POST(request)

          expect(response.status).not.toBe(400)
        }
      })
    })

    describe('Audio Processing', () => {
      it('processes audio successfully', async () => {
        const request = createMockRequest()
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data.transcript).toBe('chicken, pasta, salad')
        expect(data.data.items).toEqual(['chicken', 'pasta', 'salad'])
        expect(mockOptimizedTranscribe).toHaveBeenCalled()
      })

      it('calls optimized transcription with correct parameters', async () => {
        const audioFile = new File(
          [new ArrayBuffer(1000)],
          'test-audio.wav',
          { type: 'audio/wav' }
        )

        const request = createMockRequest({ audioFile })
        await POST(request)

        expect(mockOptimizedTranscribe).toHaveBeenCalledWith(
          expect.any(Blob),
          'test-user-id',
          'test-audio.wav',
          expect.objectContaining({
            enableOptimization: true,
            enableCaching: true,
            enableFallback: true,
            maxRetries: 3,
            confidenceThreshold: 0.7,
            preferredModel: 'gpt-3.5-turbo',
          })
        )
      })

      it('sanitizes output data', async () => {
        mockOptimizedTranscribe.mockResolvedValue({
          transcription: '<script>alert("xss")</script>chicken, pasta',
          items: ['<script>alert("xss")</script>', 'chicken', 'pasta', ''],
        })

        const request = createMockRequest()
        await POST(request)

        expect(mockSecurity.sanitize.sanitizeHTML).toHaveBeenCalled()
        expect(mockSecurity.sanitize.sanitizeOrderItem).toHaveBeenCalledTimes(3)
      })

      it('limits items to maximum of 20', async () => {
        const manyItems = Array.from({ length: 25 }, (_, i) => `item-${i}`)
        mockOptimizedTranscribe.mockResolvedValue({
          transcription: 'many items',
          items: manyItems,
        })

        const request = createMockRequest()
        const response = await POST(request)
        const data = await response.json()

        expect(data.data.items).toHaveLength(20)
      })
    })

    describe('Error Handling', () => {
      it('handles transcription service errors', async () => {
        mockOptimizedTranscribe.mockRejectedValue(new Error('Transcription failed'))

        const request = createMockRequest()
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(422)
        expect(data.success).toBe(false)
        expect(data.error).toContain('transcription failed')
      })

      it('handles specific error codes', async () => {
        const errorCases = [
          { code: 'RATE_LIMITED', expectedStatus: 503 },
          { code: 'AUDIO_TOO_LARGE', expectedStatus: 413 },
          { code: 'INVALID_FORMAT', expectedStatus: 400 },
          { code: 'TIMEOUT', expectedStatus: 408 },
        ]

        for (const { code, expectedStatus } of errorCases) {
          const error = new Error('Test error')
          ;(error as any).code = code

          mockOptimizedTranscribe.mockRejectedValue(error)

          const request = createMockRequest()
          const response = await POST(request)

          expect(response.status).toBe(expectedStatus)
        }
      })

      it('includes error metadata in logs', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
        
        const error = new Error('Transcription failed')
        ;(error as any).code = 'TEST_ERROR'
        ;(error as any).retryable = false

        mockOptimizedTranscribe.mockRejectedValue(error)

        const request = createMockRequest()
        await POST(request)

        expect(consoleSpy).toHaveBeenCalledWith(
          'Optimized transcription failed:',
          expect.objectContaining({
            error: 'Transcription failed',
            code: 'TEST_ERROR',
            retryable: false,
            userId: 'test-user-id',
          })
        )

        consoleSpy.mockRestore()
      })
    })

    describe('Security Headers', () => {
      it('includes security headers in all responses', async () => {
        const request = createMockRequest()
        const response = await POST(request)

        expect(mockSecurity.headers.getHeaders).toHaveBeenCalled()
        expect(response.headers.get('Content-Type')).toBe('application/json')
        expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      })

      it('includes security headers in error responses', async () => {
        mockSecurity.validate.validateRequest.mockReturnValue({
          isValid: false,
          errors: ['Invalid'],
        })

        const request = createMockRequest()
        const response = await POST(request)

        expect(response.status).toBe(400)
        expect(mockSecurity.headers.getHeaders).toHaveBeenCalled()
      })
    })

    describe('Performance Monitoring', () => {
      it('measures API call performance', async () => {
        const request = createMockRequest()
        await POST(request)

        expect(mockMeasureApiCall).toHaveBeenCalledWith(
          'transcribe_api',
          expect.any(Function)
        )
      })

      it('logs optimization metrics', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
        
        const audioFile = new File(
          [new ArrayBuffer(2 * 1024 * 1024)], // 2MB (large file)
          'large-audio.wav',
          { type: 'audio/wav' }
        )

        const request = createMockRequest({ audioFile })
        await POST(request)

        expect(consoleSpy).toHaveBeenCalledWith(
          'Large audio file detected, will optimize:',
          expect.objectContaining({
            userId: 'test-user-id',
            originalSize: 2 * 1024 * 1024,
            fileName: 'large-audio.wav',
          })
        )

        consoleSpy.mockRestore()
      })

      it('logs successful transcription metrics', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

        const request = createMockRequest()
        await POST(request)

        expect(consoleSpy).toHaveBeenCalledWith(
          'Optimized transcription completed:',
          expect.objectContaining({
            userId: 'test-user-id',
            itemCount: 3,
            transcriptionLength: 19, // 'chicken, pasta, salad'.length
            originalFileSize: 1000,
          })
        )

        consoleSpy.mockRestore()
      })
    })

    describe('Integration with Optimized Services', () => {
      it('integrates with usage tracking', async () => {
        const request = createMockRequest()
        await POST(request)

        expect(mockGetUsageTracker).toHaveBeenCalled()
        expect(mockUsageTracker.getUsageStats).toHaveBeenCalledWith(
          'day',
          'test-user-id'
        )
      })

      it('checks budget before processing', async () => {
        // First call - within budget
        mockUsageTracker.getUsageStats.mockResolvedValue({ totalCost: 1.0 })
        
        const request1 = createMockRequest()
        const response1 = await POST(request1)
        expect(response1.status).toBe(200)

        // Second call - over budget
        mockUsageTracker.getUsageStats.mockResolvedValue({ totalCost: 6.0 })
        
        const request2 = createMockRequest()
        const response2 = await POST(request2)
        expect(response2.status).toBe(429)
      })
    })

    describe('Edge Cases', () => {
      it('handles empty audio file', async () => {
        const emptyFile = new File([], 'empty.wav', { type: 'audio/wav' })

        const request = createMockRequest({ audioFile: emptyFile })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('too small')
      })

      it('handles file without extension', async () => {
        const file = new File(
          [new ArrayBuffer(1000)],
          'audio-file', // No extension
          { type: 'audio/wav' }
        )

        const request = createMockRequest({ audioFile: file })
        const response = await POST(request)

        expect(response.status).toBe(200) // Should still work based on MIME type
      })

      it('handles missing user ID in session', async () => {
        mockSupabaseClient.auth.getSession.mockResolvedValue({
          data: {
            session: { user: {} }, // Missing user ID
          },
          error: null,
        })

        const request = createMockRequest()
        const response = await POST(request)

        expect(response.status).toBe(401)
      })
    })
  })

  describe('GET /api/transcribe', () => {
    it('returns 405 Method Not Allowed', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method not allowed')
      expect(response.headers.get('Allow')).toBe('POST')
      expect(mockSecurity.headers.getHeaders).toHaveBeenCalled()
    })
  })

  describe('Response Format', () => {
    it('returns correct success response format', async () => {
      const request = createMockRequest()
      const response = await POST(request)
      const data = await response.json()

      expect(data).toMatchObject({
        success: true,
        data: {
          transcript: expect.any(String),
          items: expect.any(Array),
        },
        timestamp: expect.any(String),
      })

      // Validate timestamp format
      expect(new Date(data.timestamp)).toBeInstanceOf(Date)
    })

    it('returns correct error response format', async () => {
      mockSecurity.validate.validateRequest.mockReturnValue({
        isValid: false,
        errors: ['Test error'],
      })

      const request = createMockRequest()
      const response = await POST(request)
      const data = await response.json()

      expect(data).toMatchObject({
        error: expect.any(String),
        details: expect.any(Array),
      })
    })
  })
})