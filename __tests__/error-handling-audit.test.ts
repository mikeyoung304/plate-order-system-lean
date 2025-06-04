/**
 * Error Handling Audit Test Suite
 * 
 * This test simulates various error scenarios to identify gaps in error handling
 * and verify that the application gracefully handles failures.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import '@testing-library/jest-dom'

// Mock components and services for error testing
const mockSupabaseClient = {
  from: jest.fn(),
  auth: {
    getSession: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  },
  channel: jest.fn(),
  removeChannel: jest.fn(),
}

const mockCreateClient = jest.fn(() => mockSupabaseClient)

// Mock the Supabase client
jest.mock('@/lib/modassembly/supabase/client', () => ({
  createClient: () => mockCreateClient(),
}))

jest.mock('@/lib/modassembly/supabase/server', () => ({
  createClient: () => mockCreateClient(),
}))

describe('Error Handling Audit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset console methods
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('1. Error Boundary Coverage', () => {
    test('should catch React component errors', async () => {
      const ThrowError = () => {
        throw new Error('Test component error')
      }

      const { ErrorBoundary } = await import('@/components/error-boundaries')
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
      expect(screen.getByText(/try again/i)).toBeInTheDocument()
    })

    test('should handle KDS-specific errors', async () => {
      const KDSError = () => {
        throw new Error('Kitchen display connection failed')
      }

      const { KDSErrorBoundary } = await import('@/components/error-boundaries')
      
      render(
        <KDSErrorBoundary>
          <KDSError />
        </KDSErrorBoundary>
      )

      expect(screen.getByText(/kitchen display issue/i)).toBeInTheDocument()
      expect(screen.getByText(/retry/i)).toBeInTheDocument()
    })

    test('should handle voice recording errors', async () => {
      const VoiceError = () => {
        throw new Error('Microphone access denied')
      }

      const { VoiceErrorBoundary } = await import('@/components/error-boundaries')
      
      render(
        <VoiceErrorBoundary>
          <VoiceError />
        </VoiceErrorBoundary>
      )

      expect(screen.getByText(/voice order issue/i)).toBeInTheDocument()
      expect(screen.getByText(/microphone permissions/i)).toBeInTheDocument()
    })

    test('should handle floor plan errors', async () => {
      const FloorPlanError = () => {
        throw new Error('Cannot load floor plan data')
      }

      const { FloorPlanErrorBoundary } = await import('@/components/error-boundaries')
      
      render(
        <FloorPlanErrorBoundary>
          <FloorPlanError />
        </FloorPlanErrorBoundary>
      )

      expect(screen.getByText(/floor plan loading issue/i)).toBeInTheDocument()
      expect(screen.getByText(/reload tables/i)).toBeInTheDocument()
    })

    test('should handle authentication errors', async () => {
      const AuthError = () => {
        throw new Error('Session expired')
      }

      const { AuthErrorBoundary } = await import('@/components/error-boundaries')
      
      render(
        <AuthErrorBoundary>
          <AuthError />
        </AuthErrorBoundary>
      )

      expect(screen.getByText(/authentication required/i)).toBeInTheDocument()
      expect(screen.getByText(/sign in/i)).toBeInTheDocument()
    })
  })

  describe('2. Database Error Handling', () => {
    test('should handle database connection failures', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Connection timeout', code: 'PGRST301' }
            })
          })
        })
      })

      const { fetchRecentOrders } = await import('@/lib/modassembly/supabase/database/orders')
      
      await expect(fetchRecentOrders()).rejects.toThrow()
    })

    test('should handle constraint violations', async () => {
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: null,
            error: { 
              message: 'duplicate key value violates unique constraint',
              code: '23505'
            }
          })
        })
      })

      const { createOrder } = await import('@/lib/modassembly/supabase/database/orders')
      
      const orderData = {
        table_id: 'test-table-id',
        seat_id: 'test-seat-id',
        resident_id: 'test-resident-id',
        server_id: 'test-server-id',
        items: ['test item'],
        transcript: 'test transcript',
        type: 'food' as const,
      }

      await expect(createOrder(orderData)).rejects.toThrow()
    })

    test('should handle malformed data errors', async () => {
      const { createOrder } = await import('@/lib/modassembly/supabase/database/orders')
      
      const invalidOrderData = {
        table_id: '',
        seat_id: 'invalid-uuid',
        resident_id: null,
        server_id: 'also-invalid',
        items: [],
        transcript: '<script>alert("xss")</script>',
        type: 'invalid-type' as any,
      }

      await expect(createOrder(invalidOrderData)).rejects.toThrow(/validation failed/i)
    })
  })

  describe('3. Real-time Connection Error Handling', () => {
    test('should handle WebSocket connection failures', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockResolvedValue('CHANNEL_ERROR'),
      }
      
      mockSupabaseClient.channel.mockReturnValue(mockChannel)

      const { ConnectionProvider, useConnection } = await import('@/lib/state/domains/connection-context')
      
      const TestComponent = () => {
        const { connectionState } = useConnection()
        return <div>Status: {connectionState.status}</div>
      }

      render(
        <ConnectionProvider>
          <TestComponent />
        </ConnectionProvider>
      )

      await waitFor(() => {
        expect(screen.getByText(/status: disconnected/i)).toBeInTheDocument()
      })
    })

    test('should handle reconnection failures', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn()
          .mockResolvedValueOnce('CHANNEL_ERROR')
          .mockResolvedValueOnce('TIMED_OUT')
          .mockResolvedValueOnce('SUBSCRIBED'),
      }
      
      mockSupabaseClient.channel.mockReturnValue(mockChannel)
      mockSupabaseClient.removeChannel.mockResolvedValue()

      const { ConnectionProvider, useConnection } = await import('@/lib/state/domains/connection-context')
      
      const TestComponent = () => {
        const { connectionState, reconnect } = useConnection()
        return (
          <div>
            <div>Status: {connectionState.status}</div>
            <div>Attempts: {connectionState.reconnectAttempts}</div>
            <button onClick={reconnect}>Reconnect</button>
          </div>
        )
      }

      render(
        <ConnectionProvider>
          <TestComponent />
        </ConnectionProvider>
      )

      // Test manual reconnection
      fireEvent.click(screen.getByText('Reconnect'))
      
      await waitFor(() => {
        expect(screen.getByText(/attempts: \d+/)).toBeInTheDocument()
      })
    })
  })

  describe('4. Voice System Error Handling', () => {
    test('should handle microphone permission denial', async () => {
      // Mock navigator.mediaDevices
      Object.defineProperty(navigator, 'mediaDevices', {
        writable: true,
        value: {
          getUserMedia: jest.fn().mockRejectedValue(
            new DOMException('Permission denied', 'NotAllowedError')
          ),
        },
      })

      const mockRecorder = {
        startRecording: jest.fn().mockRejectedValue(
          new Error('Microphone access denied')
        ),
        stopRecording: jest.fn(),
        isRecording: false,
      }

      // Test voice recording error handling
      expect(() => mockRecorder.startRecording()).rejects.toThrow(/microphone access denied/i)
    })

    test('should handle OpenAI API failures', async () => {
      // Mock failed transcription
      const mockTranscriptionError = {
        code: 'TRANSCRIPTION_FAILED',
        message: 'OpenAI API unavailable',
        retryable: true,
      }

      const { optimizedTranscribeAudioFile } = await import('@/lib/modassembly/openai/optimized-transcribe')
      
      // Mock environment variable
      process.env.OPENAI_API_KEY = 'test-key'
      
      const mockBlob = new Blob(['test audio'], { type: 'audio/wav' })
      
      // Mock the service to throw an error
      jest.doMock('@/lib/modassembly/openai/optimized-transcribe', () => ({
        optimizedTranscribeAudioFile: jest.fn().mockRejectedValue(mockTranscriptionError)
      }))

      await expect(
        optimizedTranscribeAudioFile(mockBlob, 'test-user-id', 'test.wav')
      ).rejects.toMatchObject({
        code: 'TRANSCRIPTION_FAILED',
        retryable: true,
      })
    })

    test('should handle audio file validation errors', async () => {
      const { OptimizedTranscriptionService } = await import('@/lib/modassembly/openai/optimized-transcribe')
      
      const service = new (OptimizedTranscriptionService as any)('test-key')
      
      // Test oversized file
      const oversizedBlob = new Blob(['x'.repeat(26 * 1024 * 1024)], { type: 'audio/wav' })
      
      await expect(
        service.transcribe(oversizedBlob, 'test-user')
      ).rejects.toMatchObject({
        code: 'AUDIO_TOO_LARGE',
        retryable: false,
      })

      // Test undersized file
      const undersizedBlob = new Blob(['x'], { type: 'audio/wav' })
      
      await expect(
        service.transcribe(undersizedBlob, 'test-user')
      ).rejects.toMatchObject({
        code: 'AUDIO_TOO_SHORT',
        retryable: false,
      })

      // Test invalid format
      const invalidBlob = new Blob(['test'], { type: 'text/plain' })
      
      await expect(
        service.transcribe(invalidBlob, 'test-user')
      ).rejects.toMatchObject({
        code: 'INVALID_FORMAT',
        retryable: false,
      })
    })
  })

  describe('5. Context Error Isolation', () => {
    test('should isolate errors in order context', async () => {
      const mockOrdersError = new Error('Failed to fetch orders')
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockRejectedValue(mockOrdersError)
          })
        })
      })

      const { OrdersProvider } = await import('@/lib/state/domains/orders-context')
      
      const TestComponent = () => {
        return <div>Orders component loaded</div>
      }

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(
        <OrdersProvider>
          <TestComponent />
        </OrdersProvider>
      )

      expect(screen.getByText('Orders component loaded')).toBeInTheDocument()
      
      // Error should be logged but not crash the component
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Error in orders context'),
          expect.any(Object)
        )
      })
    })

    test('should isolate errors in tables context', async () => {
      const mockTablesError = new Error('Failed to fetch tables')
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockRejectedValue(mockTablesError)
      })

      const { TablesProvider } = await import('@/lib/state/domains/tables-context')
      
      const TestComponent = () => {
        return <div>Tables component loaded</div>
      }

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(
        <TablesProvider>
          <TestComponent />
        </TablesProvider>
      )

      expect(screen.getByText('Tables component loaded')).toBeInTheDocument()
      
      // Error should be logged but not crash the component
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Error in tables context'),
          expect.any(Object)
        )
      })
    })
  })

  describe('6. User Experience During Errors', () => {
    test('should show friendly error messages', async () => {
      const NetworkError = () => {
        throw new Error('fetch: network error')
      }

      const { RootErrorBoundary } = await import('@/components/error-boundaries')
      
      render(
        <RootErrorBoundary>
          <NetworkError />
        </RootErrorBoundary>
      )

      expect(screen.getByText(/connection issue detected/i)).toBeInTheDocument()
      expect(screen.getByText(/check your internet connection/i)).toBeInTheDocument()
      expect(screen.getByText(/retry/i)).toBeInTheDocument()
    })

    test('should provide recovery actions', async () => {
      const AuthError = () => {
        throw new Error('unauthorized: session expired')
      }

      const { RootErrorBoundary } = await import('@/components/error-boundaries')
      
      render(
        <RootErrorBoundary>
          <AuthError />
        </RootErrorBoundary>
      )

      expect(screen.getByText(/authentication required/i)).toBeInTheDocument()
      expect(screen.getByText(/sign in/i)).toBeInTheDocument()
      expect(screen.getByText(/go home/i)).toBeInTheDocument()
    })

    test('should handle error reporting', async () => {
      const TestError = () => {
        throw new Error('Reportable error for testing')
      }

      const { RootErrorBoundary } = await import('@/components/error-boundaries')
      
      render(
        <RootErrorBoundary>
          <TestError />
        </RootErrorBoundary>
      )

      // Expand technical details
      fireEvent.click(screen.getByText(/technical details/i))
      
      await waitFor(() => {
        expect(screen.getByText(/copy details/i)).toBeInTheDocument()
        expect(screen.getByText(/report issue/i)).toBeInTheDocument()
      })

      // Test error reporting
      fireEvent.click(screen.getByText(/report issue/i))
      
      await waitFor(() => {
        expect(screen.getByText(/reported/i)).toBeInTheDocument()
      })
    })
  })

  describe('7. Production Error Tracking', () => {
    test('should track errors with proper metadata', async () => {
      const mockLogger = {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
      }

      jest.doMock('@/lib/logger', () => ({
        logger: mockLogger
      }))

      const TestError = () => {
        throw new Error('Test error for tracking')
      }

      const { RootErrorBoundary } = await import('@/components/error-boundaries')
      
      render(
        <RootErrorBoundary>
          <TestError />
        </RootErrorBoundary>
      )

      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Root Error Boundary caught an error',
          expect.objectContaining({
            error: 'Test error for tracking',
            component: 'RootErrorBoundary',
          })
        )
      })
    })

    test('should handle chunk loading errors with auto-retry', async () => {
      const ChunkLoadError = () => {
        throw new Error('Loading chunk 5 failed')
      }

      const { GlobalErrorProvider } = await import('@/components/error-boundaries')
      
      // Mock window.location.reload
      const reloadSpy = jest.spyOn(window.location, 'reload').mockImplementation()
      
      render(
        <GlobalErrorProvider>
          <ChunkLoadError />
        </GlobalErrorProvider>
      )

      // Should auto-retry for chunk loading errors
      await waitFor(() => {
        expect(reloadSpy).toHaveBeenCalled()
      }, { timeout: 2000 })
    })
  })

  describe('8. API Route Error Handling', () => {
    test('should validate request format', async () => {
      const request = new Request('http://localhost/api/transcribe', {
        method: 'POST',
        body: 'invalid-data'
      })

      // Mock the route handler
      const { POST } = await import('@/app/api/transcribe/route')
      
      const response = await POST(request)
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Invalid form data')
    })

    test('should handle missing authentication', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const formData = new FormData()
      formData.append('audio', new Blob(['test'], { type: 'audio/wav' }))
      
      const request = new Request('http://localhost/api/transcribe', {
        method: 'POST',
        body: formData
      })

      const { POST } = await import('@/app/api/transcribe/route')
      
      const response = await POST(request)
      
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toContain('Unauthorized')
    })

    test('should handle rate limiting', async () => {
      // Mock successful auth
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'test-user' } } },
        error: null
      })

      // Mock rate limiter to return false
      jest.doMock('@/lib/security', () => ({
        Security: {
          validate: {
            validateRequest: () => ({ isValid: true, errors: [] })
          },
          rateLimit: {
            isAllowed: () => false // Rate limit exceeded
          },
          headers: {
            getHeaders: () => ({})
          },
          sanitize: {
            sanitizeIdentifier: (id: string) => id
          }
        }
      }))

      const formData = new FormData()
      formData.append('audio', new Blob(['test'], { type: 'audio/wav' }))
      
      const request = new Request('http://localhost/api/transcribe', {
        method: 'POST',
        body: formData
      })

      const { POST } = await import('@/app/api/transcribe/route')
      
      const response = await POST(request)
      
      expect(response.status).toBe(429)
      const data = await response.json()
      expect(data.error).toContain('Rate limit exceeded')
    })
  })
})

// Test utilities for error simulation
export const ErrorTestUtils = {
  simulateNetworkError: () => {
    return new Error('fetch: Failed to fetch')
  },
  
  simulateAuthError: () => {
    return new Error('unauthorized: invalid session')
  },
  
  simulateDatabaseError: () => {
    return new Error('database: connection timeout')
  },
  
  simulateVoiceError: () => {
    return new Error('microphone: permission denied')
  },
  
  simulateChunkError: () => {
    return new Error('Loading chunk 5 failed')
  },
  
  simulateMemoryError: () => {
    return new Error('JavaScript heap out of memory')
  }
}