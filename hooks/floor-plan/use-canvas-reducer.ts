'use client'

import { useReducer, useMemo } from 'react'

// Canvas-specific state
export interface CanvasState {
  zoomLevel: number
  panOffset: { x: number; y: number }
  canvasSize: { width: number; height: number }
  interactionMode: 'idle' | 'dragging' | 'resizing' | 'rotating' | 'panning'
  dragOffset: { x: number; y: number }
  resizeDirection: string | null
  resizeStart: { x: number; y: number }
  rotateStart: number
  initialRotation: number
  panStart: { x: number; y: number }
}

// Canvas-specific actions
export type CanvasAction =
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_PAN_OFFSET'; payload: { x: number; y: number } }
  | { type: 'SET_CANVAS_SIZE'; payload: { width: number; height: number } }
  | { type: 'SET_INTERACTION_MODE'; payload: CanvasState['interactionMode'] }
  | { type: 'SET_DRAG_OFFSET'; payload: { x: number; y: number } }
  | { type: 'SET_RESIZE_STATE'; payload: { direction: string | null; start: { x: number; y: number } } }
  | { type: 'SET_ROTATE_STATE'; payload: { start: number; initial: number } }
  | { type: 'SET_PAN_START'; payload: { x: number; y: number } }
  | { type: 'RESET_INTERACTION' }
  | { type: 'RESET_VIEW' }

const createInitialCanvasState = (): CanvasState => ({
  zoomLevel: 1,
  panOffset: { x: 0, y: 0 },
  canvasSize: { width: 800, height: 600 },
  interactionMode: 'idle',
  dragOffset: { x: 0, y: 0 },
  resizeDirection: null,
  resizeStart: { x: 0, y: 0 },
  rotateStart: 0,
  initialRotation: 0,
  panStart: { x: 0, y: 0 },
})

function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
  switch (action.type) {
    case 'SET_ZOOM':
      // Clamp zoom between 0.1 and 5
      const clampedZoom = Math.max(0.1, Math.min(5, action.payload))
      return {
        ...state,
        zoomLevel: clampedZoom,
      }

    case 'SET_PAN_OFFSET':
      return {
        ...state,
        panOffset: action.payload,
      }

    case 'SET_CANVAS_SIZE':
      return {
        ...state,
        canvasSize: action.payload,
      }

    case 'SET_INTERACTION_MODE':
      return {
        ...state,
        interactionMode: action.payload,
      }

    case 'SET_DRAG_OFFSET':
      return {
        ...state,
        dragOffset: action.payload,
      }

    case 'SET_RESIZE_STATE':
      return {
        ...state,
        resizeDirection: action.payload.direction,
        resizeStart: action.payload.start,
      }

    case 'SET_ROTATE_STATE':
      return {
        ...state,
        rotateStart: action.payload.start,
        initialRotation: action.payload.initial,
      }

    case 'SET_PAN_START':
      return {
        ...state,
        panStart: action.payload,
      }

    case 'RESET_INTERACTION':
      return {
        ...state,
        interactionMode: 'idle',
        dragOffset: { x: 0, y: 0 },
        resizeDirection: null,
        resizeStart: { x: 0, y: 0 },
        rotateStart: 0,
        initialRotation: 0,
        panStart: { x: 0, y: 0 },
      }

    case 'RESET_VIEW':
      return {
        ...state,
        zoomLevel: 1,
        panOffset: { x: 0, y: 0 },
        interactionMode: 'idle',
      }

    default:
      return state
  }
}

export function useCanvasReducer() {
  const [state, dispatch] = useReducer(canvasReducer, createInitialCanvasState())

  // Memoized selectors
  const selectors = useMemo(() => ({
    isInteracting: state.interactionMode !== 'idle',
    isDragging: state.interactionMode === 'dragging',
    isResizing: state.interactionMode === 'resizing',
    isRotating: state.interactionMode === 'rotating',
    isPanning: state.interactionMode === 'panning',
    canZoomIn: state.zoomLevel < 5,
    canZoomOut: state.zoomLevel > 0.1,
    viewportCenter: {
      x: state.canvasSize.width / 2,
      y: state.canvasSize.height / 2,
    },
  }), [state])

  // Memoized actions
  const actions = useMemo(() => ({
    setZoom: (level: number) => dispatch({ type: 'SET_ZOOM', payload: level }),
    zoomIn: () => dispatch({ type: 'SET_ZOOM', payload: state.zoomLevel * 1.2 }),
    zoomOut: () => dispatch({ type: 'SET_ZOOM', payload: state.zoomLevel / 1.2 }),
    setPanOffset: (offset: { x: number; y: number }) => 
      dispatch({ type: 'SET_PAN_OFFSET', payload: offset }),
    setCanvasSize: (size: { width: number; height: number }) => 
      dispatch({ type: 'SET_CANVAS_SIZE', payload: size }),
    setInteractionMode: (mode: CanvasState['interactionMode']) => 
      dispatch({ type: 'SET_INTERACTION_MODE', payload: mode }),
    setDragOffset: (offset: { x: number; y: number }) => 
      dispatch({ type: 'SET_DRAG_OFFSET', payload: offset }),
    setResizeState: (direction: string | null, start: { x: number; y: number }) => 
      dispatch({ type: 'SET_RESIZE_STATE', payload: { direction, start } }),
    setRotateState: (start: number, initial: number) => 
      dispatch({ type: 'SET_ROTATE_STATE', payload: { start, initial } }),
    setPanStart: (start: { x: number; y: number }) => 
      dispatch({ type: 'SET_PAN_START', payload: start }),
    resetInteraction: () => dispatch({ type: 'RESET_INTERACTION' }),
    resetView: () => dispatch({ type: 'RESET_VIEW' }),
  }), [state.zoomLevel])

  return {
    state,
    selectors,
    actions,
    dispatch,
  }
}