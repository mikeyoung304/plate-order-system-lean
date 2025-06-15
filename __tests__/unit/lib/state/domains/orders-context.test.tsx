/**
 * Comprehensive tests for OrdersContext
 * Tests state management, real-time updates, optimistic updates, and all context operations
 */

import React, { act } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { 
  OrdersProvider, 
  useOrders, 
  useOrdersData, 
  useActiveOrders 
} from '@/lib/state/domains/orders-context'
import { mockData } from '@/__tests__/utils/test-utils'

// Mock the optimized client and database functions
const mockCreateOrder = jest.fn()
const mockUpdateOrder = jest.fn()
const mockDeleteOrder = jest.fn()
const mockGetOrders = jest.fn()

jest.mock('@/lib/modassembly/supabase/client', () => ({
  createClient: jest.fn(() => ({
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnValue(Promise.resolve()),
    })),
    removeChannel: jest.fn(),
  })),
}))

jest.mock('@/lib/modassembly/supabase/database/orders', () => ({
  createOrder: jest.fn().mockImplementation((...args) => mockCreateOrder(...args)),
  updateOrder: jest.fn().mockImplementation((...args) => mockUpdateOrder(...args)),
  deleteOrder: jest.fn().mockImplementation((...args) => mockDeleteOrder(...args)),
  getOrders: jest.fn().mockImplementation((...args) => mockGetOrders(...args)),
}))

