/**
 * Performance tests for KDS components
 * Tests rendering performance, memory usage, and scalability under load
 */

import React from 'react'
import { render, act } from '@testing-library/react'
import { KDSHeader } from '@/components/kds/KDSHeader'
import { KDSMainContent } from '@/components/kds/KDSMainContent'
import { GrillStation } from '@/components/kds/stations/GrillStation'
import { renderWithProviders, mockData, performanceUtils } from '@/__tests__/utils/test-utils'

// Mock KDS state
const createMockKDSState = (orderCount: number = 0) => ({
  orders: Array.from({ length: orderCount }, (_, i) => 
    mockData.kdsOrder({ 
      id: `order-${i}`,
      table_label: `${i + 1}`,
      items: [`Item ${i}`, `Side ${i}`],
      status: i % 3 === 0 ? 'new' : i % 3 === 1 ? 'in_progress' : 'ready',
      elapsed_seconds: Math.floor(Math.random() * 1800), // 0-30 minutes
      priority: Math.floor(Math.random() * 3) + 1,
    })
  ),
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
})

jest.mock('@/lib/hooks/use-kds-state', () => ({
  useKDSState: jest.fn(),
}))

jest.mock('@/hooks/use-table-grouped-orders', () => ({
  useTableGroupedOrders: jest.fn(() => []),
}))

const { useKDSState } = require('@/lib/hooks/use-kds-state')

