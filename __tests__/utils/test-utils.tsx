/**
 * Enhanced testing utilities for the Plate Restaurant System
 * Provides reusable components, mocks, and helpers for testing
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions, RenderResult } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
// Note: AuthProvider no longer exists - using server-first auth pattern

// Types
export interface TestRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: any
  initialTheme?: 'light' | 'dark' | 'system'
  skipAuthProvider?: boolean
  skipThemeProvider?: boolean
}

export interface TestRenderResult extends RenderResult {
  user: ReturnType<typeof userEvent.setup>
}

// Mock providers for testing
const MockAuthProvider: React.FC<{ children: React.ReactNode; user?: any }> = ({ 
  children, 
  user = null 
}) => {
  // No longer using AuthProvider - server-first auth pattern
  // Just pass through children for testing
  return <>{children}</>
}

// Test wrapper component
const AllTheProviders: React.FC<{
  children: React.ReactNode
  user?: any
  initialTheme?: 'light' | 'dark' | 'system'
  skipAuthProvider?: boolean
  skipThemeProvider?: boolean
}> = ({ 
  children, 
  user, 
  initialTheme = 'light',
  skipAuthProvider = false,
  skipThemeProvider = false
}) => {
  let wrappedChildren = children

  // Wrap with auth provider if not skipped
  if (!skipAuthProvider) {
    wrappedChildren = (
      <MockAuthProvider user={user}>
        {wrappedChildren}
      </MockAuthProvider>
    )
  }

  // Wrap with theme provider if not skipped
  if (!skipThemeProvider) {
    wrappedChildren = (
      <ThemeProvider defaultTheme={initialTheme} storageKey="test-theme">
        {wrappedChildren}
      </ThemeProvider>
    )
  }

  // Always include toaster for UI feedback
  return (
    <div>
      {wrappedChildren}
      <Toaster />
    </div>
  )
}

/**
 * Enhanced render function with providers and user event setup
 */
export function renderWithProviders(
  ui: ReactElement,
  options: TestRenderOptions = {}
): TestRenderResult {
  const {
    user,
    initialTheme,
    skipAuthProvider,
    skipThemeProvider,
    ...renderOptions
  } = options

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AllTheProviders
      user={user}
      initialTheme={initialTheme}
      skipAuthProvider={skipAuthProvider}
      skipThemeProvider={skipThemeProvider}
    >
      {children}
    </AllTheProviders>
  )

  const userEventInstance = userEvent.setup()

  return {
    user: userEventInstance,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}

/**
 * Simplified render for components that don't need providers
 */
export function renderComponent(ui: ReactElement, options?: RenderOptions): TestRenderResult {
  return {
    user: userEvent.setup(),
    ...render(ui, options),
  }
}

// Supabase mocks
export const createMockSupabaseClient = () => ({
  auth: {
    getSession: jest.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    }),
    getUser: jest.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    }),
    signInWithPassword: jest.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    }),
    signOut: jest.fn().mockResolvedValue({
      error: null,
    }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    }),
  },
  from: jest.fn(() => {
    const createQueryBuilder = () => {
      const queryBuilder = {
        select: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        eq: jest.fn(),
        gte: jest.fn(),
        lte: jest.fn(),
        order: jest.fn(),
        limit: jest.fn(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      
      // Make each chainable method return the same query builder
      queryBuilder.select.mockReturnValue(queryBuilder);
      queryBuilder.insert.mockReturnValue(queryBuilder);
      queryBuilder.update.mockReturnValue(queryBuilder);
      queryBuilder.delete.mockReturnValue(queryBuilder);
      queryBuilder.eq.mockReturnValue(queryBuilder);
      queryBuilder.gte.mockReturnValue(queryBuilder);
      queryBuilder.lte.mockReturnValue(queryBuilder);
      queryBuilder.order.mockReturnValue(queryBuilder);
      queryBuilder.limit.mockReturnValue(queryBuilder);
      
      // Add mockResolvedValue to chainable methods
      queryBuilder.select.mockResolvedValue = jest.fn().mockResolvedValue({ data: [], error: null });
      queryBuilder.insert.mockResolvedValue = jest.fn().mockResolvedValue({ data: [], error: null });
      queryBuilder.update.mockResolvedValue = jest.fn().mockResolvedValue({ data: [], error: null });
      queryBuilder.delete.mockResolvedValue = jest.fn().mockResolvedValue({ data: [], error: null });
      queryBuilder.eq.mockResolvedValue = jest.fn().mockResolvedValue({ data: [], error: null });
      queryBuilder.gte.mockResolvedValue = jest.fn().mockResolvedValue({ data: [], error: null });
      queryBuilder.lte.mockResolvedValue = jest.fn().mockResolvedValue({ data: [], error: null });
      queryBuilder.order.mockResolvedValue = jest.fn().mockResolvedValue({ data: [], error: null });
      queryBuilder.limit.mockResolvedValue = jest.fn().mockResolvedValue({ data: [], error: null });
      
      return queryBuilder;
    };
    
    return createQueryBuilder();
  }),
  rpc: jest.fn().mockResolvedValue({
    data: null,
    error: null,
  }),
  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockResolvedValue('ok'),
    unsubscribe: jest.fn().mockResolvedValue('ok'),
  })),
  removeChannel: jest.fn(),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn().mockResolvedValue({
        data: { path: 'test-path' },
        error: null,
      }),
      download: jest.fn().mockResolvedValue({
        data: new Blob(),
        error: null,
      }),
      remove: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    })),
  },
})

