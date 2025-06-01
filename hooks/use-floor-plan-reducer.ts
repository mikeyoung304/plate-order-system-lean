'use client'

import { useReducer, useCallback, useEffect, useMemo } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { Table } from '@/lib/floor-plan-utils'
import {
  saveFloorPlanTables,
  loadFloorPlanTables,
} from '@/lib/modassembly/supabase/database/floor-plan'

const MAX_UNDO_STATES = 20

// State structure
export interface FloorPlanState {
  // Core data
  data: {
    tables: Table[]
    originalTables: Table[]
    floorPlanId: string
  }

  // UI state
  ui: {
    selectedTableId: string | null
    hoveredTableId: string | null
    panels: {
      isTablesPanelOpen: boolean
      isControlsPanelOpen: boolean
    }
    canvas: {
      zoomLevel: number
      panOffset: { x: number; y: number }
      canvasSize: { width: number; height: number }
    }
    grid: {
      isVisible: boolean
      size: number
      snapToGrid: boolean
    }
    display: {
      showTooltips: boolean
      showTableLabels: boolean
      showTableSeats: boolean
      showTableDimensions: boolean
      showTableStatus: boolean
    }
  }

  // Interaction state
  interaction: {
    mode: 'idle' | 'dragging' | 'resizing' | 'rotating' | 'panning'
    dragOffset: { x: number; y: number }
    resizeDirection: string | null
    resizeStart: { x: number; y: number }
    rotateStart: number
    initialRotation: number
    panStart: { x: number; y: number }
  }

  // History for undo/redo
  history: {
    undoStack: Table[][]
    redoStack: Table[][]
    position: number
  }

  // Async state
  async: {
    isLoading: boolean
    isSaving: boolean
    loadError: string | null
    unsavedChanges: boolean
  }
}

// Action types
export type FloorPlanAction =
  | { type: 'SET_TABLES'; payload: Table[] }
  | { type: 'UPDATE_TABLE'; payload: { id: string; updates: Partial<Table> } }
  | { type: 'ADD_TABLE'; payload: Table }
  | { type: 'DELETE_TABLE'; payload: string }
  | { type: 'DUPLICATE_TABLE'; payload: string }
  | { type: 'SELECT_TABLE'; payload: string | null }
  | { type: 'SET_HOVERED_TABLE'; payload: string | null }
  | { type: 'SET_UI_STATE'; payload: Partial<FloorPlanState['ui']> }
  | {
      type: 'SET_PANEL_STATE'
      payload: { panel: 'tables' | 'controls'; open: boolean }
    }
  | {
      type: 'SET_GRID_OPTION'
      payload: { option: 'visible' | 'size' | 'snap'; value: any }
    }
  | {
      type: 'SET_DISPLAY_OPTION'
      payload: { option: keyof FloorPlanState['ui']['display']; value: boolean }
    }
  | {
      type: 'SET_INTERACTION_STATE'
      payload: Partial<FloorPlanState['interaction']>
    }
  | { type: 'SET_CANVAS_SIZE'; payload: { width: number; height: number } }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_PAN_OFFSET'; payload: { x: number; y: number } }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'ADD_TO_HISTORY'; payload: Table[] }
  | { type: 'SET_ASYNC_STATE'; payload: Partial<FloorPlanState['async']> }
  | { type: 'RESET_VIEW' }

// Initial state
const createInitialState = (floorPlanId: string): FloorPlanState => ({
  data: {
    tables: [],
    originalTables: [],
    floorPlanId,
  },
  ui: {
    selectedTableId: null,
    hoveredTableId: null,
    panels: {
      isTablesPanelOpen: true,
      isControlsPanelOpen: true,
    },
    canvas: {
      zoomLevel: 1,
      panOffset: { x: 0, y: 0 },
      canvasSize: { width: 800, height: 600 },
    },
    grid: {
      isVisible: true,
      size: 50,
      snapToGrid: true,
    },
    display: {
      showTooltips: true,
      showTableLabels: true,
      showTableSeats: true,
      showTableDimensions: false,
      showTableStatus: true,
    },
  },
  interaction: {
    mode: 'idle',
    dragOffset: { x: 0, y: 0 },
    resizeDirection: null,
    resizeStart: { x: 0, y: 0 },
    rotateStart: 0,
    initialRotation: 0,
    panStart: { x: 0, y: 0 },
  },
  history: {
    undoStack: [[]],
    redoStack: [],
    position: 0,
  },
  async: {
    isLoading: true,
    isSaving: false,
    loadError: null,
    unsavedChanges: false,
  },
})

