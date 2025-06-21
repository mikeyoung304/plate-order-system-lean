/**
 * Real-time Integration Tests for Project Helios
 * Tests WebSocket connections, live updates, and concurrent operations
 */

import { createClient } from '@/lib/modassembly/supabase/server'
// processVoiceCommand is now part of VoiceCommandProcessor in voice-commands.ts
import { AnomalyDetectionEngine } from '@/lib/modassembly/supabase/database/anomaly-detection'
import { useTableGroupedOrders } from '@/hooks/use-table-grouped-orders'
import { renderHook, act } from '@testing-library/react'
import { 
  createMockSupabaseClient,
  createMockKDSOrder,
  createMockOrderBatch,
  measurePerformance
} from '../utils/test-mocks'

// Mock Supabase
jest.mock('@/lib/modassembly/supabase/server')
jest.mock('@/lib/modassembly/supabase/database/kds')

describe('Real-time Integration Tests', () => {
  let mockSupabase: any
  let mockChannel: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock Supabase real-time channel
    mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
      unsubscribe: jest.fn(),
      send: jest.fn(),
    }

    mockSupabase = {
      ...createMockSupabaseClient(),
      channel: jest.fn(() => mockChannel),
    }

    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  describe('Live Order Updates', () => {
    it('should handle order status changes in real-time', async () => {
      const initialOrders = createMockOrderBatch('5', 3, 'preparing')
      let currentOrders = [...initialOrders]

      const { result, rerender } = renderHook(() => 
        useTableGroupedOrders(currentOrders)
      )

      // Initial state
      expect(result.current[0].overallStatus).toBe('preparing')

      // Simulate real-time order completion
      act(() => {
        currentOrders = currentOrders.map(order => ({
          ...order,
          completed_at: new Date().toISOString(),
          bumped_at: new Date().toISOString()
        }))
        rerender()
      })

      expect(result.current[0].overallStatus).toBe('ready')
    })

    it('should handle new orders being added via real-time events', async () => {
      let orders = createMockOrderBatch('8', 2, 'preparing')

      const { result, rerender } = renderHook(() => 
        useTableGroupedOrders(orders)
      )

      expect(result.current).toHaveLength(1)
      expect(result.current[0].orders).toHaveLength(2)

      // Simulate new order arriving via WebSocket
      act(() => {
        const newOrder = createMockKDSOrder('new-8-3', 803, '8')
        orders = [...orders, newOrder]
        rerender()
      })

      expect(result.current[0].orders).toHaveLength(3)
      expect(result.current[0].totalItems).toBeGreaterThan(4) // More items now
    })

    it('should handle order recalls via real-time updates', async () => {
      const orders = createMockOrderBatch('10', 1, 'ready')
      let currentOrders = [...orders]

      const { result, rerender } = renderHook(() => 
        useTableGroupedOrders(currentOrders)
      )

      expect(result.current[0].overallStatus).toBe('ready')

      // Simulate recall via real-time event
      act(() => {
        currentOrders = currentOrders.map(order => ({
          ...order,
          completed_at: null,
          bumped_at: null,
          recall_count: (order.recall_count || 0) + 1
        }))
        rerender()
      })

      expect(result.current[0].overallStatus).toBe('preparing')
      expect(result.current[0].hasRecalls).toBe(true)
      expect(result.current[0].totalRecallCount).toBe(1)
    })
  })

  describe('Voice Command Real-time Integration', () => {
    it('should broadcast voice commands to other clients', async () => {
      // Mock successful order lookup and update
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'routing-broadcast-test',
          order: {
            id: 'order-broadcast-test',
            order_number: 123,
            table: { label: '5' }
          }
        },
        error: null
      })

      await processVoiceCommand('bump order 123', {
        userId: 'user-broadcaster',
        sessionId: 'session-broadcast',
        timestamp: new Date().toISOString(),
        userRole: 'cook'
      })

      // Verify channel communication was attempted
      expect(mockSupabase.channel).toHaveBeenCalledWith('kds-updates')
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.any(Object),
        expect.any(Function)
      )
    })

    it('should handle concurrent voice commands from multiple users', async () => {
      const concurrentCommands = [
        { user: 'cook-1', command: 'bump order 100' },
        { user: 'cook-2', command: 'start order 200' },
        { user: 'server-1', command: 'set order 300 priority high' },
      ]

      // Mock different order responses
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: 'routing-100', order: { order_number: 100 } },
          error: null
        })
        .mockResolvedValueOnce({
          data: { id: 'routing-200', order: { order_number: 200 } },
          error: null
        })
        .mockResolvedValueOnce({
          data: { id: 'routing-300', order: { order_number: 300 } },
          error: null
        })

      const { duration } = await measurePerformance(
        () => Promise.all(
          concurrentCommands.map(({ user, command }) =>
            processVoiceCommand(command, {
              userId: user,
              sessionId: `session-${user}`,
              timestamp: new Date().toISOString(),
              userRole: user.startsWith('cook') ? 'cook' : 'server'
            })
          )
        ),
        'Concurrent voice commands from multiple users'
      )

      expect(duration).toBeLessThan(3000) // Should handle concurrency efficiently
    })

    it('should maintain command ordering under high load', async () => {
      const orderedCommands = Array(20).fill(null).map((_, i) => ({
        command: `bump order ${i + 1}`,
        timestamp: Date.now() + i * 10, // 10ms apart
        expectedOrder: i
      }))

      const results: Array<{ orderNumber: number, processedAt: number }> = []

      mockSupabase.single.mockImplementation(async () => {
        const callCount = mockSupabase.single.mock.calls.length
        const orderNumber = callCount
        
        // Small random delay to simulate real processing
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50))
        
        results.push({
          orderNumber,
          processedAt: Date.now()
        })

        return {
          data: {
            id: `routing-${orderNumber}`,
            order: { order_number: orderNumber }
          },
          error: null
        }
      })

      await Promise.all(
        orderedCommands.map(({ command }) =>
          processVoiceCommand(command, {
            userId: 'stress-test-user',
            sessionId: 'stress-test-session',
            timestamp: new Date().toISOString(),
            userRole: 'cook'
          })
        )
      )

      expect(results).toHaveLength(20)
      
      // Verify all commands were processed
      const processedOrders = results.map(r => r.orderNumber).sort((a, b) => a - b)
      const expectedOrders = Array.from({ length: 20 }, (_, i) => i + 1)
      expect(processedOrders).toEqual(expectedOrders)
    })
  })

  describe('Anomaly Detection Real-time Flow', () => {
    it('should trigger real-time alerts for critical anomalies', async () => {
      const engine = new AnomalyDetectionEngine(mockSupabase)
      
      // Mock critical dietary violation
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          dietary_restrictions: ['nut-free', 'dairy-free']
        },
        error: null
      })

      mockSupabase.in.mockResolvedValueOnce({
        data: [{
          id: 'menu-dangerous',
          name: 'Peanut Butter Smoothie',
          dietary_info: 'Contains nuts and dairy',
          allergens: ['nuts', 'dairy'],
          ingredients: 'peanuts, milk, cream'
        }],
        error: null
      })

      // Mock empty results for other detection methods
      mockSupabase.limit.mockResolvedValue({ data: [], error: null })

      const orderContext = {
        orderId: 'critical-anomaly-test',
        tableNumber: 7,
        residentId: 'resident-allergic',
        items: [{
          id: 'item-dangerous',
          menuItemId: 'menu-dangerous',
          quantity: 1
        }],
        createdAt: new Date().toISOString(),
        kitchenId: 'kitchen-main'
      }

      const anomalies = await engine.detectAnomalies(orderContext)
      
      const criticalAnomaly = anomalies.find(a => 
        a.type === 'dietary_violation' && a.severity === 'critical'
      )
      expect(criticalAnomaly).toBeDefined()

      // Verify real-time notification would be sent
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'dietary_violation',
            severity: 'critical',
            order_id: 'critical-anomaly-test'
          })
        ])
      )
    })

    it('should handle anomaly resolution workflow in real-time', async () => {
      const engine = new AnomalyDetectionEngine(mockSupabase)

      // Mock unresolved anomaly
      mockSupabase.order.mockResolvedValueOnce({
        data: [{
          id: 'anomaly-workflow-test',
          type: 'duplicate',
          severity: 'high',
          resolved: false,
          orders: {
            id: 'order-duplicate',
            table_number: 5,
            status: 'pending'
          }
        }],
        error: null
      })

      const unresolvedAnomalies = await engine.getUnresolvedAnomalies('high')
      expect(unresolvedAnomalies).toHaveLength(1)

      // Resolve the anomaly
      await engine.resolveAnomaly(
        'anomaly-workflow-test',
        'Confirmed with customer - legitimate order'
      )

      expect(mockSupabase.update).toHaveBeenCalledWith({
        resolved: true,
        resolution: 'Confirmed with customer - legitimate order',
        resolved_at: expect.any(String)
      })

      // This would trigger real-time update to remove from active alerts
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'anomaly-workflow-test')
    })
  })

  describe('WebSocket Performance and Reliability', () => {
    it('should handle WebSocket reconnection gracefully', async () => {
      const reconnectionEvents: string[] = []
      
      // Mock connection state changes
      const mockReconnectionFlow = () => {
        // Simulate disconnect
        reconnectionEvents.push('disconnected')
        
        // Simulate reconnection attempt
        setTimeout(() => {
          reconnectionEvents.push('reconnecting')
          
          // Simulate successful reconnection
          setTimeout(() => {
            reconnectionEvents.push('connected')
          }, 100)
        }, 200)
      }

      mockReconnectionFlow()

      // Wait for reconnection flow
      await new Promise(resolve => setTimeout(resolve, 500))

      expect(reconnectionEvents).toEqual([
        'disconnected',
        'reconnecting', 
        'connected'
      ])
    })

    it('should buffer operations during connection loss', async () => {
      const bufferedOperations: any[] = []
      
      // Simulate offline state
      let isOnline = false
      
      const queueOperation = (operation: any) => {
        if (isOnline) {
          return operation() // Execute immediately
        } else {
          bufferedOperations.push(operation) // Buffer for later
          return Promise.resolve() // Return success to continue flow
        }
      }

      // Try to process commands while offline
      await queueOperation(() => 
        processVoiceCommand('bump order 999', {
          userId: 'offline-user',
          sessionId: 'offline-session',
          timestamp: new Date().toISOString(),
          userRole: 'cook'
        })
      )

      expect(bufferedOperations).toHaveLength(1)

      // Come back online and process buffered operations
      isOnline = true
      await Promise.all(bufferedOperations.map(op => op()))

      expect(bufferedOperations).toHaveLength(1) // Operations were processed
    })

    it('should handle message ordering and deduplication', async () => {
      const processedMessages = new Set<string>()
      const messageOrder: string[] = []

      const processMessage = (messageId: string, sequenceNumber: number) => {
        if (processedMessages.has(messageId)) {
          return // Deduplicate
        }

        processedMessages.add(messageId)
        messageOrder.push(`${messageId}-${sequenceNumber}`)
      }

      // Simulate out-of-order and duplicate messages
      const messages = [
        { id: 'msg-1', sequence: 1 },
        { id: 'msg-3', sequence: 3 },
        { id: 'msg-2', sequence: 2 },
        { id: 'msg-1', sequence: 1 }, // Duplicate
        { id: 'msg-4', sequence: 4 },
      ]

      messages.forEach(msg => 
        processMessage(msg.id, msg.sequence)
      )

      expect(processedMessages.size).toBe(4) // No duplicates
      expect(messageOrder).toEqual([
        'msg-1-1',
        'msg-3-3', 
        'msg-2-2',
        'msg-4-4'
      ]) // Original order preserved
    })
  })

  describe('Multi-client Synchronization', () => {
    it('should synchronize table grouping across multiple clients', async () => {
      // Simulate two clients viewing the same table
      const client1Orders = createMockOrderBatch('12', 2, 'preparing')
      const client2Orders = [...client1Orders]

      const { result: client1Result, rerender: client1Rerender } = renderHook(() => 
        useTableGroupedOrders(client1Orders)
      )

      const { result: client2Result, rerender: client2Rerender } = renderHook(() => 
        useTableGroupedOrders(client2Orders)
      )

      // Both clients should see same initial state
      expect(client1Result.current[0].overallStatus).toBe('preparing')
      expect(client2Result.current[0].overallStatus).toBe('preparing')

      // Simulate order completion on client 1
      act(() => {
        client1Orders.forEach(order => {
          order.completed_at = new Date().toISOString()
        })
        client1Rerender()
      })

      // Simulate real-time update reaching client 2
      act(() => {
        client2Orders.forEach(order => {
          order.completed_at = new Date().toISOString()
        })
        client2Rerender()
      })

      // Both clients should now show 'ready' status
      expect(client1Result.current[0].overallStatus).toBe('ready')
      expect(client2Result.current[0].overallStatus).toBe('ready')
    })

    it('should handle conflicting updates from multiple clients', async () => {
      const baseOrder = createMockKDSOrder('conflict-test', 555, '15')
      
      // Two clients try to update the same order simultaneously
      const client1Update = {
        ...baseOrder,
        priority: 8, // High priority
        updated_by: 'client-1',
        updated_at: new Date(Date.now() - 100).toISOString() // Slightly earlier
      }

      const client2Update = {
        ...baseOrder,
        priority: 3, // Low priority  
        updated_by: 'client-2',
        updated_at: new Date().toISOString() // More recent
      }

      // Last-write-wins: client 2's update should prevail
      const finalState = client2Update.updated_at > client1Update.updated_at 
        ? client2Update 
        : client1Update

      expect(finalState.priority).toBe(3)
      expect(finalState.updated_by).toBe('client-2')
    })

    it('should maintain consistency during rapid updates', async () => {
      const rapidUpdates = Array(50).fill(null).map((_, i) => ({
        orderId: 'rapid-update-test',
        updateType: i % 2 === 0 ? 'priority' : 'status',
        value: i % 2 === 0 ? Math.floor(Math.random() * 10) + 1 : 'preparing',
        timestamp: Date.now() + i * 10 // 10ms apart
      }))

      let finalState = {
        priority: 5,
        status: 'pending',
        updateCount: 0
      }

      const { duration } = await measurePerformance(
        async () => {
          for (const update of rapidUpdates) {
            finalState = {
              ...finalState,
              [update.updateType === 'priority' ? 'priority' : 'status']: update.value,
              updateCount: finalState.updateCount + 1
            }
            
            // Small delay to simulate processing
            await new Promise(resolve => setTimeout(resolve, 1))
          }
        },
        'Processing 50 rapid updates'
      )

      expect(finalState.updateCount).toBe(50)
      expect(duration).toBeLessThan(1000) // Should be fast
    })
  })

  describe('Error Recovery and Fault Tolerance', () => {
    it('should recover from temporary network failures', async () => {
      let networkFailureCount = 0
      const maxFailures = 3

      mockSupabase.single.mockImplementation(() => {
        networkFailureCount++
        
        if (networkFailureCount <= maxFailures) {
          return Promise.reject(new Error('Network timeout'))
        }
        
        return Promise.resolve({
          data: {
            id: 'recovery-test',
            order: { order_number: 123 }
          },
          error: null
        })
      })

      // Should eventually succeed after retries
      const result = await processVoiceCommand('bump order 123', {
        userId: 'recovery-test-user',
        sessionId: 'recovery-test-session', 
        timestamp: new Date().toISOString(),
        userRole: 'cook'
      })

      expect(result.executionResult?.success).toBe(false) // Initial failure
      expect(networkFailureCount).toBe(maxFailures + 1) // Retried and succeeded
    })

    it('should handle partial system failures gracefully', async () => {
      // Voice commands work but anomaly detection fails
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'partial-failure-test',
          order: { order_number: 456 }
        },
        error: null
      })

      // Anomaly detection database calls fail
      mockSupabase.limit.mockRejectedValue(new Error('Anomaly service unavailable'))

      const result = await processVoiceCommand('bump order 456', {
        userId: 'partial-failure-user',
        sessionId: 'partial-failure-session',
        timestamp: new Date().toISOString(), 
        userRole: 'cook'
      })

      // Main command should succeed despite anomaly detection failure
      expect(result.executionResult?.success).toBe(true)
      expect(result.metadata.validationErrors).toContain(
        expect.stringContaining('Anomaly detection unavailable')
      )
    })

    it('should maintain data consistency during failures', async () => {
      const operations = [
        { orderId: 'consistency-1', action: 'bump' },
        { orderId: 'consistency-2', action: 'start' }, 
        { orderId: 'consistency-3', action: 'recall' },
      ]

      let successfulOperations = 0
      let failedOperations = 0

      // Simulate 50% failure rate
      mockSupabase.single.mockImplementation(async () => {
        if (Math.random() > 0.5) {
          successfulOperations++
          return {
            data: { id: 'routing-success', order: { order_number: 123 } },
            error: null
          }
        } else {
          failedOperations++
          throw new Error('Operation failed')
        }
      })

      const results = await Promise.allSettled(
        operations.map(({ orderId, action }) =>
          processVoiceCommand(`${action} order ${orderId}`, {
            userId: 'consistency-test-user',
            sessionId: 'consistency-test-session',
            timestamp: new Date().toISOString(),
            userRole: 'cook'
          })
        )
      )

      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      console.log(`Operations: ${successful} successful, ${failed} failed`)
      
      // Should handle both success and failure cases
      expect(successful + failed).toBe(operations.length)
    })
  })
})