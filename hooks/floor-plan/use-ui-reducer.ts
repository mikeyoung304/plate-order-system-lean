'use client'

import { useReducer, useMemo } from 'react'

// UI-specific state
export interface UIState {
  panels: {
    isTablesPanelOpen: boolean
    isControlsPanelOpen: boolean
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

// UI-specific actions
export type UIAction =
  | { type: 'TOGGLE_PANEL'; payload: 'tables' | 'controls' }
  | { type: 'SET_PANEL_STATE'; payload: { panel: 'tables' | 'controls'; open: boolean } }
  | { type: 'SET_GRID_VISIBLE'; payload: boolean }
  | { type: 'SET_GRID_SIZE'; payload: number }
  | { type: 'SET_GRID_SNAP'; payload: boolean }
  | { type: 'SET_DISPLAY_OPTION'; payload: { option: keyof UIState['display']; value: boolean } }
  | { type: 'RESET_UI' }

const createInitialUIState = (): UIState => ({
  panels: {
    isTablesPanelOpen: true,
    isControlsPanelOpen: true,
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
})

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'TOGGLE_PANEL':
      return {
        ...state,
        panels: {
          ...state.panels,
          [action.payload === 'tables' ? 'isTablesPanelOpen' : 'isControlsPanelOpen']:
            !state.panels[action.payload === 'tables' ? 'isTablesPanelOpen' : 'isControlsPanelOpen'],
        },
      }

    case 'SET_PANEL_STATE':
      return {
        ...state,
        panels: {
          ...state.panels,
          [action.payload.panel === 'tables' ? 'isTablesPanelOpen' : 'isControlsPanelOpen']:
            action.payload.open,
        },
      }

    case 'SET_GRID_VISIBLE':
      return {
        ...state,
        grid: {
          ...state.grid,
          isVisible: action.payload,
        },
      }

    case 'SET_GRID_SIZE':
      // Clamp grid size between 10 and 200
      const clampedSize = Math.max(10, Math.min(200, action.payload))
      return {
        ...state,
        grid: {
          ...state.grid,
          size: clampedSize,
        },
      }

    case 'SET_GRID_SNAP':
      return {
        ...state,
        grid: {
          ...state.grid,
          snapToGrid: action.payload,
        },
      }

    case 'SET_DISPLAY_OPTION':
      return {
        ...state,
        display: {
          ...state.display,
          [action.payload.option]: action.payload.value,
        },
      }

    case 'RESET_UI':
      return createInitialUIState()

    default:
      return state
  }
}

export function useUIReducer() {
  const [state, dispatch] = useReducer(uiReducer, createInitialUIState())

  // Memoized selectors
  const selectors = useMemo(() => ({
    anyPanelOpen: state.panels.isTablesPanelOpen || state.panels.isControlsPanelOpen,
    allPanelsOpen: state.panels.isTablesPanelOpen && state.panels.isControlsPanelOpen,
    gridEnabled: state.grid.isVisible && state.grid.snapToGrid,
    displayOptionsCount: Object.values(state.display).filter(Boolean).length,
  }), [state])

  // Memoized actions
  const actions = useMemo(() => ({
    toggleTablesPanel: () => dispatch({ type: 'TOGGLE_PANEL', payload: 'tables' }),
    toggleControlsPanel: () => dispatch({ type: 'TOGGLE_PANEL', payload: 'controls' }),
    setPanelState: (panel: 'tables' | 'controls', open: boolean) => 
      dispatch({ type: 'SET_PANEL_STATE', payload: { panel, open } }),
    setGridVisible: (visible: boolean) => dispatch({ type: 'SET_GRID_VISIBLE', payload: visible }),
    setGridSize: (size: number) => dispatch({ type: 'SET_GRID_SIZE', payload: size }),
    setGridSnap: (snap: boolean) => dispatch({ type: 'SET_GRID_SNAP', payload: snap }),
    setDisplayOption: (option: keyof UIState['display'], value: boolean) => 
      dispatch({ type: 'SET_DISPLAY_OPTION', payload: { option, value } }),
    resetUI: () => dispatch({ type: 'RESET_UI' }),
  }), [])

  return {
    state,
    selectors,
    actions,
    dispatch,
  }
}