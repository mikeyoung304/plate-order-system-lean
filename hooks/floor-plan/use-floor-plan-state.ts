'use client'

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { Table } from '@/lib/floor-plan-utils'
import {
  saveFloorPlanTables,
  loadFloorPlanTables,
} from '@/lib/modassembly/supabase/database/floor-plan'

// Import domain-specific reducers
import { useTableReducer } from './use-table-reducer'
import { useCanvasReducer } from './use-canvas-reducer'
import { useUIReducer } from './use-ui-reducer'
import { useHistoryReducer } from './use-history-reducer'

// Async state for loading/saving operations
interface AsyncState {
  isLoading: boolean
  isSaving: boolean
  loadError: string | null
}

/**
 * Composite Floor Plan State Hook
 * 
 * This hook combines multiple domain-specific reducers to manage
 * the complex state of the floor plan editor. It replaces the
 * monolithic 865-line reducer with focused, maintainable modules.
 * 
 * Architecture Benefits:
 * - Single Responsibility: Each reducer handles one domain
 * - Better Performance: Selective re-renders based on domain changes
 * - Easier Testing: Individual reducers can be tested in isolation
 * - Enhanced Maintainability: Clear separation of concerns
 */
export function useFloorPlanState(floorPlanId: string) {
  const { toast } = useToast()
  const isMountedRef = useRef(true)
  
  // Domain-specific reducers
  const tableState = useTableReducer(floorPlanId)
  const canvasState = useCanvasReducer()
  const uiState = useUIReducer()
  const historyState = useHistoryReducer()

  // Async state for operations
  const [asyncState, setAsyncState] = useReducer(
    (state: AsyncState, updates: Partial<AsyncState>) => ({ ...state, ...updates }),
    { isLoading: true, isSaving: false, loadError: null }
  )

  // Logger for debugging
  const logger = useMemo(() => ({
    info: (message: string, ...args: any[]) =>
      console.log(`[FloorPlanState] ${message}`, ...args),
    error: (message: string, ...args: any[]) =>
      console.error(`[FloorPlanState] ${message}`, ...args),
    warning: (message: string, ...args: any[]) =>
      console.warn(`[FloorPlanState] ${message}`, ...args),
  }), [])

  // Toast helper
  const showToast = useCallback((
    message: string,
    type: 'success' | 'error' | 'warning' | 'default' = 'default'
  ) => {
    toast({
      title: type.charAt(0).toUpperCase() + type.slice(1),
      description: message,
      variant: type === 'error' ? 'destructive' : 'default',
    })
  }, [toast])

  // Combined selectors from all reducers
  const selectors = useMemo(() => ({
    // Table selectors
    ...tableState.selectors,
    
    // Canvas selectors
    ...canvasState.selectors,
    
    // UI selectors
    ...uiState.selectors,
    
    // History selectors
    ...historyState.selectors,
    
    // Async selectors
    isLoading: asyncState.isLoading,
    isSaving: asyncState.isSaving,
    loadError: asyncState.loadError,
    
    // Combined computed selectors
    tables: tableState.state.tables,
    selectedTable: tableState.selectors.selectedTable,
    canvasState: canvasState.state,
    uiState: uiState.state,
    hasUnsavedChanges: tableState.selectors.hasUnsavedChanges,
  }), [
    tableState.selectors,
    canvasState.selectors,
    uiState.selectors,
    historyState.selectors,
    asyncState,
    tableState.state.tables,
  ])

  // Data operations
  const loadTables = useCallback(async () => {
    logger.info(`Loading tables for floor plan: ${floorPlanId}`)
    setAsyncState({ isLoading: true, loadError: null })

    try {
      const floorPlanTables = await loadFloorPlanTables()

      const frontendTables: Table[] = floorPlanTables.map((table, index) => {
        const row = Math.floor(index / 3)
        const col = index % 3
        const fallbackX = 100 + col * 150
        const fallbackY = 100 + row * 150

        return {
          id: table.id,
          label: table.label,
          type: table.type,
          seats: table.seats,
          status: table.status,
          x: (table as any).position_x ?? (table as any).x ?? fallbackX,
          y: (table as any).position_y ?? (table as any).y ?? fallbackY,
          width: (table as any).width ?? (table.type === 'circle' ? 80 : table.type === 'square' ? 100 : 120),
          height: (table as any).height ?? (table.type === 'circle' ? 80 : table.type === 'square' ? 100 : 80),
          rotation: (table as any).rotation ?? 0,
          zIndex: (table as any).zIndex ?? 1,
          floor_plan_id: floorPlanId,
        }
      })

      logger.info(`Retrieved ${frontendTables.length} tables for floor plan`)

      // Check if component is still mounted before updating state
      if (!isMountedRef.current) {
        logger.info('Component unmounted, skipping table state update')
        return
      }

      // Update both current and original tables
      tableState.actions.setTables(frontendTables)
      tableState.actions.setOriginalTables(frontendTables)
      tableState.actions.setUnsavedChanges(false)
      
      // Add initial state to history
      historyState.actions.addToHistory(frontendTables)
      
      setAsyncState({ isLoading: false })
    } catch (error: any) {
      const errorMsg = `Error loading tables: ${error.message}`
      logger.error(errorMsg)
      setAsyncState({ isLoading: false, loadError: errorMsg })
      showToast('Failed to load floor plan tables', 'error')
    }
  }, [floorPlanId, logger, showToast, tableState.actions, historyState.actions])

  const saveTables = useCallback(async (): Promise<boolean> => {
    if (!floorPlanId) {
      logger.error('Cannot save tables: No floor plan ID provided')
      return false
    }

    setAsyncState({ isSaving: true })
    logger.info(`Saving ${tableState.state.tables.length} tables to floor plan ${floorPlanId}`)

    try {
      const backendTables = tableState.state.tables.map(table => ({
        id: table.id,
        table_id: table.id,
        label: table.label,
        type: table.type,
        status: table.status,
        position_x: table.x,
        position_y: table.y,
        width: table.width,
        height: table.height,
        rotation: table.rotation,
        seats: table.seats,
        floor_plan_id: floorPlanId,
      }))

      await saveFloorPlanTables(backendTables as any)
      
      // Update original tables and mark as saved
      tableState.actions.setOriginalTables(tableState.state.tables)
      tableState.actions.setUnsavedChanges(false)
      
      setAsyncState({ isSaving: false })
      showToast('Floor plan saved successfully', 'success')
      logger.info('Floor plan saved successfully')
      return true
    } catch (error: any) {
      const errorMsg = `Error saving tables: ${error.message}`
      logger.error(errorMsg)
      setAsyncState({ isSaving: false })
      showToast('Failed to save floor plan changes', 'error')
      return false
    }
  }, [floorPlanId, tableState.state.tables, tableState.actions, logger, showToast])

  // Enhanced actions that coordinate between reducers
  const enhancedActions = useMemo(() => ({
    // Table actions with history tracking
    updateTableWithHistory: (id: string, updates: Partial<Table>) => {
      historyState.actions.addToHistory(tableState.state.tables)
      tableState.actions.updateTable(id, updates)
    },
    
    addTableWithHistory: (table: Table) => {
      historyState.actions.addToHistory(tableState.state.tables)
      tableState.actions.addTable(table)
    },
    
    deleteTableWithHistory: (id: string) => {
      historyState.actions.addToHistory(tableState.state.tables)
      tableState.actions.deleteTable(id)
    },
    
    duplicateTableWithHistory: (id: string) => {
      historyState.actions.addToHistory(tableState.state.tables)
      tableState.actions.duplicateTable(id)
    },

    // Undo/Redo with table state sync
    undo: () => {
      if (historyState.selectors.canUndo) {
        const previousState = historyState.getPreviousState
        if (previousState) {
          historyState.actions.undo(tableState.state.tables)
          tableState.actions.setTables(previousState)
          showToast('Action undone', 'default')
        }
      }
    },

    redo: () => {
      if (historyState.selectors.canRedo) {
        const nextState = historyState.getNextState
        if (nextState) {
          historyState.actions.redo(tableState.state.tables)
          tableState.actions.setTables(nextState)
          showToast('Action redone', 'default')
        }
      }
    },

    // Viewport operations
    resetView: () => {
      canvasState.actions.resetView()
      showToast('View reset to center', 'default')
    },

    // Combined operations
    loadTables,
    saveTables,
  }), [
    tableState.state.tables,
    tableState.actions,
    historyState.actions,
    historyState.selectors,
    historyState.getPreviousState,
    historyState.getNextState,
    canvasState.actions,
    showToast,
    loadTables,
    saveTables,
  ])

  // Load tables on mount
  useEffect(() => {
    loadTables()
  }, [loadTables])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return {
    // Individual domain states
    tableState: tableState.state,
    canvasState: canvasState.state,
    uiState: uiState.state,
    historyState: historyState.state,
    asyncState,
    
    // Combined selectors
    selectors,
    
    // Individual domain actions
    tableActions: tableState.actions,
    canvasActions: canvasState.actions,
    uiActions: uiState.actions,
    historyActions: historyState.actions,
    
    // Enhanced coordinated actions
    actions: enhancedActions,
  }
}