// Reducer function
function floorPlanReducer(
  state: FloorPlanState,
  action: FloorPlanAction
): FloorPlanState {
  switch (action.type) {
    case 'SET_TABLES':
      return {
        ...state,
        data: {
          ...state.data,
          tables: action.payload,
        },
        async: {
          ...state.async,
          unsavedChanges: true,
        },
      }

    case 'UPDATE_TABLE': {
      const { id, updates } = action.payload
      return {
        ...state,
        data: {
          ...state.data,
          tables: state.data.tables.map(t =>
            t.id === id ? { ...t, ...updates } : t
          ),
        },
        async: {
          ...state.async,
          unsavedChanges: true,
        },
      }
    }

    case 'ADD_TABLE':
      return {
        ...state,
        data: {
          ...state.data,
          tables: [...state.data.tables, action.payload],
        },
        ui: {
          ...state.ui,
          selectedTableId: action.payload.id,
        },
        async: {
          ...state.async,
          unsavedChanges: true,
        },
      }

    case 'DELETE_TABLE':
      return {
        ...state,
        data: {
          ...state.data,
          tables: state.data.tables.filter(t => t.id !== action.payload),
        },
        ui: {
          ...state.ui,
          selectedTableId:
            state.ui.selectedTableId === action.payload
              ? null
              : state.ui.selectedTableId,
        },
        async: {
          ...state.async,
          unsavedChanges: true,
        },
      }

    case 'DUPLICATE_TABLE': {
      const table = state.data.tables.find(t => t.id === action.payload)
      if (!table) return state

      const newTable: Table = {
        ...table,
        id: `table-${Date.now()}`,
        x: table.x + 20,
        y: table.y + 20,
        label: `${table.label} (Copy)`,
      }

      return {
        ...state,
        data: {
          ...state.data,
          tables: [...state.data.tables, newTable],
        },
        ui: {
          ...state.ui,
          selectedTableId: newTable.id,
        },
        async: {
          ...state.async,
          unsavedChanges: true,
        },
      }
    }

    case 'SELECT_TABLE':
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedTableId: action.payload,
        },
      }

    case 'SET_HOVERED_TABLE':
      return {
        ...state,
        ui: {
          ...state.ui,
          hoveredTableId: action.payload,
        },
      }

    case 'SET_UI_STATE':
      return {
        ...state,
        ui: {
          ...state.ui,
          ...action.payload,
        },
      }

    case 'SET_PANEL_STATE': {
      const { panel, open } = action.payload
      return {
        ...state,
        ui: {
          ...state.ui,
          panels: {
            ...state.ui.panels,
            [panel === 'tables' ? 'isTablesPanelOpen' : 'isControlsPanelOpen']:
              open,
          },
        },
      }
    }

    case 'SET_GRID_OPTION': {
      const { option, value } = action.payload
      const gridUpdate = {
        visible: () => ({ isVisible: value }),
        size: () => ({ size: value }),
        snap: () => ({ snapToGrid: value }),
      }[option]()

      return {
        ...state,
        ui: {
          ...state.ui,
          grid: {
            ...state.ui.grid,
            ...gridUpdate,
          },
        },
      }
    }

    case 'SET_DISPLAY_OPTION': {
      const { option, value } = action.payload
      return {
        ...state,
        ui: {
          ...state.ui,
          display: {
            ...state.ui.display,
            [option]: value,
          },
        },
      }
    }

    case 'SET_INTERACTION_STATE':
      return {
        ...state,
        interaction: {
          ...state.interaction,
          ...action.payload,
        },
      }

    case 'SET_CANVAS_SIZE':
      return {
        ...state,
        ui: {
          ...state.ui,
          canvas: {
            ...state.ui.canvas,
            canvasSize: action.payload,
          },
        },
      }

    case 'SET_ZOOM':
      return {
        ...state,
        ui: {
          ...state.ui,
          canvas: {
            ...state.ui.canvas,
            zoomLevel: action.payload,
          },
        },
      }

    case 'SET_PAN_OFFSET':
      return {
        ...state,
        ui: {
          ...state.ui,
          canvas: {
            ...state.ui.canvas,
            panOffset: action.payload,
          },
        },
      }

    case 'RESET_VIEW':
      return {
        ...state,
        ui: {
          ...state.ui,
          canvas: {
            ...state.ui.canvas,
            zoomLevel: 1,
            panOffset: { x: 0, y: 0 },
          },
        },
      }

    case 'ADD_TO_HISTORY': {
      const newStack = [
        ...state.history.undoStack.slice(0, state.history.position + 1),
        [...action.payload],
      ]
      if (newStack.length > MAX_UNDO_STATES) {
        newStack.splice(0, newStack.length - MAX_UNDO_STATES)
      }

      return {
        ...state,
        history: {
          undoStack: newStack,
          redoStack: [],
          position: Math.min(state.history.position + 1, MAX_UNDO_STATES - 1),
        },
      }
    }

    case 'UNDO': {
      if (state.history.undoStack.length <= 1) return state

      const currentState = [...state.data.tables]
      const newStack = [...state.history.undoStack]
      newStack.pop()
      const previousState = newStack[newStack.length - 1]

      return {
        ...state,
        data: {
          ...state.data,
          tables: previousState,
        },
        history: {
          undoStack: newStack,
          redoStack: [...state.history.redoStack, currentState],
          position: state.history.position - 1,
        },
        ui: {
          ...state.ui,
          selectedTableId:
            state.ui.selectedTableId &&
            previousState.find(t => t.id === state.ui.selectedTableId)
              ? state.ui.selectedTableId
              : null,
        },
      }
    }

    case 'REDO': {
      if (state.history.redoStack.length === 0) return state

      const currentState = [...state.data.tables]
      const newRedoStack = [...state.history.redoStack]
      const nextState = newRedoStack.pop()!

      return {
        ...state,
        data: {
          ...state.data,
          tables: nextState,
        },
        history: {
          undoStack: [...state.history.undoStack, currentState],
          redoStack: newRedoStack,
          position: state.history.position + 1,
        },
        ui: {
          ...state.ui,
          selectedTableId:
            state.ui.selectedTableId &&
            nextState.find(t => t.id === state.ui.selectedTableId)
              ? state.ui.selectedTableId
              : null,
        },
      }
    }

    case 'SET_ASYNC_STATE':
      return {
        ...state,
        async: {
          ...state.async,
          ...action.payload,
        },
      }

    default:
      return state
  }
}

