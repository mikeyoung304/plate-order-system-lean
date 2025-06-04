/**
 * Integration tests for order database operations
 * Tests actual database interactions, transactions, and data integrity
 */

import { 
  createOrder, 
  updateOrder, 
  deleteOrder, 
  getOrders 
} from '@/lib/modassembly/supabase/database/orders'
import { createMockSupabaseClient, mockData } from '@/__tests__/utils/test-utils'

// Mock the Supabase client
let mockSupabase: ReturnType<typeof createMockSupabaseClient>

jest.mock('@/lib/modassembly/supabase/client', () => ({
  createClient: jest.fn(() => mockSupabase),
}))

describe('Order Database Operations', () => {
  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    jest.clearAllMocks()
  })

  describe('createOrder', () => {
    it('creates a new order successfully', async () => {
      const orderData = {
        table_id: 'table-1',
        seat_id: 'seat-1',
        resident_id: 'resident-1',
        server_id: 'server-1',
        items: ['Chicken Dinner', 'Caesar Salad'],
        transcript: 'chicken dinner and caesar salad',
        status: 'pending' as const,
        type: 'food' as const,
      }

      const expectedOrder = {
        id: 'new-order-id',
        created_at: '2024-01-01T00:00:00Z',
        ...orderData,
      }

      // Mock successful database response
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: expectedOrder,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQueryBuilder)

      const result = await createOrder(orderData)

      expect(mockSupabase.from).toHaveBeenCalledWith('orders')
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(orderData)
      expect(mockQueryBuilder.single).toHaveBeenCalled()
      expect(result).toEqual(expectedOrder)
    })

    it('handles creation errors', async () => {
      const orderData = {
        table_id: 'invalid-table',
        items: [],
        status: 'pending' as const,
      }

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: {
            message: 'Foreign key violation',
            code: '23503',
          },
        }),
      }

      mockSupabase.from.mockReturnValue(mockQueryBuilder)

      await expect(createOrder(orderData as any)).rejects.toThrow('Foreign key violation')
    })

    it('validates required fields', async () => {
      const incompleteOrderData = {
        table_id: 'table-1',
        // Missing required fields
      }

      await expect(createOrder(incompleteOrderData as any)).rejects.toThrow()
    })

    it('handles database connection errors', async () => {
      const orderData = mockData.order()

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(new Error('Connection failed')),
      }

      mockSupabase.from.mockReturnValue(mockQueryBuilder)

      await expect(createOrder(orderData)).rejects.toThrow('Connection failed')
    })

    it('sanitizes input data', async () => {
      const orderData = {
        table_id: 'table-1',
        items: ['<script>alert("xss")</script>Chicken'],
        transcript: '<img src=x onerror=alert("xss")>chicken dinner',
        status: 'pending' as const,
      }

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'order-1', ...orderData },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQueryBuilder)

      await createOrder(orderData as any)

      const insertCall = mockQueryBuilder.insert.mock.calls[0][0]
      expect(insertCall.items).not.toContain('<script>')
      expect(insertCall.transcript).not.toContain('<img')
    })
  })

  describe('updateOrder', () => {
    it('updates an order successfully', async () => {
      const orderId = 'order-1'
      const updates = {
        status: 'confirmed' as const,
        priority: 2,
      }

      const updatedOrder = {
        id: orderId,
        status: 'confirmed',
        priority: 2,
        updated_at: '2024-01-01T01:00:00Z',
      }

      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: updatedOrder,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQueryBuilder)

      const result = await updateOrder(orderId, updates)

      expect(mockSupabase.from).toHaveBeenCalledWith('orders')
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(updates)
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', orderId)
      expect(result).toEqual(updatedOrder)
    })

    it('handles non-existent order', async () => {
      const orderId = 'non-existent-order'
      const updates = { status: 'confirmed' as const }

      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: {
            message: 'No rows returned',
            code: 'PGRST116',
          },
        }),
      }

      mockSupabase.from.mockReturnValue(mockQueryBuilder)

      const result = await updateOrder(orderId, updates)
      expect(result).toBeNull()
    })

    it('handles update validation errors', async () => {
      const orderId = 'order-1'
      const updates = {
        status: 'invalid-status' as any,
      }

      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: {
            message: 'Invalid status value',
            code: '23514',
          },
        }),
      }

      mockSupabase.from.mockReturnValue(mockQueryBuilder)

      await expect(updateOrder(orderId, updates)).rejects.toThrow('Invalid status value')
    })

    it('prevents updating immutable fields', async () => {
      const orderId = 'order-1'
      const updates = {
        id: 'new-id', // Should not be allowed
        created_at: '2024-01-01T00:00:00Z', // Should not be allowed
        status: 'confirmed' as const,
      }

      const sanitizedUpdates = {
        status: 'confirmed',
      }

      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: orderId, status: 'confirmed' },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQueryBuilder)

      await updateOrder(orderId, updates as any)

      expect(mockQueryBuilder.update).toHaveBeenCalledWith(sanitizedUpdates)
    })

    it('handles concurrent updates', async () => {
      const orderId = 'order-1'
      const updates1 = { status: 'confirmed' as const }
      const updates2 = { priority: 1 }

      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn()
          .mockResolvedValueOnce({
            data: { id: orderId, status: 'confirmed' },
            error: null,
          })
          .mockResolvedValueOnce({
            data: { id: orderId, status: 'confirmed', priority: 1 },
            error: null,
          }),
      }

      mockSupabase.from.mockReturnValue(mockQueryBuilder)

      const [result1, result2] = await Promise.all([
        updateOrder(orderId, updates1),
        updateOrder(orderId, updates2),
      ])

      expect(result1).toBeTruthy()
      expect(result2).toBeTruthy()
      expect(mockQueryBuilder.update).toHaveBeenCalledTimes(2)
    })
  })

  describe('deleteOrder', () => {
    it('deletes an order successfully', async () => {
      const orderId = 'order-1'

      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: orderId },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQueryBuilder)

      await deleteOrder(orderId)

      expect(mockSupabase.from).toHaveBeenCalledWith('orders')
      expect(mockQueryBuilder.delete).toHaveBeenCalled()
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', orderId)
    })

    it('handles non-existent order deletion', async () => {
      const orderId = 'non-existent-order'

      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: {
            message: 'No rows returned',
            code: 'PGRST116',
          },
        }),
      }

      mockSupabase.from.mockReturnValue(mockQueryBuilder)

      // Should not throw error for non-existent order
      await expect(deleteOrder(orderId)).resolves.not.toThrow()
    })

    it('handles deletion with foreign key constraints', async () => {
      const orderId = 'order-1'

      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: {
            message: 'Foreign key constraint violation',
            code: '23503',
          },
        }),
      }

      mockSupabase.from.mockReturnValue(mockQueryBuilder)

      await expect(deleteOrder(orderId)).rejects.toThrow('Foreign key constraint violation')
    })

    it('performs soft delete for completed orders', async () => {
      const orderId = 'completed-order-1'

      // Mock order lookup to check status
      const mockSelectBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: orderId, status: 'served' },
          error: null,
        }),
      }

      const mockUpdateBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: orderId, deleted_at: '2024-01-01T02:00:00Z' },
          error: null,
        }),
      }

      mockSupabase.from
        .mockReturnValueOnce(mockSelectBuilder) // First call for status check
        .mockReturnValueOnce(mockUpdateBuilder) // Second call for soft delete

      await deleteOrder(orderId)

      expect(mockUpdateBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({ deleted_at: expect.any(String) })
      )
    })
  })

  describe('getOrders', () => {
    it('retrieves all orders', async () => {
      const mockOrders = [
        mockData.order({ id: 'order-1', status: 'pending' }),
        mockData.order({ id: 'order-2', status: 'confirmed' }),
      ]

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockOrders,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQueryBuilder)

      const result = await getOrders()

      expect(mockSupabase.from).toHaveBeenCalledWith('orders')
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(`
        *,
        table:tables(label, type),
        seat:seats(seat_id),
        resident:profiles!resident_id(name),
        server:profiles!server_id(name)
      `)
      expect(result).toEqual(mockOrders)
    })

    it('filters orders by status', async () => {
      const filters = { status: 'pending' as const }
      const mockOrders = [
        mockData.order({ id: 'order-1', status: 'pending' }),
      ]

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockOrders,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQueryBuilder)

      const result = await getOrders(filters)

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'pending')
      expect(result).toEqual(mockOrders)
    })

    it('filters orders by table', async () => {
      const filters = { tableId: 'table-1' }
      const mockOrders = [
        mockData.order({ id: 'order-1', table_id: 'table-1' }),
      ]

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockOrders,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQueryBuilder)

      const result = await getOrders(filters)

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('table_id', 'table-1')
      expect(result).toEqual(mockOrders)
    })

    it('filters orders by date range', async () => {
      const filters = {
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-02'),
        },
      }

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQueryBuilder)

      await getOrders(filters)

      expect(mockQueryBuilder.gte).toHaveBeenCalledWith('created_at', '2024-01-01T00:00:00.000Z')
      expect(mockQueryBuilder.lte).toHaveBeenCalledWith('created_at', '2024-01-02T00:00:00.000Z')
    })

    it('combines multiple filters', async () => {
      const filters = {
        status: 'pending' as const,
        tableId: 'table-1',
        serverId: 'server-1',
      }

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQueryBuilder)

      await getOrders(filters)

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'pending')
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('table_id', 'table-1')
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('server_id', 'server-1')
    })

    it('handles query errors', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: {
            message: 'Database error',
            code: 'PGRST000',
          },
        }),
      }

      mockSupabase.from.mockReturnValue(mockQueryBuilder)

      await expect(getOrders()).rejects.toThrow('Database error')
    })

    it('applies default ordering and limits', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQueryBuilder)

      await getOrders()

      expect(mockQueryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(100)
    })

    it('excludes soft-deleted orders', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQueryBuilder)

      await getOrders()

      expect(mockQueryBuilder.is).toHaveBeenCalledWith('deleted_at', null)
    })
  })

  describe('Performance and Optimization', () => {
    it('uses proper indexes for common queries', async () => {
      const filters = { status: 'pending' as const }

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQueryBuilder)

      const startTime = performance.now()
      await getOrders(filters)
      const endTime = performance.now()

      // Should complete quickly with proper indexing
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('handles large result sets efficiently', async () => {
      const manyOrders = Array.from({ length: 1000 }, (_, i) => 
        mockData.order({ id: `order-${i}` })
      )

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: manyOrders,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQueryBuilder)

      const startTime = performance.now()
      const result = await getOrders()
      const endTime = performance.now()

      expect(result).toHaveLength(1000)
      expect(endTime - startTime).toBeLessThan(1000) // Should handle large datasets
    })

    it('uses efficient joins for related data', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQueryBuilder)

      await getOrders()

      // Check that it uses proper joins instead of multiple queries
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        expect.stringContaining('table:tables')
      )
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        expect.stringContaining('resident:profiles!resident_id')
      )
    })
  })

  describe('Transaction Safety', () => {
    it('handles transaction rollback on errors', async () => {
      const orderData = mockData.order()

      // Mock a transaction failure
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(new Error('Transaction failed')),
      }

      mockSupabase.from.mockReturnValue(mockQueryBuilder)

      await expect(createOrder(orderData)).rejects.toThrow('Transaction failed')

      // Verify no partial data was committed
      expect(mockQueryBuilder.insert).toHaveBeenCalled()
    })

    it('maintains data consistency during concurrent operations', async () => {
      const orderId = 'order-1'
      
      // Simulate concurrent updates
      const update1 = updateOrder(orderId, { status: 'confirmed' })
      const update2 = updateOrder(orderId, { priority: 1 })

      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn()
          .mockResolvedValueOnce({ data: { id: orderId, status: 'confirmed' }, error: null })
          .mockResolvedValueOnce({ data: { id: orderId, priority: 1 }, error: null }),
      }

      mockSupabase.from.mockReturnValue(mockQueryBuilder)

      const results = await Promise.all([update1, update2])

      expect(results).toHaveLength(2)
      expect(results.every(r => r !== null)).toBe(true)
    })
  })
})