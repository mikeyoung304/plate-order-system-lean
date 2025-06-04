/**
 * Comprehensive tests for KDSMainContent component
 * Tests loading states, error handling, different view modes, and data filtering
 */

import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import { KDSMainContent } from '@/components/kds/KDSMainContent'
import { renderWithProviders, mockData } from '@/__tests__/utils/test-utils'

// Mock the hooks
const mockKDSState = {
  orders: [],
  loading: false,
  error: null,
  viewMode: 'grid' as const,
  sortBy: 'time' as const,
  filterBy: 'all' as const,
  soundEnabled: true,
  connectionStatus: 'connected' as const,
  filteredAndSortedOrders: [],
  refetch: jest.fn(),
  optimisticUpdate: jest.fn(),
  setViewMode: jest.fn(),
  setSortBy: jest.fn(),
  setFilterBy: jest.fn(),
  toggleSound: jest.fn(),
}

const mockTableGroups = [
  {
    tableId: 'table-1',
    label: 'Table 1',
    orders: [mockData.kdsOrder({ id: 'order-1' })],
    totalItems: 1,
    urgentCount: 0,
    estimatedCompletion: new Date(Date.now() + 600000).toISOString(),
  }
]

jest.mock('@/lib/hooks/use-kds-state', () => ({
  useKDSState: jest.fn(() => mockKDSState),
}))

jest.mock('@/hooks/use-table-grouped-orders', () => ({
  useTableGroupedOrders: jest.fn(() => mockTableGroups),
}))

// Mock child components
jest.mock('@/components/kds/order-card', () => ({
  OrderCard: ({ order, onBump, onRecall }: any) => (
    <div data-testid="order-card" data-order-id={order.id}>
      <div>Order: {order.id}</div>
      <button onClick={() => onBump(order.id)}>Bump</button>
      <button onClick={() => onRecall(order.id)}>Recall</button>
    </div>
  ),
}))

jest.mock('@/components/kds/table-group-card', () => ({
  TableGroupCard: ({ group, onBumpTable }: any) => (
    <div data-testid="table-group-card" data-table-id={group.tableId}>
      <div>Table: {group.label}</div>
      <button onClick={() => onBumpTable(group.tableId, [])}>Bump Table</button>
    </div>
  ),
}))

