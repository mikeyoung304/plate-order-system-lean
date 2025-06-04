'use client'

import { useReducer, useMemo } from 'react'
import type { Table } from '@/lib/floor-plan-utils'

// Table-specific state
export interface TableState {
  tables: Table[]
  originalTables: Table[]
  selectedTableId: string | null
  hoveredTableId: string | null
  floorPlanId: string
  unsavedChanges: boolean
}

// Table-specific actions
export type TableAction =
  | { type: 'SET_TABLES'; payload: Table[] }
  | { type: 'UPDATE_TABLE'; payload: { id: string; updates: Partial<Table> } }
  | { type: 'ADD_TABLE'; payload: Table }
  | { type: 'DELETE_TABLE'; payload: string }
  | { type: 'DUPLICATE_TABLE'; payload: string }
  | { type: 'SELECT_TABLE'; payload: string | null }
  | { type: 'SET_HOVERED_TABLE'; payload: string | null }
  | { type: 'SET_ORIGINAL_TABLES'; payload: Table[] }
  | { type: 'SET_UNSAVED_CHANGES'; payload: boolean }

const createInitialTableState = (floorPlanId: string): TableState => ({
  tables: [],
  originalTables: [],
  selectedTableId: null,
  hoveredTableId: null,
  floorPlanId,
  unsavedChanges: false,
})

function tableReducer(state: TableState, action: TableAction): TableState {
  switch (action.type) {
    case 'SET_TABLES':
      return {
        ...state,
        tables: action.payload,
        unsavedChanges: true,
      }

    case 'UPDATE_TABLE': {
      const { id, updates } = action.payload
      return {
        ...state,
        tables: state.tables.map(t =>
          t.id === id ? { ...t, ...updates } : t
        ),
        unsavedChanges: true,
      }
    }

    case 'ADD_TABLE':
      return {
        ...state,
        tables: [...state.tables, action.payload],
        unsavedChanges: true,
      }

    case 'DELETE_TABLE':
      return {
        ...state,
        tables: state.tables.filter(t => t.id !== action.payload),
        selectedTableId: state.selectedTableId === action.payload ? null : state.selectedTableId,
        hoveredTableId: state.hoveredTableId === action.payload ? null : state.hoveredTableId,
        unsavedChanges: true,
      }

    case 'DUPLICATE_TABLE': {
      const originalTable = state.tables.find(t => t.id === action.payload)
      if (!originalTable) return state
      
      const duplicatedTable: Table = {
        ...originalTable,
        id: `table_${Date.now()}`,
        label: `${originalTable.label} Copy`,
        x: originalTable.x + 50,
        y: originalTable.y + 50,
      }
      
      return {
        ...state,
        tables: [...state.tables, duplicatedTable],
        selectedTableId: duplicatedTable.id,
        unsavedChanges: true,
      }
    }

    case 'SELECT_TABLE':
      return {
        ...state,
        selectedTableId: action.payload,
      }

    case 'SET_HOVERED_TABLE':
      return {
        ...state,
        hoveredTableId: action.payload,
      }

    case 'SET_ORIGINAL_TABLES':
      return {
        ...state,
        originalTables: action.payload,
      }

    case 'SET_UNSAVED_CHANGES':
      return {
        ...state,
        unsavedChanges: action.payload,
      }

    default:
      return state
  }
}

export function useTableReducer(floorPlanId: string) {
  const [state, dispatch] = useReducer(tableReducer, createInitialTableState(floorPlanId))

  // Memoized selectors
  const selectors = useMemo(() => ({
    selectedTable: state.tables.find(t => t.id === state.selectedTableId) || null,
    hoveredTable: state.tables.find(t => t.id === state.hoveredTableId) || null,
    tableCount: state.tables.length,
    hasUnsavedChanges: state.unsavedChanges,
    hasChanges: JSON.stringify(state.tables) !== JSON.stringify(state.originalTables),
  }), [state])

  // Memoized actions
  const actions = useMemo(() => ({
    setTables: (tables: Table[]) => dispatch({ type: 'SET_TABLES', payload: tables }),
    updateTable: (id: string, updates: Partial<Table>) => 
      dispatch({ type: 'UPDATE_TABLE', payload: { id, updates } }),
    addTable: (table: Table) => dispatch({ type: 'ADD_TABLE', payload: table }),
    deleteTable: (id: string) => dispatch({ type: 'DELETE_TABLE', payload: id }),
    duplicateTable: (id: string) => dispatch({ type: 'DUPLICATE_TABLE', payload: id }),
    selectTable: (id: string | null) => dispatch({ type: 'SELECT_TABLE', payload: id }),
    setHoveredTable: (id: string | null) => dispatch({ type: 'SET_HOVERED_TABLE', payload: id }),
    setOriginalTables: (tables: Table[]) => dispatch({ type: 'SET_ORIGINAL_TABLES', payload: tables }),
    setUnsavedChanges: (hasChanges: boolean) => dispatch({ type: 'SET_UNSAVED_CHANGES', payload: hasChanges }),
  }), [])

  return {
    state,
    selectors,
    actions,
    dispatch,
  }
}