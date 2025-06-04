/**
 * Environment setup for Jest tests
 * This file runs before each test suite to set up environment variables
 */

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.OPENAI_API_KEY = 'test-openai-key'

// Disable console warnings during tests unless explicitly enabled
if (!process.env.VERBOSE_TESTS) {
  const originalWarn = console.warn
  const originalError = console.error
  
  console.warn = (...args) => {
    // Only show warnings that are likely to be test-related
    const message = args.join(' ')
    if (message.includes('Warning:') || message.includes('Act(')) {
      originalWarn.apply(console, args)
    }
  }
  
  console.error = (...args) => {
    // Only show errors that are likely to be test-related
    const message = args.join(' ')
    if (message.includes('Error:') || message.includes('Failed')) {
      originalError.apply(console, args)
    }
  }
}

// Set up fetch mock for Node environment
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn()
}

// Set up ResizeObserver mock
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Set up IntersectionObserver mock
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock window.scrollTo
window.scrollTo = jest.fn()

// Mock crypto for UUID generation
if (typeof global.crypto === 'undefined') {
  global.crypto = {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
  }
}