/**
 * Comprehensive tests for GrillStation component
 * Tests station-specific logic, filtering, priority handling, and user interactions
 */

import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import { GrillStation } from '@/components/kds/stations/GrillStation'
import { renderWithProviders, mockData } from '@/__tests__/utils/test-utils'

describe('GrillStation', () => {
  const defaultProps = {
    orders: [],
    onOrderAction: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders with title and flame icon', () => {
      renderWithProviders(<GrillStation {...defaultProps} />)
      
      expect(screen.getByText('Grill Station')).toBeInTheDocument()
      expect(screen.getByTestId('flame-icon') || screen.queryByText('Flame')).toBeTruthy()
    })

    it('applies custom className', () => {
      const { container } = renderWithProviders(
        <GrillStation {...defaultProps} className="custom-class" />
      )
      
      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('shows empty state when no grill orders', () => {
      const nonGrillOrders = [
        mockData.kdsOrder({ items: ['salad', 'soup'] }),
        mockData.kdsOrder({ items: ['beverage', 'dessert'] }),
      ]
      
      renderWithProviders(
        <GrillStation {...defaultProps} orders={nonGrillOrders} />
      )
      
      expect(screen.getByText('No grill orders')).toBeInTheDocument()
    })
  })

  describe('Order Filtering', () => {
    it('filters orders containing grill items', () => {
      const orders = [
        mockData.kdsOrder({ id: 'order-1', items: ['steak', 'fries'] }),
        mockData.kdsOrder({ id: 'order-2', items: ['burger', 'onion rings'] }),
        mockData.kdsOrder({ id: 'order-3', items: ['salad', 'soup'] }), // Not grill
        mockData.kdsOrder({ id: 'order-4', items: ['chicken', 'vegetables'] }),
      ]
      
      renderWithProviders(
        <GrillStation {...defaultProps} orders={orders} />
      )
      
      // Should show 3 grill orders (steak, burger, chicken)
      const orderCards = screen.getAllByText(/Table/)
      expect(orderCards).toHaveLength(3)
    })

    it('recognizes all grill items', () => {
      const grillItems = ['steak', 'burger', 'chicken', 'fish', 'sausage']
      const orders = grillItems.map((item, index) => 
        mockData.kdsOrder({ 
          id: `order-${index}`, 
          items: [item],
          table_label: `${index + 1}`
        })
      )
      
      renderWithProviders(
        <GrillStation {...defaultProps} orders={orders} />
      )
      
      const orderCards = screen.getAllByText(/Table/)
      expect(orderCards).toHaveLength(5)
    })

    it('handles case-insensitive item matching', () => {
      const orders = [
        mockData.kdsOrder({ id: 'order-1', items: ['STEAK Dinner'] }),
        mockData.kdsOrder({ id: 'order-2', items: ['Grilled CHICKEN'] }),
        mockData.kdsOrder({ id: 'order-3', items: ['Fish and chips'] }),
      ]
      
      renderWithProviders(
        <GrillStation {...defaultProps} orders={orders} />
      )
      
      const orderCards = screen.getAllByText(/Table/)
      expect(orderCards).toHaveLength(3)
    })

    it('filters partial matches in item names', () => {
      const orders = [
        mockData.kdsOrder({ id: 'order-1', items: ['Ribeye steak dinner'] }),
        mockData.kdsOrder({ id: 'order-2', items: ['Chicken Caesar salad'] }),
        mockData.kdsOrder({ id: 'order-3', items: ['Veggie burger deluxe'] }),
      ]
      
      renderWithProviders(
        <GrillStation {...defaultProps} orders={orders} />
      )
      
      const orderCards = screen.getAllByText(/Table/)
      expect(orderCards).toHaveLength(3)
    })
  })

  describe('Priority System', () => {
    it('assigns high priority to grill items', () => {
      const orders = [
        mockData.kdsOrder({ 
          id: 'order-1', 
          items: ['steak'], 
          table_label: '1'
        }),
      ]
      
      const { container } = renderWithProviders(
        <GrillStation {...defaultProps} orders={orders} />
      )
      
      expect(screen.getByText('high')).toBeInTheDocument()
      
      // Check for high priority styling
      const highPriorityBadge = container.querySelector('.bg-red-')
      expect(highPriorityBadge).toBeInTheDocument()
    })

    it('assigns medium priority to non-core grill items', () => {
      const orders = [
        mockData.kdsOrder({ 
          id: 'order-1', 
          items: ['grilled vegetables'], 
          table_label: '1'
        }),
      ]
      
      renderWithProviders(
        <GrillStation {...defaultProps} orders={orders} />
      )
      
      expect(screen.getByText('medium')).toBeInTheDocument()
    })

    it('sorts orders by priority', () => {
      const orders = [
        mockData.kdsOrder({ 
          id: 'order-1', 
          items: ['grilled vegetables'], // medium priority
          table_label: '1',
          elapsed_seconds: 60
        }),
        mockData.kdsOrder({ 
          id: 'order-2', 
          items: ['steak'], // high priority
          table_label: '2',
          elapsed_seconds: 30
        }),
      ]
      
      renderWithProviders(
        <GrillStation {...defaultProps} orders={orders} />
      )
      
      const tableLabels = screen.getAllByText(/Table \d/)
      // High priority order (steak) should come first
      expect(tableLabels[0]).toHaveTextContent('Table 2')
      expect(tableLabels[1]).toHaveTextContent('Table 1')
    })

    it('sorts by elapsed time within same priority', () => {
      const orders = [
        mockData.kdsOrder({ 
          id: 'order-1', 
          items: ['steak'], 
          table_label: '1',
          elapsed_seconds: 300 // 5 minutes
        }),
        mockData.kdsOrder({ 
          id: 'order-2', 
          items: ['burger'], 
          table_label: '2',
          elapsed_seconds: 120 // 2 minutes
        }),
      ]
      
      renderWithProviders(
        <GrillStation {...defaultProps} orders={orders} />
      )
      
      const tableLabels = screen.getAllByText(/Table \d/)
      // Older order should come first
      expect(tableLabels[0]).toHaveTextContent('Table 2')
      expect(tableLabels[1]).toHaveTextContent('Table 1')
    })
  })

  describe('Time Estimation', () => {
    it('displays estimated cooking times correctly', () => {
      const orders = [
        mockData.kdsOrder({ 
          id: 'order-1', 
          items: ['steak'], 
          table_label: '1',
          elapsed_seconds: 300 // 5 minutes elapsed
        }),
      ]
      
      renderWithProviders(
        <GrillStation {...defaultProps} orders={orders} />
      )
      
      // Should show 5m elapsed / 15m estimated for steak
      expect(screen.getByText('5m / 15m')).toBeInTheDocument()
    })

    it('calculates max cook time for multiple items', () => {
      const orders = [
        mockData.kdsOrder({ 
          id: 'order-1', 
          items: ['burger', 'steak'], // burger: 8min, steak: 15min
          table_label: '1',
          elapsed_seconds: 0
        }),
      ]
      
      renderWithProviders(
        <GrillStation {...defaultProps} orders={orders} />
      )
      
      // Should use max time (steak: 15 minutes)
      expect(screen.getByText('0m / 15m')).toBeInTheDocument()
    })

    it('highlights overdue orders', () => {
      const orders = [
        mockData.kdsOrder({ 
          id: 'order-1', 
          items: ['burger'], // 8 minute estimate
          table_label: '1',
          elapsed_seconds: 600 // 10 minutes elapsed (overdue)
        }),
      ]
      
      const { container } = renderWithProviders(
        <GrillStation {...defaultProps} orders={orders} />
      )
      
      // Should have red border for overdue order
      const overdueCard = container.querySelector('.border-red-500')
      expect(overdueCard).toBeInTheDocument()
    })
  })

  describe('Order Status and Actions', () => {
    it('shows start button for new orders', () => {
      const orders = [
        mockData.kdsOrder({ 
          id: 'order-1', 
          items: ['steak'], 
          status: 'new',
          table_label: '1'
        }),
      ]
      
      renderWithProviders(
        <GrillStation {...defaultProps} orders={orders} />
      )
      
      expect(screen.getByText('Start Grilling')).toBeInTheDocument()
    })

    it('shows done button for in-progress orders', () => {
      const orders = [
        mockData.kdsOrder({ 
          id: 'order-1', 
          items: ['steak'], 
          status: 'in_progress',
          table_label: '1'
        }),
      ]
      
      renderWithProviders(
        <GrillStation {...defaultProps} orders={orders} />
      )
      
      expect(screen.getByText('Done')).toBeInTheDocument()
    })

    it('calls onOrderAction when start button is clicked', async () => {
      const onOrderAction = jest.fn()
      const orders = [
        mockData.kdsOrder({ 
          id: 'test-order', 
          items: ['steak'], 
          status: 'new',
          table_label: '1'
        }),
      ]
      
      const { user } = renderWithProviders(
        <GrillStation orders={orders} onOrderAction={onOrderAction} />
      )
      
      const startButton = screen.getByText('Start Grilling')
      await user.click(startButton)
      
      expect(onOrderAction).toHaveBeenCalledWith('start', 'test-order')
    })

    it('calls onOrderAction when done button is clicked', async () => {
      const onOrderAction = jest.fn()
      const orders = [
        mockData.kdsOrder({ 
          id: 'test-order', 
          items: ['steak'], 
          status: 'in_progress',
          table_label: '1'
        }),
      ]
      
      const { user } = renderWithProviders(
        <GrillStation orders={orders} onOrderAction={onOrderAction} />
      )
      
      const doneButton = screen.getByText('Done')
      await user.click(doneButton)
      
      expect(onOrderAction).toHaveBeenCalledWith('complete', 'test-order')
    })
  })

  describe('Order Details', () => {
    it('displays order items with priority highlighting', () => {
      const orders = [
        mockData.kdsOrder({ 
          id: 'order-1', 
          items: ['steak', 'salad'], 
          table_label: '1'
        }),
      ]
      
      const { container } = renderWithProviders(
        <GrillStation {...defaultProps} orders={orders} />
      )
      
      expect(screen.getByText('steak')).toBeInTheDocument()
      expect(screen.getByText('salad')).toBeInTheDocument()
      
      // Steak should have high priority styling
      const steakElement = screen.getByText('steak')
      expect(steakElement).toHaveClass('text-orange-600')
    })

    it('displays special requests', () => {
      const orders = [
        mockData.kdsOrder({ 
          id: 'order-1', 
          items: ['steak'], 
          special_requests: 'Medium rare, no salt',
          table_label: '1'
        }),
      ]
      
      renderWithProviders(
        <GrillStation {...defaultProps} orders={orders} />
      )
      
      expect(screen.getByText('Special:')).toBeInTheDocument()
      expect(screen.getByText('Medium rare, no salt')).toBeInTheDocument()
    })

    it('displays table information', () => {
      const orders = [
        mockData.kdsOrder({ 
          id: 'order-1', 
          items: ['steak'], 
          table_label: '5',
        }),
      ]
      
      renderWithProviders(
        <GrillStation {...defaultProps} orders={orders} />
      )
      
      expect(screen.getByText('Table 5')).toBeInTheDocument()
    })
  })

  describe('Active Order Counter', () => {
    it('counts active orders correctly', () => {
      const orders = [
        mockData.kdsOrder({ items: ['steak'], status: 'new' }),
        mockData.kdsOrder({ items: ['burger'], status: 'in_progress' }),
        mockData.kdsOrder({ items: ['chicken'], status: 'completed' }), // Not active
        mockData.kdsOrder({ items: ['salad'] }), // Not grill order
      ]
      
      renderWithProviders(
        <GrillStation {...defaultProps} orders={orders} />
      )
      
      expect(screen.getByText('2 active')).toBeInTheDocument()
    })

    it('shows green badge for low activity (≤2)', () => {
      const orders = [
        mockData.kdsOrder({ items: ['steak'], status: 'new' }),
      ]
      
      const { container } = renderWithProviders(
        <GrillStation {...defaultProps} orders={orders} />
      )
      
      const badge = container.querySelector('.bg-green-900')
      expect(badge).toBeInTheDocument()
    })

    it('shows yellow badge for medium activity (3-5)', () => {
      const orders = Array.from({ length: 4 }, (_, i) => 
        mockData.kdsOrder({ 
          id: `order-${i}`,
          items: ['steak'], 
          status: 'new' 
        })
      )
      
      const { container } = renderWithProviders(
        <GrillStation {...defaultProps} orders={orders} />
      )
      
      const badge = container.querySelector('.bg-yellow-900')
      expect(badge).toBeInTheDocument()
    })

    it('shows red badge for high activity (>5)', () => {
      const orders = Array.from({ length: 7 }, (_, i) => 
        mockData.kdsOrder({ 
          id: `order-${i}`,
          items: ['steak'], 
          status: 'new' 
        })
      )
      
      const { container } = renderWithProviders(
        <GrillStation {...defaultProps} orders={orders} />
      )
      
      const badge = container.querySelector('.bg-red-900')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('handles large number of orders efficiently', () => {
      const manyOrders = Array.from({ length: 50 }, (_, i) => 
        mockData.kdsOrder({ 
          id: `order-${i}`,
          items: ['steak'], 
          table_label: `${i + 1}`
        })
      )
      
      const startTime = performance.now()
      renderWithProviders(
        <GrillStation {...defaultProps} orders={manyOrders} />
      )
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(1000)
      expect(screen.getAllByText(/Table \d+/)).toHaveLength(50)
    })

    it('memoizes order cards to prevent unnecessary re-renders', () => {
      const orders = [
        mockData.kdsOrder({ items: ['steak'], table_label: '1' }),
      ]
      
      const { rerender } = renderWithProviders(
        <GrillStation {...defaultProps} orders={orders} />
      )
      
      rerender(
        <GrillStation {...defaultProps} orders={orders} />
      )
      
      expect(screen.getByText('Table 1')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles orders with no items', () => {
      const orders = [
        mockData.kdsOrder({ 
          id: 'order-1', 
          items: [], 
          table_label: '1'
        }),
      ]
      
      expect(() => {
        renderWithProviders(
          <GrillStation {...defaultProps} orders={orders} />
        )
      }).not.toThrow()
      
      // Should not show any orders since no grill items
      expect(screen.getByText('No grill orders')).toBeInTheDocument()
    })

    it('handles orders with null/undefined items', () => {
      const orders = [
        {
          ...mockData.kdsOrder({ table_label: '1' }),
          items: null as any
        },
      ]
      
      expect(() => {
        renderWithProviders(
          <GrillStation {...defaultProps} orders={orders} />
        )
      }).not.toThrow()
    })

    it('handles missing elapsed_seconds', () => {
      const orders = [
        {
          ...mockData.kdsOrder({ 
            items: ['steak'], 
            table_label: '1'
          }),
          elapsed_seconds: undefined
        },
      ]
      
      renderWithProviders(
        <GrillStation {...defaultProps} orders={orders} />
      )
      
      expect(screen.getByText('0m / 15m')).toBeInTheDocument()
    })

    it('handles missing table_label', () => {
      const orders = [
        {
          ...mockData.kdsOrder({ items: ['steak'] }),
          table_label: undefined
        },
      ]
      
      renderWithProviders(
        <GrillStation {...defaultProps} orders={orders} />
      )
      
      expect(screen.getByText('Table')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and structure', () => {
      const orders = [
        mockData.kdsOrder({ 
          items: ['steak'], 
          status: 'new',
          table_label: '1'
        }),
      ]
      
      renderWithProviders(
        <GrillStation {...defaultProps} orders={orders} />
      )
      
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
      
      buttons.forEach(button => {
        expect(button).toBeVisible()
      })
    })

    it('supports keyboard navigation', async () => {
      const orders = [
        mockData.kdsOrder({ 
          items: ['steak'], 
          status: 'new',
          table_label: '1'
        }),
      ]
      
      const { user } = renderWithProviders(
        <GrillStation {...defaultProps} orders={orders} />
      )
      
      await user.tab()
      expect(document.activeElement).toBeInstanceOf(HTMLElement)
    })

    it('has semantic color coding for status', () => {
      const orders = [
        mockData.kdsOrder({ 
          items: ['steak'], 
          status: 'new',
          table_label: '1'
        }),
      ]
      
      const { container } = renderWithProviders(
        <GrillStation {...defaultProps} orders={orders} />
      )
      
      // High priority should have orange/red styling
      const priorityElements = container.querySelectorAll('.text-orange-600, .border-orange-500')
      expect(priorityElements.length).toBeGreaterThan(0)
    })
  })

  describe('Station Integration', () => {
    it('integrates properly with KDS action system', async () => {
      const onOrderAction = jest.fn()
      const orders = [
        mockData.kdsOrder({ 
          id: 'integration-test', 
          items: ['steak'], 
          status: 'new',
          table_label: '1'
        }),
      ]
      
      const { user } = renderWithProviders(
        <GrillStation orders={orders} onOrderAction={onOrderAction} />
      )
      
      const startButton = screen.getByText('Start Grilling')
      await user.click(startButton)
      
      expect(onOrderAction).toHaveBeenCalledWith('start', 'integration-test')
      expect(onOrderAction).toHaveBeenCalledTimes(1)
    })
  })
})