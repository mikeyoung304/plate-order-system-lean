'use client'

/**
 * Tables State Context
 * 
 * Manages table data, floor plan state, and table-related operations.
 * Extracted from the monolithic restaurant-state-context.tsx for better
 * separation of concerns and performance optimization.
 */

import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from 'react'
import { createClient } from '@/lib/modassembly/supabase/client'
import { deleteTable, getTables, updateTable } from '@/lib/modassembly/supabase/database/tables'
import type { Table } from '@/lib/floor-plan-utils'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Tables state interface
interface TablesState {
  tables: Table[]
  selectedTable: Table | null
  hoveredTable: Table | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  unsavedChanges: boolean
}

// Tables actions
type TablesAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TABLES'; payload: Table[] }
  | { type: 'ADD_TABLE'; payload: Table }
  | { type: 'UPDATE_TABLE'; payload: Table }
  | { type: 'REMOVE_TABLE'; payload: string }
  | { type: 'SELECT_TABLE'; payload: Table | null }
  | { type: 'HOVER_TABLE'; payload: Table | null }
  | { type: 'SET_UNSAVED_CHANGES'; payload: boolean }
  | { type: 'REFRESH_TIMESTAMP' }

// Initial state
const initialState: TablesState = {
  tables: [],
  selectedTable: null,
  hoveredTable: null,
  loading: false,
  error: null,
  lastUpdated: null,
  unsavedChanges: false,
}

// Reducer function
function tablesReducer(state: TablesState, action: TablesAction): TablesState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
      
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
      
    case 'SET_TABLES':
      return {
        ...state,
        tables: action.payload,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      }
      
    case 'ADD_TABLE':
      return {
        ...state,
        tables: [...state.tables, action.payload],
        unsavedChanges: true,
        lastUpdated: new Date(),
      }
      
    case 'UPDATE_TABLE':
      return {
        ...state,
        tables: state.tables.map(table =>
          table.id === action.payload.id ? action.payload : table
        ),
        selectedTable: state.selectedTable?.id === action.payload.id
          ? action.payload
          : state.selectedTable,
        unsavedChanges: true,
        lastUpdated: new Date(),
      }
      
    case 'REMOVE_TABLE':
      const filteredTables = state.tables.filter(table => table.id !== action.payload)
      return {
        ...state,
        tables: filteredTables,
        selectedTable: state.selectedTable?.id === action.payload ? null : state.selectedTable,
        hoveredTable: state.hoveredTable?.id === action.payload ? null : state.hoveredTable,
        unsavedChanges: true,
        lastUpdated: new Date(),
      }
      
    case 'SELECT_TABLE':
      return { ...state, selectedTable: action.payload }
      
    case 'HOVER_TABLE':
      return { ...state, hoveredTable: action.payload }
      
    case 'SET_UNSAVED_CHANGES':
      return { ...state, unsavedChanges: action.payload }
      
    case 'REFRESH_TIMESTAMP':
      return { ...state, lastUpdated: new Date() }
      
    default:
      return state
  }
}

// Context interface
interface TablesContextValue {
  // State
  state: TablesState
  
  // Data operations
  loadTables: () => Promise<void>
  saveTable: (table: Table) => Promise<void>
  removeTable: (tableId: string) => Promise<void>
  
  // UI operations
  selectTable: (table: Table | null) => void
  setHoveredTable: (table: Table | null) => void
  
  // Optimistic updates
  optimisticUpdate: (table: Table) => void
  optimisticAdd: (table: Table) => void
  optimisticRemove: (tableId: string) => void
  
  // Utilities
  getTableById: (id: string) => Table | undefined
  getTablesByStatus: (status: string) => Table[]
  hasUnsavedChanges: boolean
}

const TablesContext = createContext<TablesContextValue | null>(null)

interface TablesProviderProps {
  children: ReactNode
  floorPlanId?: string
  enableRealtime?: boolean
}

