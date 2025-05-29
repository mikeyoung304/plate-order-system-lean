"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Table } from "@/lib/floor-plan-utils"
import { useCanvasInteractions } from "@/hooks/use-canvas-interactions"
import { useFloorPlanState } from "@/hooks/use-floor-plan-state"
import { Toolbar } from "./floor-plan/toolbar"
import { Canvas } from "./floor-plan/canvas"
import { SidePanel } from "./floor-plan/side-panel"

type FloorPlanEditorProps = {
  floorPlanId: string
}

export function FloorPlanEditor({ floorPlanId }: FloorPlanEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Floor plan state management
  const [state, actions] = useFloorPlanState(floorPlanId)
  
  // Canvas interactions
  const interactions = useCanvasInteractions(canvasRef)
  
  // Canvas size state
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })

  // Adjust canvas size on window resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const width = Math.min(1200, containerRef.current.clientWidth - 20)
        setCanvasSize({ width, height: width * 0.75 })
      }
    }
    
    updateCanvasSize()
    window.addEventListener("resize", updateCanvasSize)
    return () => window.removeEventListener("resize", updateCanvasSize)
  }, [])

  // Table creation helper
  const createDefaultTable = useCallback((type: Table['type']): Table => {
    const tableCount = state.tables.length + 1
    const gridOffset = state.snapToGrid ? state.gridSize : 20
    
    return {
      id: `table-${Date.now()}`,
      type,
      x: state.snapToGrid ? 
        Math.round((100 + (tableCount % 5) * gridOffset) / state.gridSize) * state.gridSize :
        100 + (tableCount % 5) * gridOffset,
      y: state.snapToGrid ?
        Math.round((100 + Math.floor(tableCount / 5) * gridOffset) / state.gridSize) * state.gridSize :
        100 + Math.floor(tableCount / 5) * gridOffset,
      width: type === 'circle' ? 80 : 100,
      height: type === 'circle' ? 80 : (type === 'square' ? 100 : 60),
      seats: 4,
      label: `Table ${tableCount}`,
      rotation: 0,
      status: "available",
      zIndex: 1
    }
  }, [state.tables.length, state.snapToGrid, state.gridSize])

  // Table management handlers
  const handleAddTable = useCallback((type: Table['type']) => {
    const newTable = createDefaultTable(type)
    actions.addToUndoStack([...state.tables])
    actions.addTable(newTable)
  }, [createDefaultTable, actions, state.tables])

  const handleDeleteTable = useCallback(() => {
    if (!state.selectedTable) return
    
    actions.addToUndoStack([...state.tables])
    actions.deleteTable(state.selectedTable.id)
  }, [state.selectedTable, actions, state.tables])

  const handleDuplicateTable = useCallback(() => {
    if (!state.selectedTable) return
    
    actions.addToUndoStack([...state.tables])
    actions.duplicateTable(state.selectedTable.id)
  }, [state.selectedTable, actions, state.tables])

  const handleBringToFront = useCallback(() => {
    if (!state.selectedTable) return
    
    const highestZIndex = Math.max(...state.tables.map(t => t.zIndex || 0)) + 1
    actions.addToUndoStack([...state.tables])
    actions.updateTable(state.selectedTable.id, { zIndex: highestZIndex })
  }, [state.selectedTable, state.tables, actions])

  const handleSendToBack = useCallback(() => {
    if (!state.selectedTable) return
    
    const lowestZIndex = Math.min(...state.tables.map(t => t.zIndex || 0)) - 1
    actions.addToUndoStack([...state.tables])
    actions.updateTable(state.selectedTable.id, { zIndex: lowestZIndex })
  }, [state.selectedTable, state.tables, actions])

  const handleUpdateTableProperty = useCallback((property: keyof Table, value: any) => {
    if (!state.selectedTable) return
    actions.updateTable(state.selectedTable.id, { [property]: value })
  }, [state.selectedTable, actions])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement || 
          e.target instanceof HTMLSelectElement) return

      if (e.key === "Delete" || e.key === "Backspace") {
        if (state.selectedTable) handleDeleteTable()
      } else if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        actions.undo()
      } else if ((e.key === "y" && (e.ctrlKey || e.metaKey)) || 
                 (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey)) {
        e.preventDefault()
        actions.redo()
      } else if (e.key === "d" && (e.ctrlKey || e.metaKey) && state.selectedTable) {
        e.preventDefault()
        handleDuplicateTable()
      } else if (e.key === "g") {
        actions.setIsGridVisible(!state.isGridVisible)
      } else if (e.key === "s") {
        actions.setSnapToGrid(!state.snapToGrid)
      } else if (e.key === "r") {
        interactions.resetView()
      } else if (state.selectedTable && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault()
        
        const moveDistance = e.shiftKey ? (state.snapToGrid ? state.gridSize : 10) : 1
        let newX = state.selectedTable.x
        let newY = state.selectedTable.y
        
        if (e.key === "ArrowLeft") newX -= moveDistance
        if (e.key === "ArrowRight") newX += moveDistance
        if (e.key === "ArrowUp") newY -= moveDistance
        if (e.key === "ArrowDown") newY += moveDistance
        
        if (state.snapToGrid && !e.shiftKey) {
          newX = Math.round(newX / state.gridSize) * state.gridSize
          newY = Math.round(newY / state.gridSize) * state.gridSize
        }
        
        actions.addToUndoStack([...state.tables])
        actions.updateTable(state.selectedTable.id, { x: newX, y: newY })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    state.selectedTable, state.isGridVisible, state.snapToGrid, state.gridSize, state.tables,
    handleDeleteTable, handleDuplicateTable, actions, interactions
  ])

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Toolbar */}
      <Toolbar
        undoStack={state.undoStack}
        redoStack={state.redoStack}
        onUndo={actions.undo}
        onRedo={actions.redo}
        isGridVisible={state.isGridVisible}
        snapToGrid={state.snapToGrid}
        onToggleGrid={() => actions.setIsGridVisible(!state.isGridVisible)}
        onToggleSnap={() => actions.setSnapToGrid(!state.snapToGrid)}
        onAddTable={handleAddTable}
        onResetView={interactions.resetView}
        onSave={actions.saveTables}
        isSaving={state.isSaving}
        showTooltips={state.showTooltips}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Canvas Area */}
        <div ref={containerRef} className="flex-1">
          <Canvas
            tables={state.tables}
            canvasSize={canvasSize}
            isLoading={state.isLoading}
            
            // Drawing options
            isGridVisible={state.isGridVisible}
            gridSize={state.gridSize}
            snapToGrid={state.snapToGrid}
            showTableLabels={state.showTableLabels}
            showTableSeats={state.showTableSeats}
            showTableDimensions={state.showTableDimensions}
            showTableStatus={state.showTableStatus}
            
            // Interactions
            {...interactions}
            
            // Event handlers
            onTableUpdate={actions.updateTable}
            onAddToUndoStack={actions.addToUndoStack}
          />
        </div>

        {/* Side Panel */}
        <SidePanel
          // Table state
          tables={state.tables}
          selectedTable={state.selectedTable}
          onSelectTable={actions.setSelectedTable}
          onUpdateTable={handleUpdateTableProperty}
          
          // Table actions
          onDeleteTable={handleDeleteTable}
          onDuplicateTable={handleDuplicateTable}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
          
          // Panel states
          isTablesPanelOpen={state.isTablesPanelOpen}
          isControlsPanelOpen={state.isControlsPanelOpen}
          onToggleTablesPanel={actions.setIsTablesPanelOpen}
          onToggleControlsPanel={actions.setIsControlsPanelOpen}
          
          // Grid settings
          isGridVisible={state.isGridVisible}
          gridSize={state.gridSize}
          snapToGrid={state.snapToGrid}
          onToggleGrid={() => actions.setIsGridVisible(!state.isGridVisible)}
          onToggleSnap={() => actions.setSnapToGrid(!state.snapToGrid)}
          onGridSizeChange={actions.setGridSize}
          
          // Display settings
          showTooltips={state.showTooltips}
          showTableLabels={state.showTableLabels}
          showTableSeats={state.showTableSeats}
          showTableDimensions={state.showTableDimensions}
          showTableStatus={state.showTableStatus}
          onToggleTooltips={() => actions.setShowTooltips(!state.showTooltips)}
          onToggleLabels={() => actions.setShowTableLabels(!state.showTableLabels)}
          onToggleSeats={() => actions.setShowTableSeats(!state.showTableSeats)}
          onToggleDimensions={() => actions.setShowTableDimensions(!state.showTableDimensions)}
          onToggleStatus={() => actions.setShowTableStatus(!state.showTableStatus)}
        />
      </div>
    </div>
  )
}