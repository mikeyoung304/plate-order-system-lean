import { test, expect, Page } from '@playwright/test'

test.describe('Voice Ordering End-to-End Flow', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    
    // Mock microphone permissions
    await page.context().grantPermissions(['microphone'])
    
    // Navigate to KDS page (assuming authenticated)
    await page.goto('/kitchen/kds')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test.describe('Voice Command UI', () => {
    test('should show voice command button when microphone is available', async () => {
      const voiceButton = page.locator('[data-testid="voice-command-button"]')
      await expect(voiceButton).toBeVisible()
      await expect(voiceButton).toBeEnabled()
    })

    test('should show help modal when help button is clicked', async () => {
      const helpButton = page.locator('[data-testid="voice-help-button"]')
      await helpButton.click()
      
      const helpModal = page.locator('[data-testid="voice-help-modal"]')
      await expect(helpModal).toBeVisible()
      
      // Check help content
      await expect(helpModal).toContainText('Available voice commands')
      await expect(helpModal).toContainText('bump order')
      await expect(helpModal).toContainText('recall order')
      await expect(helpModal).toContainText('start order')
    })

    test('should toggle voice command state on button click', async () => {
      const voiceButton = page.locator('[data-testid="voice-command-button"]')
      const statusText = page.locator('[data-testid="voice-status-text"]')
      
      // Initial state should be idle
      await expect(statusText).toContainText('Voice commands ready')
      
      // Click to start listening
      await voiceButton.click()
      await expect(statusText).toContainText('Listening')
      await expect(voiceButton).toHaveAttribute('aria-pressed', 'true')
      
      // Click again to stop
      await voiceButton.click()
      await expect(statusText).toContainText('Voice commands ready')
      await expect(voiceButton).toHaveAttribute('aria-pressed', 'false')
    })
  })

  test.describe('Voice Command Processing', () => {
    test('should process bump command and update order status', async () => {
      // Setup test data - create an order first
      await page.evaluate(async () => {
        // Mock API response for order creation
        window.testOrder = {
          id: 'test-order-123',
          order_number: 123,
          status: 'preparing',
          table: { label: '5' }
        }
        
        // Mock voice transcription
        window.mockTranscription = 'bump order 123'
      })

      const voiceButton = page.locator('[data-testid="voice-command-button"]')
      const statusText = page.locator('[data-testid="voice-status-text"]')
      
      // Start voice command
      await voiceButton.click()
      await expect(statusText).toContainText('Listening')
      
      // Simulate voice input by triggering the mock transcription
      await page.evaluate(() => {
        const processor = window.voiceProcessor
        if (processor) {
          processor.processCommand(window.mockTranscription)
        }
      })
      
      // Wait for processing to complete
      await expect(statusText).toContainText('Order 123 marked as ready')
      
      // Verify order status updated in UI
      const orderCard = page.locator(`[data-testid="order-card-123"]`)
      await expect(orderCard).toHaveClass(/status-ready/)
    })

    test('should handle recall command', async () => {
      // Setup completed order
      await page.evaluate(() => {
        window.testOrder = {
          id: 'test-order-456',
          order_number: 456,
          status: 'ready',
          table: { label: '8' }
        }
        window.mockTranscription = 'recall order 456'
      })

      const voiceButton = page.locator('[data-testid="voice-command-button"]')
      
      await voiceButton.click()
      
      await page.evaluate(() => {
        window.voiceProcessor?.processCommand(window.mockTranscription)
      })
      
      const statusText = page.locator('[data-testid="voice-status-text"]')
      await expect(statusText).toContainText('Order 456 recalled')
      
      const orderCard = page.locator(`[data-testid="order-card-456"]`)
      await expect(orderCard).toHaveClass(/status-preparing/)
    })

    test('should handle priority change commands', async () => {
      await page.evaluate(() => {
        window.testOrder = {
          id: 'test-order-789',
          order_number: 789,
          status: 'preparing',
          priority: 5
        }
        window.mockTranscription = 'set order 789 priority high'
      })

      const voiceButton = page.locator('[data-testid="voice-command-button"]')
      await voiceButton.click()
      
      await page.evaluate(() => {
        window.voiceProcessor?.processCommand(window.mockTranscription)
      })
      
      const statusText = page.locator('[data-testid="voice-status-text"]')
      await expect(statusText).toContainText('Order 789 priority set to high')
      
      const priorityBadge = page.locator(`[data-testid="order-card-789"] [data-testid="priority-badge"]`)
      await expect(priorityBadge).toHaveClass(/priority-high/)
    })

    test('should handle unknown commands gracefully', async () => {
      await page.evaluate(() => {
        window.mockTranscription = 'make me a sandwich'
      })

      const voiceButton = page.locator('[data-testid="voice-command-button"]')
      await voiceButton.click()
      
      await page.evaluate(() => {
        window.voiceProcessor?.processCommand(window.mockTranscription)
      })
      
      const statusText = page.locator('[data-testid="voice-status-text"]')
      await expect(statusText).toContainText('Unknown command')
      
      // Should suggest help
      const helpSuggestion = page.locator('[data-testid="voice-help-suggestion"]')
      await expect(helpSuggestion).toContainText('Say "help" for available commands')
    })
  })

  test.describe('Batch Operations', () => {
    test('should handle table-level batch commands', async () => {
      // Setup multiple orders for same table
      await page.evaluate(() => {
        window.testOrders = [
          { id: 'order-1', order_number: 101, table: { label: '5' }, status: 'preparing' },
          { id: 'order-2', order_number: 102, table: { label: '5' }, status: 'preparing' },
          { id: 'order-3', order_number: 103, table: { label: '5' }, status: 'preparing' }
        ]
        window.mockTranscription = 'bump all table 5 orders'
      })

      const voiceButton = page.locator('[data-testid="voice-command-button"]')
      await voiceButton.click()
      
      await page.evaluate(() => {
        window.voiceProcessor?.processCommand(window.mockTranscription)
      })
      
      const statusText = page.locator('[data-testid="voice-status-text"]')
      await expect(statusText).toContainText('3 orders for Table 5')
      
      // Verify all orders updated
      for (const orderNum of [101, 102, 103]) {
        const orderCard = page.locator(`[data-testid="order-card-${orderNum}"]`)
        await expect(orderCard).toHaveClass(/status-ready/)
      }
    })

    test('should confirm batch operations before execution', async () => {
      await page.evaluate(() => {
        window.testOrders = Array(5).fill(null).map((_, i) => ({
          id: `order-${i}`,
          order_number: 200 + i,
          table: { label: '10' },
          status: 'preparing'
        }))
        window.mockTranscription = 'bump all table 10 orders'
      })

      const voiceButton = page.locator('[data-testid="voice-command-button"]')
      await voiceButton.click()
      
      await page.evaluate(() => {
        window.voiceProcessor?.processCommand(window.mockTranscription)
      })
      
      // Should show confirmation dialog for large batch
      const confirmDialog = page.locator('[data-testid="batch-confirm-dialog"]')
      await expect(confirmDialog).toBeVisible()
      await expect(confirmDialog).toContainText('5 orders')
      await expect(confirmDialog).toContainText('Table 10')
      
      const confirmButton = page.locator('[data-testid="batch-confirm-yes"]')
      await confirmButton.click()
      
      const statusText = page.locator('[data-testid="voice-status-text"]')
      await expect(statusText).toContainText('Completed 5 orders')
    })
  })

  test.describe('Error Handling and Feedback', () => {
    test('should handle microphone permission denied', async () => {
      // Revoke microphone permission
      await page.context().clearPermissions()
      
      const voiceButton = page.locator('[data-testid="voice-command-button"]')
      await voiceButton.click()
      
      const statusText = page.locator('[data-testid="voice-status-text"]')
      await expect(statusText).toContainText('Failed to access microphone')
      
      const permissionPrompt = page.locator('[data-testid="microphone-permission-prompt"]')
      await expect(permissionPrompt).toBeVisible()
    })

    test('should handle order not found errors', async () => {
      await page.evaluate(() => {
        window.mockTranscription = 'bump order 999'
        // Don't setup test order - simulate not found
      })

      const voiceButton = page.locator('[data-testid="voice-command-button"]')
      await voiceButton.click()
      
      await page.evaluate(() => {
        window.voiceProcessor?.processCommand(window.mockTranscription)
      })
      
      const statusText = page.locator('[data-testid="voice-status-text"]')
      await expect(statusText).toContainText('Order 999 not found')
      
      const errorAlert = page.locator('[data-testid="voice-error-alert"]')
      await expect(errorAlert).toBeVisible()
      await expect(errorAlert).toHaveClass(/alert-warning/)
    })

    test('should provide audio feedback for successful commands', async () => {
      // Mock audio context
      await page.evaluate(() => {
        window.testOrder = { id: 'order-555', order_number: 555, status: 'preparing' }
        window.mockTranscription = 'bump order 555'
        window.mockAudioEnabled = true
      })

      const voiceButton = page.locator('[data-testid="voice-command-button"]')
      await voiceButton.click()
      
      await page.evaluate(() => {
        window.voiceProcessor?.processCommand(window.mockTranscription)
      })
      
      // Check for audio feedback indicator
      const audioFeedback = page.locator('[data-testid="audio-feedback-indicator"]')
      await expect(audioFeedback).toBeVisible()
      
      // Verify audio was played (mock check)
      const audioPlayed = await page.evaluate(() => window.lastAudioPlayed)
      expect(audioPlayed).toContain('Order 555 marked as ready')
    })
  })

  test.describe('Performance and Reliability', () => {
    test('should handle rapid successive commands', async () => {
      const commands = [
        { text: 'bump order 111', expected: 'Order 111 marked as ready' },
        { text: 'start order 222', expected: 'Started preparing order 222' },
        { text: 'recall order 333', expected: 'Order 333 recalled' }
      ]

      await page.evaluate(() => {
        window.testOrders = [
          { id: 'order-111', order_number: 111, status: 'preparing' },
          { id: 'order-222', order_number: 222, status: 'pending' },
          { id: 'order-333', order_number: 333, status: 'ready' }
        ]
      })

      const voiceButton = page.locator('[data-testid="voice-command-button"]')
      const statusText = page.locator('[data-testid="voice-status-text"]')

      for (const command of commands) {
        await voiceButton.click()
        
        await page.evaluate((cmd) => {
          window.mockTranscription = cmd
          window.voiceProcessor?.processCommand(cmd)
        }, command.text)
        
        await expect(statusText).toContainText(command.expected)
        
        // Wait for command to complete before next one
        await page.waitForTimeout(500)
      }
    })

    test('should handle network interruptions gracefully', async () => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort())
      
      await page.evaluate(() => {
        window.testOrder = { id: 'order-offline', order_number: 999, status: 'preparing' }
        window.mockTranscription = 'bump order 999'
      })

      const voiceButton = page.locator('[data-testid="voice-command-button"]')
      await voiceButton.click()
      
      await page.evaluate(() => {
        window.voiceProcessor?.processCommand(window.mockTranscription)
      })
      
      const statusText = page.locator('[data-testid="voice-status-text"]')
      await expect(statusText).toContainText('Network error')
      
      const retryButton = page.locator('[data-testid="voice-retry-button"]')
      await expect(retryButton).toBeVisible()
      
      // Restore network and retry
      await page.unroute('**/api/**')
      await retryButton.click()
      
      await expect(statusText).toContainText('Order 999 marked as ready')
    })

    test('should maintain voice command state across page navigation', async () => {
      const voiceButton = page.locator('[data-testid="voice-command-button"]')
      
      // Enable voice commands
      await voiceButton.click()
      
      // Navigate to another page and back
      await page.goto('/kitchen/inventory')
      await page.waitForLoadState('networkidle')
      await page.goto('/kitchen/kds')
      await page.waitForLoadState('networkidle')
      
      // Voice commands should still be available
      const newVoiceButton = page.locator('[data-testid="voice-command-button"]')
      await expect(newVoiceButton).toBeVisible()
      await expect(newVoiceButton).toBeEnabled()
    })
  })

  test.describe('Accessibility', () => {
    test('should be keyboard accessible', async () => {
      // Focus voice button with keyboard
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      
      const voiceButton = page.locator('[data-testid="voice-command-button"]')
      await expect(voiceButton).toBeFocused()
      
      // Activate with Enter key
      await page.keyboard.press('Enter')
      
      const statusText = page.locator('[data-testid="voice-status-text"]')
      await expect(statusText).toContainText('Listening')
      
      // Stop with Escape key
      await page.keyboard.press('Escape')
      await expect(statusText).toContainText('Voice commands ready')
    })

    test('should have proper ARIA labels and roles', async () => {
      const voiceButton = page.locator('[data-testid="voice-command-button"]')
      
      await expect(voiceButton).toHaveAttribute('role', 'button')
      await expect(voiceButton).toHaveAttribute('aria-label', /voice command/i)
      await expect(voiceButton).toHaveAttribute('aria-pressed', 'false')
      
      await voiceButton.click()
      await expect(voiceButton).toHaveAttribute('aria-pressed', 'true')
      
      const statusText = page.locator('[data-testid="voice-status-text"]')
      await expect(statusText).toHaveAttribute('role', 'status')
      await expect(statusText).toHaveAttribute('aria-live', 'polite')
    })

    test('should provide screen reader announcements', async () => {
      const announcements = page.locator('[data-testid="voice-announcements"]')
      
      await page.evaluate(() => {
        window.testOrder = { id: 'order-sr', order_number: 777, status: 'preparing' }
        window.mockTranscription = 'bump order 777'
      })

      const voiceButton = page.locator('[data-testid="voice-command-button"]')
      await voiceButton.click()
      
      await page.evaluate(() => {
        window.voiceProcessor?.processCommand(window.mockTranscription)
      })
      
      await expect(announcements).toContainText('Order 777 has been marked as ready')
    })
  })

  test.describe('Integration with KDS Features', () => {
    test('should integrate with table grouping view', async () => {
      // Setup table view
      await page.locator('[data-testid="view-toggle-table"]').click()
      
      await page.evaluate(() => {
        window.testOrders = [
          { id: 'order-a1', order_number: 501, table: { label: '12' }, status: 'preparing' },
          { id: 'order-a2', order_number: 502, table: { label: '12' }, status: 'preparing' }
        ]
        window.mockTranscription = 'bump all table 12 orders'
      })

      const voiceButton = page.locator('[data-testid="voice-command-button"]')
      await voiceButton.click()
      
      await page.evaluate(() => {
        window.voiceProcessor?.processCommand(window.mockTranscription)
      })
      
      // Verify table group status updated
      const tableGroup = page.locator('[data-testid="table-group-12"]')
      await expect(tableGroup).toHaveClass(/status-ready/)
      
      const groupStatus = page.locator('[data-testid="table-group-12"] [data-testid="group-status"]')
      await expect(groupStatus).toContainText('Ready')
    })

    test('should work with order filtering', async () => {
      // Apply filter for new orders only
      await page.locator('[data-testid="filter-new-orders"]').click()
      
      await page.evaluate(() => {
        window.mockTranscription = 'show all orders'
      })

      const voiceButton = page.locator('[data-testid="voice-command-button"]')
      await voiceButton.click()
      
      await page.evaluate(() => {
        window.voiceProcessor?.processCommand(window.mockTranscription)
      })
      
      // Should clear filter and show all orders
      const filterIndicator = page.locator('[data-testid="active-filter-indicator"]')
      await expect(filterIndicator).not.toBeVisible()
      
      const statusText = page.locator('[data-testid="voice-status-text"]')
      await expect(statusText).toContainText('Showing all orders')
    })

    test('should integrate with anomaly detection alerts', async () => {
      // Mock anomaly detection
      await page.evaluate(() => {
        window.testAnomalies = [
          {
            type: 'duplicate',
            severity: 'high',
            orderId: 'order-anom',
            message: 'Duplicate order detected'
          }
        ]
        window.mockTranscription = 'bump order with anomaly'
      })

      const voiceButton = page.locator('[data-testid="voice-command-button"]')
      await voiceButton.click()
      
      await page.evaluate(() => {
        window.voiceProcessor?.processCommand(window.mockTranscription)
      })
      
      // Should show anomaly confirmation
      const anomalyAlert = page.locator('[data-testid="anomaly-confirmation-modal"]')
      await expect(anomalyAlert).toBeVisible()
      await expect(anomalyAlert).toContainText('Duplicate order detected')
      
      const confirmButton = page.locator('[data-testid="anomaly-confirm-proceed"]')
      await confirmButton.click()
      
      const statusText = page.locator('[data-testid="voice-status-text"]')
      await expect(statusText).toContainText('Order processed despite anomaly')
    })
  })
})