export function TablesProvider({ 
  children, 
  floorPlanId,
  enableRealtime = true 
}: TablesProviderProps) {
  const [state, dispatch] = useReducer(tablesReducer, initialState)
  const supabaseRef = useRef(createClient())
  const channelRef = useRef<RealtimeChannel | null>(null)
  const mountedRef = useRef(true)
  
  // Load tables from database
  const loadTables = useCallback(async () => {
    if (!mountedRef.current) {return}
    
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      const tables = await getTables(floorPlanId)
      
      if (mountedRef.current) {
        dispatch({ type: 'SET_TABLES', payload: tables })
      }
    } catch (error) {
      console.error('Error loading tables:', error)
      if (mountedRef.current) {
        dispatch({ 
          type: 'SET_ERROR', 
          payload: error instanceof Error ? error.message : 'Failed to load tables'
        })
      }
    }
  }, [floorPlanId])
  
  // Save table to database
  const saveTable = useCallback(async (table: Table) => {
    try {
      await updateTable(table)
      
      if (mountedRef.current) {
        dispatch({ type: 'UPDATE_TABLE', payload: table })
        dispatch({ type: 'SET_UNSAVED_CHANGES', payload: false })
      }
    } catch (error) {
      console.error('Error saving table:', error)
      throw error
    }
  }, [])
  
  // Remove table from database
  const removeTable = useCallback(async (tableId: string) => {
    try {
      await deleteTable(tableId)
      
      if (mountedRef.current) {
        dispatch({ type: 'REMOVE_TABLE', payload: tableId })
        dispatch({ type: 'SET_UNSAVED_CHANGES', payload: false })
      }
    } catch (error) {
      console.error('Error removing table:', error)
      throw error
    }
  }, [])
  
  // UI operations
  const selectTable = useCallback((table: Table | null) => {
    dispatch({ type: 'SELECT_TABLE', payload: table })
  }, [])
  
  const setHoveredTable = useCallback((table: Table | null) => {
    dispatch({ type: 'HOVER_TABLE', payload: table })
  }, [])
  
  // Optimistic updates
  const optimisticUpdate = useCallback((table: Table) => {
    dispatch({ type: 'UPDATE_TABLE', payload: table })
  }, [])
  
  const optimisticAdd = useCallback((table: Table) => {
    dispatch({ type: 'ADD_TABLE', payload: table })
  }, [])
  
  const optimisticRemove = useCallback((tableId: string) => {
    dispatch({ type: 'REMOVE_TABLE', payload: tableId })
  }, [])
  
  // Utility functions
  const getTableById = useCallback((id: string) => {
    return state.tables.find(table => table.id === id)
  }, [state.tables])
  
  const getTablesByStatus = useCallback((status: string) => {
    return state.tables.filter(table => table.status === status)
  }, [state.tables])
  
  // Set up real-time subscriptions
  useEffect(() => {
    if (!enableRealtime || !mountedRef.current) {return}
    
    const supabase = supabaseRef.current
    
    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }
    
    // Create new channel for tables
    const channel = supabase
      .channel('tables-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables',
          filter: floorPlanId ? `floor_plan_id=eq.${floorPlanId}` : undefined,
        },
        (payload) => {
          if (!mountedRef.current) {return}
          
          switch (payload.eventType) {
            case 'INSERT':
              dispatch({ type: 'ADD_TABLE', payload: payload.new as Table })
              break
            case 'UPDATE':
              dispatch({ type: 'UPDATE_TABLE', payload: payload.new as Table })
              break
            case 'DELETE':
              dispatch({ type: 'REMOVE_TABLE', payload: payload.old.id })
              break
          }
          
          dispatch({ type: 'REFRESH_TIMESTAMP' })
        }
      )
      .subscribe()
    
    channelRef.current = channel
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [floorPlanId, enableRealtime])
  
  // Load tables on mount
  useEffect(() => {
    loadTables()
  }, [loadTables])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])
  
  // Context value
  const contextValue: TablesContextValue = {
    state,
    loadTables,
    saveTable,
    removeTable,
    selectTable,
    setHoveredTable,
    optimisticUpdate,
    optimisticAdd,
    optimisticRemove,
    getTableById,
    getTablesByStatus,
    hasUnsavedChanges: state.unsavedChanges,
  }
  
  return (
    <TablesContext.Provider value={contextValue}>
      {children}
    </TablesContext.Provider>
  )
}

// Hook for using tables context
export function useTables() {
  const context = useContext(TablesContext)
  if (!context) {
    throw new Error('useTables must be used within a TablesProvider')
  }
  return context
}

// Hook for table selection only (lighter weight)
export function useTableSelection() {
  const { state, selectTable, setHoveredTable } = useTables()
  return {
    selectedTable: state.selectedTable,
    hoveredTable: state.hoveredTable,
    selectTable,
    setHoveredTable,
  }
}

// Hook for table data only (read-only)
export function useTablesData() {
  const { state, getTableById, getTablesByStatus } = useTables()
  return {
    tables: state.tables,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    getTableById,
    getTablesByStatus,
  }
}