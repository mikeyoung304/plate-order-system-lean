import { getOrderSuggestions, getPopularItems } from '@/lib/modassembly/supabase/database/suggestions'
import { createMockSupabaseClient } from '@/__tests__/utils/test-utils'

// Mock the Supabase client
jest.mock('@/lib/modassembly/supabase/client', () => ({
  createClient: jest.fn(),
}))

// Mock the security utils
jest.mock('@/lib/utils/security', () => ({
  sanitizeOrderItems: jest.fn((items) => items.filter(item => item && typeof item === 'string')),
}))

describe('Order Suggestions', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    const { createClient } = require('@/lib/modassembly/supabase/client')
    createClient.mockReturnValue(mockSupabase)
    jest.clearAllMocks()
  })

  describe('getOrderSuggestions', () => {
    const mockOrders = [
      { items: ['chicken', 'pasta'] },
      { items: ['chicken', 'pasta'] },
      { items: ['chicken', 'pasta'] },
      { items: ['salad', 'soup'] },
      { items: ['salad', 'soup'] },
      { items: ['burger', 'fries'] },
    ]

    beforeEach(() => {
      mockSupabase.from().select().eq().eq().order().limit.mockResolvedValue({
        data: mockOrders,
        error: null,
      })
    })

    it('returns empty array when no userId provided', async () => {
      const result = await getOrderSuggestions('', 'food', 5)
      expect(result).toEqual([])
    })

    it('returns empty array when no orders found', async () => {
      mockSupabase.from().select().eq().eq().order().limit.mockResolvedValue({
        data: [],
        error: null,
      })

      const result = await getOrderSuggestions('user-id', 'food', 5)
      expect(result).toEqual([])
    })

    it('returns empty array when orders data is null', async () => {
      mockSupabase.from().select().eq().eq().order().limit.mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await getOrderSuggestions('user-id', 'food', 5)
      expect(result).toEqual([])
    })

    it('groups identical order combinations and counts frequency', async () => {
      const result = await getOrderSuggestions('user-id', 'food', 5)

      expect(result).toHaveLength(3)
      
      // Most frequent should be first (chicken, pasta appears 3 times)
      expect(result[0]).toEqual({
        items: ['chicken', 'pasta'],
        frequency: 3,
      })
      
      // Second most frequent (salad, soup appears 2 times)
      expect(result[1]).toEqual({
        items: ['salad', 'soup'],
        frequency: 2,
      })
      
      // Least frequent (burger, fries appears 1 time)
      expect(result[2]).toEqual({
        items: ['burger', 'fries'],
        frequency: 1,
      })
    })

    it('sorts items within each suggestion consistently', async () => {
      // Test with items in different order
      mockSupabase.from().select().eq().eq().order().limit.mockResolvedValue({
        data: [
          { items: ['pasta', 'chicken'] },
          { items: ['chicken', 'pasta'] },
        ],
        error: null,
      })

      const result = await getOrderSuggestions('user-id', 'food', 5)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        items: ['chicken', 'pasta'], // Should be sorted alphabetically
        frequency: 2,
      })
    })

    it('filters out invalid order items', async () => {
      mockSupabase.from().select().eq().eq().order().limit.mockResolvedValue({
        data: [
          { items: ['chicken', 'pasta'] },
          { items: 'not-an-array' }, // Invalid
          { items: null }, // Invalid
          { items: [] }, // Empty array
        ],
        error: null,
      })

      const result = await getOrderSuggestions('user-id', 'food', 5)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        items: ['chicken', 'pasta'],
        frequency: 1,
      })
    })

    it('respects the limit parameter', async () => {
      const result = await getOrderSuggestions('user-id', 'food', 2)

      expect(result).toHaveLength(2)
      expect(result[0].frequency).toBeGreaterThanOrEqual(result[1].frequency)
    })

    it('handles minimum limit of 1', async () => {
      const result = await getOrderSuggestions('user-id', 'food', 0)

      expect(result).toHaveLength(1) // Should return at least 1
    })

    it('handles maximum limit of 10', async () => {
      const result = await getOrderSuggestions('user-id', 'food', 100)

      expect(result.length).toBeLessThanOrEqual(10) // Should cap at 10
    })

    it('uses correct query parameters', async () => {
      await getOrderSuggestions('test-user-id', 'drink', 3)

      expect(mockSupabase.from).toHaveBeenCalledWith('orders')
      expect(mockSupabase.from().select).toHaveBeenCalledWith('items')
      expect(mockSupabase.from().select().eq).toHaveBeenNthCalledWith(1, 'resident_id', 'test-user-id')
      expect(mockSupabase.from().select().eq().eq).toHaveBeenCalledWith('type', 'drink')
      expect(mockSupabase.from().select().eq().eq().order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockSupabase.from().select().eq().eq().order().limit).toHaveBeenCalledWith(50)
    })

    it('defaults to food type when no type specified', async () => {
      await getOrderSuggestions('test-user-id')

      expect(mockSupabase.from().select().eq().eq).toHaveBeenCalledWith('type', 'food')
    })

    it('defaults to limit of 5 when no limit specified', async () => {
      mockSupabase.from().select().eq().eq().order().limit.mockResolvedValue({
        data: Array.from({ length: 10 }, (_, i) => ({
          items: [`item${i}`],
        })),
        error: null,
      })

      const result = await getOrderSuggestions('test-user-id')

      expect(result.length).toBeLessThanOrEqual(5)
    })
  })

  describe('getPopularItems', () => {
    const mockOrdersWithItems = [
      { items: ['chicken', 'pasta', 'salad'] },
      { items: ['chicken', 'burger'] },
      { items: ['pasta', 'salad'] },
      { items: ['chicken'] },
      { items: ['pizza', 'wings'] },
    ]

    beforeEach(() => {
      mockSupabase.from().select().eq().gte().limit.mockResolvedValue({
        data: mockOrdersWithItems,
        error: null,
      })
    })

    it('returns empty array when no orders found', async () => {
      mockSupabase.from().select().eq().gte().limit.mockResolvedValue({
        data: [],
        error: null,
      })

      const result = await getPopularItems('food', 5)
      expect(result).toEqual([])
    })

    it('returns empty array when orders data is null', async () => {
      mockSupabase.from().select().eq().gte().limit.mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await getPopularItems('food', 5)
      expect(result).toEqual([])
    })

    it('counts individual item frequency correctly', async () => {
      const result = await getPopularItems('food', 10)

      // Expected counts:
      // chicken: 3 times
      // pasta: 2 times  
      // salad: 2 times
      // burger: 1 time
      // pizza: 1 time
      // wings: 1 time

      expect(result).toHaveLength(6)
      expect(result[0]).toBe('chicken') // Most frequent
      expect(result.slice(1, 3)).toContain('pasta') // Second tier
      expect(result.slice(1, 3)).toContain('salad') // Second tier
    })

    it('respects the limit parameter', async () => {
      const result = await getPopularItems('food', 3)

      expect(result).toHaveLength(3)
      expect(result[0]).toBe('chicken') // Should still be most frequent
    })

    it('filters out invalid items', async () => {
      mockSupabase.from().select().eq().gte().limit.mockResolvedValue({
        data: [
          { items: ['chicken', 'pasta'] },
          { items: 'not-an-array' },
          { items: null },
          { items: ['', 'valid-item'] }, // Empty string should be filtered
        ],
        error: null,
      })

      const result = await getPopularItems('food', 10)

      expect(result).toEqual(['chicken', 'pasta', 'valid-item'])
    })

    it('uses correct query parameters', async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      
      await getPopularItems('drink', 5)

      expect(mockSupabase.from).toHaveBeenCalledWith('orders')
      expect(mockSupabase.from().select).toHaveBeenCalledWith('items')
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('type', 'drink')
      expect(mockSupabase.from().select().eq().gte).toHaveBeenCalledWith(
        'created_at',
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/) // ISO date format
      )
      expect(mockSupabase.from().select().eq().gte().limit).toHaveBeenCalledWith(200)
    })

    it('defaults to food type when no type specified', async () => {
      await getPopularItems()

      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('type', 'food')
    })

    it('defaults to limit of 10 when no limit specified', async () => {
      mockSupabase.from().select().eq().gte().limit.mockResolvedValue({
        data: Array.from({ length: 20 }, (_, i) => ({
          items: [`item${i}`],
        })),
        error: null,
      })

      const result = await getPopularItems()

      expect(result.length).toBeLessThanOrEqual(10)
    })

    it('handles date filtering correctly', async () => {
      await getPopularItems('food', 5)

      const call = mockSupabase.from().select().eq().gte.mock.calls[0]
      const dateParam = call[1]
      const providedDate = new Date(dateParam)
      const expectedDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      
      // Allow some tolerance for execution time
      const timeDiff = Math.abs(providedDate.getTime() - expectedDate.getTime())
      expect(timeDiff).toBeLessThan(1000) // Less than 1 second difference
    })
  })

  describe('Placeholder Functions', () => {
    it('getSeatResidentSuggestions returns empty array', async () => {
      const result = await require('@/lib/modassembly/supabase/database/suggestions').getSeatResidentSuggestions('table-1', 1, 3)
      expect(result).toEqual([])
    })

    it('getTimeBasedResidentSuggestions returns empty array', async () => {
      const result = await require('@/lib/modassembly/supabase/database/suggestions').getTimeBasedResidentSuggestions(12, 2)
      expect(result).toEqual([])
    })
  })
})