/**
 * Global setup for Jest tests
 * This file runs after jest.setup.js and contains additional test utilities
 */

import { configure } from '@testing-library/react'
import { toHaveNoViolations } from 'jest-axe'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
  // Show helpful error messages
  getElementError: (message, container) => {
    const error = new Error(message)
    error.name = 'TestingLibraryElementError'
    error.stack = null
    return error
  },
})

// Global test utilities
global.testUtils = {
  // Generate consistent test data
  createMockOrder: (overrides = {}) => ({
    id: 'test-order-' + Math.random().toString(36).substr(2, 9),
    table_id: 'test-table-1',
    seat_id: 'test-seat-1',
    resident_id: 'test-resident-1',
    server_id: 'test-server-1',
    items: ['test-item-1', 'test-item-2'],
    transcript: 'test transcript',
    status: 'pending',
    type: 'food',
    priority: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  createMockTable: (overrides = {}) => ({
    id: 'test-table-' + Math.random().toString(36).substr(2, 9),
    table_id: 'T1',
    label: 'Table 1',
    type: 'round',
    status: 'available',
    x: 100,
    y: 100,
    width: 80,
    height: 80,
    created_at: new Date().toISOString(),
    ...overrides,
  }),

  createMockUser: (overrides = {}) => ({
    id: 'test-user-' + Math.random().toString(36).substr(2, 9),
    email: 'test@example.com',
    role: 'server',
    name: 'Test User',
    created_at: new Date().toISOString(),
    ...overrides,
  }),

  createMockKDSOrder: (overrides = {}) => ({
    id: 'test-kds-order-' + Math.random().toString(36).substr(2, 9),
    order: global.testUtils.createMockOrder(),
    station_id: 'kitchen',
    priority: 1,
    status: 'pending',
    routing_id: 'test-routing-' + Math.random().toString(36).substr(2, 9),
    estimated_completion: new Date(Date.now() + 900000).toISOString(), // 15 minutes
    started_at: null,
    completed_at: null,
    bumped_at: null,
    recalled_at: null,
    notes: '',
    created_at: new Date().toISOString(),
    ...overrides,
  }),

  // Async test helpers
  waitForElement: async (callback, timeout = 5000) => {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      try {
        const result = callback()
        if (result) return result
      } catch (error) {
        // Continue waiting
      }
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    throw new Error(`Element not found within ${timeout}ms`)
  },

  // Mock data generators
  generateMockOrders: (count = 5) => {
    return Array.from({ length: count }, (_, index) =>
      global.testUtils.createMockOrder({
        id: `test-order-${index + 1}`,
        table_id: `test-table-${Math.floor(index / 2) + 1}`,
        items: [`item-${index + 1}`, `item-${index + 2}`],
      })
    )
  },

  generateMockKDSOrders: (count = 5) => {
    return Array.from({ length: count }, (_, index) =>
      global.testUtils.createMockKDSOrder({
        id: `test-kds-order-${index + 1}`,
        routing_id: `test-routing-${index + 1}`,
        priority: (index % 3) + 1,
        status: index < 2 ? 'pending' : index < 4 ? 'preparing' : 'ready',
      })
    )
  },

  // Performance testing helpers
  measurePerformance: (fn, iterations = 100) => {
    const times = []
    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      fn()
      const end = performance.now()
      times.push(end - start)
    }
    
    const avg = times.reduce((sum, time) => sum + time, 0) / times.length
    const min = Math.min(...times)
    const max = Math.max(...times)
    
    return { avg, min, max, times }
  },

  // Memory usage helpers
  measureMemoryUsage: () => {
    if (typeof performance !== 'undefined' && performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
      }
    }
    return null
  },
}

// Global error handler for unhandled promise rejections in tests
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection in test:', error)
})

// Cleanup function to run after each test
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks()
  
  // Clean up any global state
  if (global.testCleanup) {
    global.testCleanup.forEach(cleanup => cleanup())
    global.testCleanup = []
  }
})

// Global test cleanup registry
global.testCleanup = []

// Helper to register cleanup functions
global.registerTestCleanup = (cleanupFn) => {
  global.testCleanup.push(cleanupFn)
}