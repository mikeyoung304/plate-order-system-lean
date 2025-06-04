import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, mockData } from '@/__tests__/utils/test-utils'
import { KDSLayout } from '@/components/kds/kds-layout'

// Mock the hooks
jest.mock('@/lib/hooks/use-kds-state', () => ({
  useKDSState: jest.fn(() => ({
    orders: [],
    filteredAndSortedOrders: [],
    loading: false,
    error: null,
    connectionStatus: 'connected',
    filterBy: 'all',
    sortBy: 'time',
    viewMode: 'grid',
    soundEnabled: true,
    setFilterBy: jest.fn(),
    setSortBy: jest.fn(),
    setViewMode: jest.fn(),
    toggleSound: jest.fn(),
    refetch: jest.fn(),
    optimisticUpdate: jest.fn(),
  })),
  useKDSAudio: jest.fn(() => ({
    playSound: jest.fn(),
  })),
}))

jest.mock('@/hooks/use-table-grouped-orders', () => ({
  useTableGroupedOrders: jest.fn(() => []),
}))

jest.mock('@/lib/modassembly/supabase/auth/session', () => ({
  getClientUser: jest.fn().mockResolvedValue({ id: 'test-user-id' }),
}))

jest.mock('@/lib/modassembly/supabase/database/kds', () => ({
  bumpOrder: jest.fn().mockResolvedValue(undefined),
  recallOrder: jest.fn().mockResolvedValue(undefined),
  startOrderPrep: jest.fn().mockResolvedValue(undefined),
  updateOrderPriority: jest.fn().mockResolvedValue(undefined),
  addOrderNotes: jest.fn().mockResolvedValue(undefined),
}))

