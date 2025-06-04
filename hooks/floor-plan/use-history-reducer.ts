'use client'

import { useReducer, useMemo } from 'react'
import type { Table } from '@/lib/floor-plan-utils'

const MAX_UNDO_STATES = 20

// History-specific state
export interface HistoryState {
  undoStack: Table[][]
  redoStack: Table[][]
  position: number
}

// History-specific actions
export type HistoryAction =
  | { type: 'ADD_TO_HISTORY'; payload: Table[] }
  | { type: 'UNDO'; currentTables: Table[] }
  | { type: 'REDO'; currentTables: Table[] }
  | { type: 'CLEAR_HISTORY' }

const createInitialHistoryState = (): HistoryState => ({
  undoStack: [[]],
  redoStack: [],
  position: 0,
})

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'ADD_TO_HISTORY': {
      const newStack = [...state.undoStack, action.payload]
      
      // Limit undo stack size
      if (newStack.length > MAX_UNDO_STATES) {
        newStack.shift()
      }
      
      return {
        undoStack: newStack,
        redoStack: [], // Clear redo stack when new action is performed
        position: newStack.length - 1,
      }
    }

    case 'UNDO': {
      if (state.position <= 0) return state
      
      const newPosition = state.position - 1
      const newRedoStack = [action.currentTables, ...state.redoStack]
      
      return {
        ...state,
        redoStack: newRedoStack,
        position: newPosition,
      }
    }

    case 'REDO': {
      if (state.redoStack.length === 0) return state
      
      const [nextState, ...remainingRedo] = state.redoStack
      const newUndoStack = [...state.undoStack, action.currentTables]
      
      return {
        undoStack: newUndoStack,
        redoStack: remainingRedo,
        position: newUndoStack.length - 1,
      }
    }

    case 'CLEAR_HISTORY':
      return createInitialHistoryState()

    default:
      return state
  }
}

export function useHistoryReducer() {
  const [state, dispatch] = useReducer(historyReducer, createInitialHistoryState())

  // Memoized selectors
  const selectors = useMemo(() => ({
    canUndo: state.position > 0,
    canRedo: state.redoStack.length > 0,
    historyLength: state.undoStack.length,
    currentPosition: state.position,
    undoStatesAvailable: state.position,
    redoStatesAvailable: state.redoStack.length,
  }), [state])

  // Memoized actions
  const actions = useMemo(() => ({
    addToHistory: (tables: Table[]) => 
      dispatch({ type: 'ADD_TO_HISTORY', payload: JSON.parse(JSON.stringify(tables)) }),
    undo: (currentTables: Table[]) => 
      dispatch({ type: 'UNDO', currentTables: JSON.parse(JSON.stringify(currentTables)) }),
    redo: (currentTables: Table[]) => 
      dispatch({ type: 'REDO', currentTables: JSON.parse(JSON.stringify(currentTables)) }),
    clearHistory: () => dispatch({ type: 'CLEAR_HISTORY' }),
  }), [])

  // Get the previous state for undo
  const getPreviousState = useMemo(() => {
    if (state.position > 0) {
      return state.undoStack[state.position - 1]
    }
    return null
  }, [state.undoStack, state.position])

  // Get the next state for redo
  const getNextState = useMemo(() => {
    if (state.redoStack.length > 0) {
      return state.redoStack[0]
    }
    return null
  }, [state.redoStack])

  return {
    state,
    selectors,
    actions,
    dispatch,
    getPreviousState,
    getNextState,
  }
}