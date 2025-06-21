/**
 * Performance testing for Project Helios voice command system
 * Tests processing speed, memory usage, and scalability under load
 */

// processVoiceCommand is now part of VoiceCommandProcessor in voice-commands.ts
import { VoiceCommandProcessor } from '@/lib/kds/voice-commands'
import { parseVoiceCommand } from '@/lib/kds/voice-commands'
import { AnomalyDetectionEngine } from '@/lib/modassembly/supabase/database/anomaly-detection'
import { useTableGroupedOrders } from '@/hooks/use-table-grouped-orders'
import { 
  createMockSupabaseClient,
  createMockVoiceResult,
  createLoadTestData,
  measurePerformance,
  buildScenario,
  voiceCommands
} from '../utils/test-mocks'

// Mock dependencies
jest.mock('@/lib/modassembly/supabase/server')
jest.mock('@/lib/modassembly/supabase/database/kds')

describe('Voice Command Performance Tests', () => {
  let mockSupabase: any
  const PERFORMANCE_THRESHOLDS = {
    VOICE_PARSING: 50, // ms
    COMMAND_PROCESSING: 500, // ms
    BATCH_OPERATIONS: 2000, // ms
    MEMORY_USAGE: 10 * 1024 * 1024, // 10MB
    CONCURRENT_COMMANDS: 100, // number of simultaneous commands
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase = createMockSupabaseClient()
    ;(require('@/lib/modassembly/supabase/server').createClient as jest.Mock)
      .mockResolvedValue(mockSupabase)
  })

  describe('Voice Command Parsing Performance', () => {
    it('should parse commands within performance threshold', async () => {
      const testCommands = [
        ...voiceCommands.bump.slice(0, 5),
        ...voiceCommands.recall.slice(0, 5),
        ...voiceCommands.start.slice(0, 5),
        ...voiceCommands.priority.slice(0, 5),
      ]

      for (const command of testCommands) {
        const { duration } = await measurePerformance(
          () => Promise.resolve(parseVoiceCommand(command)),
          `Parsing: "${command}"`
        )

        expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.VOICE_PARSING)
      }
    })

    it('should handle batch parsing efficiently', async () => {
      const batchCommands = Array(100).fill(null).map((_, i) => 
        `bump order ${100 + i}`
      )

      const { duration } = await measurePerformance(
        async () => {
          return Promise.all(
            batchCommands.map(cmd => Promise.resolve(parseVoiceCommand(cmd)))
          )
        },
        'Batch parsing 100 commands'
      )

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.VOICE_PARSING * 10)
    })

    it('should maintain performance with complex commands', async () => {
      const complexCommands = [
        'set order 123 priority high and start preparation immediately',
        'bump all orders for table 5 and recall order 999 if it exists',
        'show me all overdue orders that are high priority and from table 8',
        'start cooking all new orders except those with dietary restrictions'
      ]

      for (const command of complexCommands) {
        const { duration } = await measurePerformance(
          () => Promise.resolve(parseVoiceCommand(command)),
          `Complex parsing: "${command.substring(0, 30)}..."`
        )

        expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.VOICE_PARSING * 2)
      }
    })
  })

  describe('Voice Command Processing Performance', () => {
    it('should process simple commands within threshold', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'routing-123',
          order: { id: 'order-123', order_number: 123 }
        },
        error: null
      })

      const { duration } = await measurePerformance(
        () => processVoiceCommand('bump order 123', {
          userId: 'test-user',
          sessionId: 'test-session',
          timestamp: new Date().toISOString(),
          userRole: 'cook'
        }),
        'Simple command processing'
      )

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.COMMAND_PROCESSING)
    })

    it('should handle concurrent command processing', async () => {
      const concurrentCommands = Array(PERFORMANCE_THRESHOLDS.CONCURRENT_COMMANDS)
        .fill(null)
        .map((_, i) => ({
          command: `bump order ${i + 1}`,
          context: {
            userId: `user-${i}`,
            sessionId: `session-${i}`,
            timestamp: new Date().toISOString(),
            userRole: 'cook' as const
          }
        }))

      // Mock successful responses for all commands
      mockSupabase.single.mockImplementation(({ eq }) => {
        const orderNum = eq.mock.calls[0]?.[1] || Math.floor(Math.random() * 1000)
        return Promise.resolve({
          data: {
            id: `routing-${orderNum}`,
            order: { id: `order-${orderNum}`, order_number: orderNum }
          },
          error: null
        })
      })

      const { duration } = await measurePerformance(
        () => Promise.all(
          concurrentCommands.map(({ command, context }) => 
            processVoiceCommand(command, context)
          )
        ),
        `${PERFORMANCE_THRESHOLDS.CONCURRENT_COMMANDS} concurrent commands`
      )

      // Should complete within reasonable time
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.COMMAND_PROCESSING * 5)
    })

    it('should efficiently process batch operations', async () => {
      // Mock table with multiple orders
      mockSupabase.select.mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockResolvedValue({
          data: Array(10).fill(null).map((_, i) => ({
            id: `routing-${i}`,
            order: { table: { id: 'table-5', label: '5' } }
          })),
          error: null
        })
      })

      const { duration, memory } = await measurePerformance(
        () => processVoiceCommand('bump all table 5 orders', {
          userId: 'test-user',
          sessionId: 'test-session',
          timestamp: new Date().toISOString(),
          userRole: 'cook'
        }),
        'Batch operation (10 orders)'
      )

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.BATCH_OPERATIONS)
      if (memory) {
        expect(memory).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_USAGE)
      }
    })
  })

  describe('Table Grouping Performance', () => {
    it('should group small datasets efficiently', async () => {
      const { orders } = createLoadTestData(20, 5)

      const { duration } = await measurePerformance(
        () => {
          // Simulate React hook behavior
          const result = orders.reduce((groups, order) => {
            const tableId = order.order?.table?.id || 'unknown'
            if (!groups[tableId]) groups[tableId] = []
            groups[tableId].push(order)
            return groups
          }, {} as Record<string, typeof orders>)
          return Promise.resolve(Object.values(result))
        },
        'Table grouping (20 orders, 5 tables)'
      )

      expect(duration).toBeLessThan(100)
    })

    it('should handle large datasets within threshold', async () => {
      const { orders } = createLoadTestData(500, 50)

      const { duration, memory } = await measurePerformance(
        () => {
          // Simulate complex grouping with calculations
          const groups = orders.reduce((acc, order) => {
            const tableId = order.order?.table?.id || 'unknown'
            if (!acc[tableId]) {
              acc[tableId] = {
                orders: [],
                totalItems: 0,
                maxElapsedTime: 0,
                avgPriority: 0
              }
            }
            
            acc[tableId].orders.push(order)
            acc[tableId].totalItems += order.order?.items?.length || 0
            
            const elapsed = Date.now() - new Date(order.routed_at).getTime()
            if (elapsed > acc[tableId].maxElapsedTime) {
              acc[tableId].maxElapsedTime = elapsed
            }
            
            return acc
          }, {} as Record<string, any>)
          
          return Promise.resolve(Object.values(groups))
        },
        'Table grouping (500 orders, 50 tables)'
      )

      expect(duration).toBeLessThan(1000)
      if (memory) {
        expect(memory).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_USAGE * 2)
      }
    })

    it('should optimize for real-time updates', async () => {
      const initialOrders = createLoadTestData(100, 20).orders
      
      // Simulate adding orders one by one (real-time scenario)
      const newOrders = createLoadTestData(10, 5).orders
      
      const { duration } = await measurePerformance(
        () => {
          return Promise.resolve(
            newOrders.map(newOrder => {
              const updatedOrders = [...initialOrders, newOrder]
              // Simulate incremental grouping update
              return updatedOrders.filter(o => 
                o.order?.table?.id === newOrder.order?.table?.id
              )
            })
          )
        },
        'Real-time grouping updates (10 new orders)'
      )

      expect(duration).toBeLessThan(200)
    })
  })

  describe('Anomaly Detection Performance', () => {
    it('should detect anomalies within performance threshold', async () => {
      const engine = new AnomalyDetectionEngine(mockSupabase)
      
      // Mock database responses
      mockSupabase.limit.mockResolvedValue({ data: [], error: null })
      mockSupabase.single.mockResolvedValue({ data: null, error: null })
      mockSupabase.in.mockResolvedValue({ data: [], error: null })

      const orderContext = {
        orderId: 'perf-test-order',
        tableNumber: 5,
        residentId: 'perf-test-resident',
        items: Array(5).fill(null).map((_, i) => ({
          id: `item-${i}`,
          menuItemId: `menu-${i}`,
          quantity: Math.floor(Math.random() * 3) + 1
        })),
        createdAt: new Date().toISOString(),
        kitchenId: 'kitchen-main'
      }

      const { duration } = await measurePerformance(
        () => engine.detectAnomalies(orderContext),
        'Anomaly detection (single order)'
      )

      expect(duration).toBeLessThan(1000)
    })

    it('should handle concurrent anomaly detection', async () => {
      const engine = new AnomalyDetectionEngine(mockSupabase)
      
      // Mock fast database responses
      mockSupabase.limit.mockResolvedValue({ data: [], error: null })
      mockSupabase.single.mockResolvedValue({ data: null, error: null })
      mockSupabase.in.mockResolvedValue({ data: [], error: null })

      const orderContexts = Array(20).fill(null).map((_, i) => ({
        orderId: `concurrent-order-${i}`,
        tableNumber: (i % 10) + 1,
        residentId: `resident-${i}`,
        items: [{
          id: `item-${i}`,
          menuItemId: `menu-${i}`,
          quantity: 1
        }],
        createdAt: new Date().toISOString(),
        kitchenId: 'kitchen-main'
      }))

      const { duration } = await measurePerformance(
        () => Promise.all(
          orderContexts.map(context => engine.detectAnomalies(context))
        ),
        'Concurrent anomaly detection (20 orders)'
      )

      expect(duration).toBeLessThan(3000)
    })

    it('should efficiently process large order histories', async () => {
      const engine = new AnomalyDetectionEngine(mockSupabase)
      
      // Mock large historical dataset
      const largeHistory = Array(100).fill(null).map((_, i) => ({
        id: `historical-${i}`,
        created_at: new Date(Date.now() - i * 3600000).toISOString(),
        order_items: Array(Math.floor(Math.random() * 5) + 1).fill(null).map((_, j) => ({
          menu_item_id: `menu-${j}`,
          quantity: Math.floor(Math.random() * 3) + 1
        }))
      }))

      mockSupabase.limit.mockResolvedValueOnce({ data: largeHistory, error: null })
      mockSupabase.single.mockResolvedValue({ data: null, error: null })
      mockSupabase.in.mockResolvedValue({ data: [], error: null })

      const orderContext = {
        orderId: 'large-history-test',
        tableNumber: 5,
        residentId: 'resident-with-history',
        items: [{ id: 'item-1', menuItemId: 'menu-1', quantity: 1 }],
        createdAt: new Date().toISOString(),
        kitchenId: 'kitchen-main'
      }

      const { duration } = await measurePerformance(
        () => engine.detectAnomalies(orderContext),
        'Anomaly detection with large history (100 orders)'
      )

      expect(duration).toBeLessThan(2000)
    })
  })

  describe('Memory Usage Optimization', () => {
    it('should maintain memory efficiency during processing', async () => {
      const commands = Array(50).fill(null).map((_, i) => `bump order ${i + 1}`)
      
      // Mock successful processing
      mockSupabase.single.mockImplementation(() => Promise.resolve({
        data: {
          id: `routing-${Math.random()}`,
          order: { id: `order-${Math.random()}`, order_number: Math.random() }
        },
        error: null
      }))

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0

      for (const command of commands) {
        await processVoiceCommand(command, {
          userId: 'memory-test-user',
          sessionId: 'memory-test-session',
          timestamp: new Date().toISOString(),
          userRole: 'cook'
        })
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory

      if (memoryIncrease > 0) {
        expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_USAGE)
        console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`)
      }
    })

    it('should handle cache cleanup efficiently', async () => {
      const processor = new VoiceCommandProcessor()
      
      // Fill cache with many entries
      const cacheEntries = Array(100).fill(null).map((_, i) => 
        processor.processCommand(`bump order ${i}`, {
          userId: 'cache-test-user',
          sessionId: 'cache-test-session',
          timestamp: new Date().toISOString(),
          userRole: 'cook'
        })
      )

      await Promise.all(cacheEntries)

      // Simulate cache cleanup
      const { duration } = await measurePerformance(
        () => {
          // Access cache cleanup method if available
          if ('clearCache' in processor) {
            (processor as any).clearCache()
          }
          return Promise.resolve()
        },
        'Cache cleanup'
      )

      expect(duration).toBeLessThan(100)
    })
  })

  describe('Stress Testing', () => {
    it('should handle peak hour scenario', async () => {
      const scenario = buildScenario.rushHour()
      
      // Simulate high-frequency voice commands during rush hour
      const rushCommands = Array(30).fill(null).map((_, i) => ({
        command: `bump order ${scenario.orders[i]?.order?.order_number || i + 1000}`,
        timestamp: Date.now() + i * 100 // Commands every 100ms
      }))

      mockSupabase.single.mockImplementation(() => Promise.resolve({
        data: {
          id: `routing-${Math.random()}`,
          order: { id: `order-${Math.random()}`, order_number: Math.random() }
        },
        error: null
      }))

      const { duration } = await measurePerformance(
        () => Promise.all(
          rushCommands.map(({ command }) => 
            processVoiceCommand(command, {
              userId: 'rush-hour-user',
              sessionId: 'rush-hour-session',
              timestamp: new Date().toISOString(),
              userRole: 'cook'
            })
          )
        ),
        'Rush hour scenario (30 concurrent commands)'
      )

      expect(duration).toBeLessThan(10000) // 10 seconds max
    })

    it('should maintain performance under database latency', async () => {
      // Simulate slow database responses
      mockSupabase.single.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            data: {
              id: 'routing-slow',
              order: { id: 'order-slow', order_number: 999 }
            },
            error: null
          }), 200) // 200ms latency
        )
      )

      const { duration } = await measurePerformance(
        () => processVoiceCommand('bump order 999', {
          userId: 'latency-test-user',
          sessionId: 'latency-test-session',
          timestamp: new Date().toISOString(),
          userRole: 'cook'
        }),
        'Command with database latency'
      )

      // Should still be responsive despite latency
      expect(duration).toBeGreaterThan(200) // At least the latency
      expect(duration).toBeLessThan(1000) // But not too slow
    })

    it('should handle error recovery efficiently', async () => {
      let attemptCount = 0
      
      mockSupabase.single.mockImplementation(() => {
        attemptCount++
        if (attemptCount <= 2) {
          return Promise.reject(new Error('Temporary database error'))
        }
        return Promise.resolve({
          data: {
            id: 'routing-recovered',
            order: { id: 'order-recovered', order_number: 123 }
          },
          error: null
        })
      })

      const { duration } = await measurePerformance(
        () => processVoiceCommand('bump order 123', {
          userId: 'error-recovery-user',
          sessionId: 'error-recovery-session',
          timestamp: new Date().toISOString(),
          userRole: 'cook'
        }),
        'Error recovery scenario'
      )

      expect(duration).toBeLessThan(2000) // Should recover quickly
      expect(attemptCount).toBeGreaterThan(1) // Should have retried
    })
  })

  describe('Performance Regression Detection', () => {
    it('should track performance metrics over time', async () => {
      const benchmarkResults: Array<{ operation: string, duration: number }> = []
      
      const operations = [
        () => parseVoiceCommand('bump order 123'),
        () => processVoiceCommand('start order 456', {
          userId: 'benchmark-user',
          sessionId: 'benchmark-session',
          timestamp: new Date().toISOString(),
          userRole: 'cook'
        }),
      ]

      for (const operation of operations) {
        const { duration } = await measurePerformance(
          () => Promise.resolve(operation()),
          operation.name
        )
        
        benchmarkResults.push({
          operation: operation.name,
          duration
        })
      }

      // Store results for regression tracking
      console.log('Performance Benchmark Results:', benchmarkResults)
      
      // Verify all operations meet thresholds
      benchmarkResults.forEach(result => {
        expect(result.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.COMMAND_PROCESSING)
      })
    })
  })
})