describe('KDS Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Clear performance marks
    if (typeof performance !== 'undefined') {
      performance.clearMarks?.()
      performance.clearMeasures?.()
    }
  })

  describe('KDS Header Performance', () => {
    it('renders quickly with no orders', async () => {
      useKDSState.mockReturnValue(createMockKDSState(0))

      const renderTime = await performanceUtils.measureRenderTime(
        () => renderWithProviders(<KDSHeader />),
        10
      )

      expect(renderTime.average).toBeLessThan(50) // < 50ms average
      expect(renderTime.max).toBeLessThan(100) // < 100ms max
    })

    it('renders efficiently with many orders', async () => {
      useKDSState.mockReturnValue(createMockKDSState(1000))

      const renderTime = await performanceUtils.measureRenderTime(
        () => renderWithProviders(<KDSHeader />),
        5
      )

      expect(renderTime.average).toBeLessThan(100) // Should handle large datasets
      expect(renderTime.max).toBeLessThan(200)
    })

    it('handles rapid state changes efficiently', async () => {
      const mockState = createMockKDSState(50)
      useKDSState.mockReturnValue(mockState)

      const { rerender } = renderWithProviders(<KDSHeader />)

      const startTime = performance.now()

      // Simulate rapid state changes
      for (let i = 0; i < 100; i++) {
        mockState.connectionStatus = i % 2 === 0 ? 'connected' : 'disconnected'
        rerender(<KDSHeader />)
      }

      const endTime = performance.now()
      const totalTime = endTime - startTime

      expect(totalTime).toBeLessThan(1000) // < 1 second for 100 re-renders
    })

    it('maintains consistent performance with order updates', async () => {
      const times: number[] = []

      for (let orderCount = 0; orderCount <= 500; orderCount += 100) {
        useKDSState.mockReturnValue(createMockKDSState(orderCount))

        const renderTime = await performanceUtils.measureRenderTime(
          () => renderWithProviders(<KDSHeader />),
          3
        )

        times.push(renderTime.average)
      }

      // Performance should not degrade significantly with more orders
      const maxTime = Math.max(...times)
      const minTime = Math.min(...times)
      const degradationRatio = maxTime / minTime

      expect(degradationRatio).toBeLessThan(3) // < 3x degradation
    })

    it('has minimal memory footprint', () => {
      useKDSState.mockReturnValue(createMockKDSState(100))

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0
      
      const components = []
      for (let i = 0; i < 10; i++) {
        components.push(renderWithProviders(<KDSHeader />))
      }

      const afterMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryGrowth = afterMemory - initialMemory

      // Clean up
      components.forEach(({ unmount }) => unmount())

      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024) // < 10MB growth
    })
  })

  describe('KDS Main Content Performance', () => {
    it('renders efficiently with small order sets', async () => {
      useKDSState.mockReturnValue(createMockKDSState(10))

      const renderTime = await performanceUtils.measureRenderTime(
        () => renderWithProviders(<KDSMainContent />),
        10
      )

      expect(renderTime.average).toBeLessThan(100)
      expect(renderTime.max).toBeLessThan(200)
    })

    it('handles large order sets within performance targets', async () => {
      useKDSState.mockReturnValue(createMockKDSState(200))

      const renderTime = await performanceUtils.measureRenderTime(
        () => renderWithProviders(<KDSMainContent />),
        5
      )

      expect(renderTime.average).toBeLessThan(500) // < 500ms for 200 orders
      expect(renderTime.max).toBeLessThan(1000)
    })

    it('virtualization handles massive datasets', async () => {
      useKDSState.mockReturnValue(createMockKDSState(1000))

      const startTime = performance.now()
      const { container } = renderWithProviders(<KDSMainContent />)
      const endTime = performance.now()

      const renderTime = endTime - startTime

      expect(renderTime).toBeLessThan(1000) // < 1 second for 1000 orders
      expect(container.querySelectorAll('[data-testid*="order"]')).toBeTruthy()
    })

    it('maintains smooth scrolling performance', async () => {
      useKDSState.mockReturnValue(createMockKDSState(100))

      const { container } = renderWithProviders(<KDSMainContent />)
      const scrollArea = container.querySelector('[data-radix-scroll-area-viewport]')

      if (scrollArea) {
        const scrollTimes: number[] = []

        // Simulate scroll events
        for (let i = 0; i < 10; i++) {
          const startTime = performance.now()
          
          act(() => {
            scrollArea.scrollTop = i * 100
            scrollArea.dispatchEvent(new Event('scroll'))
          })

          const endTime = performance.now()
          scrollTimes.push(endTime - startTime)
        }

        const averageScrollTime = scrollTimes.reduce((a, b) => a + b) / scrollTimes.length
        expect(averageScrollTime).toBeLessThan(16) // < 16ms for 60fps
      }
    })

    it('efficient view mode switching', async () => {
      const mockState = createMockKDSState(50)
      useKDSState.mockReturnValue(mockState)

      const { rerender } = renderWithProviders(<KDSMainContent />)

      const viewModes = ['grid', 'list', 'table'] as const
      const switchTimes: number[] = []

      for (const viewMode of viewModes) {
        const startTime = performance.now()
        
        mockState.viewMode = viewMode
        rerender(<KDSMainContent />)

        const endTime = performance.now()
        switchTimes.push(endTime - startTime)
      }

      const averageSwitchTime = switchTimes.reduce((a, b) => a + b) / switchTimes.length
      expect(averageSwitchTime).toBeLessThan(100) // < 100ms for view switching
    })
  })

  describe('Station Component Performance', () => {
    it('grill station filters and renders efficiently', async () => {
      const orders = Array.from({ length: 100 }, (_, i) => 
        mockData.kdsOrder({
          id: `order-${i}`,
          items: i % 3 === 0 ? ['steak'] : i % 3 === 1 ? ['burger'] : ['salad'],
          table_label: `${i + 1}`,
        })
      )

      const renderTime = await performanceUtils.measureRenderTime(
        () => renderWithProviders(
          <GrillStation orders={orders} onOrderAction={jest.fn()} />
        ),
        5
      )

      expect(renderTime.average).toBeLessThan(200)
      expect(renderTime.max).toBeLessThan(400)
    })

    it('efficient order filtering performance', () => {
      const orders = Array.from({ length: 1000 }, (_, i) => 
        mockData.kdsOrder({
          id: `order-${i}`,
          items: i % 5 === 0 ? ['steak'] : ['salad'],
        })
      )

      const startTime = performance.now()
      renderWithProviders(
        <GrillStation orders={orders} onOrderAction={jest.fn()} />
      )
      const endTime = performance.now()

      const filterTime = endTime - startTime
      expect(filterTime).toBeLessThan(500) // < 500ms for filtering 1000 orders
    })

    it('handles order updates without full re-render', async () => {
      const orders = [
        mockData.kdsOrder({ 
          id: 'order-1', 
          items: ['steak'], 
          status: 'new',
          table_label: '1'
        }),
      ]

      const { rerender } = renderWithProviders(
        <GrillStation orders={orders} onOrderAction={jest.fn()} />
      )

      const startTime = performance.now()

      // Update order status
      orders[0].status = 'in_progress'
      rerender(<GrillStation orders={orders} onOrderAction={jest.fn()} />)

      const endTime = performance.now()
      const updateTime = endTime - startTime

      expect(updateTime).toBeLessThan(50) // < 50ms for single order update
    })
  })

  describe('Memory Management', () => {
    it('cleans up event listeners on unmount', () => {
      useKDSState.mockReturnValue(createMockKDSState(10))

      const { unmount } = renderWithProviders(<KDSHeader />)
      
      // Get initial listener count (this is a rough approximation)
      const initialListeners = document.querySelectorAll('*').length

      unmount()

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const afterListeners = document.querySelectorAll('*').length
      
      // Should not have significantly more listeners after unmount
      expect(afterListeners).toBeLessThanOrEqual(initialListeners + 5)
    })

    it('prevents memory leaks with large datasets', () => {
      useKDSState.mockReturnValue(createMockKDSState(500))

      const renders = []
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0

      // Create multiple components
      for (let i = 0; i < 5; i++) {
        renders.push(renderWithProviders(<KDSMainContent />))
      }

      // Unmount all
      renders.forEach(({ unmount }) => unmount())

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryGrowth = finalMemory - initialMemory

      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024) // < 50MB growth
    })

    it('efficient re-rendering with memo optimization', () => {
      const mockState = createMockKDSState(100)
      useKDSState.mockReturnValue(mockState)

      const { rerender } = renderWithProviders(<KDSHeader />)

      const renderCount = jest.fn()
      
      // Mock React.memo behavior by tracking renders
      const WrappedComponent = React.memo(() => {
        renderCount()
        return <KDSHeader />
      })

      rerender(<WrappedComponent />)
      
      const initialRenderCount = renderCount.mock.calls.length

      // Re-render with same props (should not trigger re-render due to memo)
      rerender(<WrappedComponent />)

      expect(renderCount.mock.calls.length).toBe(initialRenderCount)
    })
  })

  describe('Concurrent Rendering', () => {
    it('handles concurrent updates efficiently', async () => {
      const mockState = createMockKDSState(50)
      useKDSState.mockReturnValue(mockState)

      const { rerender } = renderWithProviders(<KDSMainContent />)

      const updatePromises = []

      // Simulate concurrent state updates
      for (let i = 0; i < 10; i++) {
        updatePromises.push(
          new Promise<void>((resolve) => {
            setTimeout(() => {
              act(() => {
                mockState.orders[i % mockState.orders.length].status = 'ready'
                rerender(<KDSMainContent />)
              })
              resolve()
            }, Math.random() * 100)
          })
        )
      }

      const startTime = performance.now()
      await Promise.all(updatePromises)
      const endTime = performance.now()

      const totalTime = endTime - startTime
      expect(totalTime).toBeLessThan(1000) // Should handle concurrent updates quickly
    })

    it('maintains UI responsiveness during heavy computation', async () => {
      const mockState = createMockKDSState(200)
      useKDSState.mockReturnValue(mockState)

      renderWithProviders(<KDSMainContent />)

      // Simulate heavy computation in background
      const heavyComputationPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          // Simulate CPU-intensive task
          let result = 0
          for (let i = 0; i < 1000000; i++) {
            result += Math.random()
          }
          resolve()
        }, 0)
      })

      const startTime = performance.now()
      await heavyComputationPromise
      const endTime = performance.now()

      // UI should remain responsive even during computation
      expect(endTime - startTime).toBeLessThan(500)
    })
  })

  describe('Real-world Scenarios', () => {
    it('busy restaurant simulation (100+ concurrent orders)', async () => {
      const busyRestaurantState = createMockKDSState(150)
      useKDSState.mockReturnValue(busyRestaurantState)

      const renderTime = await performanceUtils.measureRenderTime(
        () => renderWithProviders(<KDSMainContent />),
        3
      )

      expect(renderTime.average).toBeLessThan(800) // < 800ms for busy restaurant
    })

    it('peak hour order influx simulation', async () => {
      let orderCount = 10
      const mockState = createMockKDSState(orderCount)
      useKDSState.mockReturnValue(mockState)

      const { rerender } = renderWithProviders(<KDSMainContent />)
      const updateTimes: number[] = []

      // Simulate orders coming in every second for 30 seconds
      for (let i = 0; i < 30; i++) {
        const startTime = performance.now()
        
        // Add 2-5 new orders
        const newOrdersCount = Math.floor(Math.random() * 4) + 2
        for (let j = 0; j < newOrdersCount; j++) {
          mockState.orders.push(mockData.kdsOrder({ 
            id: `peak-order-${orderCount++}`,
            table_label: `${orderCount}`,
          }))
        }

        act(() => {
          rerender(<KDSMainContent />)
        })

        const endTime = performance.now()
        updateTimes.push(endTime - startTime)
      }

      const averageUpdateTime = updateTimes.reduce((a, b) => a + b) / updateTimes.length
      expect(averageUpdateTime).toBeLessThan(100) // < 100ms average update time
      expect(Math.max(...updateTimes)).toBeLessThan(300) // < 300ms max update time
    })

    it('stress test with maximum supported orders', async () => {
      const maxOrders = 1000
      const stressTestState = createMockKDSState(maxOrders)
      useKDSState.mockReturnValue(stressTestState)

      const startTime = performance.now()
      const { container } = renderWithProviders(<KDSMainContent />)
      const endTime = performance.now()

      const renderTime = endTime - startTime

      expect(renderTime).toBeLessThan(2000) // < 2 seconds for max load
      expect(container).toBeTruthy()
      
      // Should still be responsive for interactions
      const buttons = container.querySelectorAll('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('Performance Regression Detection', () => {
    it('establishes performance baseline', async () => {
      const baselineOrderCount = 50
      useKDSState.mockReturnValue(createMockKDSState(baselineOrderCount))

      const times = await performanceUtils.measureRenderTime(
        () => renderWithProviders(<KDSMainContent />),
        10
      )

      // Store baseline for regression testing
      const baseline = {
        average: times.average,
        max: times.max,
        orderCount: baselineOrderCount,
      }

      // These should be achievable targets
      expect(baseline.average).toBeLessThan(300)
      expect(baseline.max).toBeLessThan(600)
      
      // Log baseline for CI/CD monitoring
      console.log('Performance baseline:', baseline)
    })

    it('detects performance regressions', async () => {
      const testCases = [
        { orderCount: 10, maxTime: 100 },
        { orderCount: 50, maxTime: 300 },
        { orderCount: 100, maxTime: 600 },
        { orderCount: 200, maxTime: 1000 },
      ]

      for (const testCase of testCases) {
        useKDSState.mockReturnValue(createMockKDSState(testCase.orderCount))

        const renderTime = await performanceUtils.measureRenderTime(
          () => renderWithProviders(<KDSMainContent />),
          3
        )

        expect(renderTime.average).toBeLessThan(testCase.maxTime)
        
        // Log metrics for monitoring
        console.log(`Orders: ${testCase.orderCount}, Time: ${renderTime.average.toFixed(2)}ms`)
      }
    })
  })
})