// Mock data generators
export const mockData = {
  user: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: { name: 'Test User' },
    created_at: new Date().toISOString(),
    ...overrides,
  }),

  profile: (overrides = {}) => ({
    id: 'test-profile-id',
    role: 'server',
    name: 'Test User',
    created_at: new Date().toISOString(),
    ...overrides,
  }),

  order: (overrides = {}) => ({
    id: 'test-order-id',
    table_id: 'test-table-id',
    seat_id: 'test-seat-id',
    resident_id: 'test-resident-id',
    server_id: 'test-server-id',
    items: ['Test Item 1', 'Test Item 2'],
    transcript: 'Test order transcript',
    status: 'new',
    type: 'food',
    priority: 1,
    actual_time: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  kdsOrder: (overrides = {}) => ({
    id: 'test-kds-order-id',
    routing_id: 'test-routing-id',
    order: mockData.order(),
    station_id: 'kitchen',
    priority: 1,
    status: 'pending',
    estimated_completion: new Date(Date.now() + 900000).toISOString(),
    started_at: null,
    completed_at: null,
    bumped_at: null,
    recalled_at: null,
    notes: '',
    created_at: new Date().toISOString(),
    ...overrides,
  }),

  table: (overrides = {}) => ({
    id: 'test-table-id',
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

  seat: (overrides = {}) => ({
    id: 'test-seat-id',
    seat_id: 'S1',
    table_id: 'test-table-id',
    resident_id: null,
    x: 0,
    y: 0,
    created_at: new Date().toISOString(),
    ...overrides,
  }),
}

// Mock API responses
export const mockApiResponses = {
  success: (data = null) => ({
    data,
    error: null,
  }),

  error: (message = 'Test error', code = 'TEST_ERROR') => ({
    data: null,
    error: {
      message,
      code,
      details: 'Test error details',
    },
  }),

  pagination: (data = [], count = null) => ({
    data,
    error: null,
    count: count ?? data.length,
  }),
}

// Voice API mocks
export const mockVoiceAPI = {
  transcribeAudio: jest.fn().mockResolvedValue({
    transcript: 'chicken, pasta, salad',
    confidence: 0.95,
  }),

  recordAudio: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn().mockResolvedValue(new Blob()),
    cancel: jest.fn(),
  })),
}

// Performance testing utilities
export const performanceUtils = {
  measureRenderTime: async (renderFn: () => void, iterations = 10) => {
    const times: number[] = []
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      renderFn()
      const end = performance.now()
      times.push(end - start)
    }

    return {
      average: times.reduce((sum, time) => sum + time, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      times,
    }
  },

  measureAsyncOperation: async (asyncFn: () => Promise<void>, iterations = 10) => {
    const times: number[] = []
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      await asyncFn()
      const end = performance.now()
      times.push(end - start)
    }

    return {
      average: times.reduce((sum, time) => sum + time, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      times,
    }
  },
}

// Accessibility testing utilities
export const a11yUtils = {
  checkKeyboardNavigation: async (user: ReturnType<typeof userEvent.setup>, container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const results = []
    for (let i = 0; i < focusableElements.length; i++) {
      await user.tab()
      const focused = document.activeElement
      results.push({
        expected: focusableElements[i],
        actual: focused,
        matches: focusableElements[i] === focused,
      })
    }

    return results
  },

  checkAriaLabels: (container: HTMLElement) => {
    const interactive = container.querySelectorAll('button, input, select, textarea, [role="button"]')
    const missing = []

    interactive.forEach(element => {
      const hasLabel = 
        element.getAttribute('aria-label') ||
        element.getAttribute('aria-labelledby') ||
        (element as HTMLElement).textContent?.trim()

      if (!hasLabel) {
        missing.push(element)
      }
    })

    return missing
  },
}

// Async testing utilities
export const asyncUtils = {
  waitFor: async (condition: () => boolean, timeout = 5000, interval = 50) => {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      if (condition()) return true
      await new Promise(resolve => setTimeout(resolve, interval))
    }
    throw new Error(`Condition not met within ${timeout}ms`)
  },

  waitForElement: async (selector: string, container = document, timeout = 5000) => {
    return asyncUtils.waitFor(() => container.querySelector(selector) !== null, timeout)
  },

  sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
}

// Re-export everything from testing library for convenience
export * from '@testing-library/react'
export { userEvent }

// Default export for common usage
export default {
  render: renderWithProviders,
  renderComponent,
  mockData,
  mockApiResponses,
  mockVoiceAPI,
  performanceUtils,
  a11yUtils,
  asyncUtils,
  createMockSupabaseClient,
}