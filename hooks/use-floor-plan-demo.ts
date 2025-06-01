/**
 * DEMO MODE FLOOR PLAN HOOK
 * 
 * This hook provides the same interface as the regular floor plan hook,
 * but stores data in session storage instead of the database.
 * Perfect for demo users who want to play with the floor plan without
 * affecting real data.
 */

"use client"

import { useReducer, useCallback, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import type { Table } from "@/lib/floor-plan-utils"

// DEMO TABLES - Default restaurant layout
const DEMO_TABLES: Table[] = [
  { id: "table-1", label: "Table 1", x: 100, y: 100, width: 120, height: 80, type: "rectangle", seats: 4, rotation: 0 },
  { id: "table-2", label: "Table 2", x: 300, y: 100, width: 120, height: 80, type: "rectangle", seats: 4, rotation: 0 },
  { id: "table-3", label: "Table 3", x: 500, y: 100, width: 120, height: 80, type: "rectangle", seats: 4, rotation: 0 },
  { id: "table-4", label: "Table 4", x: 100, y: 250, width: 100, height: 100, type: "circle", seats: 6, rotation: 0 },
  { id: "table-5", label: "Table 5", x: 300, y: 250, width: 100, height: 100, type: "circle", seats: 6, rotation: 0 },
  { id: "table-6", label: "Table 6", x: 500, y: 250, width: 100, height: 100, type: "circle", seats: 6, rotation: 0 },
  { id: "table-7", label: "Table 7", x: 200, y: 400, width: 140, height: 90, type: "rectangle", seats: 8, rotation: 0 },
  { id: "table-8", label: "Table 8", x: 400, y: 400, width: 140, height: 90, type: "rectangle", seats: 8, rotation: 0 }
]

// DEMO STATE INTERFACE - Same as regular floor plan
interface DemoFloorPlanState {
  tables: Table[]
  originalTables: Table[]
  selectedTable: Table | null
  undoStack: Table[][]
  canUndo: boolean
  canRedo: boolean
  isLoading: boolean
  isSaving: boolean
  error: string | null
  hasUnsavedChanges: boolean
  ui: {
    isGridVisible: boolean
    gridSize: number
    snapToGrid: boolean
    showTableLabels: boolean
  }
}

// ACTIONS - Same interface as regular floor plan
type DemoFloorPlanAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; tables: Table[] }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'SAVE_START' }
  | { type: 'SAVE_SUCCESS' }
  | { type: 'SAVE_ERROR'; error: string }
  | { type: 'SELECT_TABLE'; table: Table | null }
  | { type: 'UPDATE_TABLE'; tableId: string; updates: Partial<Table> }
  | { type: 'ADD_TABLE'; table: Table }
  | { type: 'DELETE_TABLE'; tableId: string }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'TOGGLE_GRID' }
  | { type: 'SET_GRID_SIZE'; size: number }
  | { type: 'TOGGLE_SNAP_TO_GRID' }
  | { type: 'TOGGLE_TABLE_LABELS' }
  | { type: 'RESET_CHANGES' }

const initialState: DemoFloorPlanState = {
  tables: [],
  originalTables: [],
  selectedTable: null,
  undoStack: [],
  canUndo: false,
  canRedo: false,
  isLoading: true,
  isSaving: false,
  error: null,
  hasUnsavedChanges: false,
  ui: {
    isGridVisible: true,
    gridSize: 50,
    snapToGrid: true,
    showTableLabels: true
  }
}

// DEMO REDUCER - Same logic as regular but simpler
function demoFloorPlanReducer(state: DemoFloorPlanState, action: DemoFloorPlanAction): DemoFloorPlanState {
  switch (action.type) {
    case 'LOAD_START':
      return {
        ...state,
        isLoading: true,
        error: null
      }
    
    case 'LOAD_SUCCESS':
      return {
        ...state,
        isLoading: false,
        tables: action.tables,
        originalTables: action.tables,
        hasUnsavedChanges: false,
        error: null
      }
    
    case 'LOAD_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.error
      }
    
    case 'SAVE_START':
      return {
        ...state,
        isSaving: true,
        error: null
      }
    
    case 'SAVE_SUCCESS':
      return {
        ...state,
        isSaving: false,
        originalTables: state.tables,
        hasUnsavedChanges: false,
        error: null
      }
    
    case 'SAVE_ERROR':
      return {
        ...state,
        isSaving: false,
        error: action.error
      }
    
    case 'SELECT_TABLE':
      return {
        ...state,
        selectedTable: action.table
      }
    
    case 'UPDATE_TABLE': {
      const updatedTables = state.tables.map(table =>
        table.id === action.tableId
          ? { ...table, ...action.updates }
          : table
      )
      
      return {
        ...state,
        tables: updatedTables,
        hasUnsavedChanges: true,
        undoStack: [...state.undoStack, state.tables].slice(-10),
        canUndo: true
      }
    }
    
    case 'ADD_TABLE':
      return {
        ...state,
        tables: [...state.tables, action.table],
        hasUnsavedChanges: true,
        undoStack: [...state.undoStack, state.tables].slice(-10),
        canUndo: true
      }
    
    case 'DELETE_TABLE': {
      const filteredTables = state.tables.filter(table => table.id !== action.tableId)
      return {
        ...state,
        tables: filteredTables,
        selectedTable: state.selectedTable?.id === action.tableId ? null : state.selectedTable,
        hasUnsavedChanges: true,
        undoStack: [...state.undoStack, state.tables].slice(-10),
        canUndo: true
      }
    }
    
    case 'UNDO': {
      const previousState = state.undoStack[state.undoStack.length - 1]
      if (!previousState) return state
      
      return {
        ...state,
        tables: previousState,
        undoStack: state.undoStack.slice(0, -1),
        canUndo: state.undoStack.length > 1,
        canRedo: true,
        hasUnsavedChanges: true
      }
    }
    
    case 'TOGGLE_GRID':
      return {
        ...state,
        ui: {
          ...state.ui,
          isGridVisible: !state.ui.isGridVisible
        }
      }
    
    case 'SET_GRID_SIZE':
      return {
        ...state,
        ui: {
          ...state.ui,
          gridSize: action.size
        }
      }
    
    case 'TOGGLE_SNAP_TO_GRID':
      return {
        ...state,
        ui: {
          ...state.ui,
          snapToGrid: !state.ui.snapToGrid
        }
      }
    
    case 'TOGGLE_TABLE_LABELS':
      return {
        ...state,
        ui: {
          ...state.ui,
          showTableLabels: !state.ui.showTableLabels
        }
      }
    
    case 'RESET_CHANGES':
      return {
        ...state,
        tables: state.originalTables,
        hasUnsavedChanges: false,
        selectedTable: null,
        undoStack: [],
        canUndo: false,
        canRedo: false
      }
    
    default:
      return state
  }
}