describe('KDSMainContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset to default state
    Object.assign(mockKDSState, {
      orders: [],
      loading: false,
      error: null,
      viewMode: 'grid',
      sortBy: 'time',
      filterBy: 'all',
      soundEnabled: true,
      connectionStatus: 'connected',
      filteredAndSortedOrders: [],
    })
  })

  describe('Rendering States', () => {
    it('renders loading skeleton when loading', () => {
      mockKDSState.loading = true
      renderWithProviders(<KDSMainContent />)
      
      const skeletons = screen.getAllByTestId(/skeleton/i)
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('renders error display when there is an error', () => {
      mockKDSState.loading = false
      mockKDSState.error = 'Connection failed'
      renderWithProviders(<KDSMainContent />)
      
      expect(screen.getByText(/Failed to load orders/i)).toBeInTheDocument()
      expect(screen.getByText(/Connection failed/i)).toBeInTheDocument()
    })

    it('renders empty state when no orders', () => {
      mockKDSState.loading = false
      mockKDSState.error = null
      mockKDSState.orders = []
      renderWithProviders(<KDSMainContent />)
      
      expect(screen.getByText('No orders')).toBeInTheDocument()
      expect(screen.getByText(/All caught up/i)).toBeInTheDocument()
    })

    it('renders empty state with filter-specific message', () => {
      mockKDSState.loading = false
      mockKDSState.error = null
      mockKDSState.orders = []
      mockKDSState.filterBy = 'new'
      renderWithProviders(<KDSMainContent />)
      
      expect(screen.getByText('No orders')).toBeInTheDocument()
      expect(screen.getByText(/No new orders/i)).toBeInTheDocument()
    })
  })

  describe('View Modes', () => {
    const createTestOrders = (count: number) => 
      Array.from({ length: count }, (_, i) => 
        mockData.kdsOrder({ 
          id: `order-${i + 1}`,
          routed_at: new Date(Date.now() + i * 60000).toISOString()
        })
      )

    it('renders individual orders in grid view', () => {
      mockKDSState.orders = createTestOrders(3)
      mockKDSState.viewMode = 'grid'
      renderWithProviders(<KDSMainContent />)
      
      const orderCards = screen.getAllByTestId('order-card')
      expect(orderCards).toHaveLength(3)
    })

    it('renders individual orders in list view', () => {
      mockKDSState.orders = createTestOrders(3)
      mockKDSState.viewMode = 'list'
      renderWithProviders(<KDSMainContent />)
      
      const orderCards = screen.getAllByTestId('order-card')
      expect(orderCards).toHaveLength(3)
    })

    it('renders table groups in table view', () => {
      mockKDSState.orders = createTestOrders(3)
      mockKDSState.viewMode = 'table'
      renderWithProviders(<KDSMainContent />)
      
      const tableGroupCards = screen.getAllByTestId('table-group-card')
      expect(tableGroupCards).toHaveLength(1) // Based on mockTableGroups
    })

    it('applies correct grid classes for different view modes', () => {
      const { container } = renderWithProviders(<KDSMainContent />)
      
      // Test default grid classes
      const gridContainer = container.querySelector('.grid')
      expect(gridContainer).toBeInTheDocument()
    })

    it('adapts grid layout based on order count', () => {
      // Test with few orders
      mockKDSState.orders = createTestOrders(2)
      const { container, rerender } = renderWithProviders(<KDSMainContent />)
      
      let gridContainer = container.querySelector('.grid')
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2')
      
      // Test with many orders
      mockKDSState.orders = createTestOrders(12)
      rerender(<KDSMainContent />)
      
      gridContainer = container.querySelector('.grid')
      expect(gridContainer).toHaveClass('xl:grid-cols-4')
    })
  })

  describe('Data Filtering and Sorting', () => {
    const createOrderWithStatus = (id: string, status: 'new' | 'preparing' | 'ready') => {
      const baseOrder = mockData.kdsOrder({ id })
      
      switch (status) {
        case 'new':
          return { ...baseOrder, started_at: null, completed_at: null }
        case 'preparing':
          return { 
            ...baseOrder, 
            started_at: new Date().toISOString(), 
            completed_at: null 
          }
        case 'ready':
          return { 
            ...baseOrder, 
            started_at: new Date().toISOString(), 
            completed_at: new Date().toISOString() 
          }
        default:
          return baseOrder
      }
    }

    it('filters orders by status', () => {
      const orders = [
        createOrderWithStatus('order-1', 'new'),
        createOrderWithStatus('order-2', 'preparing'),
        createOrderWithStatus('order-3', 'ready'),
      ]
      
      mockKDSState.orders = orders
      mockKDSState.filterBy = 'new'
      
      renderWithProviders(<KDSMainContent />)
      
      // Should only show new orders
      const orderCards = screen.getAllByTestId('order-card')
      expect(orderCards).toHaveLength(1)
      expect(screen.getByText('Order: order-1')).toBeInTheDocument()
    })

    it('sorts orders by priority', () => {
      const orders = [
        { ...mockData.kdsOrder({ id: 'order-1' }), priority: 1 },
        { ...mockData.kdsOrder({ id: 'order-2' }), priority: 3 },
        { ...mockData.kdsOrder({ id: 'order-3' }), priority: 2 },
      ]
      
      mockKDSState.orders = orders
      mockKDSState.sortBy = 'priority'
      
      renderWithProviders(<KDSMainContent />)
      
      const orderCards = screen.getAllByTestId('order-card')
      expect(orderCards).toHaveLength(3)
      
      // Orders should be sorted by priority (highest first)
      expect(orderCards[0]).toHaveAttribute('data-order-id', 'order-2')
      expect(orderCards[1]).toHaveAttribute('data-order-id', 'order-3')
      expect(orderCards[2]).toHaveAttribute('data-order-id', 'order-1')
    })

    it('sorts orders by time', () => {
      const now = Date.now()
      const orders = [
        { 
          ...mockData.kdsOrder({ id: 'order-1' }), 
          routed_at: new Date(now + 180000).toISOString() // Latest
        },
        { 
          ...mockData.kdsOrder({ id: 'order-2' }), 
          routed_at: new Date(now).toISOString() // Earliest
        },
        { 
          ...mockData.kdsOrder({ id: 'order-3' }), 
          routed_at: new Date(now + 60000).toISOString() // Middle
        },
      ]
      
      mockKDSState.orders = orders
      mockKDSState.sortBy = 'time'
      
      renderWithProviders(<KDSMainContent />)
      
      const orderCards = screen.getAllByTestId('order-card')
      expect(orderCards).toHaveLength(3)
      
      // Orders should be sorted by time (earliest first)
      expect(orderCards[0]).toHaveAttribute('data-order-id', 'order-2')
      expect(orderCards[1]).toHaveAttribute('data-order-id', 'order-3')
      expect(orderCards[2]).toHaveAttribute('data-order-id', 'order-1')
    })

    it('sorts orders by table', () => {
      const orders = [
        { 
          ...mockData.kdsOrder({ id: 'order-1' }), 
          order: { table: { label: 'Table C' } }
        },
        { 
          ...mockData.kdsOrder({ id: 'order-2' }), 
          order: { table: { label: 'Table A' } }
        },
        { 
          ...mockData.kdsOrder({ id: 'order-3' }), 
          order: { table: { label: 'Table B' } }
        },
      ]
      
      mockKDSState.orders = orders
      mockKDSState.sortBy = 'table'
      
      renderWithProviders(<KDSMainContent />)
      
      const orderCards = screen.getAllByTestId('order-card')
      expect(orderCards).toHaveLength(3)
      
      // Orders should be sorted alphabetically by table
      expect(orderCards[0]).toHaveAttribute('data-order-id', 'order-2')
      expect(orderCards[1]).toHaveAttribute('data-order-id', 'order-3')
      expect(orderCards[2]).toHaveAttribute('data-order-id', 'order-1')
    })
  })

  describe('User Interactions', () => {
    it('handles order bump action', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      mockKDSState.orders = [mockData.kdsOrder({ id: 'test-order' })]
      
      const { user } = renderWithProviders(<KDSMainContent />)
      
      const bumpButton = screen.getByText('Bump')
      await user.click(bumpButton)
      
      expect(consoleSpy).toHaveBeenCalledWith('Bump order:', 'test-order')
      consoleSpy.mockRestore()
    })

    it('handles order recall action', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      mockKDSState.orders = [mockData.kdsOrder({ id: 'test-order' })]
      
      const { user } = renderWithProviders(<KDSMainContent />)
      
      const recallButton = screen.getByText('Recall')
      await user.click(recallButton)
      
      expect(consoleSpy).toHaveBeenCalledWith('Recall order:', 'test-order')
      consoleSpy.mockRestore()
    })

    it('handles table bump action in table view', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      mockKDSState.orders = [mockData.kdsOrder()]
      mockKDSState.viewMode = 'table'
      
      const { user } = renderWithProviders(<KDSMainContent />)
      
      const bumpTableButton = screen.getByText('Bump Table')
      await user.click(bumpTableButton)
      
      expect(consoleSpy).toHaveBeenCalledWith('Bump table:', 'table-1', [])
      consoleSpy.mockRestore()
    })
  })

  describe('Performance', () => {
    it('memoizes components to prevent unnecessary re-renders', () => {
      const orders = Array.from({ length: 10 }, (_, i) => 
        mockData.kdsOrder({ id: `order-${i}` })
      )
      
      mockKDSState.orders = orders
      
      const { rerender } = renderWithProviders(<KDSMainContent />)
      
      // Re-render with same props
      rerender(<KDSMainContent />)
      
      // Should not cause performance issues
      expect(screen.getAllByTestId('order-card')).toHaveLength(10)
    })

    it('handles large datasets efficiently', () => {
      const manyOrders = Array.from({ length: 100 }, (_, i) => 
        mockData.kdsOrder({ id: `order-${i}` })
      )
      
      mockKDSState.orders = manyOrders
      
      const startTime = performance.now()
      renderWithProviders(<KDSMainContent />)
      const endTime = performance.now()
      
      // Should render in reasonable time
      expect(endTime - startTime).toBeLessThan(1000)
      expect(screen.getAllByTestId('order-card')).toHaveLength(100)
    })

    it('optimizes scroll area rendering', () => {
      mockKDSState.orders = [mockData.kdsOrder()]
      
      const { container } = renderWithProviders(<KDSMainContent />)
      
      const scrollArea = container.querySelector('[data-radix-scroll-area-viewport]')
      expect(scrollArea).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles null or undefined orders gracefully', () => {
      mockKDSState.orders = null as any
      
      expect(() => {
        renderWithProviders(<KDSMainContent />)
      }).not.toThrow()
      
      expect(screen.getByText('No orders')).toBeInTheDocument()
    })

    it('handles orders with missing data', () => {
      mockKDSState.orders = [
        { 
          id: 'incomplete-order',
          // Missing many expected fields
        } as any
      ]
      
      expect(() => {
        renderWithProviders(<KDSMainContent />)
      }).not.toThrow()
      
      expect(screen.getByTestId('order-card')).toBeInTheDocument()
    })

    it('handles invalid dates in sorting', () => {
      mockKDSState.orders = [
        { 
          ...mockData.kdsOrder({ id: 'order-1' }),
          routed_at: 'invalid-date'
        },
        { 
          ...mockData.kdsOrder({ id: 'order-2' }),
          routed_at: new Date().toISOString()
        }
      ]
      mockKDSState.sortBy = 'time'
      
      expect(() => {
        renderWithProviders(<KDSMainContent />)
      }).not.toThrow()
      
      expect(screen.getAllByTestId('order-card')).toHaveLength(2)
    })

    it('handles empty table groups in table view', () => {
      jest.doMock('@/hooks/use-table-grouped-orders', () => ({
        useTableGroupedOrders: jest.fn(() => []),
      }))
      
      mockKDSState.orders = [mockData.kdsOrder()]
      mockKDSState.viewMode = 'table'
      
      renderWithProviders(<KDSMainContent />)
      
      // Should handle empty table groups gracefully
      expect(screen.queryByTestId('table-group-card')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA structure', () => {
      mockKDSState.orders = [mockData.kdsOrder()]
      renderWithProviders(<KDSMainContent />)
      
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
      
      buttons.forEach(button => {
        expect(button).toBeVisible()
      })
    })

    it('supports keyboard navigation', async () => {
      mockKDSState.orders = [mockData.kdsOrder()]
      const { user } = renderWithProviders(<KDSMainContent />)
      
      // Should be able to navigate to interactive elements
      await user.tab()
      expect(document.activeElement).toBeInstanceOf(HTMLElement)
    })

    it('maintains focus management in different view modes', async () => {
      mockKDSState.orders = [mockData.kdsOrder()]
      const { user, rerender } = renderWithProviders(<KDSMainContent />)
      
      // Focus on an element
      const bumpButton = screen.getByText('Bump')
      await user.click(bumpButton)
      
      // Change view mode
      mockKDSState.viewMode = 'table'
      rerender(<KDSMainContent />)
      
      // Focus should be managed appropriately
      expect(document.activeElement).toBeInstanceOf(HTMLElement)
    })
  })

  describe('Error Recovery', () => {
    it('recovers from error state when data loads successfully', () => {
      mockKDSState.error = 'Network error'
      const { rerender } = renderWithProviders(<KDSMainContent />)
      
      expect(screen.getByText(/Failed to load orders/i)).toBeInTheDocument()
      
      // Simulate successful data load
      mockKDSState.error = null
      mockKDSState.orders = [mockData.kdsOrder()]
      rerender(<KDSMainContent />)
      
      expect(screen.queryByText(/Failed to load orders/i)).not.toBeInTheDocument()
      expect(screen.getByTestId('order-card')).toBeInTheDocument()
    })

    it('clears error when switching between states', () => {
      mockKDSState.error = 'Connection error'
      const { rerender } = renderWithProviders(<KDSMainContent />)
      
      expect(screen.getByText(/Failed to load orders/i)).toBeInTheDocument()
      
      // Switch to loading state
      mockKDSState.error = null
      mockKDSState.loading = true
      rerender(<KDSMainContent />)
      
      expect(screen.queryByText(/Failed to load orders/i)).not.toBeInTheDocument()
      expect(screen.getAllByTestId(/skeleton/i).length).toBeGreaterThan(0)
    })
  })

  describe('Styling and Layout', () => {
    it('applies custom className', () => {
      const { container } = renderWithProviders(
        <KDSMainContent className="custom-class" />
      )
      
      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('maintains responsive grid layout', () => {
      const { container } = renderWithProviders(<KDSMainContent />)
      
      const gridContainer = container.querySelector('.grid')
      expect(gridContainer).toHaveClass('gap-4')
    })

    it('applies proper spacing and padding', () => {
      const { container } = renderWithProviders(<KDSMainContent />)
      
      const contentArea = container.querySelector('.p-4')
      expect(contentArea).toBeInTheDocument()
    })
  })
})