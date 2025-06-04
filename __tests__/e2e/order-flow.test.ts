/**
 * End-to-End tests for the complete order flow
 * Tests the full user journey from authentication to order completion
 */

import { test, expect, Browser, Page } from '@playwright/test'

// Test configuration
const TEST_CONFIG = {
  baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  user: {
    email: 'server@test.com',
    password: 'testpassword123',
  },
  admin: {
    email: 'admin@test.com',
    password: 'adminpassword123',
  },
}

// Mock data for testing
const TEST_DATA = {
  table: {
    id: 'table-1',
    label: 'Table 1',
  },
  resident: {
    name: 'John Doe',
    dietaryRestrictions: 'No nuts',
  },
  order: {
    items: ['Chicken Dinner', 'Caesar Salad', 'Iced Tea'],
    voiceTranscript: 'chicken dinner, caesar salad, and iced tea please',
  },
}

test.describe('Complete Order Flow E2E', () => {
  let browser: Browser
  let serverPage: Page
  let kitchenPage: Page

  test.beforeAll(async ({ browser: b }) => {
    browser = b
  })

  test.beforeEach(async () => {
    // Create separate pages for server and kitchen views
    serverPage = await browser.newPage()
    kitchenPage = await browser.newPage()

    // Set up viewport sizes
    await serverPage.setViewportSize({ width: 1280, height: 720 })
    await kitchenPage.setViewportSize({ width: 1920, height: 1080 })
  })

  test.afterEach(async () => {
    await serverPage.close()
    await kitchenPage.close()
  })

  test('complete order lifecycle from placement to completion', async () => {
    // Step 1: Server Authentication
    await serverPage.goto(`${TEST_CONFIG.baseURL}/auth/login`)
    await serverPage.fill('[data-testid="email-input"]', TEST_CONFIG.user.email)
    await serverPage.fill('[data-testid="password-input"]', TEST_CONFIG.user.password)
    await serverPage.click('[data-testid="login-button"]')

    // Wait for redirect to server dashboard
    await serverPage.waitForURL('**/server')
    await expect(serverPage.locator('[data-testid="server-dashboard"]')).toBeVisible()

    // Step 2: Kitchen Authentication
    await kitchenPage.goto(`${TEST_CONFIG.baseURL}/auth/login`)
    await kitchenPage.fill('[data-testid="email-input"]', TEST_CONFIG.admin.email)
    await kitchenPage.fill('[data-testid="password-input"]', TEST_CONFIG.admin.password)
    await kitchenPage.click('[data-testid="login-button"]')

    // Navigate to kitchen view
    await kitchenPage.waitForURL('**/admin')
    await kitchenPage.click('[data-testid="kitchen-link"]')
    await kitchenPage.waitForURL('**/kitchen')
    await expect(kitchenPage.locator('[data-testid="kds-layout"]')).toBeVisible()

    // Step 3: Floor Plan Interaction
    await test.step('Server selects table and resident', async () => {
      // Click on table
      await serverPage.click(`[data-testid="table-${TEST_DATA.table.id}"]`)
      await expect(serverPage.locator('[data-testid="table-selected"]')).toBeVisible()

      // Select seat
      await serverPage.click('[data-testid="seat-1"]')
      await expect(serverPage.locator('[data-testid="seat-selected"]')).toBeVisible()

      // Choose or add resident
      const residentSelector = serverPage.locator('[data-testid="resident-selector"]')
      if (await residentSelector.isVisible()) {
        await residentSelector.click()
        await serverPage.click(`[data-testid="resident-${TEST_DATA.resident.name}"]`)
      } else {
        // Add new resident if selector not available
        await serverPage.click('[data-testid="add-resident"]')
        await serverPage.fill('[data-testid="resident-name"]', TEST_DATA.resident.name)
        await serverPage.click('[data-testid="save-resident"]')
      }
    })

    // Step 4: Voice Order Recording
    await test.step('Server records voice order', async () => {
      // Start voice recording
      await serverPage.click('[data-testid="voice-record-button"]')
      await expect(serverPage.locator('[data-testid="recording-indicator"]')).toBeVisible()

      // Simulate voice input (in real test, this would be actual audio)
      // For E2E testing, we'll mock the transcription result
      await serverPage.evaluate((transcript) => {
        // Mock successful transcription
        window.dispatchEvent(new CustomEvent('mock-transcription', {
          detail: { transcript, items: transcript.split(', ') }
        }))
      }, TEST_DATA.order.voiceTranscript)

      // Stop recording
      await serverPage.click('[data-testid="voice-stop-button"]')

      // Wait for transcription processing
      await expect(serverPage.locator('[data-testid="transcription-result"]')).toBeVisible()
      
      // Verify items were parsed correctly
      for (const item of TEST_DATA.order.items) {
        await expect(serverPage.locator(`[data-testid="order-item-${item}"]`)).toBeVisible()
      }
    })

    // Step 5: Order Review and Submission
    await test.step('Server reviews and submits order', async () => {
      // Review order items
      await expect(serverPage.locator('[data-testid="order-review"]')).toBeVisible()
      
      // Add special instructions if needed
      await serverPage.fill('[data-testid="special-instructions"]', 'No onions, extra sauce')
      
      // Confirm order
      await serverPage.click('[data-testid="confirm-order"]')
      
      // Wait for order confirmation
      await expect(serverPage.locator('[data-testid="order-confirmed"]')).toBeVisible()
      
      // Get order ID for tracking
      const orderIdElement = await serverPage.locator('[data-testid="order-id"]')
      const orderId = await orderIdElement.textContent()
      expect(orderId).toBeTruthy()
    })

    // Step 6: Kitchen Receives Order
    await test.step('Kitchen receives and processes order', async () => {
      // Wait for order to appear in KDS
      await expect(kitchenPage.locator('[data-testid="new-order"]')).toBeVisible({ timeout: 10000 })
      
      // Verify order details in kitchen view
      await expect(kitchenPage.locator(`[data-testid="order-table-${TEST_DATA.table.label}"]`)).toBeVisible()
      
      // Check that items are displayed
      for (const item of TEST_DATA.order.items) {
        await expect(kitchenPage.locator(`[data-testid="kitchen-item-${item}"]`)).toBeVisible()
      }

      // Verify special instructions
      await expect(kitchenPage.locator('[data-testid="special-instructions"]')).toContainText('No onions, extra sauce')
    })

    // Step 7: Kitchen Workflow - Start Preparation
    await test.step('Kitchen starts order preparation', async () => {
      // Click start preparation button
      await kitchenPage.click('[data-testid="start-prep-button"]')
      
      // Verify order status changed
      await expect(kitchenPage.locator('[data-testid="order-status-preparing"]')).toBeVisible()
      
      // Check timer started
      await expect(kitchenPage.locator('[data-testid="prep-timer"]')).toBeVisible()
      
      // Verify server sees status update
      await expect(serverPage.locator('[data-testid="order-status-preparing"]')).toBeVisible({ timeout: 5000 })
    })

    // Step 8: Station-Specific Processing
    await test.step('Station processes individual items', async () => {
      // Switch to grill station view
      await kitchenPage.click('[data-testid="grill-station"]')
      await expect(kitchenPage.locator('[data-testid="grill-station-active"]')).toBeVisible()
      
      // Start cooking chicken dinner
      await kitchenPage.click('[data-testid="start-cooking-chicken"]')
      await expect(kitchenPage.locator('[data-testid="cooking-chicken"]')).toBeVisible()
      
      // Switch to salad station
      await kitchenPage.click('[data-testid="salad-station"]')
      await expect(kitchenPage.locator('[data-testid="salad-station-active"]')).toBeVisible()
      
      // Prepare caesar salad
      await kitchenPage.click('[data-testid="start-prep-salad"]')
      await expect(kitchenPage.locator('[data-testid="prepping-salad"]')).toBeVisible()
    })

    // Step 9: Quality Control and Completion
    await test.step('Kitchen completes order preparation', async () => {
      // Mark chicken as complete
      await kitchenPage.click('[data-testid="complete-chicken"]')
      await expect(kitchenPage.locator('[data-testid="chicken-complete"]')).toBeVisible()
      
      // Mark salad as complete
      await kitchenPage.click('[data-testid="complete-salad"]')
      await expect(kitchenPage.locator('[data-testid="salad-complete"]')).toBeVisible()
      
      // Mark beverage as ready
      await kitchenPage.click('[data-testid="complete-beverage"]')
      await expect(kitchenPage.locator('[data-testid="beverage-complete"]')).toBeVisible()
      
      // Complete entire order
      await kitchenPage.click('[data-testid="complete-order"]')
      await expect(kitchenPage.locator('[data-testid="order-ready"]')).toBeVisible()
    })

    // Step 10: Expo and Service
    await test.step('Order ready for service', async () => {
      // Switch to expo station
      await kitchenPage.click('[data-testid="expo-station"]')
      await expect(kitchenPage.locator('[data-testid="expo-station-active"]')).toBeVisible()
      
      // Verify order in expo queue
      await expect(kitchenPage.locator('[data-testid="expo-order-ready"]')).toBeVisible()
      
      // Quality check
      await kitchenPage.click('[data-testid="quality-check-pass"]')
      
      // Release order for pickup
      await kitchenPage.click('[data-testid="release-order"]')
      await expect(kitchenPage.locator('[data-testid="order-pickup-ready"]')).toBeVisible()
    })

    // Step 11: Server Pickup and Delivery
    await test.step('Server picks up and delivers order', async () => {
      // Server should see order ready notification
      await expect(serverPage.locator('[data-testid="order-ready-notification"]')).toBeVisible({ timeout: 5000 })
      
      // Navigate to pickup area
      await serverPage.click('[data-testid="pickup-orders"]')
      await expect(serverPage.locator('[data-testid="ready-orders-list"]')).toBeVisible()
      
      // Mark order as picked up
      await serverPage.click('[data-testid="pickup-order"]')
      await expect(serverPage.locator('[data-testid="order-picked-up"]')).toBeVisible()
      
      // Deliver to table
      await serverPage.click('[data-testid="deliver-order"]')
      await expect(serverPage.locator('[data-testid="order-delivered"]')).toBeVisible()
    })

    // Step 12: Order Completion and Analytics
    await test.step('Order completion and metrics', async () => {
      // Mark order as served
      await serverPage.click('[data-testid="mark-served"]')
      await expect(serverPage.locator('[data-testid="order-completed"]')).toBeVisible()
      
      // Verify order appears in completed orders
      await serverPage.click('[data-testid="completed-orders"]')
      await expect(serverPage.locator('[data-testid="completed-order-entry"]')).toBeVisible()
      
      // Check kitchen metrics updated
      await kitchenPage.click('[data-testid="kitchen-metrics"]')
      await expect(kitchenPage.locator('[data-testid="orders-completed-count"]')).toBeVisible()
      
      // Verify timing metrics
      await expect(kitchenPage.locator('[data-testid="average-completion-time"]')).toBeVisible()
    })
  })

  test('voice order error handling and recovery', async () => {
    // Authentication
    await serverPage.goto(`${TEST_CONFIG.baseURL}/auth/login`)
    await serverPage.fill('[data-testid="email-input"]', TEST_CONFIG.user.email)
    await serverPage.fill('[data-testid="password-input"]', TEST_CONFIG.user.password)
    await serverPage.click('[data-testid="login-button"]')
    await serverPage.waitForURL('**/server')

    // Select table and seat
    await serverPage.click(`[data-testid="table-${TEST_DATA.table.id}"]`)
    await serverPage.click('[data-testid="seat-1"]')

    await test.step('Handle voice recording failure', async () => {
      // Start recording
      await serverPage.click('[data-testid="voice-record-button"]')
      
      // Simulate recording error
      await serverPage.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mock-recording-error', {
          detail: { error: 'Microphone access denied' }
        }))
      })

      // Verify error message
      await expect(serverPage.locator('[data-testid="recording-error"]')).toBeVisible()
      await expect(serverPage.locator('[data-testid="recording-error"]')).toContainText('Microphone access denied')

      // Try again button should be available
      await expect(serverPage.locator('[data-testid="retry-recording"]')).toBeVisible()
    })

    await test.step('Handle transcription failure', async () => {
      // Retry recording
      await serverPage.click('[data-testid="retry-recording"]')
      
      // Simulate transcription error
      await serverPage.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mock-transcription-error', {
          detail: { error: 'Transcription service unavailable' }
        }))
      })

      // Verify error handling
      await expect(serverPage.locator('[data-testid="transcription-error"]')).toBeVisible()
      
      // Manual entry fallback should be available
      await expect(serverPage.locator('[data-testid="manual-entry-fallback"]')).toBeVisible()
    })

    await test.step('Use manual entry fallback', async () => {
      // Switch to manual entry
      await serverPage.click('[data-testid="manual-entry-fallback"]')
      await expect(serverPage.locator('[data-testid="manual-order-form"]')).toBeVisible()

      // Add items manually
      for (const item of TEST_DATA.order.items) {
        await serverPage.fill('[data-testid="add-item-input"]', item)
        await serverPage.click('[data-testid="add-item-button"]')
        await expect(serverPage.locator(`[data-testid="manual-item-${item}"]`)).toBeVisible()
      }

      // Submit manual order
      await serverPage.click('[data-testid="submit-manual-order"]')
      await expect(serverPage.locator('[data-testid="order-confirmed"]')).toBeVisible()
    })
  })

  test('kitchen display system real-time updates', async () => {
    // Set up both pages
    await serverPage.goto(`${TEST_CONFIG.baseURL}/auth/login`)
    await kitchenPage.goto(`${TEST_CONFIG.baseURL}/auth/login`)

    // Login both users
    await Promise.all([
      // Server login
      (async () => {
        await serverPage.fill('[data-testid="email-input"]', TEST_CONFIG.user.email)
        await serverPage.fill('[data-testid="password-input"]', TEST_CONFIG.user.password)
        await serverPage.click('[data-testid="login-button"]')
        await serverPage.waitForURL('**/server')
      })(),
      // Kitchen login
      (async () => {
        await kitchenPage.fill('[data-testid="email-input"]', TEST_CONFIG.admin.email)
        await kitchenPage.fill('[data-testid="password-input"]', TEST_CONFIG.admin.password)
        await kitchenPage.click('[data-testid="login-button"]')
        await kitchenPage.waitForURL('**/admin')
        await kitchenPage.click('[data-testid="kitchen-link"]')
        await kitchenPage.waitForURL('**/kitchen')
      })(),
    ])

    await test.step('Real-time order synchronization', async () => {
      // Place order from server
      await serverPage.click('[data-testid="table-table-1"]')
      await serverPage.click('[data-testid="seat-1"]')
      
      // Quick order placement
      await serverPage.click('[data-testid="quick-order"]')
      await serverPage.click('[data-testid="preset-chicken-dinner"]')
      await serverPage.click('[data-testid="confirm-quick-order"]')

      // Order should appear in kitchen immediately
      await expect(kitchenPage.locator('[data-testid="new-order"]')).toBeVisible({ timeout: 3000 })
      
      // Verify real-time connection status
      await expect(kitchenPage.locator('[data-testid="connection-status-connected"]')).toBeVisible()
    })

    await test.step('Status updates propagate in real-time', async () => {
      // Kitchen starts order
      await kitchenPage.click('[data-testid="start-prep-button"]')
      
      // Server should see status change immediately
      await expect(serverPage.locator('[data-testid="order-status-preparing"]')).toBeVisible({ timeout: 3000 })
      
      // Kitchen completes order
      await kitchenPage.click('[data-testid="complete-order"]')
      
      // Server should see completion immediately
      await expect(serverPage.locator('[data-testid="order-status-ready"]')).toBeVisible({ timeout: 3000 })
    })

    await test.step('Connection resilience', async () => {
      // Simulate network interruption
      await kitchenPage.evaluate(() => {
        // Mock network disconnect
        window.dispatchEvent(new CustomEvent('mock-network-disconnect'))
      })

      // Should show disconnected status
      await expect(kitchenPage.locator('[data-testid="connection-status-disconnected"]')).toBeVisible()
      
      // Simulate reconnection
      await kitchenPage.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mock-network-reconnect'))
      })

      // Should reconnect and sync
      await expect(kitchenPage.locator('[data-testid="connection-status-connected"]')).toBeVisible({ timeout: 5000 })
    })
  })

  test('accessibility and keyboard navigation', async () => {
    await serverPage.goto(`${TEST_CONFIG.baseURL}/auth/login`)
    
    await test.step('Keyboard navigation works throughout app', async () => {
      // Tab through login form
      await serverPage.press('body', 'Tab')
      await expect(serverPage.locator('[data-testid="email-input"]')).toBeFocused()
      
      await serverPage.press('body', 'Tab')
      await expect(serverPage.locator('[data-testid="password-input"]')).toBeFocused()
      
      await serverPage.press('body', 'Tab')
      await expect(serverPage.locator('[data-testid="login-button"]')).toBeFocused()
    })

    await test.step('Screen reader accessibility', async () => {
      // Check for proper ARIA labels
      await expect(serverPage.locator('[data-testid="email-input"]')).toHaveAttribute('aria-label')
      await expect(serverPage.locator('[data-testid="password-input"]')).toHaveAttribute('aria-label')
      
      // Check for proper heading structure
      await expect(serverPage.locator('h1')).toBeVisible()
      
      // Check for proper form labels
      await expect(serverPage.locator('label[for="email"]')).toBeVisible()
      await expect(serverPage.locator('label[for="password"]')).toBeVisible()
    })

    // Login and test main interface
    await serverPage.fill('[data-testid="email-input"]', TEST_CONFIG.user.email)
    await serverPage.fill('[data-testid="password-input"]', TEST_CONFIG.user.password)
    await serverPage.click('[data-testid="login-button"]')
    await serverPage.waitForURL('**/server')

    await test.step('Main interface keyboard navigation', async () => {
      // Voice recording should be accessible via keyboard
      await serverPage.press('body', 'Tab')
      // Find and focus voice recording button
      const voiceButton = serverPage.locator('[data-testid="voice-record-button"]')
      await voiceButton.focus()
      await expect(voiceButton).toBeFocused()
      
      // Space or Enter should trigger recording
      await serverPage.press('[data-testid="voice-record-button"]', 'Space')
      await expect(serverPage.locator('[data-testid="recording-indicator"]')).toBeVisible()
    })
  })

  test('performance under load', async () => {
    await kitchenPage.goto(`${TEST_CONFIG.baseURL}/auth/login`)
    await kitchenPage.fill('[data-testid="email-input"]', TEST_CONFIG.admin.email)
    await kitchenPage.fill('[data-testid="password-input"]', TEST_CONFIG.admin.password)
    await kitchenPage.click('[data-testid="login-button"]')
    await kitchenPage.waitForURL('**/admin')
    await kitchenPage.click('[data-testid="kitchen-link"]')
    await kitchenPage.waitForURL('**/kitchen')

    await test.step('Handle multiple orders efficiently', async () => {
      // Simulate receiving multiple orders quickly
      for (let i = 0; i < 10; i++) {
        await kitchenPage.evaluate((orderNum) => {
          window.dispatchEvent(new CustomEvent('mock-new-order', {
            detail: {
              id: `load-test-order-${orderNum}`,
              table: `Table ${orderNum + 1}`,
              items: [`Item ${orderNum}A`, `Item ${orderNum}B`],
              timestamp: new Date().toISOString(),
            }
          }))
        }, i)
      }

      // All orders should be visible and interface should remain responsive
      for (let i = 0; i < 10; i++) {
        await expect(kitchenPage.locator(`[data-testid="order-load-test-order-${i}"]`)).toBeVisible()
      }

      // UI should still be responsive
      await kitchenPage.click('[data-testid="filter-by-status"]')
      await expect(kitchenPage.locator('[data-testid="status-filter-menu"]')).toBeVisible()
    })

    await test.step('Measure rendering performance', async () => {
      // Measure time to render order updates
      const startTime = Date.now()
      
      await kitchenPage.click('[data-testid="refresh-orders"]')
      await expect(kitchenPage.locator('[data-testid="orders-refreshed"]')).toBeVisible()
      
      const endTime = Date.now()
      const renderTime = endTime - startTime
      
      // Should render within 2 seconds even with many orders
      expect(renderTime).toBeLessThan(2000)
    })
  })
})