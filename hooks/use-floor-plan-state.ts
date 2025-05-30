"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"
import type { Table } from "@/lib/floor-plan-utils"
import { saveFloorPlanTables, loadFloorPlanTables } from "@/lib/modassembly/supabase/database/floor-plan"

const MAX_UNDO_STATES = 20

export interface FloorPlanState {
  // Tables
  tables: Table[]
  originalTables: Table[]
  
  // Selection and interaction
  selectedTable: Table | null
  
  // Undo/Redo
  undoStack: Table[][]
  redoStack: Table[][]
  undoPosition: number
  
  // UI state
  isLoading: boolean
  isSaving: boolean
  loadError: string | null
  unsavedChanges: boolean
  
  // Panel states
  isTablesPanelOpen: boolean
  isControlsPanelOpen: boolean
  
  // Grid and display options
  isGridVisible: boolean
  gridSize: number
  snapToGrid: boolean
  showTooltips: boolean
  showTableLabels: boolean
  showTableSeats: boolean
  showTableDimensions: boolean
  showTableStatus: boolean
}

export interface FloorPlanActions {
  // Table management
  setTables: (tables: Table[]) => void
  setSelectedTable: (table: Table | null) => void
  updateTable: (tableId: string, updates: Partial<Table>) => void
  addTable: (table: Table) => void
  deleteTable: (tableId: string) => void
  duplicateTable: (tableId: string) => void
  
  // Undo/Redo
  addToUndoStack: (tables: Table[]) => void
  undo: () => void
  redo: () => void
  
  // Data operations
  loadTables: () => Promise<void>
  saveTables: () => Promise<boolean>
  
  // UI state
  setIsTablesPanelOpen: (open: boolean) => void
  setIsControlsPanelOpen: (open: boolean) => void
  
  // Grid and display options
  setIsGridVisible: (visible: boolean) => void
  setGridSize: (size: number) => void
  setSnapToGrid: (snap: boolean) => void
  setShowTooltips: (show: boolean) => void
  setShowTableLabels: (show: boolean) => void
  setShowTableSeats: (show: boolean) => void
  setShowTableDimensions: (show: boolean) => void
  setShowTableStatus: (show: boolean) => void
}

