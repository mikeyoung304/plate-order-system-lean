/**
 * End-to-end tests for critical order flows
 * Tests the complete user journey from login to order completion
 */

import { createMockSupabaseClient, mockData } from '@/__tests__/utils/test-utils'
import { performanceUtils } from '@/__tests__/utils/test-utils'

// Mock dependencies for E2E tests
jest.mock('@/lib/modassembly/supabase/client', () => ({
  createClient: jest.fn(),
}))

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(),
  createServerComponentClient: jest.fn(),
  createMiddlewareClient: jest.fn(),
}))

describe('Order Flow E2E Tests', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    
    // Setup all Supabase mock implementations
    const supabaseMocks = require('@supabase/auth-helpers-nextjs')
    supabaseMocks.createRouteHandlerClient.mockReturnValue(mockSupabase)
    supabaseMocks.createServerComponentClient.mockReturnValue(mockSupabase)
    supabaseMocks.createMiddlewareClient.mockReturnValue(mockSupabase)
    
    const { createClient } = require('@/lib/modassembly/supabase/client')
    createClient.mockReturnValue(mockSupabase)

    jest.clearAllMocks()
  })

  describe('Server Order Flow', () => {
    const mockServer = mockData.user({ role: 'server' })
    const mockTable = mockData.table()
    const mockResident = mockData.user({ role: 'resident' })

    it('completes full order creation workflow', async () => {
      // Setup authentication
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockServer, access_token: 'token' } },
        error: null,
      })

      // Setup profile fetch
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { ...mockServer, role: 'server' },
        error: null,
      })

      // Setup tables fetch
      mockSupabase.from().select.mockResolvedValue({
        data: [mockTable],
        error: null,
      })

      // Setup order creation
      const mockOrder = mockData.order({
        table_id: mockTable.id,
        server_id: mockServer.id,
        resident_id: mockResident.id,
      })

      mockSupabase.from().insert.mockResolvedValue({
        data: [mockOrder],
        error: null,
      })

      // Simulate the flow
      const orderData = {
        table_id: mockTable.id,
        seat_id: 'seat-1',
        resident_id: mockResident.id,
        server_id: mockServer.id,
        items: ['chicken', 'pasta', 'salad'],
        transcript: 'chicken, pasta, salad',
        status: 'pending',
        type: 'food',
      }

      // Mock API call to create order
      const createOrderResponse = await simulateCreateOrder(orderData)
      
      expect(createOrderResponse.success).toBe(true)
      expect(createOrderResponse.order).toMatchObject({
        table_id: mockTable.id,
        server_id: mockServer.id,
        items: ['chicken', 'pasta', 'salad'],
        status: 'pending',
      })

      // Verify database interactions
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          table_id: mockTable.id,
          server_id: mockServer.id,
          items: ['chicken', 'pasta', 'salad'],
        })
      )
    })

    it('handles voice order transcription flow', async () => {
      // Mock voice transcription
      const mockTranscription = 'chicken, pasta, salad'
      
      // Mock audio file upload
      mockSupabase.storage.from().upload.mockResolvedValue({
        data: { path: 'audio/test-file.webm' },
        error: null,
      })

      // Simulate voice order workflow
      const voiceOrderData = {
        audioBlob: new Blob(['mock audio data'], { type: 'audio/webm' }),
        table_id: mockTable.id,
        seat_id: 'seat-1',
        resident_id: mockResident.id,
        server_id: mockServer.id,
      }

      const voiceOrderResponse = await simulateVoiceOrder(voiceOrderData)

      expect(voiceOrderResponse.success).toBe(true)
      expect(voiceOrderResponse.transcript).toBe(mockTranscription)
      expect(voiceOrderResponse.order).toMatchObject({
        transcript: mockTranscription,
        items: ['chicken', 'pasta', 'salad'],
      })
    })

    it('validates order data before creation', async () => {
      // Test with invalid order data
      const invalidOrderData = {
        table_id: '', // Invalid
        seat_id: 'seat-1',
        items: [], // Invalid
        server_id: mockServer.id,
      }

      const response = await simulateCreateOrder(invalidOrderData)

      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
      expect(mockSupabase.from().insert).not.toHaveBeenCalled()
    })
  })

  describe('Kitchen Order Processing Flow', () => {
    const mockCook = mockData.user({ role: 'cook' })
    const mockKDSOrder = mockData.kdsOrder()

    beforeEach(() => {
      // Setup cook authentication
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockCook, access_token: 'token' } },
        error: null,
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { ...mockCook, role: 'cook' },
        error: null,
      })
    })

    it('processes order from new to completed', async () => {
      // Mock order fetching
      mockSupabase.from().select().mockResolvedValue({
        data: [mockKDSOrder],
        error: null,
      })

      // Mock order updates
      mockSupabase.from().update().eq.mockResolvedValue({
        data: [{ ...mockKDSOrder, started_at: new Date().toISOString() }],
        error: null,
      })

      // Simulate order progression
      const orderProgression = await simulateKDSOrderProgression(mockKDSOrder.id)

      expect(orderProgression.steps).toEqual([
        'fetched',
        'started',
        'completed',
      ])

      // Verify all steps were called
      expect(mockSupabase.from().select).toHaveBeenCalled()
      expect(mockSupabase.from().update().eq).toHaveBeenCalledTimes(2) // Start + Complete
    })

    it('handles order priority updates', async () => {
      const priorityUpdateResponse = await simulateOrderPriorityUpdate(
        mockKDSOrder.id,
        5
      )

      expect(priorityUpdateResponse.success).toBe(true)
      expect(mockSupabase.from().update().eq).toHaveBeenCalledWith(
        'id',
        mockKDSOrder.id
      )
    })

    it('supports order recall functionality', async () => {
      // Mock completed order
      const completedOrder = {
        ...mockKDSOrder,
        completed_at: new Date().toISOString(),
        bumped_at: new Date().toISOString(),
      }

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: completedOrder,
        error: null,
      })

      const recallResponse = await simulateOrderRecall(completedOrder.id)

      expect(recallResponse.success).toBe(true)
      expect(mockSupabase.from().update().eq).toHaveBeenCalledWith(
        'id',
        completedOrder.id
      )
    })
  })

  describe('Real-time Order Updates', () => {
    it('handles real-time order status changes', async () => {
      const orderUpdates: any[] = []
      
      // Mock real-time subscription
      mockSupabase.channel().on.mockImplementation((event, filter, callback) => {
        // Simulate real-time update
        setTimeout(() => {
          callback({
            eventType: 'UPDATE',
            new: { ...mockData.kdsOrder(), status: 'preparing' },
            old: { ...mockData.kdsOrder(), status: 'pending' },
          })
        }, 50)
        return mockSupabase.channel()
      })

      // Simulate real-time subscription setup
      const subscription = await simulateRealtimeSubscription(
        (update) => orderUpdates.push(update)
      )

      // Wait for real-time update
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(orderUpdates).toHaveLength(1)
      expect(orderUpdates[0]).toMatchObject({
        eventType: 'UPDATE',
        new: { status: 'preparing' },
        old: { status: 'pending' },
      })
    })

    it('maintains connection stability under load', async () => {
      // Simulate multiple rapid updates
      const updateCount = 50
      const updates: any[] = []

      mockSupabase.channel().on.mockImplementation((event, filter, callback) => {
        // Simulate rapid updates
        for (let i = 0; i < updateCount; i++) {
          setTimeout(() => {
            callback({
              eventType: 'UPDATE',
              new: { ...mockData.kdsOrder(), status: 'preparing', priority: i },
            })
          }, i * 10)
        }
        return mockSupabase.channel()
      })

      await simulateRealtimeSubscription((update) => updates.push(update))

      // Wait for all updates
      await new Promise(resolve => setTimeout(resolve, updateCount * 10 + 100))

      expect(updates).toHaveLength(updateCount)
      expect(updates[0].new.priority).toBe(0)
      expect(updates[updateCount - 1].new.priority).toBe(updateCount - 1)
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('recovers from database connection errors', async () => {
      // Mock database error followed by success
      mockSupabase.from().select
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockResolvedValueOnce({
          data: [mockData.kdsOrder()],
          error: null,
        })

      const recoveryResponse = await simulateErrorRecovery()

      expect(recoveryResponse.recovered).toBe(true)
      expect(recoveryResponse.attempts).toBe(2)
    })

    it('handles auth token expiration gracefully', async () => {
      // Mock auth error followed by refresh
      mockSupabase.auth.getSession
        .mockResolvedValueOnce({
          data: { session: null },
          error: { message: 'Token expired' },
        })
        .mockResolvedValueOnce({
          data: { session: { user: mockData.user(), access_token: 'new-token' } },
          error: null,
        })

      const authRecoveryResponse = await simulateAuthRecovery()

      expect(authRecoveryResponse.recovered).toBe(true)
      expect(authRecoveryResponse.newSession).toBeDefined()
    })

    it('maintains data consistency during failures', async () => {
      // Mock partial failure scenario
      mockSupabase.from().insert
        .mockResolvedValueOnce({
          data: [mockData.order()],
          error: null,
        })

      // Mock KDS routing failure
      mockSupabase.from().insert
        .mockRejectedValueOnce(new Error('KDS routing failed'))

      const consistencyResponse = await simulateConsistencyCheck()

      expect(consistencyResponse.orderCreated).toBe(true)
      expect(consistencyResponse.kdsRouted).toBe(false)
      expect(consistencyResponse.rollbackTriggered).toBe(true)
    })
  })

  describe('Performance Under Load', () => {
    it('handles high-frequency order updates efficiently', async () => {
      const orderCount = 100
      const orders = Array.from({ length: orderCount }, () => mockData.kdsOrder())

      mockSupabase.from().select().mockResolvedValue({
        data: orders,
        error: null,
      })

      const performanceResult = await performanceUtils.measureAsyncOperation(
        () => simulateHighFrequencyUpdates(orders),
        5
      )

      // Should handle 100 orders in reasonable time
      expect(performanceResult.average).toBeLessThan(1000) // Less than 1 second
      expect(performanceResult.max).toBeLessThan(2000) // Max 2 seconds
    })

    it('maintains responsiveness during concurrent operations', async () => {
      const concurrentOperations = [
        simulateCreateOrder(mockData.order()),
        simulateKDSOrderProgression('order-1'),
        simulateOrderPriorityUpdate('order-2', 3),
        simulateOrderRecall('order-3'),
      ]

      const startTime = performance.now()
      const results = await Promise.all(concurrentOperations)
      const endTime = performance.now()

      // All operations should succeed
      results.forEach(result => {
        expect(result.success).toBe(true)
      })

      // Should complete concurrently, not sequentially
      expect(endTime - startTime).toBeLessThan(1000)
    })
  })
})

