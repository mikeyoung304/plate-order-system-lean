"use client"

import { useCallback, useEffect, useRef } from "react"
import type { Table } from "@/lib/floor-plan-utils"
import { useFloorPlanReducer } from "@/hooks/use-floor-plan-reducer"
import { useCanvasInteractionsOptimized } from "@/hooks/use-canvas-interactions-optimized"
import { Toolbar } from "./floor-plan/toolbar"
import { CanvasOptimized as Canvas } from "./floor-plan/canvas-optimized"
import { SidePanel } from "./floor-plan/side-panel"
import { FloorPlanErrorBoundary } from "./error-boundaries"

type FloorPlanEditorProps = {
  floorPlanId: string
}

export function FloorPlanEditor({ floorPlanId }: FloorPlanEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Floor plan state management - REDUCED FROM 33 useState TO 1 useReducer!
  const { selectors, actions } = useFloorPlanReducer(floorPlanId)
  
  // Canvas interactions - optimized version
  const interactions = useCanvasInteractionsOptimized(
    canvasRef,
    selectors.zoomLevel,
    selectors.panOffset
  )

  // Adjust canvas size on window resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const width = Math.min(1200, containerRef.current.clientWidth - 20)
        actions.setCanvasSize({ width, height: width * 0.75 })
      }
    }
    
    updateCanvasSize()
    window.addEventListener("resize", updateCanvasSize)
    return () => window.removeEventListener("resize", updateCanvasSize)
  }, [actions])

  // Table creation helper
  const createDefaultTable = useCallback((type: Table['type']): Table => {
    const tableCount = selectors.tables.length + 1
    const gridOffset = selectors.snapToGrid ? selectors.gridSize : 20
    
    return {
      id: `table-${Date.now()}`,
      type,
      x: selectors.snapToGrid ? 
        Math.round((100 + (tableCount % 5) * gridOffset) / selectors.gridSize) * selectors.gridSize :
        100 + (tableCount % 5) * gridOffset,
      y: selectors.snapToGrid ?
        Math.round((100 + Math.floor(tableCount / 5) * gridOffset) / selectors.gridSize) * selectors.gridSize :
        100 + Math.floor(tableCount / 5) * gridOffset,
      width: type === 'circle' ? 80 : 100,
      height: type === 'circle' ? 80 : (type === 'square' ? 100 : 60),
      seats: 4,
      label: `Table ${tableCount}`,
      rotation: 0,
      status: "available",
      zIndex: 1
    }
  }, [selectors.tables.length, selectors.snapToGrid, selectors.gridSize])

  // Table management handlers
  const handleAddTable = useCallback((type: Table['type']) => {
    const newTable = createDefaultTable(type)
    actions.addToUndoStack([...selectors.tables])
    actions.addTable(newTable)
  }, [createDefaultTable, actions, selectors.tables])

  const handleDeleteTable = useCallback(() => {
    if (!selectors.selectedTable) return
    
    actions.addToUndoStack([...selectors.tables])
    actions.deleteTable(selectors.selectedTable.id)
  }, [selectors.selectedTable, actions, selectors.tables])

  const handleDuplicateTable = useCallback(() => {
    if (!selectors.selectedTable) return
    
    actions.addToUndoStack([...selectors.tables])
    actions.duplicateTable(selectors.selectedTable.id)
  }, [selectors.selectedTable, actions, selectors.tables])

  const handleBringToFront = useCallback(() => {
    if (!selectors.selectedTable) return
    
    const highestZIndex = Math.max(...selectors.tables.map(t => t.zIndex || 0)) + 1
    actions.addToUndoStack([...selectors.tables])
    actions.updateTable(selectors.selectedTable.id, { zIndex: highestZIndex })
  }, [selectors.selectedTable, selectors.tables, actions])

  const handleSendToBack = useCallback(() => {
    if (!selectors.selectedTable) return
    
    const lowestZIndex = Math.min(...selectors.tables.map(t => t.zIndex || 0)) - 1
    actions.addToUndoStack([...selectors.tables])
    actions.updateTable(selectors.selectedTable.id, { zIndex: lowestZIndex })
  }, [selectors.selectedTable, selectors.tables, actions])

  const handleUpdateTableProperty = useCallback((property: keyof Table, value: any) => {
    if (!selectors.selectedTable) return
    actions.updateTable(selectors.selectedTable.id, { [property]: value })
  }, [selectors.selectedTable, actions])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement || 
          e.target instanceof HTMLSelectElement) return

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectors.selectedTable) handleDeleteTable()
      } else if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        actions.undo()
      } else if ((e.key === "y" && (e.ctrlKey || e.metaKey)) || 
                 (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey)) {
        e.preventDefault()
        actions.redo()
      } else if (e.key === "d" && (e.ctrlKey || e.metaKey) && selectors.selectedTable) {
        e.preventDefault()
        handleDuplicateTable()
      } else if (e.key === "g") {
        actions.setIsGridVisible(!selectors.isGridVisible)
      } else if (e.key === "s") {
        actions.setSnapToGrid(!selectors.snapToGrid)
      } else if (e.key === "r") {
        actions.resetView()
      } else if (selectors.selectedTable && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault()
        
        const moveDistance = e.shiftKey ? (selectors.snapToGrid ? selectors.gridSize : 10) : 1
        let newX = selectors.selectedTable.x
        let newY = selectors.selectedTable.y
        
        if (e.key === "ArrowLeft") newX -= moveDistance
        if (e.key === "ArrowRight") newX += moveDistance
        if (e.key === "ArrowUp") newY -= moveDistance
        if (e.key === "ArrowDown") newY += moveDistance
        
        if (selectors.snapToGrid && !e.shiftKey) {
          newX = Math.round(newX / selectors.gridSize) * selectors.gridSize
          newY = Math.round(newY / selectors.gridSize) * selectors.gridSize
        }
        
        actions.addToUndoStack([...selectors.tables])
        actions.updateTable(selectors.selectedTable.id, { x: newX, y: newY })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    selectors.selectedTable, selectors.isGridVisible, selectors.snapToGrid, selectors.gridSize, selectors.tables,
    handleDeleteTable, handleDuplicateTable, actions
  ])

  return (
    <FloorPlanErrorBoundary>
      <div className="grid grid-cols-1 gap-6">
        {/* Toolbar */}
        <Toolbar
          undoStack={selectors.undoStack}
          redoStack={selectors.redoStack}
          onUndo={actions.undo}
          onRedo={actions.redo}
          isGridVisible={selectors.isGridVisible}
          snapToGrid={selectors.snapToGrid}
          onToggleGrid={() => actions.setIsGridVisible(!selectors.isGridVisible)}
          onToggleSnap={() => actions.setSnapToGrid(!selectors.snapToGrid)}
          onAddTable={handleAddTable}
          onResetView={actions.resetView}
          onSave={actions.saveTables}
          isSaving={selectors.isSaving}
          showTooltips={selectors.showTooltips}
        />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Canvas Area */}
          <div ref={containerRef} className="flex-1">
            <Canvas
              tables={selectors.tables}
              canvasSize={selectors.canvasSize}
              isLoading={selectors.isLoading}
              selectedTable={selectors.selectedTable}
              hoveredTableId={selectors.hoveredTableId}
              zoomLevel={selectors.zoomLevel}
              panOffset={selectors.panOffset}
              
              // Drawing options
              isGridVisible={selectors.isGridVisible}
              gridSize={selectors.gridSize}
              snapToGrid={selectors.snapToGrid}
              showTableLabels={selectors.showTableLabels}
              showTableSeats={selectors.showTableSeats}
              showTableDimensions={selectors.showTableDimensions}
              showTableStatus={selectors.showTableStatus}
              
              // Interaction state
              interactionMode={selectors.interactionMode}
              
              // Interactions
              interactions={interactions}
              
              // Event handlers
              onTableUpdate={actions.updateTable}
              onSelectTable={actions.selectTable}
              onSetHoveredTable={actions.setHoveredTable}
              onSetInteractionMode={actions.setInteractionMode}
              onSetDragOffset={actions.setDragOffset}
              onSetResizeDirection={actions.setResizeDirection}
              onSetResizeStart={actions.setResizeStart}
              onSetRotateStart={actions.setRotateStart}
              onSetInitialRotation={actions.setInitialRotation}
              onSetPanStart={actions.setPanStart}
              onSetZoom={actions.setZoom}
              onSetPanOffset={actions.setPanOffset}
              onAddToUndoStack={actions.addToUndoStack}
              canvasRef={canvasRef as React.RefObject<HTMLCanvasElement>}
            />
          </div>

          {/* Side Panel */}
          <SidePanel
            // Table state
            tables={selectors.tables}
            selectedTable={selectors.selectedTable}
            onSelectTable={(table: Table) => actions.selectTable(table.id)}
            onUpdateTable={handleUpdateTableProperty}
            
            // Table actions
            onDeleteTable={handleDeleteTable}
            onDuplicateTable={handleDuplicateTable}
            onBringToFront={handleBringToFront}
            onSendToBack={handleSendToBack}
            
            // Panel states
            isTablesPanelOpen={selectors.isTablesPanelOpen}
            isControlsPanelOpen={selectors.isControlsPanelOpen}
            onToggleTablesPanel={actions.setIsTablesPanelOpen}
            onToggleControlsPanel={actions.setIsControlsPanelOpen}
            
            // Grid settings
            isGridVisible={selectors.isGridVisible}
            gridSize={selectors.gridSize}
            snapToGrid={selectors.snapToGrid}
            onToggleGrid={() => actions.setIsGridVisible(!selectors.isGridVisible)}
            onToggleSnap={() => actions.setSnapToGrid(!selectors.snapToGrid)}
            onGridSizeChange={actions.setGridSize}
            
            // Display settings
            showTooltips={selectors.showTooltips}
            showTableLabels={selectors.showTableLabels}
            showTableSeats={selectors.showTableSeats}
            showTableDimensions={selectors.showTableDimensions}
            showTableStatus={selectors.showTableStatus}
            onToggleTooltips={() => actions.setShowTooltips(!selectors.showTooltips)}
            onToggleLabels={() => actions.setShowTableLabels(!selectors.showTableLabels)}
            onToggleSeats={() => actions.setShowTableSeats(!selectors.showTableSeats)}
            onToggleDimensions={() => actions.setShowTableDimensions(!selectors.showTableDimensions)}
            onToggleStatus={() => actions.setShowTableStatus(!selectors.showTableStatus)}
          />
        </div>
      </div>
    </FloorPlanErrorBoundary>
  )
}