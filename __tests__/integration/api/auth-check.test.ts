/**
 * Integration tests for the auth-check API route
 * Tests the authentication verification endpoint
 */

import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/auth-check/route'
import { createMockSupabaseClient } from '@/__tests__/utils/test-utils'

// Mock the Supabase client
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(),
}))

describe('/api/auth-check', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    const { createRouteHandlerClient } = require('@supabase/auth-helpers-nextjs')
    createRouteHandlerClient.mockReturnValue(mockSupabase)
    jest.clearAllMocks()
  })

  describe('GET /api/auth-check', () => {
    it('returns user data when authenticated', async () => {
      // Mock authenticated user
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      }

      const mockSession = {
        user: mockUser,
        access_token: 'mock-access-token',
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      // Mock profile data
      const mockProfile = {
        id: 'test-user-id',
        role: 'server',
        name: 'Test User',
      }

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockProfile,
        error: null,
      })

      // Create request
      const request = new NextRequest('http://localhost:3000/api/auth-check')

      // Call the API route
      const response = await GET(request)
      const data = await response.json()

      // Assertions
      expect(response.status).toBe(200)
      expect(data).toEqual({
        authenticated: true,
        user: mockUser,
        profile: mockProfile,
      })

      // Verify Supabase calls
      expect(mockSupabase.auth.getSession).toHaveBeenCalled()
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabase.from().select).toHaveBeenCalledWith('*')
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('id', 'test-user-id')
      expect(mockSupabase.from().select().eq().single).toHaveBeenCalled()
    })

    it('returns unauthenticated when no session', async () => {
      // Mock no session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/auth-check')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        authenticated: false,
        user: null,
        profile: null,
      })

      // Should not try to fetch profile when not authenticated
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('returns unauthenticated when session has no user', async () => {
      // Mock session without user
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: null, access_token: 'token' } },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/auth-check')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        authenticated: false,
        user: null,
        profile: null,
      })
    })

    it('handles session fetch error gracefully', async () => {
      // Mock session error
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session error' },
      })

      const request = new NextRequest('http://localhost:3000/api/auth-check')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        authenticated: false,
        user: null,
        profile: null,
      })
    })

    it('returns user without profile when profile not found', async () => {
      // Mock authenticated user
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      }

      const mockSession = {
        user: mockUser,
        access_token: 'mock-access-token',
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      // Mock profile not found
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Profile not found' },
      })

      const request = new NextRequest('http://localhost:3000/api/auth-check')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        authenticated: true,
        user: mockUser,
        profile: null,
      })
    })

    it('handles profile fetch error gracefully', async () => {
      // Mock authenticated user
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      }

      const mockSession = {
        user: mockUser,
        access_token: 'mock-access-token',
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      // Mock profile fetch error
      mockSupabase.from().select().eq().single.mockRejectedValue(
        new Error('Database connection error')
      )

      const request = new NextRequest('http://localhost:3000/api/auth-check')
      const response = await GET(request)
      const data = await response.json()

      // Should still return user data even if profile fetch fails
      expect(response.status).toBe(200)
      expect(data).toEqual({
        authenticated: true,
        user: mockUser,
        profile: null,
      })
    })

    it('handles unexpected errors gracefully', async () => {
      // Mock unexpected error
      mockSupabase.auth.getSession.mockRejectedValue(
        new Error('Unexpected error')
      )

      const request = new NextRequest('http://localhost:3000/api/auth-check')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Internal server error',
      })
    })

    it('uses correct Supabase client configuration', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser, access_token: 'token' } },
        error: null,
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { id: 'test-user-id', role: 'server' },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/auth-check')
      await GET(request)

      // Verify that createRouteHandlerClient was called with cookies
      const { createRouteHandlerClient } = require('@supabase/auth-helpers-nextjs')
      expect(createRouteHandlerClient).toHaveBeenCalledWith({
        cookies: expect.any(Function),
      })
    })
  })

  describe('Response Format', () => {
    it('returns consistent response structure for authenticated users', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
        created_at: '2024-01-01T00:00:00Z',
      }

      const mockProfile = {
        id: 'test-user-id',
        role: 'server',
        name: 'Test User',
        created_at: '2024-01-01T00:00:00Z',
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser, access_token: 'token' } },
        error: null,
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockProfile,
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/auth-check')
      const response = await GET(request)
      const data = await response.json()

      // Verify response structure
      expect(data).toHaveProperty('authenticated')
      expect(data).toHaveProperty('user')
      expect(data).toHaveProperty('profile')
      expect(typeof data.authenticated).toBe('boolean')
      expect(data.authenticated).toBe(true)
      expect(data.user).toEqual(mockUser)
      expect(data.profile).toEqual(mockProfile)
    })

    it('returns consistent response structure for unauthenticated users', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/auth-check')
      const response = await GET(request)
      const data = await response.json()

      // Verify response structure
      expect(data).toHaveProperty('authenticated')
      expect(data).toHaveProperty('user')
      expect(data).toHaveProperty('profile')
      expect(typeof data.authenticated).toBe('boolean')
      expect(data.authenticated).toBe(false)
      expect(data.user).toBeNull()
      expect(data.profile).toBeNull()
    })

    it('sets correct content-type header', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/auth-check')
      const response = await GET(request)

      expect(response.headers.get('content-type')).toBe('application/json')
    })
  })

  describe('Performance', () => {
    it('completes within reasonable time', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser, access_token: 'token' } },
        error: null,
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { id: 'test-user-id', role: 'server' },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/auth-check')
      
      const startTime = performance.now()
      await GET(request)
      const endTime = performance.now()

      // Should complete within 100ms in test environment
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('handles concurrent requests efficiently', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser, access_token: 'token' } },
        error: null,
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { id: 'test-user-id', role: 'server' },
        error: null,
      })

      // Make 5 concurrent requests
      const requests = Array.from({ length: 5 }, () => 
        new NextRequest('http://localhost:3000/api/auth-check')
      )

      const startTime = performance.now()
      const responses = await Promise.all(
        requests.map(request => GET(request))
      )
      const endTime = performance.now()

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })

      // Should handle concurrent requests efficiently
      expect(endTime - startTime).toBeLessThan(200)
    })
  })
})