// Selectors for performance optimization
export const createSelectors = (state: FloorPlanState) => ({
  // Core data selectors
  tables: state.data.tables,
  originalTables: state.data.originalTables,
  selectedTable: state.ui.selectedTableId
    ? state.data.tables.find(t => t.id === state.ui.selectedTableId) || null
    : null,
  hoveredTableId: state.ui.hoveredTableId,

  // UI selectors
  isTablesPanelOpen: state.ui.panels.isTablesPanelOpen,
  isControlsPanelOpen: state.ui.panels.isControlsPanelOpen,
  canvasSize: state.ui.canvas.canvasSize,
  zoomLevel: state.ui.canvas.zoomLevel,
  panOffset: state.ui.canvas.panOffset,

  // Grid selectors
  isGridVisible: state.ui.grid.isVisible,
  gridSize: state.ui.grid.size,
  snapToGrid: state.ui.grid.snapToGrid,

  // Display selectors
  showTooltips: state.ui.display.showTooltips,
  showTableLabels: state.ui.display.showTableLabels,
  showTableSeats: state.ui.display.showTableSeats,
  showTableDimensions: state.ui.display.showTableDimensions,
  showTableStatus: state.ui.display.showTableStatus,

  // Interaction selectors
  interactionMode: state.interaction.mode,
  isDragging: state.interaction.mode === 'dragging',
  isResizing: state.interaction.mode === 'resizing',
  isRotating: state.interaction.mode === 'rotating',
  isPanning: state.interaction.mode === 'panning',
  dragOffset: state.interaction.dragOffset,
  resizeDirection: state.interaction.resizeDirection,
  resizeStart: state.interaction.resizeStart,
  rotateStart: state.interaction.rotateStart,
  initialRotation: state.interaction.initialRotation,
  panStart: state.interaction.panStart,

  // History selectors
  undoStack: state.history.undoStack,
  redoStack: state.history.redoStack,
  canUndo: state.history.undoStack.length > 1,
  canRedo: state.history.redoStack.length > 0,

  // Async selectors
  isLoading: state.async.isLoading,
  isSaving: state.async.isSaving,
  loadError: state.async.loadError,
  unsavedChanges: state.async.unsavedChanges,
})