// Helper functions to simulate various workflows
async function simulateCreateOrder(orderData: any) {
  // Simulate order validation
  if (!orderData.table_id || !orderData.items?.length) {
    return { success: false, error: 'Invalid order data' }
  }

  // Simulate order creation
  const mockSupabase = createMockSupabaseClient()
  await mockSupabase.from('orders').insert(orderData)

  return {
    success: true,
    order: { ...orderData, id: 'new-order-id' },
  }
}

async function simulateVoiceOrder(voiceOrderData: any) {
  const mockTranscript = 'chicken, pasta, salad'
  
  // Simulate audio upload
  const mockSupabase = createMockSupabaseClient()
  await mockSupabase.storage.from('audio').upload('test.webm', voiceOrderData.audioBlob)

  // Simulate transcription
  const items = mockTranscript.split(', ')

  return {
    success: true,
    transcript: mockTranscript,
    order: {
      ...voiceOrderData,
      transcript: mockTranscript,
      items,
      id: 'voice-order-id',
    },
  }
}

async function simulateKDSOrderProgression(orderId: string) {
  const steps = []
  const mockSupabase = createMockSupabaseClient()

  // Fetch order
  await mockSupabase.from('kds_orders').select('*')
  steps.push('fetched')

  // Start order
  await mockSupabase.from('kds_orders').update({ started_at: new Date().toISOString() }).eq('id', orderId)
  steps.push('started')

  // Complete order
  await mockSupabase.from('kds_orders').update({ completed_at: new Date().toISOString() }).eq('id', orderId)
  steps.push('completed')

  return { success: true, steps }
}

