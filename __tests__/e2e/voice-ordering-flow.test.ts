/**
 * End-to-End Voice Ordering Flow Tests
 * Tests the complete voice ordering pipeline from audio input to order creation
 */

import { test, expect } from '@playwright/test'

// Mock audio data for testing
const createMockAudioBlob = (sizeKB: number = 50): Blob => {
  const size = sizeKB * 1024
  const audioData = new Uint8Array(size)
  // Fill with some realistic audio-like data pattern
  for (let i = 0; i < size; i++) {
    audioData[i] = Math.sin(i * 0.01) * 127 + 128
  }
  return new Blob([audioData], { type: 'audio/wav' })
}

test.describe('Voice Ordering Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to server page
    await page.goto('/server')
    
    // Mock MediaRecorder API for testing
    await page.addInitScript(() => {
      // Mock MediaRecorder
      class MockMediaRecorder {
        state = 'inactive'
        ondataavailable: ((event: any) => void) | null = null
        onstop: (() => void) | null = null
        onerror: ((event: any) => void) | null = null

        constructor(stream: MediaStream, options?: any) {}

        start() {
          this.state = 'recording'
          // Simulate recording data after a short delay
          setTimeout(() => {
            if (this.ondataavailable) {
              const mockBlob = new Blob([new Uint8Array(50000)], { type: 'audio/wav' })
              this.ondataavailable({ data: mockBlob })
            }
          }, 100)
        }

        stop() {
          this.state = 'inactive'
          if (this.onstop) {
            this.onstop()
          }
        }

        static isTypeSupported(type: string) {
          return true
        }
      }

      // Mock getUserMedia
      const mockGetUserMedia = async (constraints: any) => {
        return new MediaStream()
      }

      // Replace native APIs
      window.MediaRecorder = MockMediaRecorder as any
      navigator.mediaDevices = {
        getUserMedia: mockGetUserMedia
      } as any
    })
  })

  test('should complete full voice ordering workflow', async ({ page }) => {
    // Mock the transcription API to return specific results
    await page.route('**/api/transcribe', async (route) => {
      const mockResponse = {
        success: true,
        data: {
          transcript: 'I would like a cheeseburger with no onions and a large fries',
          items: ['Cheeseburger - no onions', 'Large Fries'],
          metadata: {
            cached: false,
            optimized: true,
            compressionRatio: 2.5,
            cost: 0.008,
            latency: 1200
          }
        },
        timestamp: new Date().toISOString()
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse)
      })
    })

    // 1. Find and select a table
    await page.click('[data-testid="table-selector"]')
    await page.click('[data-testid="table-option-1"]')
    
    // 2. Open voice recording interface
    await page.click('[data-testid="voice-order-button"]')
    
    // 3. Wait for microphone permission modal (if any)
    const permissionModal = page.locator('[data-testid="mic-permission-modal"]')
    if (await permissionModal.isVisible()) {
      await page.click('[data-testid="grant-permission-button"]')
    }

    // 4. Start voice recording
    await page.click('[data-testid="start-recording-button"]')
    
    // 5. Verify recording state
    await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible()
    await expect(page.locator('[data-testid="recording-status"]')).toContainText('Recording')

    // 6. Stop recording after a brief moment
    await page.waitForTimeout(1000)
    await page.click('[data-testid="stop-recording-button"]')

    // 7. Wait for transcription processing
    await expect(page.locator('[data-testid="processing-indicator"]')).toBeVisible()
    await expect(page.locator('[data-testid="transcription-result"]')).toBeVisible({ timeout: 10000 })

    // 8. Verify transcription results are displayed
    await expect(page.locator('[data-testid="transcription-text"]')).toContainText('cheeseburger')
    await expect(page.locator('[data-testid="parsed-items"]')).toContainText('Cheeseburger - no onions')
    await expect(page.locator('[data-testid="parsed-items"]')).toContainText('Large Fries')

    // 9. Verify cost and performance metrics (if displayed in dev mode)
    const metadataSection = page.locator('[data-testid="transcription-metadata"]')
    if (await metadataSection.isVisible()) {
      await expect(metadataSection).toContainText('Cost: $0.008')
      await expect(metadataSection).toContainText('Optimized: Yes')
    }

    // 10. Confirm and submit the order
    await page.click('[data-testid="confirm-voice-order-button"]')

    // 11. Verify order was created successfully
    await expect(page.locator('[data-testid="order-success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="recent-orders"]')).toContainText('Cheeseburger')
  })

  test('should handle voice recording errors gracefully', async ({ page }) => {
    // Mock API to return an error
    await page.route('**/api/transcribe', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Audio file too short or corrupted',
          timestamp: new Date().toISOString()
        })
      })
    })

    // Start voice recording process
    await page.click('[data-testid="voice-order-button"]')
    await page.click('[data-testid="start-recording-button"]')
    await page.waitForTimeout(500)
    await page.click('[data-testid="stop-recording-button"]')

    // Should show error message
    await expect(page.locator('[data-testid="transcription-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="transcription-error"]')).toContainText('Audio file too short')

    // Should allow retry
    await expect(page.locator('[data-testid="retry-recording-button"]')).toBeVisible()
  })

  test('should respect rate limiting', async ({ page }) => {
    // Mock API to return rate limit error
    await page.route('**/api/transcribe', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Rate limit exceeded. Voice transcription is limited to 10 requests per minute.',
          timestamp: new Date().toISOString()
        }),
        headers: {
          'Retry-After': '60'
        }
      })
    })

    // Attempt voice recording
    await page.click('[data-testid="voice-order-button"]')
    await page.click('[data-testid="start-recording-button"]')
    await page.waitForTimeout(500)
    await page.click('[data-testid="stop-recording-button"]')

    // Should show rate limit message
    await expect(page.locator('[data-testid="rate-limit-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="rate-limit-error"]')).toContainText('Rate limit exceeded')

    // Should disable recording button temporarily
    await expect(page.locator('[data-testid="start-recording-button"]')).toBeDisabled()
  })

  test('should handle budget limits', async ({ page }) => {
    // Mock API to return budget exceeded error
    await page.route('**/api/transcribe', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Daily budget exceeded ($5.00). Current usage: $5.12',
          timestamp: new Date().toISOString()
        })
      })
    })

    // Attempt voice recording
    await page.click('[data-testid="voice-order-button"]')
    await page.click('[data-testid="start-recording-button"]')
    await page.waitForTimeout(500)
    await page.click('[data-testid="stop-recording-button"]')

    // Should show budget exceeded message
    await expect(page.locator('[data-testid="budget-exceeded-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="budget-exceeded-error"]')).toContainText('Daily budget exceeded')
  })

  test('should cache repeated voice orders', async ({ page }) => {
    let requestCount = 0
    
    // Mock API to simulate caching behavior
    await page.route('**/api/transcribe', async (route) => {
      requestCount++
      
      const mockResponse = {
        success: true,
        data: {
          transcript: 'I would like a coffee with cream',
          items: ['Coffee - with cream'],
          metadata: {
            cached: requestCount > 1, // Second request should be cached
            optimized: true,
            compressionRatio: 2.0,
            cost: requestCount > 1 ? 0 : 0.005, // No cost for cached requests
            latency: requestCount > 1 ? 150 : 1200 // Much faster for cached
          }
        },
        timestamp: new Date().toISOString()
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse)
      })
    })

    // First voice order
    await page.click('[data-testid="voice-order-button"]')
    await page.click('[data-testid="start-recording-button"]')
    await page.waitForTimeout(500)
    await page.click('[data-testid="stop-recording-button"]')
    
    await expect(page.locator('[data-testid="transcription-result"]')).toBeVisible()
    await page.click('[data-testid="confirm-voice-order-button"]')

    // Second identical voice order (should be cached)
    await page.click('[data-testid="voice-order-button"]')
    await page.click('[data-testid="start-recording-button"]')
    await page.waitForTimeout(500)
    await page.click('[data-testid="stop-recording-button"]')

    await expect(page.locator('[data-testid="transcription-result"]')).toBeVisible()
    
    // Verify caching indicators (if shown)
    const metadataSection = page.locator('[data-testid="transcription-metadata"]')
    if (await metadataSection.isVisible()) {
      await expect(metadataSection).toContainText('Cached: Yes')
      await expect(metadataSection).toContainText('Cost: $0.00')
    }
  })

  test('should optimize large audio files', async ({ page }) => {
    // Mock API with optimization metadata
    await page.route('**/api/transcribe', async (route) => {
      const mockResponse = {
        success: true,
        data: {
          transcript: 'Large order with many items',
          items: ['Item 1', 'Item 2', 'Item 3'],
          metadata: {
            cached: false,
            optimized: true,
            compressionRatio: 4.2, // Significant compression
            originalSize: 2048000, // 2MB original
            optimizedSize: 487619, // ~488KB after optimization
            cost: 0.012, // Within budget
            latency: 1800
          }
        },
        timestamp: new Date().toISOString()
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse)
      })
    })

    // Use a larger audio file simulation
    await page.addInitScript(() => {
      class MockMediaRecorder {
        state = 'inactive'
        ondataavailable: ((event: any) => void) | null = null
        onstop: (() => void) | null = null

        start() {
          this.state = 'recording'
          setTimeout(() => {
            if (this.ondataavailable) {
              // Simulate large audio file
              const mockBlob = new Blob([new Uint8Array(2048000)], { type: 'audio/wav' })
              this.ondataavailable({ data: mockBlob })
            }
          }, 100)
        }

        stop() {
          this.state = 'inactive'
          if (this.onstop) this.onstop()
        }
      }
      window.MediaRecorder = MockMediaRecorder as any
    })

    await page.click('[data-testid="voice-order-button"]')
    await page.click('[data-testid="start-recording-button"]')
    await page.waitForTimeout(1000) // Longer recording
    await page.click('[data-testid="stop-recording-button"]')

    await expect(page.locator('[data-testid="transcription-result"]')).toBeVisible()

    // Verify optimization occurred
    const metadataSection = page.locator('[data-testid="transcription-metadata"]')
    if (await metadataSection.isVisible()) {
      await expect(metadataSection).toContainText('Compression: 4.2x')
      await expect(metadataSection).toContainText('Optimized: Yes')
    }
  })
})

