import '@testing-library/jest-dom'
import 'jest-axe/extend-expect'
import React from 'react'

// Custom Jest matchers
import './__tests__/utils/jest-matchers'

// React 19 compatibility - set up React testing environment
import { configure } from '@testing-library/react'

// Configure React Testing Library for React 19
configure({
  // Enable React 19 features and compatibility
  asyncUtilTimeout: 5000,
  testIdAttribute: 'data-testid',
})

// Mock Next.js router with enhanced functionality
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn().mockResolvedValue(true),
      replace: jest.fn().mockResolvedValue(true),
      prefetch: jest.fn().mockResolvedValue(undefined),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      pathname: '/test-path',
      query: {},
      route: '/test-path',
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/test-path'
  },
  redirect: jest.fn(),
  notFound: jest.fn(),
}))

// Mock Next.js dynamic imports
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (...args) => {
    const React = require('react')
    const dynamicModule = args[0]
    const dynamicOptions = args[1] || {}
    
    const MockedComponent = (props) => {
      if (dynamicOptions.loading) {
        return React.createElement(dynamicOptions.loading)
      }
      return React.createElement('div', { 'data-testid': 'mocked-dynamic-component', ...props })
    }
    
    MockedComponent.displayName = 'MockedDynamicComponent'
    return MockedComponent
  },
}))

// Enhanced Supabase mock
jest.mock('./lib/modassembly/supabase/client', () => {
  const { createMockSupabaseClient } = require('./__tests__/utils/test-utils')
  return {
    createClient: jest.fn(() => createMockSupabaseClient()),
  }
})

// Mock Supabase server client
jest.mock('./lib/modassembly/supabase/server', () => {
  const { createMockSupabaseClient } = require('./__tests__/utils/test-utils')
  return {
    createClient: jest.fn(() => createMockSupabaseClient()),
  }
})

// Note: @supabase/auth-helpers-nextjs no longer used - using server-first auth pattern

// Mock OpenAI API
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    audio: {
      transcriptions: {
        create: jest.fn().mockResolvedValue({
          text: 'chicken, pasta, salad'
        })
      }
    }
  }))
}))

// Enhanced Web Audio API mock
global.AudioContext = jest.fn().mockImplementation(() => ({
  createMediaStreamSource: jest.fn(),
  createScriptProcessor: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    onaudioprocess: null,
  })),
  createAnalyser: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    fftSize: 2048,
    frequencyBinCount: 1024,
    getByteFrequencyData: jest.fn(),
    getByteTimeDomainData: jest.fn(),
  })),
  destination: {},
  close: jest.fn(),
  resume: jest.fn().mockResolvedValue(),
  suspend: jest.fn().mockResolvedValue(),
  state: 'running',
}))

global.webkitAudioContext = global.AudioContext

// Enhanced MediaDevices mock
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: jest.fn(() => [
        {
          kind: 'audio',
          stop: jest.fn(),
          enabled: true,
        }
      ]),
      getAudioTracks: jest.fn(() => [
        {
          kind: 'audio',
          stop: jest.fn(),
          enabled: true,
        }
      ]),
      addTrack: jest.fn(),
      removeTrack: jest.fn(),
    }),
    enumerateDevices: jest.fn().mockResolvedValue([
      {
        deviceId: 'test-device-id',
        kind: 'audioinput',
        label: 'Test Microphone',
      }
    ]),
  },
})

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-object-url')
global.URL.revokeObjectURL = jest.fn()

// Mock Blob constructor
global.Blob = jest.fn().mockImplementation((content, options) => {
  let size = 0;
  if (content && Array.isArray(content)) {
    size = content.reduce((total, item) => {
      if (item instanceof ArrayBuffer || item instanceof Uint8Array) {
        return total + item.byteLength || item.length
      }
      if (typeof item === 'string') {
        return total + item.length
      }
      return total + (item.length || 0)
    }, 0)
  }
  
  return {
    size,
    type: options?.type || '',
    stream: jest.fn(),
    text: jest.fn().mockResolvedValue(content ? content.join('') : ''),
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(size)),
  }
})

// Mock File constructor
global.File = jest.fn().mockImplementation((content, filename, options) => ({
  ...new Blob(content, options),
  name: filename,
  lastModified: Date.now(),
}))

// Mock performance API
Object.defineProperty(global, 'performance', {
  writable: true,
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000,
    },
    timeOrigin: Date.now(),
  },
})

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16))
global.cancelAnimationFrame = jest.fn((id) => clearTimeout(id))

// Mock requestIdleCallback
global.requestIdleCallback = jest.fn((cb) => setTimeout(cb, 0))
global.cancelIdleCallback = jest.fn((id) => clearTimeout(id))

// Enhanced console mocking with selective suppression
const originalConsole = { ...console }
global.console = {
  ...console,
  warn: jest.fn((...args) => {
    const message = args.join(' ')
    // Only show important warnings
    if (message.includes('Warning:') || message.includes('validateDOMNesting') || 
        message.includes('componentWillReceiveProps') || process.env.VERBOSE_TESTS) {
      originalConsole.warn.apply(console, args)
    }
  }),
  error: jest.fn((...args) => {
    const message = args.join(' ')
    // Always show errors unless they're expected test errors
    if (!message.includes('Not implemented: navigation') && 
        !message.includes('Error: Not implemented')) {
      originalConsole.error.apply(console, args)
    }
  }),
  log: process.env.VERBOSE_TESTS ? originalConsole.log : jest.fn(),
}

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}))

// Mock MutationObserver
global.MutationObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(() => []),
}))

// Mock document.elementFromPoint
document.elementFromPoint = jest.fn(() => null)

// Mock CSS.supports
global.CSS = {
  supports: jest.fn(() => true),
}

// Mock scroll behavior
Element.prototype.scrollTo = jest.fn()
Element.prototype.scrollIntoView = jest.fn()

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  configurable: true,
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(''),
  },
})

// Mock crypto.subtle API for hashing operations
Object.defineProperty(global, 'crypto', {
  writable: true,
  value: {
    ...global.crypto,
    subtle: {
      digest: jest.fn(async (algorithm, data) => {
        // Simple mock hash generation that creates different hashes for different data
        const view = new Uint8Array(data)
        const hash = new Uint8Array(32)
        let seed = 0
        for (let i = 0; i < view.length; i++) {
          seed = (seed + view[i]) * 31
        }
        for (let i = 0; i < 32; i++) {
          hash[i] = (seed + i) % 256
        }
        return hash.buffer
      }),
    },
    getRandomValues: jest.fn((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256)
      }
      return array
    }),
    randomUUID: jest.fn(() => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })),
  },
})

// Setup cleanup for better test isolation
afterEach(() => {
  // Clear all timers
  jest.clearAllTimers()
  
  // Reset all mocks
  jest.clearAllMocks()
  
  // Clean up DOM
  document.body.innerHTML = ''
  
  // Reset document title
  document.title = 'Test'
  
  // Clear localStorage and sessionStorage
  localStorage.clear()
  sessionStorage.clear()
  
  // Reset URL
  window.history.replaceState({}, '', '/')
})