// Main hook
export function useFloorPlanReducer(floorPlanId: string) {
  const { toast } = useToast()
  const [state, dispatch] = useReducer(
    floorPlanReducer,
    createInitialState(floorPlanId)
  )

  // Memoized selectors
  const selectors = useMemo(() => createSelectors(state), [state])

  // Logger
  const logger = useMemo(
    () => ({
      info: (message: string, ...args: any[]) =>
        console.log(`[FloorPlanReducer] ${message}`, ...args),
      error: (message: string, ...args: any[]) =>
        console.error(`[FloorPlanReducer] ${message}`, ...args),
      warning: (message: string, ...args: any[]) =>
        console.warn(`[FloorPlanReducer] ${message}`, ...args),
    }),
    []
  )

  const showInternalToast = useCallback(
    (
      message: string,
      type: 'success' | 'error' | 'warning' | 'default' = 'default'
    ) => {
      toast({
        title: type.charAt(0).toUpperCase() + type.slice(1),
        description: message,
        variant:
          type === 'error'
            ? 'destructive'
            : type === 'warning'
              ? ('warning' as any)
              : 'default',
      })
    },
    [toast]
  )

  // Stable actions without state dependencies
  const actions = useMemo(
    () => ({
      // Table actions
      setTables: (tables: Table[]) =>
        dispatch({ type: 'SET_TABLES', payload: tables }),
      updateTable: (id: string, updates: Partial<Table>) =>
        dispatch({ type: 'UPDATE_TABLE', payload: { id, updates } }),
      addTable: (table: Table) =>
        dispatch({ type: 'ADD_TABLE', payload: table }),
      deleteTable: (id: string) =>
        dispatch({ type: 'DELETE_TABLE', payload: id }),
      duplicateTable: (id: string) =>
        dispatch({ type: 'DUPLICATE_TABLE', payload: id }),

      // Selection actions
      selectTable: (id: string | null) =>
        dispatch({ type: 'SELECT_TABLE', payload: id }),
      setHoveredTable: (id: string | null) =>
        dispatch({ type: 'SET_HOVERED_TABLE', payload: id }),

      // UI actions
      setCanvasSize: (size: { width: number; height: number }) =>
        dispatch({ type: 'SET_CANVAS_SIZE', payload: size }),
      setZoom: (level: number) =>
        dispatch({ type: 'SET_ZOOM', payload: level }),
      setPanOffset: (offset: { x: number; y: number }) =>
        dispatch({ type: 'SET_PAN_OFFSET', payload: offset }),
      resetView: () => dispatch({ type: 'RESET_VIEW' }),

      // Panel actions - now using stable dispatch calls
      setIsTablesPanelOpen: (open: boolean) =>
        dispatch({
          type: 'SET_PANEL_STATE',
          payload: { panel: 'tables', open },
        }),
      setIsControlsPanelOpen: (open: boolean) =>
        dispatch({
          type: 'SET_PANEL_STATE',
          payload: { panel: 'controls', open },
        }),

      // Grid actions - now using stable dispatch calls
      setIsGridVisible: (visible: boolean) =>
        dispatch({
          type: 'SET_GRID_OPTION',
          payload: { option: 'visible', value: visible },
        }),
      setGridSize: (size: number) =>
        dispatch({
          type: 'SET_GRID_OPTION',
          payload: { option: 'size', value: size },
        }),
      setSnapToGrid: (snap: boolean) =>
        dispatch({
          type: 'SET_GRID_OPTION',
          payload: { option: 'snap', value: snap },
        }),

      // Display actions - now using stable dispatch calls
      setShowTooltips: (show: boolean) =>
        dispatch({
          type: 'SET_DISPLAY_OPTION',
          payload: { option: 'showTooltips', value: show },
        }),
      setShowTableLabels: (show: boolean) =>
        dispatch({
          type: 'SET_DISPLAY_OPTION',
          payload: { option: 'showTableLabels', value: show },
        }),
      setShowTableSeats: (show: boolean) =>
        dispatch({
          type: 'SET_DISPLAY_OPTION',
          payload: { option: 'showTableSeats', value: show },
        }),
      setShowTableDimensions: (show: boolean) =>
        dispatch({
          type: 'SET_DISPLAY_OPTION',
          payload: { option: 'showTableDimensions', value: show },
        }),
      setShowTableStatus: (show: boolean) =>
        dispatch({
          type: 'SET_DISPLAY_OPTION',
          payload: { option: 'showTableStatus', value: show },
        }),

      // Interaction actions
      setInteractionMode: (mode: FloorPlanState['interaction']['mode']) =>
        dispatch({ type: 'SET_INTERACTION_STATE', payload: { mode } }),
      setDragOffset: (offset: { x: number; y: number }) =>
        dispatch({
          type: 'SET_INTERACTION_STATE',
          payload: { dragOffset: offset },
        }),
      setResizeDirection: (direction: string | null) =>
        dispatch({
          type: 'SET_INTERACTION_STATE',
          payload: { resizeDirection: direction },
        }),
      setResizeStart: (start: { x: number; y: number }) =>
        dispatch({
          type: 'SET_INTERACTION_STATE',
          payload: { resizeStart: start },
        }),
      setRotateStart: (start: number) =>
        dispatch({
          type: 'SET_INTERACTION_STATE',
          payload: { rotateStart: start },
        }),
      setInitialRotation: (rotation: number) =>
        dispatch({
          type: 'SET_INTERACTION_STATE',
          payload: { initialRotation: rotation },
        }),
      setPanStart: (start: { x: number; y: number }) =>
        dispatch({
          type: 'SET_INTERACTION_STATE',
          payload: { panStart: start },
        }),

      // History actions
      addToUndoStack: (tables: Table[]) =>
        dispatch({ type: 'ADD_TO_HISTORY', payload: tables }),
    }),
    []
  ) // No state dependencies!

  // Separate actions that need state access
  const undo = useCallback(() => {
    if (state.history.undoStack.length <= 1) {
      showInternalToast('Nothing to undo', 'default')
      return
    }
    dispatch({ type: 'UNDO' })
    showInternalToast('Action undone', 'default')
  }, [state.history.undoStack.length, showInternalToast])

  const redo = useCallback(() => {
    if (state.history.redoStack.length === 0) {
      showInternalToast('Nothing to redo', 'default')
      return
    }
    dispatch({ type: 'REDO' })
    showInternalToast('Action redone', 'default')
  }, [state.history.redoStack.length, showInternalToast])

  // Data operations
  const loadTables = useCallback(async () => {
    logger.info(`Loading tables for floor plan: ${floorPlanId}`)
    dispatch({
      type: 'SET_ASYNC_STATE',
      payload: { isLoading: true, loadError: null },
    })

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
          width:
            (table as any).width ??
            (table.type === 'circle'
              ? 80
              : table.type === 'square'
                ? 100
                : 120),
          height:
            (table as any).height ??
            (table.type === 'circle' ? 80 : table.type === 'square' ? 100 : 80),
          rotation: (table as any).rotation ?? 0,
          zIndex: (table as any).zIndex ?? 1,
          floor_plan_id: floorPlanId,
        }
      })

      logger.info(`Retrieved ${frontendTables.length} tables for floor plan`)

      dispatch({ type: 'SET_TABLES', payload: frontendTables })
      dispatch({
        type: 'SET_ASYNC_STATE',
        payload: {
          isLoading: false,
          unsavedChanges: false,
          originalTables: JSON.parse(JSON.stringify(frontendTables)),
        } as any,
      })
    } catch (error: any) {
      const errorMsg = `Error loading tables: ${error.message}`
      logger.error(errorMsg)
      dispatch({
        type: 'SET_ASYNC_STATE',
        payload: { isLoading: false, loadError: errorMsg },
      })
      showInternalToast('Failed to load floor plan tables', 'error')
    }
  }, [floorPlanId, logger, showInternalToast])

  const saveTables = useCallback(async (): Promise<boolean> => {
    if (!floorPlanId) {
      logger.error('Cannot save tables: No floor plan ID provided')
      return false
    }

    dispatch({ type: 'SET_ASYNC_STATE', payload: { isSaving: true } })
    logger.info(
      `Saving ${state.data.tables.length} tables to floor plan ${floorPlanId}`
    )

    try {
      const floorPlanTables = state.data.tables.map(table => ({
        id: table.id,
        label: table.label,
        type: table.type,
        seats: table.seats,
        status: table.status || 'available',
        position_x: table.x,
        position_y: table.y,
        width: table.width,
        height: table.height,
        rotation: table.rotation,
        zIndex: table.zIndex,
      }))

      await saveFloorPlanTables(floorPlanTables)

      logger.info('Tables saved successfully')
      dispatch({
        type: 'SET_ASYNC_STATE',
        payload: {
          isSaving: false,
          unsavedChanges: false,
          originalTables: JSON.parse(JSON.stringify(state.data.tables)),
        } as any,
      })
      showInternalToast('Floor plan saved successfully', 'success')
      return true
    } catch (error: any) {
      const errorMsg = `Error saving tables: ${error.message}`
      logger.error(errorMsg)
      dispatch({ type: 'SET_ASYNC_STATE', payload: { isSaving: false } })
      showInternalToast('Failed to save floor plan changes', 'error')
      return false
    }
  }, [floorPlanId, state.data.tables, logger, showInternalToast])

  // Load tables on mount
  useEffect(() => {
    loadTables()
  }, [loadTables])

  return {
    state,
    selectors,
    actions: {
      ...actions,
      undo,
      redo,
      loadTables,
      saveTables,
    },
    dispatch,
  }
}