export function useFloorPlanState(floorPlanId: string): [FloorPlanState, FloorPlanActions] {
  const { toast } = useToast()
  
  // State
  const [tables, setTablesState] = useState<Table[]>([])
  const [originalTables, setOriginalTables] = useState<Table[]>([])
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  
  const [undoStack, setUndoStack] = useState<Table[][]>([[]])
  const [redoStack, setRedoStack] = useState<Table[][]>([])
  const [undoPosition, setUndoPosition] = useState(0)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  
  const [isTablesPanelOpen, setIsTablesPanelOpen] = useState(true)
  const [isControlsPanelOpen, setIsControlsPanelOpen] = useState(true)
  
  const [isGridVisible, setIsGridVisible] = useState(true)
  const [gridSize, setGridSize] = useState(50)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [showTooltips, setShowTooltips] = useState(true)
  const [showTableLabels, setShowTableLabels] = useState(true)
  const [showTableSeats, setShowTableSeats] = useState(true)
  const [showTableDimensions, setShowTableDimensions] = useState(false)
  const [showTableStatus, setShowTableStatus] = useState(true)

  // Logger
  const logger = useMemo(() => ({
    info: (message: string, ...args: any[]) => console.log(`[FloorPlanState] ${message}`, ...args),
    error: (message: string, ...args: any[]) => console.error(`[FloorPlanState] ${message}`, ...args),
    warning: (message: string, ...args: any[]) => console.warn(`[FloorPlanState] ${message}`, ...args),
  }), [])

  const showInternalToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'default' = 'default') => {
    toast({
      title: type.charAt(0).toUpperCase() + type.slice(1),
      description: message,
      variant: type === 'error' ? 'destructive' : type === 'warning' ? 'warning' as any : 'default',
    })
  }, [toast])

  // Actions
  const setTables = useCallback((newTables: Table[]) => {
    setTablesState(newTables)
    setUnsavedChanges(true)
  }, [])

  const updateTable = useCallback((tableId: string, updates: Partial<Table>) => {
    setTablesState(prev => prev.map(t => 
      t.id === tableId ? { ...t, ...updates } : t
    ))
    
    setSelectedTable(prev => 
      prev?.id === tableId ? { ...prev, ...updates } : prev
    )
    
    setUnsavedChanges(true)
  }, [])

  const addTable = useCallback((table: Table) => {
    setTablesState(prev => [...prev, table])
    setSelectedTable(table)
    setUnsavedChanges(true)
  }, [])

  const deleteTable = useCallback((tableId: string) => {
    setTablesState(prev => prev.filter(t => t.id !== tableId))
    setSelectedTable(prev => prev?.id === tableId ? null : prev)
    setUnsavedChanges(true)
  }, [])

  const duplicateTable = useCallback((tableId: string) => {
    const table = tables.find(t => t.id === tableId)
    if (!table) return

    const newTable: Table = {
      ...table,
      id: `table-${Date.now()}`,
      x: table.x + 20,
      y: table.y + 20,
      label: `${table.label} (Copy)`
    }

    addTable(newTable)
  }, [tables, addTable])

  const addToUndoStack = useCallback((tablesToAdd: Table[]) => {
    setUndoStack(stack => {
      const newStack = [...stack.slice(0, undoPosition + 1), [...tablesToAdd]]
      if (newStack.length > MAX_UNDO_STATES) {
        return newStack.slice(newStack.length - MAX_UNDO_STATES)
      }
      return newStack
    })
    
    setUndoPosition(prev => Math.min(prev + 1, MAX_UNDO_STATES - 1))
    setRedoStack([])
  }, [undoPosition])

  const undo = useCallback(() => {
    if (undoStack.length <= 1) {
      showInternalToast("Nothing to undo", "default")
      return
    }

    const currentState = [...tables]
    const newStack = [...undoStack]
    newStack.pop()
    const previousState = newStack[newStack.length - 1]

    setRedoStack(prev => [...prev, currentState])
    setUndoStack(newStack)
    setTablesState(previousState)

    if (selectedTable) {
      const newSelectedTable = previousState.find(t => t.id === selectedTable.id)
      setSelectedTable(newSelectedTable || null)
    }

    showInternalToast("Action undone", "default")
  }, [undoStack, tables, selectedTable, showInternalToast])

  const redo = useCallback(() => {
    if (redoStack.length === 0) {
      showInternalToast("Nothing to redo", "default")
      return
    }

    const currentState = [...tables]
    const newRedoStack = [...redoStack]
    const nextState = newRedoStack.pop()

    setUndoStack(prev => [...prev, currentState])
    setRedoStack(newRedoStack)
    
    if (nextState) {
      setTablesState(nextState)
      
      if (selectedTable) {
        const newSelectedTable = nextState.find(t => t.id === selectedTable.id)
        setSelectedTable(newSelectedTable || null)
      }
    }

    showInternalToast("Action redone", "default")
  }, [redoStack, tables, selectedTable, showInternalToast])

  const loadTables = useCallback(async () => {
    logger.info(`Loading tables for floor plan: ${floorPlanId}`)
    setIsLoading(true)
    setLoadError(null)

    try {
      const floorPlanTables = await loadFloorPlanTables()
      
      const frontendTables: Table[] = floorPlanTables.map((table, index) => {
        // AI: Use persisted positions if available, fallback to calculated positions
        const row = Math.floor(index / 3)
        const col = index % 3
        const fallbackX = 100 + (col * 150)
        const fallbackY = 100 + (row * 150)
        
        return {
          id: table.id,
          label: table.label,
          type: table.type,
          seats: table.seats,
          status: table.status,
          x: (table as any).position_x ?? (table as any).x ?? fallbackX,
          y: (table as any).position_y ?? (table as any).y ?? fallbackY,
          width: (table as any).width ?? (table.type === 'circle' ? 80 : (table.type === 'square' ? 100 : 120)),
          height: (table as any).height ?? (table.type === 'circle' ? 80 : (table.type === 'square' ? 100 : 80)),
          rotation: (table as any).rotation ?? 0,
          zIndex: (table as any).zIndex ?? 1,
          floor_plan_id: floorPlanId
        }
      })
      
      logger.info(`Retrieved ${frontendTables.length} tables for floor plan`)
      
      setTablesState(frontendTables)
      setOriginalTables(JSON.parse(JSON.stringify(frontendTables)))
      setUnsavedChanges(false)
    } catch (error: any) {
      const errorMsg = `Error loading tables: ${error.message}`
      logger.error(errorMsg)
      setLoadError(errorMsg)
      showInternalToast("Failed to load floor plan tables", "error")
    } finally {
      setIsLoading(false)
    }
  }, [floorPlanId, logger, showInternalToast])

  const saveTables = useCallback(async (): Promise<boolean> => {
    if (!floorPlanId) {
      logger.error("Cannot save tables: No floor plan ID provided")
      return false
    }

    setIsSaving(true)
    logger.info(`Saving ${tables.length} tables to floor plan ${floorPlanId}`)

    try {
      const floorPlanTables = tables.map(table => ({
        id: table.id,
        label: table.label,
        type: table.type,
        seats: table.seats,
        status: table.status || "available",
        // AI: Include position and dimension data for persistence
        position_x: table.x,
        position_y: table.y,
        width: table.width,
        height: table.height,
        rotation: table.rotation,
        zIndex: table.zIndex
      }))
      
      await saveFloorPlanTables(floorPlanTables)
      
      logger.info("Tables saved successfully")
      setUnsavedChanges(false)
      setOriginalTables(JSON.parse(JSON.stringify(tables)))
      showInternalToast("Floor plan saved successfully", "success")
      return true
    } catch (error: any) {
      const errorMsg = `Error saving tables: ${error.message}`
      logger.error(errorMsg)
      showInternalToast("Failed to save floor plan changes", "error")
      return false
    } finally {
      setIsSaving(false)
    }
  }, [floorPlanId, tables, logger, showInternalToast])

  // Load tables on mount
  useEffect(() => {
    loadTables()
  }, [loadTables])

  const state: FloorPlanState = {
    tables,
    originalTables,
    selectedTable,
    undoStack,
    redoStack,
    undoPosition,
    isLoading,
    isSaving,
    loadError,
    unsavedChanges,
    isTablesPanelOpen,
    isControlsPanelOpen,
    isGridVisible,
    gridSize,
    snapToGrid,
    showTooltips,
    showTableLabels,
    showTableSeats,
    showTableDimensions,
    showTableStatus
  }

  const actions: FloorPlanActions = {
    setTables,
    setSelectedTable,
    updateTable,
    addTable,
    deleteTable,
    duplicateTable,
    addToUndoStack,
    undo,
    redo,
    loadTables,
    saveTables,
    setIsTablesPanelOpen,
    setIsControlsPanelOpen,
    setIsGridVisible,
    setGridSize,
    setSnapToGrid,
    setShowTooltips,
    setShowTableLabels,
    setShowTableSeats,
    setShowTableDimensions,
    setShowTableStatus
  }

  return [state, actions]
}