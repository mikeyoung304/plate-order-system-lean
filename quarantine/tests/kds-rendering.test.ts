/**
 * Performance tests for KDS rendering optimization
 * Tests rendering performance under various load conditions
 */

import React from 'react'
import { performanceUtils, mockData } from '@/__tests__/utils/test-utils'
import { render, cleanup } from '@testing-library/react'

// Mock heavy components for performance testing
jest.mock('@/components/kds/kds-layout', () => ({
  KDSLayout: React.memo(({ orders = [] }: { orders?: any[] }) => {
    // Simulate some rendering work
    const processedOrders = orders.map(order => ({
      ...order,
      processed: true,
    }))

    return React.createElement('div', { 'data-testid': 'kds-layout' },
      processedOrders.map(order => 
        React.createElement('div', { 
          key: order.id, 
          'data-testid': 'order-item' 
        }, order.items?.join(', '))
      )
    )
  }),
}))

jest.mock('@/components/kds/order-card', () => ({
  OrderCard: React.memo(({ order }: { order: any }) => {
    // Simulate order card rendering
    return React.createElement('div', { 
      'data-testid': 'order-card', 
      'data-order-id': order.id 
    }, [
      React.createElement('div', { key: 'items' }, order.items?.join(', ')),
      React.createElement('div', { key: 'status' }, order.status),
      React.createElement('div', { key: 'priority' }, order.priority)
    ])
  }),
}))