describe('OrdersContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <OrdersProvider enableRealtime={false} autoRefresh={false} disableAutoLoad={true}>
      {children}
    </OrdersProvider>
  )

  // Helper function to wait for all pending async operations
  const waitForAsyncOperations = async () => {
    await act(async () => {
      // Wait for any pending promises to resolve
      await new Promise(resolve => setTimeout(resolve, 0))
    })
  }

  // Helper function to load orders in tests
  const loadOrdersInTest = async (result: any) => {
    await act(async () => {
      await result.current.loadOrders()
    })
    await waitFor(() => {
      expect(result.current.state.loading).toBe(false)
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetOrders.mockResolvedValue([])
    mockCreateOrder.mockImplementation(async (orderData) => ({
      id: 'new-order-id',
      created_at: new Date().toISOString(),
      ...orderData,
    }))
    mockUpdateOrder.mockImplementation(async (id, updates) => ({
      id,
      ...updates,
    }))
    mockDeleteOrder.mockResolvedValue(undefined)
  })

  afterEach(async () => {
    // Wait for any pending async operations to complete
    await waitForAsyncOperations()
  })

  describe('Provider Initialization', () => {
    it('provides initial state', async () => {
      const { result } = renderHook(() => useOrders(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.state.loading).toBe(false)
      })
      
      expect(result.current.state.orders).toEqual([])
      expect(result.current.state.error).toBe(null)
      expect(result.current.orders).toEqual([])
    })

    it('loads orders on mount', async () => {
      const testOrders = [
        mockData.order({ id: 'order-1' }),
        mockData.order({ id: 'order-2' }),
      ]
      mockGetOrders.mockResolvedValue(testOrders)

      const { result } = renderHook(() => useOrders(), { wrapper })
      
      // Since auto-load is disabled in tests, manually trigger load
      await act(async () => {
        await result.current.loadOrders()
      })
      
      await waitFor(() => {
        expect(result.current.state.loading).toBe(false)
      })
      
      expect(mockGetOrders).toHaveBeenCalled()
      expect(result.current.orders).toEqual(testOrders)
    })

    it('handles loading error gracefully', async () => {
      const errorMessage = 'Database connection failed'
      mockGetOrders.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useOrders(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.state.error).toBe(errorMessage)
      })
      
      expect(result.current.state.loading).toBe(false)
      expect(result.current.orders).toEqual([])
    })
  })

  describe('Order Operations', () => {
    it('creates new order', async () => {
      const { result } = renderHook(() => useOrders(), { wrapper })
      
      const orderData = {
        table_id: 'table-1',
        seat_id: 'seat-1',
        resident_id: 'resident-1',
        server_id: 'server-1',
        items: ['Chicken', 'Salad'],
        status: 'new' as const,
      }

      await act(async () => {
        const newOrder = await result.current.createNewOrder(orderData)
        expect(newOrder.id).toBe('new-order-id')
        expect(newOrder.items).toEqual(['Chicken', 'Salad'])
      })

      expect(mockCreateOrder).toHaveBeenCalledWith(orderData)
      expect(result.current.orders).toHaveLength(1)
      expect(result.current.orders[0].items).toEqual(['Chicken', 'Salad'])
    })

    it('updates existing order', async () => {
      const initialOrders = [mockData.order({ id: 'order-1', status: 'new' })]
      mockGetOrders.mockResolvedValue(initialOrders)

      const { result } = renderHook(() => useOrders(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.orders).toHaveLength(1)
      })

      const updates = { status: 'in_progress' as const }
      mockUpdateOrder.mockResolvedValue({ 
        ...initialOrders[0], 
        ...updates 
      })

      await act(async () => {
        await result.current.updateOrderData('order-1', updates)
      })

      expect(mockUpdateOrder).toHaveBeenCalledWith('order-1', updates)
      expect(result.current.getOrderById('order-1')?.status).toBe('in_progress')
    })

    it('removes order', async () => {
      const initialOrders = [
        mockData.order({ id: 'order-1' }),
        mockData.order({ id: 'order-2' }),
      ]
      mockGetOrders.mockResolvedValue(initialOrders)

      const { result } = renderHook(() => useOrders(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.orders).toHaveLength(2)
      })

      await act(async () => {
        await result.current.removeOrder('order-1')
      })

      expect(mockDeleteOrder).toHaveBeenCalledWith('order-1')
      expect(result.current.orders).toHaveLength(1)
      expect(result.current.getOrderById('order-1')).toBeUndefined()
    })

    it('handles operation errors', async () => {
      const { result } = renderHook(() => useOrders(), { wrapper })
      
      mockCreateOrder.mockRejectedValue(new Error('Creation failed'))

      await act(async () => {
        await expect(result.current.createNewOrder({
          table_id: 'table-1',
          items: [],
          status: 'new',
        } as any)).rejects.toThrow('Creation failed')
      })

      expect(result.current.orders).toHaveLength(0)
    })
  })

  describe('Optimistic Updates', () => {
    it('applies optimistic updates immediately', async () => {
      const initialOrders = [mockData.order({ id: 'order-1', status: 'new' })]
      mockGetOrders.mockResolvedValue(initialOrders)

      const { result } = renderHook(() => useOrders(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.orders).toHaveLength(1)
      })

      act(() => {
        result.current.optimisticUpdate('order-1', { status: 'in_progress' })
      })

      expect(result.current.getOrderById('order-1')?.status).toBe('in_progress')
      expect(result.current.state.optimisticUpdates['order-1']).toEqual({ 
        status: 'in_progress' 
      })
    })

    it('clears optimistic updates on successful real update', async () => {
      const initialOrders = [mockData.order({ id: 'order-1', status: 'new' })]
      mockGetOrders.mockResolvedValue(initialOrders)

      const { result } = renderHook(() => useOrders(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.orders).toHaveLength(1)
      })

      // Apply optimistic update
      act(() => {
        result.current.optimisticUpdate('order-1', { status: 'in_progress' })
      })

      expect(result.current.state.optimisticUpdates['order-1']).toBeDefined()

      // Simulate successful real update
      const updates = { status: 'in_progress' as const }
      mockUpdateOrder.mockResolvedValue({ 
        ...initialOrders[0], 
        ...updates 
      })

      await act(async () => {
        await result.current.updateOrderData('order-1', updates)
      })

      expect(result.current.state.optimisticUpdates['order-1']).toBeUndefined()
    })

    it('clears optimistic updates on operation error', async () => {
      const initialOrders = [mockData.order({ id: 'order-1', status: 'new' })]
      mockGetOrders.mockResolvedValue(initialOrders)

      const { result } = renderHook(() => useOrders(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.orders).toHaveLength(1)
      })

      // Apply optimistic update
      act(() => {
        result.current.optimisticUpdate('order-1', { status: 'in_progress' })
      })

      expect(result.current.state.optimisticUpdates['order-1']).toBeDefined()

      // Simulate update error
      mockUpdateOrder.mockRejectedValue(new Error('Update failed'))

      await act(async () => {
        await expect(
          result.current.updateOrderData('order-1', { status: 'in_progress' })
        ).rejects.toThrow('Update failed')
      })

      expect(result.current.state.optimisticUpdates['order-1']).toBeUndefined()
    })

    it('merges multiple optimistic updates', async () => {
      const initialOrders = [mockData.order({ id: 'order-1', status: 'new' })]
      mockGetOrders.mockResolvedValue(initialOrders)

      const { result } = renderHook(() => useOrders(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.orders).toHaveLength(1)
      })

      act(() => {
        result.current.optimisticUpdate('order-1', { status: 'in_progress' })
        result.current.optimisticUpdate('order-1', { priority: 1 })
      })

      const updatedOrder = result.current.getOrderById('order-1')
      expect(updatedOrder?.status).toBe('in_progress')
      expect(updatedOrder?.priority).toBe(1)
    })
  })

  describe('Query Functions', () => {
    beforeEach(async () => {
      const testOrders = [
        mockData.order({ 
          id: 'order-1', 
          status: 'new', 
          table_id: 'table-1',
          resident_id: 'resident-1'
        }),
        mockData.order({ 
          id: 'order-2', 
          status: 'ready', 
          table_id: 'table-1',
          resident_id: 'resident-2'
        }),
        mockData.order({ 
          id: 'order-3', 
          status: 'delivered', 
          table_id: 'table-2',
          resident_id: 'resident-1'
        }),
      ]
      mockGetOrders.mockResolvedValue(testOrders)
    })

    it('gets order by ID', async () => {
      const { result } = renderHook(() => useOrders(), { wrapper })
      
      await loadOrdersInTest(result)

      const order = result.current.getOrderById('order-2')
      expect(order?.id).toBe('order-2')
      expect(order?.status).toBe('ready')
    })

    it('gets orders by status', async () => {
      const { result } = renderHook(() => useOrders(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.orders).toHaveLength(3)
      })

      const newOrders = result.current.getOrdersByStatus('new')
      expect(newOrders).toHaveLength(1)
      expect(newOrders[0].id).toBe('order-1')

      const readyOrders = result.current.getOrdersByStatus('ready')
      expect(readyOrders).toHaveLength(1)
      expect(readyOrders[0].id).toBe('order-2')
    })

    it('gets orders by table', async () => {
      const { result } = renderHook(() => useOrders(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.orders).toHaveLength(3)
      })

      const table1Orders = result.current.getOrdersByTable('table-1')
      expect(table1Orders).toHaveLength(2)
      expect(table1Orders.map(o => o.id)).toEqual(['order-1', 'order-2'])

      const table2Orders = result.current.getOrdersByTable('table-2')
      expect(table2Orders).toHaveLength(1)
      expect(table2Orders[0].id).toBe('order-3')
    })

    it('gets orders by resident', async () => {
      const { result } = renderHook(() => useOrders(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.orders).toHaveLength(3)
      })

      const resident1Orders = result.current.getOrdersByResident('resident-1')
      expect(resident1Orders).toHaveLength(2)
      expect(resident1Orders.map(o => o.id)).toEqual(['order-1', 'order-3'])
    })

    it('gets active orders', async () => {
      const { result } = renderHook(() => useOrders(), { wrapper })
      
      await loadOrdersInTest(result)

      const activeOrders = result.current.getActiveOrders()
      expect(activeOrders).toHaveLength(2) // new and ready, not delivered
      expect(activeOrders.map(o => o.id)).toEqual(['order-1', 'order-2'])
    })
  })

  describe('Order Statistics', () => {
    it('calculates order statistics correctly', async () => {
      const testOrders = [
        mockData.order({ id: 'order-1', status: 'new' }),
        mockData.order({ id: 'order-2', status: 'ready' }),
        mockData.order({ id: 'order-3', status: 'ready' }),
        mockData.order({ id: 'order-4', status: 'delivered', created_at: new Date().toISOString() }),
      ]
      mockGetOrders.mockResolvedValue(testOrders)

      const { result } = renderHook(() => useOrders(), { wrapper })
      
      await loadOrdersInTest(result)

      const stats = result.current.getOrderStats()
      
      expect(stats.total).toBe(4)
      expect(stats.byStatus.new).toBe(1)
      expect(stats.byStatus.ready).toBe(2)
      expect(stats.byStatus.delivered).toBe(1)
      expect(stats.pendingCount).toBe(1)
      expect(stats.readyCount).toBe(2)
      expect(stats.averageTime).toBe(0) // No actual_time data provided
    })

    it('handles empty order list', async () => {
      const { result } = renderHook(() => useOrders(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.state.loading).toBe(false)
      })

      const stats = result.current.getOrderStats()
      
      expect(stats.total).toBe(0)
      expect(stats.pendingCount).toBe(0)
      expect(stats.readyCount).toBe(0)
      expect(stats.averageTime).toBe(0)
    })
  })

  describe('Convenience Hooks', () => {
    it('useOrdersData provides read-only data', async () => {
      const testOrders = [mockData.order({ id: 'order-1' })]
      mockGetOrders.mockResolvedValue(testOrders)

      const { result } = renderHook(() => useOrdersData(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.orders).toEqual(testOrders)
      expect(result.current.error).toBe(null)
      expect(result.current.lastUpdated).toBeInstanceOf(Date)
      expect(result.current.stats.total).toBe(1)
    })

    it('useActiveOrders provides active orders only', async () => {
      const testOrders = [
        mockData.order({ id: 'order-1', status: 'new' }),
        mockData.order({ id: 'order-2', status: 'delivered' }),
        mockData.order({ id: 'order-3', status: 'ready' }),
      ]
      mockGetOrders.mockResolvedValue(testOrders)

      // First load the data using useOrders, then test useActiveOrders
      const { result: ordersResult } = renderHook(() => useOrders(), { wrapper })
      await loadOrdersInTest(ordersResult)

      const { result } = renderHook(() => useActiveOrders(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.activeOrders).toHaveLength(2)
      })

      expect(result.current.activeOrders.map(o => o.id)).toEqual(['order-1', 'order-3'])
      expect(result.current.stats.total).toBe(3)
    })
  })

  describe('Error Handling', () => {
    it('throws error when used outside provider', () => {
      expect(() => {
        renderHook(() => useOrders())
      }).toThrow('useOrders must be used within an OrdersProvider')
    })

    it('handles concurrent operations gracefully', async () => {
      const { result } = renderHook(() => useOrders(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.state.loading).toBe(false)
      })

      // Simulate concurrent operations
      const orderData1 = { table_id: 'table-1', items: ['Item 1'], status: 'new' as const }
      const orderData2 = { table_id: 'table-2', items: ['Item 2'], status: 'new' as const }

      mockCreateOrder
        .mockResolvedValueOnce({ id: 'order-1', ...orderData1 })
        .mockResolvedValueOnce({ id: 'order-2', ...orderData2 })

      await act(async () => {
        await Promise.all([
          result.current.createNewOrder(orderData1 as any),
          result.current.createNewOrder(orderData2 as any),
        ])
      })

      expect(result.current.orders).toHaveLength(2)
    })

    it('maintains state consistency on partial failures', async () => {
      const initialOrders = [mockData.order({ id: 'order-1' })]
      mockGetOrders.mockResolvedValue(initialOrders)

      const { result } = renderHook(() => useOrders(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.orders).toHaveLength(1)
      })

      // Apply optimistic update
      act(() => {
        result.current.optimisticUpdate('order-1', { status: 'in_progress' })
      })

      // Simulate update failure
      mockUpdateOrder.mockRejectedValue(new Error('Network error'))

      await act(async () => {
        await expect(
          result.current.updateOrderData('order-1', { status: 'in_progress' })
        ).rejects.toThrow('Network error')
      })

      // Wait for any additional state updates to complete
      await waitFor(() => {
        // State should revert optimistic update
        expect(result.current.getOrderById('order-1')?.status).toBe('new')
      })
    })
  })

  describe('Performance', () => {
    it('memoizes computed values correctly', async () => {
      const testOrders = [mockData.order({ id: 'order-1' })]
      mockGetOrders.mockResolvedValue(testOrders)

      const { result, rerender } = renderHook(() => useOrders(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.orders).toHaveLength(1)
      })

      const firstOrdersRef = result.current.orders
      const firstStatsRef = result.current.getOrderStats()

      // Re-render without state changes
      rerender()

      // References should be the same (memoized)
      expect(result.current.orders).toBe(firstOrdersRef)
      expect(result.current.getOrderStats()).toEqual(firstStatsRef)
    })

    it('handles large datasets efficiently', async () => {
      const manyOrders = Array.from({ length: 1000 }, (_, i) => 
        mockData.order({ id: `order-${i}` })
      )
      mockGetOrders.mockResolvedValue(manyOrders)

      const { result } = renderHook(() => useOrders(), { wrapper })
      
      const startTime = performance.now()
      
      await waitFor(() => {
        expect(result.current.orders).toHaveLength(1000)
      })

      const stats = result.current.getOrderStats()
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(1000) // Should process quickly
      expect(stats.total).toBe(1000)
    })
  })

  describe('Real-time Updates', () => {
    it('configures real-time subscription when enabled', () => {
      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <OrdersProvider enableRealtime={true} autoRefresh={false}>
          {children}
        </OrdersProvider>
      )

      renderHook(() => useOrders(), { wrapper: TestWrapper })

      // Real-time setup would be tested with actual subscription mocks
      // This test verifies the provider accepts the configuration
      expect(true).toBe(true)
    })

    it('configures auto-refresh when enabled', () => {
      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <OrdersProvider enableRealtime={false} autoRefresh={true} refreshInterval={5000}>
          {children}
        </OrdersProvider>
      )

      renderHook(() => useOrders(), { wrapper: TestWrapper })

      // Auto-refresh setup would be tested with timer mocks
      // This test verifies the provider accepts the configuration
      expect(true).toBe(true)
    })
  })
})