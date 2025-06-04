'use client'

import { useFloorPlanState } from './floor-plan/use-floor-plan-state'

/**
 * Migrated Floor Plan Reducer Hook
 * 
 * This is a compatibility layer that maintains the same API as the original
 * 865-line use-floor-plan-reducer.ts while using the new domain-specific
 * reducer architecture under the hood.
 * 
 * Benefits of the new architecture:
 * - 865 lines → 5 focused modules (~150 lines each)
 * - Better performance through selective re-renders
 * - Easier testing and maintenance
 * - Clear separation of concerns
 * 
 * Migration path:
 * 1. Components can gradually migrate to the new useFloorPlanState hook
 * 2. This compatibility layer ensures existing code continues to work
 * 3. Eventually this file can be removed when all components are migrated
 */
export function useFloorPlanReducer(floorPlanId: string) {
  const {
    tableState,
    canvasState,
    uiState,
    historyState,
    asyncState,
    selectors,
    tableActions,
    canvasActions,
    uiActions,
    historyActions,
    actions,
  } = useFloorPlanState(floorPlanId)

  // Reconstruct the legacy state structure for backward compatibility
  const legacyState = {
    data: {
      tables: tableState.tables,
      originalTables: tableState.originalTables,
      floorPlanId: tableState.floorPlanId,
    },
    ui: {
      selectedTableId: tableState.selectedTableId,
      hoveredTableId: tableState.hoveredTableId,
      panels: uiState.panels,
      canvas: {
        zoomLevel: canvasState.zoomLevel,
        panOffset: canvasState.panOffset,
        canvasSize: canvasState.canvasSize,
      },
      grid: uiState.grid,
      display: uiState.display,
    },
    interaction: {
      mode: canvasState.interactionMode,
      dragOffset: canvasState.dragOffset,
      resizeDirection: canvasState.resizeDirection,
      resizeStart: canvasState.resizeStart,
      rotateStart: canvasState.rotateStart,
      initialRotation: canvasState.initialRotation,
      panStart: canvasState.panStart,
    },
    history: {
      undoStack: historyState.undoStack,
      redoStack: historyState.redoStack,
      position: historyState.position,
    },
    async: {
      isLoading: asyncState.isLoading,
      isSaving: asyncState.isSaving,
      loadError: asyncState.loadError,
      unsavedChanges: tableState.unsavedChanges,
    },
  }

  // Reconstruct legacy selectors
  const legacySelectors = {
    selectedTable: selectors.selectedTable,
    hoveredTable: selectors.hoveredTable,
    canUndo: selectors.canUndo,
    canRedo: selectors.canRedo,
    hasUnsavedChanges: selectors.hasUnsavedChanges,
    isLoading: selectors.isLoading,
    isSaving: selectors.isSaving,
    unsavedChanges: selectors.hasUnsavedChanges,
  }

  // Reconstruct legacy actions with the same API
  const legacyActions = {
    // Table actions
    setTables: tableActions.setTables,
    updateTable: tableActions.updateTable,
    addTable: tableActions.addTable,
    deleteTable: tableActions.deleteTable,
    duplicateTable: tableActions.duplicateTable,
    selectTable: tableActions.selectTable,
    setHoveredTable: tableActions.setHoveredTable,

    // Canvas actions  
    setZoom: canvasActions.setZoom,
    setPanOffset: canvasActions.setPanOffset,
    setCanvasSize: canvasActions.setCanvasSize,
    setInteractionMode: canvasActions.setInteractionMode,
    setDragOffset: canvasActions.setDragOffset,
    resetView: canvasActions.resetView,

    // UI actions
    toggleTablesPanel: uiActions.toggleTablesPanel,
    toggleControlsPanel: uiActions.toggleControlsPanel,
    setPanelState: uiActions.setPanelState,
    setGridVisible: uiActions.setGridVisible,
    setGridSize: uiActions.setGridSize,
    setGridSnap: uiActions.setGridSnap,
    setDisplayOption: uiActions.setDisplayOption,

    // History actions
    undo: actions.undo,
    redo: actions.redo,
    addToUndoStack: historyActions.addToHistory,

    // Data operations
    loadTables: actions.loadTables,
    saveTables: actions.saveTables,
  }

  return {
    state: legacyState,
    selectors: legacySelectors,
    actions: legacyActions,
    dispatch: () => {
      console.warn('Direct dispatch is deprecated. Use specific action methods instead.')
    },
  }
}