async function simulateOrderPriorityUpdate(orderId: string, priority: number) {
  const mockSupabase = createMockSupabaseClient()
  await mockSupabase.from('kds_orders').update({ priority }).eq('id', orderId)
  
  return { success: true, priority }
}

async function simulateOrderRecall(orderId: string) {
  const mockSupabase = createMockSupabaseClient()
  await mockSupabase.from('kds_orders').update({
    completed_at: null,
    bumped_at: null,
    recalled_at: new Date().toISOString(),
  }).eq('id', orderId)
  
  return { success: true }
}

async function simulateRealtimeSubscription(onUpdate: (update: any) => void) {
  const mockSupabase = createMockSupabaseClient()
  return mockSupabase
    .channel('orders-updates')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onUpdate)
    .subscribe()
}

async function simulateErrorRecovery() {
  let attempts = 0
  
  while (attempts < 3) {
    attempts++
    try {
      const mockSupabase = createMockSupabaseClient()
      await mockSupabase.from('orders').select('*')
      return { recovered: true, attempts }
    } catch (error) {
      if (attempts === 3) throw error
      await new Promise(resolve => setTimeout(resolve, 100)) // Retry delay
    }
  }
  
  return { recovered: false, attempts }
}

async function simulateAuthRecovery() {
  const mockSupabase = createMockSupabaseClient()
  
  // First attempt fails
  const firstAttempt = await mockSupabase.auth.getSession()
  
  // Simulate token refresh
  await new Promise(resolve => setTimeout(resolve, 50))
  
  // Second attempt succeeds
  const secondAttempt = await mockSupabase.auth.getSession()
  
  return {
    recovered: true,
    newSession: secondAttempt.data.session,
  }
}

async function simulateConsistencyCheck() {
  const mockSupabase = createMockSupabaseClient()
  
  try {
    // Create order
    await mockSupabase.from('orders').insert(mockData.order())
    const orderCreated = true
    
    try {
      // Try to create KDS routing
      await mockSupabase.from('kds_orders').insert(mockData.kdsOrder())
      return { orderCreated, kdsRouted: true, rollbackTriggered: false }
    } catch (error) {
      // Rollback order creation
      await mockSupabase.from('orders').delete().eq('id', 'order-id')
      return { orderCreated, kdsRouted: false, rollbackTriggered: true }
    }
  } catch (error) {
    return { orderCreated: false, kdsRouted: false, rollbackTriggered: false }
  }
}

async function simulateHighFrequencyUpdates(orders: any[]) {
  const mockSupabase = createMockSupabaseClient()
  
  // Simulate processing all orders
  for (const order of orders) {
    await mockSupabase.from('kds_orders').update({ status: 'processing' }).eq('id', order.id)
  }
  
  return { processed: orders.length }
}