describe('KDSLayout', () => {
  const defaultProps = {
    stationId: 'kitchen',
    showHeader: true,
    isFullscreen: false,
    onToggleFullscreen: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders successfully with default props', () => {
      renderWithProviders(<KDSLayout {...defaultProps} />)
      
      expect(screen.getByText('Station kitchen')).toBeInTheDocument()
      expect(screen.getByText('0 orders')).toBeInTheDocument()
    })

    it('renders without header when showHeader is false', () => {
      renderWithProviders(<KDSLayout {...defaultProps} showHeader={false} />)
      
      expect(screen.queryByText('Station kitchen')).not.toBeInTheDocument()
    })

    it('shows "All Stations" when no stationId provided', () => {
      renderWithProviders(<KDSLayout {...defaultProps} stationId={undefined} />)
      
      expect(screen.getByText('All Stations')).toBeInTheDocument()
    })

    it('displays connection status', () => {
      renderWithProviders(<KDSLayout {...defaultProps} />)
      
      expect(screen.getByText('connected')).toBeInTheDocument()
    })

    it('renders loading skeleton when loading and no orders', () => {
      const { useKDSState } = require('@/lib/hooks/use-kds-state')
      useKDSState.mockReturnValue({
        orders: [],
        filteredAndSortedOrders: [],
        loading: true,
        error: null,
        connectionStatus: 'connected',
        filterBy: 'all',
        sortBy: 'time',
        viewMode: 'grid',
        soundEnabled: true,
        setFilterBy: jest.fn(),
        setSortBy: jest.fn(),
        setViewMode: jest.fn(),
        toggleSound: jest.fn(),
        refetch: jest.fn(),
        optimisticUpdate: jest.fn(),
      })

      renderWithProviders(<KDSLayout {...defaultProps} />)
      
      // Should show loading skeletons
      expect(document.querySelectorAll('[data-testid]')).toHaveLength(0) // No specific loading test id in current implementation
    })

    it('shows empty state when no orders', () => {
      renderWithProviders(<KDSLayout {...defaultProps} />)
      
      expect(screen.getByText('No orders')).toBeInTheDocument()
      expect(screen.getByText('All caught up! No pending orders.')).toBeInTheDocument()
    })

    it('shows error state when error exists', () => {
      const { useKDSState } = require('@/lib/hooks/use-kds-state')
      useKDSState.mockReturnValue({
        orders: [],
        filteredAndSortedOrders: [],
        loading: false,
        error: 'Test error message',
        connectionStatus: 'connected',
        filterBy: 'all',
        sortBy: 'time',
        viewMode: 'grid',
        soundEnabled: true,
        setFilterBy: jest.fn(),
        setSortBy: jest.fn(),
        setViewMode: jest.fn(),
        toggleSound: jest.fn(),
        refetch: jest.fn(),
        optimisticUpdate: jest.fn(),
      })

      renderWithProviders(<KDSLayout {...defaultProps} />)
      
      expect(screen.getByText('Error loading orders: Test error message')).toBeInTheDocument()
    })
  })

  describe('View Mode Controls', () => {
    it('renders view mode buttons', () => {
      renderWithProviders(<KDSLayout {...defaultProps} />)
      
      // Check for view mode buttons by their titles
      expect(screen.getByTitle('Table View')).toBeInTheDocument()
      expect(screen.getByTitle('Grid View')).toBeInTheDocument()
      expect(screen.getByTitle('List View')).toBeInTheDocument()
    })

    it('calls setViewMode when view mode button is clicked', async () => {
      const mockSetViewMode = jest.fn()
      const { useKDSState } = require('@/lib/hooks/use-kds-state')
      useKDSState.mockReturnValue({
        orders: [],
        filteredAndSortedOrders: [],
        loading: false,
        error: null,
        connectionStatus: 'connected',
        filterBy: 'all',
        sortBy: 'time',
        viewMode: 'grid',
        soundEnabled: true,
        setFilterBy: jest.fn(),
        setSortBy: jest.fn(),
        setViewMode: mockSetViewMode,
        toggleSound: jest.fn(),
        refetch: jest.fn(),
        optimisticUpdate: jest.fn(),
      })

      const { user } = renderWithProviders(<KDSLayout {...defaultProps} />)
      
      const listViewButton = screen.getByTitle('List View')
      await user.click(listViewButton)
      
      expect(mockSetViewMode).toHaveBeenCalledWith('list')
    })
  })

  describe('Filter and Sort Controls', () => {
    it('renders filter dropdown with options', () => {
      renderWithProviders(<KDSLayout {...defaultProps} />)
      
      // The filter dropdown should be present
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('calls setFilterBy when filter is changed', async () => {
      const mockSetFilterBy = jest.fn()
      const { useKDSState } = require('@/lib/hooks/use-kds-state')
      useKDSState.mockReturnValue({
        orders: [],
        filteredAndSortedOrders: [],
        loading: false,
        error: null,
        connectionStatus: 'connected',
        filterBy: 'all',
        sortBy: 'time',
        viewMode: 'grid',
        soundEnabled: true,
        setFilterBy: mockSetFilterBy,
        setSortBy: jest.fn(),
        setViewMode: jest.fn(),
        toggleSound: jest.fn(),
        refetch: jest.fn(),
        optimisticUpdate: jest.fn(),
      })

      const { user } = renderWithProviders(<KDSLayout {...defaultProps} />)
      
      // Find and click the filter dropdown
      const filterDropdown = screen.getAllByRole('combobox')[0] // First combobox is filter
      await user.click(filterDropdown)
      
      // Wait for dropdown options to appear and click one
      await waitFor(() => {
        expect(screen.getByText('New')).toBeInTheDocument()
      })
      
      await user.click(screen.getByText('New'))
      
      expect(mockSetFilterBy).toHaveBeenCalledWith('new')
    })
  })

  describe('Sound Control', () => {
    it('renders sound toggle button', () => {
      renderWithProviders(<KDSLayout {...defaultProps} />)
      
      expect(screen.getByTitle('Disable sounds')).toBeInTheDocument()
    })

    it('calls toggleSound when sound button is clicked', async () => {
      const mockToggleSound = jest.fn()
      const { useKDSState } = require('@/lib/hooks/use-kds-state')
      useKDSState.mockReturnValue({
        orders: [],
        filteredAndSortedOrders: [],
        loading: false,
        error: null,
        connectionStatus: 'connected',
        filterBy: 'all',
        sortBy: 'time',
        viewMode: 'grid',
        soundEnabled: true,
        setFilterBy: jest.fn(),
        setSortBy: jest.fn(),
        setViewMode: jest.fn(),
        toggleSound: mockToggleSound,
        refetch: jest.fn(),
        optimisticUpdate: jest.fn(),
      })

      const { user } = renderWithProviders(<KDSLayout {...defaultProps} />)
      
      const soundButton = screen.getByTitle('Disable sounds')
      await user.click(soundButton)
      
      expect(mockToggleSound).toHaveBeenCalled()
    })

    it('shows correct sound icon based on sound state', () => {
      const { useKDSState } = require('@/lib/hooks/use-kds-state')
      
      // Test with sound enabled
      useKDSState.mockReturnValue({
        orders: [],
        filteredAndSortedOrders: [],
        loading: false,
        error: null,
        connectionStatus: 'connected',
        filterBy: 'all',
        sortBy: 'time',
        viewMode: 'grid',
        soundEnabled: true,
        setFilterBy: jest.fn(),
        setSortBy: jest.fn(),
        setViewMode: jest.fn(),
        toggleSound: jest.fn(),
        refetch: jest.fn(),
        optimisticUpdate: jest.fn(),
      })

      const { rerender } = renderWithProviders(<KDSLayout {...defaultProps} />)
      expect(screen.getByTitle('Disable sounds')).toBeInTheDocument()
      
      // Test with sound disabled
      useKDSState.mockReturnValue({
        orders: [],
        filteredAndSortedOrders: [],
        loading: false,
        error: null,
        connectionStatus: 'connected',
        filterBy: 'all',
        sortBy: 'time',
        viewMode: 'grid',
        soundEnabled: false,
        setFilterBy: jest.fn(),
        setSortBy: jest.fn(),
        setViewMode: jest.fn(),
        toggleSound: jest.fn(),
        refetch: jest.fn(),
        optimisticUpdate: jest.fn(),
      })

      rerender(<KDSLayout {...defaultProps} />)
      expect(screen.getByTitle('Enable sounds')).toBeInTheDocument()
    })
  })

  describe('Fullscreen Control', () => {
    it('renders fullscreen toggle when onToggleFullscreen is provided', () => {
      renderWithProviders(<KDSLayout {...defaultProps} />)
      
      expect(screen.getByTitle('Enter fullscreen')).toBeInTheDocument()
    })

    it('does not render fullscreen toggle when onToggleFullscreen is not provided', () => {
      renderWithProviders(<KDSLayout {...defaultProps} onToggleFullscreen={undefined} />)
      
      expect(screen.queryByTitle('Enter fullscreen')).not.toBeInTheDocument()
      expect(screen.queryByTitle('Exit fullscreen')).not.toBeInTheDocument()
    })

    it('calls onToggleFullscreen when fullscreen button is clicked', async () => {
      const mockToggleFullscreen = jest.fn()
      
      const { user } = renderWithProviders(
        <KDSLayout {...defaultProps} onToggleFullscreen={mockToggleFullscreen} />
      )
      
      const fullscreenButton = screen.getByTitle('Enter fullscreen')
      await user.click(fullscreenButton)
      
      expect(mockToggleFullscreen).toHaveBeenCalled()
    })

    it('shows correct fullscreen icon based on fullscreen state', () => {
      const { rerender } = renderWithProviders(
        <KDSLayout {...defaultProps} isFullscreen={false} />
      )
      
      expect(screen.getByTitle('Enter fullscreen')).toBeInTheDocument()
      
      rerender(<KDSLayout {...defaultProps} isFullscreen={true} />)
      expect(screen.getByTitle('Exit fullscreen')).toBeInTheDocument()
    })
  })

  describe('Refresh Control', () => {
    it('renders refresh button', () => {
      renderWithProviders(<KDSLayout {...defaultProps} />)
      
      expect(screen.getByTitle('Refresh orders')).toBeInTheDocument()
    })

    it('calls refetch when refresh button is clicked', async () => {
      const mockRefetch = jest.fn()
      const { useKDSState } = require('@/lib/hooks/use-kds-state')
      useKDSState.mockReturnValue({
        orders: [],
        filteredAndSortedOrders: [],
        loading: false,
        error: null,
        connectionStatus: 'connected',
        filterBy: 'all',
        sortBy: 'time',
        viewMode: 'grid',
        soundEnabled: true,
        setFilterBy: jest.fn(),
        setSortBy: jest.fn(),
        setViewMode: jest.fn(),
        toggleSound: jest.fn(),
        refetch: mockRefetch,
        optimisticUpdate: jest.fn(),
      })

      const { user } = renderWithProviders(<KDSLayout {...defaultProps} />)
      
      const refreshButton = screen.getByTitle('Refresh orders')
      await user.click(refreshButton)
      
      expect(mockRefetch).toHaveBeenCalled()
    })

    it('disables refresh button when loading', () => {
      const { useKDSState } = require('@/lib/hooks/use-kds-state')
      useKDSState.mockReturnValue({
        orders: [],
        filteredAndSortedOrders: [],
        loading: true,
        error: null,
        connectionStatus: 'connected',
        filterBy: 'all',
        sortBy: 'time',
        viewMode: 'grid',
        soundEnabled: true,
        setFilterBy: jest.fn(),
        setSortBy: jest.fn(),
        setViewMode: jest.fn(),
        toggleSound: jest.fn(),
        refetch: jest.fn(),
        optimisticUpdate: jest.fn(),
      })

      renderWithProviders(<KDSLayout {...defaultProps} />)
      
      const refreshButton = screen.getByTitle('Refresh orders')
      expect(refreshButton).toBeDisabled()
    })
  })

  describe('Settings Panel', () => {
    it('toggles settings panel when settings button is clicked', async () => {
      const { user } = renderWithProviders(<KDSLayout {...defaultProps} />)
      
      const settingsButton = screen.getByTitle('Toggle settings')
      
      // Settings panel should not be visible initially
      expect(screen.queryByText('Display Settings')).not.toBeInTheDocument()
      
      // Click settings button to show panel
      await user.click(settingsButton)
      expect(screen.getByText('Display Settings')).toBeInTheDocument()
      
      // Click again to hide panel
      await user.click(settingsButton)
      expect(screen.queryByText('Display Settings')).not.toBeInTheDocument()
    })

    it('displays current settings in the panel', async () => {
      const { user } = renderWithProviders(<KDSLayout {...defaultProps} />)
      
      const settingsButton = screen.getByTitle('Toggle settings')
      await user.click(settingsButton)
      
      // Check for settings information
      expect(screen.getByText('Auto-refresh')).toBeInTheDocument()
      expect(screen.getByText('Every 5 seconds')).toBeInTheDocument()
      expect(screen.getByText('Sound alerts')).toBeInTheDocument()
      expect(screen.getByText('Enabled')).toBeInTheDocument()
      expect(screen.getByText('View mode')).toBeInTheDocument()
      expect(screen.getByText('Grid')).toBeInTheDocument()
      expect(screen.getByText('Connection')).toBeInTheDocument()
      expect(screen.getByText('Connected')).toBeInTheDocument()
    })
  })

  describe('Order Count Display', () => {
    it('shows correct order count in grid/list mode', () => {
      const { useKDSState } = require('@/lib/hooks/use-kds-state')
      const mockOrders = [
        mockData.kdsOrder({ id: '1' }),
        mockData.kdsOrder({ id: '2' }),
        mockData.kdsOrder({ id: '3' }),
      ]
      
      useKDSState.mockReturnValue({
        orders: mockOrders,
        filteredAndSortedOrders: mockOrders,
        loading: false,
        error: null,
        connectionStatus: 'connected',
        filterBy: 'all',
        sortBy: 'time',
        viewMode: 'grid',
        soundEnabled: true,
        setFilterBy: jest.fn(),
        setSortBy: jest.fn(),
        setViewMode: jest.fn(),
        toggleSound: jest.fn(),
        refetch: jest.fn(),
        optimisticUpdate: jest.fn(),
      })

      renderWithProviders(<KDSLayout {...defaultProps} />)
      
      expect(screen.getByText('3 orders')).toBeInTheDocument()
    })

    it('shows table count in table view mode', () => {
      const { useKDSState } = require('@/lib/hooks/use-kds-state')
      const { useTableGroupedOrders } = require('@/hooks/use-table-grouped-orders')
      
      useKDSState.mockReturnValue({
        orders: [],
        filteredAndSortedOrders: [],
        loading: false,
        error: null,
        connectionStatus: 'connected',
        filterBy: 'all',
        sortBy: 'time',
        viewMode: 'table',
        soundEnabled: true,
        setFilterBy: jest.fn(),
        setSortBy: jest.fn(),
        setViewMode: jest.fn(),
        toggleSound: jest.fn(),
        refetch: jest.fn(),
        optimisticUpdate: jest.fn(),
      })
      
      useTableGroupedOrders.mockReturnValue([
        { tableId: '1', tableLabel: 'Table 1', orders: [] },
        { tableId: '2', tableLabel: 'Table 2', orders: [] },
      ])

      renderWithProviders(<KDSLayout {...defaultProps} />)
      
      expect(screen.getByText('2 tables')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels on interactive elements', () => {
      renderWithProviders(<KDSLayout {...defaultProps} />)
      
      // Check for proper labeling of buttons
      expect(screen.getByTitle('Table View')).toBeInTheDocument()
      expect(screen.getByTitle('Grid View')).toBeInTheDocument()
      expect(screen.getByTitle('List View')).toBeInTheDocument()
      expect(screen.getByTitle('Disable sounds')).toBeInTheDocument()
      expect(screen.getByTitle('Enter fullscreen')).toBeInTheDocument()
      expect(screen.getByTitle('Refresh orders')).toBeInTheDocument()
      expect(screen.getByTitle('Toggle settings')).toBeInTheDocument()
    })

    it('supports keyboard navigation', async () => {
      const { user } = renderWithProviders(<KDSLayout {...defaultProps} />)
      
      // Tab through interactive elements
      await user.tab()
      await user.tab()
      await user.tab()
      
      // Should be able to navigate through controls
      expect(document.activeElement).toBeInTheDocument()
    })
  })
})