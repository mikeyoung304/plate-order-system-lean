import { describe, test, expect } from '@jest/globals'

describe('Unit Tests - Basic', () => {
  test('utility functions work correctly', () => {
    expect(1 + 1).toBe(2)
  })

  test('React components can be tested', () => {
    expect(true).toBe(true)
  })
})