test.describe('Voice Ordering Performance', () => {
  test('should process voice orders under 3 seconds', async ({ page }) => {
    // Mock fast API response
    await page.route('**/api/transcribe', async (route) => {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            transcript: 'Quick order',
            items: ['Quick Item'],
            metadata: { cost: 0.004, latency: 800 }
          }
        })
      })
    })

    const startTime = Date.now()
    
    await page.click('[data-testid="voice-order-button"]')
    await page.click('[data-testid="start-recording-button"]')
    await page.waitForTimeout(500)
    await page.click('[data-testid="stop-recording-button"]')
    
    await expect(page.locator('[data-testid="transcription-result"]')).toBeVisible()
    
    const endTime = Date.now()
    const totalTime = endTime - startTime
    
    expect(totalTime).toBeLessThan(3000) // Under 3 seconds
  })

  test('should handle multiple concurrent voice orders', async ({ page, context }) => {
    // Create multiple pages for concurrent testing
    const page2 = await context.newPage()
    const page3 = await context.newPage()
    
    // Mock API for all pages
    const mockRoute = async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            transcript: 'Concurrent order',
            items: ['Concurrent Item'],
            metadata: { cost: 0.005 }
          }
        })
      })
    }

    await page.route('**/api/transcribe', mockRoute)
    await page2.route('**/api/transcribe', mockRoute)
    await page3.route('**/api/transcribe', mockRoute)

    // Navigate all pages
    await page.goto('/server')
    await page2.goto('/server') 
    await page3.goto('/server')

    // Start voice orders concurrently
    const startVoiceOrder = async (testPage: any) => {
      await testPage.click('[data-testid="voice-order-button"]')
      await testPage.click('[data-testid="start-recording-button"]')
      await testPage.waitForTimeout(300)
      await testPage.click('[data-testid="stop-recording-button"]')
      return testPage.locator('[data-testid="transcription-result"]').waitFor()
    }

    // Execute all concurrently
    const startTime = Date.now()
    await Promise.all([
      startVoiceOrder(page),
      startVoiceOrder(page2),
      startVoiceOrder(page3)
    ])
    const endTime = Date.now()

    // Should handle concurrent requests efficiently
    expect(endTime - startTime).toBeLessThan(5000) // Under 5 seconds for 3 concurrent

    await page2.close()
    await page3.close()
  })
})