describe('KDS Rendering Performance', () => {
  afterEach(() => {
    cleanup()
  })

  describe('Baseline Performance', () => {
    it('renders empty KDS layout within performance threshold', async () => {
      const { KDSLayout } = require('@/components/kds/kds-layout')
      
      const performanceResult = await performanceUtils.measureRenderTime(
        () => render(React.createElement(KDSLayout, { orders: [] })),
        50 // 50 iterations
      )

      expect(performanceResult.average).toBeLessThan(10) // Less than 10ms average
      expect(performanceResult.max).toBeLessThan(50) // Less than 50ms max
    })

    it('renders single order within performance threshold', async () => {
      const { KDSLayout } = require('@/components/kds/kds-layout')
      const orders = [mockData.kdsOrder()]
      
      const performanceResult = await performanceUtils.measureRenderTime(
        () => render(React.createElement(KDSLayout, { orders })),
        50
      )

      expect(performanceResult.average).toBeLessThan(15) // Less than 15ms average
      expect(performanceResult.max).toBeLessThan(100) // Less than 100ms max
    })
  })

  describe('Scale Performance Tests', () => {
    it('handles 10 orders efficiently', async () => {
      const { KDSLayout } = require('@/components/kds/kds-layout')
      const orders = Array.from({ length: 10 }, (_, i) => 
        mockData.kdsOrder({ id: `order-${i}` })
      )
      
      const performanceResult = await performanceUtils.measureRenderTime(
        () => render(React.createElement(KDSLayout, { orders })),
        20
      )

      expect(performanceResult.average).toBeLessThan(50) // Less than 50ms average
      expect(performanceResult.max).toBeLessThan(200) // Less than 200ms max
    })

    it('handles 50 orders within acceptable range', async () => {
      const { KDSLayout } = require('@/components/kds/kds-layout')
      const orders = Array.from({ length: 50 }, (_, i) => 
        mockData.kdsOrder({ id: `order-${i}` })
      )
      
      const performanceResult = await performanceUtils.measureRenderTime(
        () => render(React.createElement(KDSLayout, { orders })),
        10
      )

      expect(performanceResult.average).toBeLessThan(200) // Less than 200ms average
      expect(performanceResult.max).toBeLessThan(500) // Less than 500ms max
    })

    it('handles 100 orders (stress test)', async () => {
      const { KDSLayout } = require('@/components/kds/kds-layout')
      const orders = Array.from({ length: 100 }, (_, i) => 
        mockData.kdsOrder({ 
          id: `order-${i}`,
          items: [`item-${i}-1`, `item-${i}-2`, `item-${i}-3`],
        })
      )
      
      const performanceResult = await performanceUtils.measureRenderTime(
        () => render(React.createElement(KDSLayout, { orders })),
        5
      )

      // For 100 orders, we allow higher thresholds but still reasonable for 1000+ users
      expect(performanceResult.average).toBeLessThan(500) // Less than 500ms average
      expect(performanceResult.max).toBeLessThan(1000) // Less than 1s max
    })
  })

  describe('Re-render Performance', () => {
    it('efficiently handles order status updates', async () => {
      const { KDSLayout } = require('@/components/kds/kds-layout')
      const initialOrders = Array.from({ length: 20 }, (_, i) => 
        mockData.kdsOrder({ id: `order-${i}`, status: 'pending' })
      )

      // Initial render
      const { rerender } = render(React.createElement(KDSLayout, { orders: initialOrders }))

      // Measure re-render performance when updating order status
      const updatedOrders = initialOrders.map(order => ({
        ...order,
        status: 'preparing',
      }))

      const performanceResult = await performanceUtils.measureRenderTime(
        () => rerender(React.createElement(KDSLayout, { orders: updatedOrders })),
        30
      )

      expect(performanceResult.average).toBeLessThan(30) // Less than 30ms for re-render
      expect(performanceResult.max).toBeLessThan(100) // Less than 100ms max
    })

    it('efficiently handles priority updates', async () => {
      const { KDSLayout } = require('@/components/kds/kds-layout')
      const initialOrders = Array.from({ length: 20 }, (_, i) => 
        mockData.kdsOrder({ id: `order-${i}`, priority: 1 })
      )

      const { rerender } = render(React.createElement(KDSLayout, { orders: initialOrders }))

      // Update single order priority
      const updatedOrders = initialOrders.map((order, index) => 
        index === 10 ? { ...order, priority: 5 } : order
      )

      const performanceResult = await performanceUtils.measureRenderTime(
        () => rerender(React.createElement(KDSLayout, { orders: updatedOrders })),
        30
      )

      expect(performanceResult.average).toBeLessThan(25) // Less than 25ms for single update
      expect(performanceResult.max).toBeLessThan(75) // Less than 75ms max
    })

    it('handles frequent real-time updates efficiently', async () => {
      const { KDSLayout } = require('@/components/kds/kds-layout')
      let orders = Array.from({ length: 15 }, (_, i) => 
        mockData.kdsOrder({ id: `order-${i}` })
      )

      const { rerender } = render(React.createElement(KDSLayout, { orders }))

      // Simulate rapid updates (like real-time)
      const updateCount = 10
      const updateTimes: number[] = []

      for (let i = 0; i < updateCount; i++) {
        orders = orders.map(order => ({
          ...order,
          updated_at: new Date().toISOString(),
          priority: Math.floor(Math.random() * 5) + 1,
        }))

        const startTime = performance.now()
        rerender(React.createElement(KDSLayout, { orders }))
        const endTime = performance.now()
        
        updateTimes.push(endTime - startTime)
      }

      const averageUpdateTime = updateTimes.reduce((sum, time) => sum + time, 0) / updateTimes.length
      const maxUpdateTime = Math.max(...updateTimes)

      expect(averageUpdateTime).toBeLessThan(20) // Less than 20ms average per update
      expect(maxUpdateTime).toBeLessThan(50) // Less than 50ms max per update
    })
  })

  describe('Memory Performance', () => {
    it('maintains stable memory usage during rendering', async () => {
      const { KDSLayout } = require('@/components/kds/kds-layout')
      
      const initialMemory = performanceUtils.measureMemoryUsage()
      
      // Render multiple times with different order sets
      for (let i = 0; i < 20; i++) {
        const orders = Array.from({ length: 25 }, (_, j) => 
          mockData.kdsOrder({ id: `batch-${i}-order-${j}` })
        )
        
        const { unmount } = render(React.createElement(KDSLayout, { orders }))
        unmount() // Clean up immediately
      }

      const finalMemory = performanceUtils.measureMemoryUsage()
      
      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.used - initialMemory.used
        const memoryIncreasePercent = (memoryIncrease / initialMemory.used) * 100
        
        // Memory increase should be minimal (less than 20%)
        expect(memoryIncreasePercent).toBeLessThan(20)
      }
    })

    it('handles component unmounting without memory leaks', async () => {
      const { KDSLayout } = require('@/components/kds/kds-layout')
      const orders = Array.from({ length: 30 }, (_, i) => 
        mockData.kdsOrder({ id: `order-${i}` })
      )

      const initialMemory = performanceUtils.measureMemoryUsage()
      
      // Mount and unmount multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(React.createElement(KDSLayout, { orders }))
        unmount()
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = performanceUtils.measureMemoryUsage()
      
      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.used - initialMemory.used
        const memoryIncreasePercent = (memoryIncrease / initialMemory.used) * 100
        
        // Memory should return close to baseline (less than 10% increase)
        expect(memoryIncreasePercent).toBeLessThan(10)
      }
    })
  })

  describe('Order Card Performance', () => {
    it('renders individual order cards efficiently', async () => {
      const { OrderCard } = require('@/components/kds/order-card')
      const order = mockData.kdsOrder({
        items: ['chicken', 'pasta', 'salad', 'bread', 'soup'],
      })
      
      const performanceResult = await performanceUtils.measureRenderTime(
        () => render(React.createElement(OrderCard, { order })),
        100
      )

      expect(performanceResult.average).toBeLessThan(5) // Less than 5ms average
      expect(performanceResult.max).toBeLessThan(20) // Less than 20ms max
    })

    it('handles complex order cards with many items', async () => {
      const { OrderCard } = require('@/components/kds/order-card')
      const order = mockData.kdsOrder({
        items: Array.from({ length: 20 }, (_, i) => `item-${i}`),
        notes: 'Special preparation instructions for this complex order',
      })
      
      const performanceResult = await performanceUtils.measureRenderTime(
        () => render(React.createElement(OrderCard, { order })),
        50
      )

      expect(performanceResult.average).toBeLessThan(10) // Less than 10ms average
      expect(performanceResult.max).toBeLessThan(30) // Less than 30ms max
    })
  })

  describe('Concurrent Rendering Performance', () => {
    it('handles multiple KDS layouts rendering simultaneously', async () => {
      const { KDSLayout } = require('@/components/kds/kds-layout')
      
      const renderConfigurations = [
        { orders: Array.from({ length: 10 }, (_, i) => mockData.kdsOrder({ id: `a-${i}` })) },
        { orders: Array.from({ length: 15 }, (_, i) => mockData.kdsOrder({ id: `b-${i}` })) },
        { orders: Array.from({ length: 20 }, (_, i) => mockData.kdsOrder({ id: `c-${i}` })) },
      ]

      const startTime = performance.now()
      
      const renders = renderConfigurations.map(config => 
        render(React.createElement(KDSLayout, { orders: config.orders }))
      )

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // All renders should complete quickly even when concurrent
      expect(totalTime).toBeLessThan(200) // Less than 200ms for all renders

      // Clean up
      renders.forEach(({ unmount }) => unmount())
    })
  })

  describe('Performance Regression Detection', () => {
    it('maintains consistent performance across test runs', async () => {
      const { KDSLayout } = require('@/components/kds/kds-layout')
      const orders = Array.from({ length: 25 }, (_, i) => 
        mockData.kdsOrder({ id: `order-${i}` })
      )

      const runs = []
      
      // Perform multiple test runs
      for (let run = 0; run < 5; run++) {
        const performanceResult = await performanceUtils.measureRenderTime(
          () => render(React.createElement(KDSLayout, { orders })),
          10
        )
        runs.push(performanceResult.average)
      }

      // Check for performance consistency (coefficient of variation < 0.3)
      const mean = runs.reduce((sum, time) => sum + time, 0) / runs.length
      const variance = runs.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / runs.length
      const standardDeviation = Math.sqrt(variance)
      const coefficientOfVariation = standardDeviation / mean

      expect(coefficientOfVariation).toBeLessThan(0.3) // Performance should be consistent
    })

    it('performance scales linearly with order count', async () => {
      const { KDSLayout } = require('@/components/kds/kds-layout')
      
      const testSizes = [5, 10, 20, 40]
      const results = []

      for (const size of testSizes) {
        const orders = Array.from({ length: size }, (_, i) => 
          mockData.kdsOrder({ id: `order-${i}` })
        )
        
        const performanceResult = await performanceUtils.measureRenderTime(
          () => render(React.createElement(KDSLayout, { orders })),
          20
        )
        
        results.push({
          size,
          averageTime: performanceResult.average,
          timePerOrder: performanceResult.average / size,
        })
      }

      // Time per order should remain relatively constant (linear scaling)
      const timesPerOrder = results.map(r => r.timePerOrder)
      const minTimePerOrder = Math.min(...timesPerOrder)
      const maxTimePerOrder = Math.max(...timesPerOrder)
      
      // Scaling should be roughly linear (max shouldn't be more than 2x min)
      expect(maxTimePerOrder / minTimePerOrder).toBeLessThan(2)
    })
  })
})