/**
 * DEMO FLOOR PLAN HOOK
 * 
 * Provides the same interface as the regular floor plan hook,
 * but stores data in session storage for demo purposes.
 * Perfect for letting users experiment without affecting real data.
 */
export function useFloorPlanDemo(floorPlanId: string = 'demo') {
  const [state, dispatch] = useReducer(demoFloorPlanReducer, initialState)
  const { toast } = useToast()
  
  const STORAGE_KEY = `demo-floor-plan-${floorPlanId}`

  // Load from session storage or use demo data
  const loadFloorPlan = useCallback(async () => {
    dispatch({ type: 'LOAD_START' })
    
    try {
      // Simulate loading delay for realism
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const saved = sessionStorage.getItem(STORAGE_KEY)
      const tables = saved ? JSON.parse(saved) : DEMO_TABLES
      
      dispatch({ type: 'LOAD_SUCCESS', tables })
    } catch (error) {
      console.error('Demo floor plan load error:', error)
      dispatch({ type: 'LOAD_ERROR', error: 'Failed to load demo floor plan' })
    }
  }, [STORAGE_KEY])

  // Save to session storage (temporary)
  const saveFloorPlan = useCallback(async () => {
    if (!state.hasUnsavedChanges) return
    
    dispatch({ type: 'SAVE_START' })
    
    try {
      // Simulate save delay for realism
      await new Promise(resolve => setTimeout(resolve, 300))
      
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.tables))
      dispatch({ type: 'SAVE_SUCCESS' })
      
      toast({
        title: "Demo Mode",
        description: "Changes saved temporarily (will reset when you close the browser)"
      })
    } catch (error) {
      console.error('Demo floor plan save error:', error)
      dispatch({ type: 'SAVE_ERROR', error: 'Failed to save demo floor plan' })
    }
  }, [state.tables, state.hasUnsavedChanges, STORAGE_KEY, toast])

  // Action creators (same interface as regular hook)
  const actions = {
    selectTable: useCallback((table: Table | null) => {
      dispatch({ type: 'SELECT_TABLE', table })
    }, []),
    
    updateTable: useCallback((tableId: string, updates: Partial<Table>) => {
      dispatch({ type: 'UPDATE_TABLE', tableId, updates })
    }, []),
    
    addTable: useCallback((table: Table) => {
      dispatch({ type: 'ADD_TABLE', table })
    }, []),
    
    deleteTable: useCallback((tableId: string) => {
      dispatch({ type: 'DELETE_TABLE', tableId })
    }, []),
    
    undo: useCallback(() => {
      dispatch({ type: 'UNDO' })
    }, []),
    
    resetChanges: useCallback(() => {
      dispatch({ type: 'RESET_CHANGES' })
    }, []),
    
    toggleGrid: useCallback(() => {
      dispatch({ type: 'TOGGLE_GRID' })
    }, []),
    
    setGridSize: useCallback((size: number) => {
      dispatch({ type: 'SET_GRID_SIZE', size })
    }, []),
    
    toggleSnapToGrid: useCallback(() => {
      dispatch({ type: 'TOGGLE_SNAP_TO_GRID' })
    }, []),
    
    toggleTableLabels: useCallback(() => {
      dispatch({ type: 'TOGGLE_TABLE_LABELS' })
    }, []),
    
    save: saveFloorPlan,
    reload: loadFloorPlan
  }

  // Load on mount
  useEffect(() => {
    loadFloorPlan()
  }, [loadFloorPlan])

  // Clear demo data when component unmounts (if user closes browser)
  useEffect(() => {
    return () => {
      // Cleanup happens automatically when session ends
    }
  }, [])

  return [state, actions] as const
}