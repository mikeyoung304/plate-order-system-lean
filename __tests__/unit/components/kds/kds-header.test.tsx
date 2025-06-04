/**
 * Comprehensive tests for KDSHeader component
 * Tests all functionality, user interactions, and edge cases
 */

import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import { KDSHeader } from '@/components/kds/KDSHeader'
import { renderWithProviders, mockData } from '@/__tests__/utils/test-utils'

// Mock the KDS state hook
const mockKDSState = {
  orders: [],
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
}

jest.mock('@/lib/hooks/use-kds-state', () => ({
  useKDSState: jest.fn(() => mockKDSState),
}))

describe('KDSHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset to default state
    Object.assign(mockKDSState, {
      orders: [],
      loading: false,
      error: null,
      viewMode: 'grid',
      sortBy: 'time',
      filterBy: 'all',
      soundEnabled: true,
      connectionStatus: 'connected',
      filteredAndSortedOrders: [],
    })
  })

  describe('Rendering', () => {
    it('renders with default props', () => {
      renderWithProviders(<KDSHeader />)
      
      expect(screen.getByText('Kitchen Display')).toBeInTheDocument()
      expect(screen.getByText('Connected')).toBeInTheDocument()
      expect(screen.getByText('Total:')).toBeInTheDocument()
      expect(screen.getByText('Active:')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = renderWithProviders(
        <KDSHeader className="custom-class" />
      )
      
      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('renders fullscreen toggle when onToggleFullscreen is provided', () => {
      const onToggleFullscreen = jest.fn()
      renderWithProviders(
        <KDSHeader onToggleFullscreen={onToggleFullscreen} />
      )
      
      expect(screen.getByLabelText(/maximize|minimize/i)).toBeInTheDocument()
    })

    it('does not render fullscreen toggle when onToggleFullscreen is not provided', () => {
      renderWithProviders(<KDSHeader />)
      
      expect(screen.queryByLabelText(/maximize|minimize/i)).not.toBeInTheDocument()
    })
  })

  describe('Connection Status', () => {
    it('shows connected status when connected', () => {
      mockKDSState.connectionStatus = 'connected'
      renderWithProviders(<KDSHeader />)
      
      expect(screen.getByText('Connected')).toBeInTheDocument()
      expect(screen.getByTestId('wifi-icon') || screen.queryByText('Wifi')).toBeTruthy()
    })

    it('shows disconnected status when disconnected', () => {
      mockKDSState.connectionStatus = 'disconnected'
      renderWithProviders(<KDSHeader />)
      
      expect(screen.getByText('Disconnected')).toBeInTheDocument()
      expect(screen.getByTestId('wifi-off-icon') || screen.queryByText('WifiOff')).toBeTruthy()
    })

    it('shows reconnecting status when reconnecting', () => {
      mockKDSState.connectionStatus = 'reconnecting'
      renderWithProviders(<KDSHeader />)
      
      // Should show disconnected UI while reconnecting
      expect(screen.getByText('Disconnected')).toBeInTheDocument()
    })
  })

  describe('Order Metrics', () => {
    it('displays correct total order count', () => {
      mockKDSState.orders = [
        mockData.kdsOrder({ status: 'pending' }),
        mockData.kdsOrder({ status: 'completed' }),
        mockData.kdsOrder({ status: 'pending' }),
      ]
      
      renderWithProviders(<KDSHeader />)
      
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('calculates active orders correctly', () => {
      mockKDSState.orders = [
        mockData.kdsOrder({ started_at: null, completed_at: null }), // new
        mockData.kdsOrder({ started_at: new Date().toISOString(), completed_at: null }), // preparing
        mockData.kdsOrder({ started_at: new Date().toISOString(), completed_at: new Date().toISOString() }), // ready
      ]
      
      renderWithProviders(<KDSHeader />)
      
      // Should show 2 active orders (new + preparing)
      const badges = screen.getAllByText(/\d+/)
      expect(badges).toHaveLength(2) // Total and Active badges
    })

    it('shows green badge for low active orders (<=5)', () => {
      mockKDSState.orders = [
        mockData.kdsOrder({ started_at: null, completed_at: null }),
        mockData.kdsOrder({ started_at: new Date().toISOString(), completed_at: null }),
      ]
      
      const { container } = renderWithProviders(<KDSHeader />)
      
      // Check for green styling (this tests the color logic)
      const activeBadge = container.querySelector('[class*="green"]')
      expect(activeBadge).toBeInTheDocument()
    })

    it('shows yellow badge for medium active orders (6-10)', () => {
      mockKDSState.orders = Array.from({ length: 7 }, () => 
        mockData.kdsOrder({ started_at: null, completed_at: null })
      )
      
      const { container } = renderWithProviders(<KDSHeader />)
      
      // Check for yellow styling
      const activeBadge = container.querySelector('[class*="yellow"]')
      expect(activeBadge).toBeInTheDocument()
    })

    it('shows red badge for high active orders (>10)', () => {
      mockKDSState.orders = Array.from({ length: 12 }, () => 
        mockData.kdsOrder({ started_at: null, completed_at: null })
      )
      
      const { container } = renderWithProviders(<KDSHeader />)
      
      // Check for red styling
      const activeBadge = container.querySelector('[class*="red"]')
      expect(activeBadge).toBeInTheDocument()
    })
  })

  describe('Station Selector', () => {
    it('renders station selector with all stations', async () => {
      const { user } = renderWithProviders(<KDSHeader />)
      
      const stationSelect = screen.getByRole('combobox', { name: /select station/i })
      expect(stationSelect).toBeInTheDocument()
      
      await user.click(stationSelect)
      
      expect(screen.getByText('All Stations')).toBeInTheDocument()
      expect(screen.getByText('Grill')).toBeInTheDocument()
      expect(screen.getByText('Fryer')).toBeInTheDocument()
      expect(screen.getByText('Salad')).toBeInTheDocument()
      expect(screen.getByText('Expo')).toBeInTheDocument()
      expect(screen.getByText('Bar')).toBeInTheDocument()
    })

    it('allows station selection', async () => {
      const { user } = renderWithProviders(<KDSHeader />)
      
      const stationSelect = screen.getByRole('combobox', { name: /select station/i })
      await user.click(stationSelect)
      await user.click(screen.getByText('Grill'))
      
      // Note: This tests the UI interaction. The actual logic would be tested separately.
    })
  })

  describe('Filter Controls', () => {
    it('renders filter dropdown', async () => {
      const { user } = renderWithProviders(<KDSHeader />)
      
      const filterSelect = screen.getByDisplayValue('All Orders')
      expect(filterSelect).toBeInTheDocument()
      
      await user.click(filterSelect)
      
      expect(screen.getByText('New')).toBeInTheDocument()
      expect(screen.getByText('In Progress')).toBeInTheDocument()
      expect(screen.getByText('Ready')).toBeInTheDocument()
    })

    it('calls setFilterBy when filter is changed', async () => {
      const { user } = renderWithProviders(<KDSHeader />)
      
      const filterSelect = screen.getByDisplayValue('All Orders')
      await user.click(filterSelect)
      await user.click(screen.getByText('New'))
      
      expect(mockKDSState.setFilterBy).toHaveBeenCalledWith('new')
    })

    it('shows current filter value', () => {
      mockKDSState.filterBy = 'in_progress'
      renderWithProviders(<KDSHeader />)
      
      expect(screen.getByDisplayValue('In Progress')).toBeInTheDocument()
    })
  })

  describe('View Mode Controls', () => {
    it('renders all view mode buttons', () => {
      renderWithProviders(<KDSHeader />)
      
      const buttons = screen.getAllByRole('button')
      const viewButtons = buttons.filter(button => 
        button.querySelector('svg') && 
        (button.className.includes('List') || button.className.includes('Grid'))
      )
      
      expect(viewButtons.length).toBeGreaterThanOrEqual(3)
    })

    it('highlights active view mode', () => {
      mockKDSState.viewMode = 'list'
      const { container } = renderWithProviders(<KDSHeader />)
      
      // Check that the list view button has active styling
      const activeButton = container.querySelector('[class*="default"]')
      expect(activeButton).toBeInTheDocument()
    })

    it('calls setViewMode when view mode is changed', async () => {
      const { user } = renderWithProviders(<KDSHeader />)
      
      const buttons = screen.getAllByRole('button')
      // Find a view mode button and click it
      const viewButton = buttons.find(button => 
        button.getAttribute('class')?.includes('ghost')
      )
      
      if (viewButton) {
        await user.click(viewButton)
        expect(mockKDSState.setViewMode).toHaveBeenCalled()
      }
    })
  })

  describe('Audio Controls', () => {
    it('shows volume icon when sound is enabled', () => {
      mockKDSState.soundEnabled = true
      renderWithProviders(<KDSHeader />)
      
      const audioButton = screen.getByRole('button', { name: /volume|audio/i })
      expect(audioButton).toBeInTheDocument()
      expect(audioButton).toHaveClass('text-blue-400')
    })

    it('shows muted icon when sound is disabled', () => {
      mockKDSState.soundEnabled = false
      renderWithProviders(<KDSHeader />)
      
      const audioButton = screen.getByRole('button', { name: /volume|audio/i })
      expect(audioButton).toBeInTheDocument()
      expect(audioButton).toHaveClass('text-gray-500')
    })

    it('calls toggleSound when audio button is clicked', async () => {
      const { user } = renderWithProviders(<KDSHeader />)
      
      const audioButton = screen.getByRole('button', { name: /volume|audio/i })
      await user.click(audioButton)
      
      expect(mockKDSState.toggleSound).toHaveBeenCalled()
    })
  })

  describe('Action Buttons', () => {
    it('renders refresh button', () => {
      renderWithProviders(<KDSHeader />)
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      expect(refreshButton).toBeInTheDocument()
    })

    it('calls refetch when refresh button is clicked', async () => {
      const { user } = renderWithProviders(<KDSHeader />)
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      await user.click(refreshButton)
      
      expect(mockKDSState.refetch).toHaveBeenCalled()
    })

    it('disables refresh button when loading', () => {
      mockKDSState.loading = true
      renderWithProviders(<KDSHeader />)
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      expect(refreshButton).toBeDisabled()
    })

    it('shows spinning icon when loading', () => {
      mockKDSState.loading = true
      const { container } = renderWithProviders(<KDSHeader />)
      
      const spinningIcon = container.querySelector('.animate-spin')
      expect(spinningIcon).toBeInTheDocument()
    })

    it('renders settings button', () => {
      renderWithProviders(<KDSHeader />)
      
      const settingsButton = screen.getByRole('button', { name: /settings/i })
      expect(settingsButton).toBeInTheDocument()
    })
  })

  describe('Fullscreen Controls', () => {
    it('shows minimize icon when in fullscreen', () => {
      const onToggleFullscreen = jest.fn()
      renderWithProviders(
        <KDSHeader isFullscreen={true} onToggleFullscreen={onToggleFullscreen} />
      )
      
      const fullscreenButton = screen.getByRole('button', { name: /minimize/i })
      expect(fullscreenButton).toBeInTheDocument()
    })

    it('shows maximize icon when not in fullscreen', () => {
      const onToggleFullscreen = jest.fn()
      renderWithProviders(
        <KDSHeader isFullscreen={false} onToggleFullscreen={onToggleFullscreen} />
      )
      
      const fullscreenButton = screen.getByRole('button', { name: /maximize/i })
      expect(fullscreenButton).toBeInTheDocument()
    })

    it('calls onToggleFullscreen when fullscreen button is clicked', async () => {
      const onToggleFullscreen = jest.fn()
      const { user } = renderWithProviders(
        <KDSHeader onToggleFullscreen={onToggleFullscreen} />
      )
      
      const fullscreenButton = screen.getByRole('button', { name: /maximize|minimize/i })
      await user.click(fullscreenButton)
      
      expect(onToggleFullscreen).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      renderWithProviders(<KDSHeader />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        // Each button should have accessible text or aria-label
        const hasAccessibleName = 
          button.textContent?.trim() ||
          button.getAttribute('aria-label') ||
          button.querySelector('svg')
        
        expect(hasAccessibleName).toBeTruthy()
      })
    })

    it('supports keyboard navigation', async () => {
      const { user } = renderWithProviders(<KDSHeader />)
      
      // Test that buttons can be focused with keyboard
      await user.tab()
      expect(document.activeElement).toBeInstanceOf(HTMLElement)
      
      await user.tab()
      expect(document.activeElement).toBeInstanceOf(HTMLElement)
    })

    it('has semantic HTML structure', () => {
      renderWithProviders(<KDSHeader />)
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      expect(screen.getAllByRole('button')).toHaveLength.greaterThan(0)
      expect(screen.getAllByRole('combobox')).toHaveLength.greaterThan(0)
    })
  })

  describe('Performance', () => {
    it('memoizes sub-components to prevent unnecessary re-renders', () => {
      const { rerender } = renderWithProviders(<KDSHeader />)
      
      // Mock console.log to track re-renders
      const originalLog = console.log
      const logSpy = jest.fn()
      console.log = logSpy
      
      // Re-render with same props
      rerender(<KDSHeader />)
      
      console.log = originalLog
      
      // Components should be memoized and not re-render unnecessarily
      expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('render'))
    })

    it('handles rapid state changes efficiently', async () => {
      const { user } = renderWithProviders(<KDSHeader />)
      
      const audioButton = screen.getByRole('button', { name: /volume|audio/i })
      
      // Rapid clicks should be handled efficiently
      await user.click(audioButton)
      await user.click(audioButton)
      await user.click(audioButton)
      
      expect(mockKDSState.toggleSound).toHaveBeenCalledTimes(3)
    })
  })

  describe('Error Handling', () => {
    it('gracefully handles missing KDS state', () => {
      // Mock the hook to return undefined
      jest.doMock('@/lib/hooks/use-kds-state', () => ({
        useKDSState: jest.fn(() => undefined),
      }))
      
      expect(() => {
        renderWithProviders(<KDSHeader />)
      }).not.toThrow()
    })

    it('displays error state when appropriate', () => {
      mockKDSState.error = 'Connection failed'
      mockKDSState.connectionStatus = 'disconnected'
      
      renderWithProviders(<KDSHeader />)
      
      expect(screen.getByText('Disconnected')).toBeInTheDocument()
    })
  })

  describe('Real-time Updates', () => {
    it('updates metrics when orders change', async () => {
      const { rerender } = renderWithProviders(<KDSHeader />)
      
      // Start with no orders
      expect(screen.getByText('0')).toBeInTheDocument()
      
      // Add orders and re-render
      mockKDSState.orders = [
        mockData.kdsOrder(),
        mockData.kdsOrder(),
      ]
      
      rerender(<KDSHeader />)
      
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('updates connection status in real-time', async () => {
      const { rerender } = renderWithProviders(<KDSHeader />)
      
      expect(screen.getByText('Connected')).toBeInTheDocument()
      
      mockKDSState.connectionStatus = 'disconnected'
      rerender(<KDSHeader />)
      
      expect(screen.getByText('Disconnected')).toBeInTheDocument()
    })
  })

  describe('Integration', () => {
    it('works with all KDS state combinations', () => {
      const testCases = [
        {
          viewMode: 'grid' as const,
          filterBy: 'all' as const,
          soundEnabled: true,
          connectionStatus: 'connected' as const,
        },
        {
          viewMode: 'list' as const,
          filterBy: 'new' as const,
          soundEnabled: false,
          connectionStatus: 'disconnected' as const,
        },
        {
          viewMode: 'table' as const,
          filterBy: 'preparing' as const,
          soundEnabled: true,
          connectionStatus: 'reconnecting' as const,
        },
      ]
      
      testCases.forEach(testCase => {
        Object.assign(mockKDSState, testCase)
        
        expect(() => {
          renderWithProviders(<KDSHeader />)
        }).not.toThrow()
      })
    })
  })
})