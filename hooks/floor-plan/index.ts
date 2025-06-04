// Floor Plan Domain-Specific Hooks
// 
// This module exports refactored floor plan state management hooks
// that replace the monolithic 865-line use-floor-plan-reducer.ts
//
// Architecture:
// - Domain Separation: Each hook manages a specific aspect of floor plan state
// - Performance Optimization: Selective re-renders based on domain changes  
// - Maintainability: Clear separation of concerns and single responsibility
// - Testing: Individual hooks can be tested in isolation

export { useTableReducer } from './use-table-reducer'
export { useCanvasReducer } from './use-canvas-reducer'
export { useUIReducer } from './use-ui-reducer'
export { useHistoryReducer } from './use-history-reducer'
export { useFloorPlanState } from './use-floor-plan-state'

// Re-export types for convenience
export type { TableState, TableAction } from './use-table-reducer'
export type { CanvasState, CanvasAction } from './use-canvas-reducer'
export type { UIState, UIAction } from './use-ui-reducer'
export type { HistoryState, HistoryAction } from './use-history-reducer'