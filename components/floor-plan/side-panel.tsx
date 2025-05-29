"use client"

import type { Table } from "@/lib/floor-plan-utils"
import { TableProperties } from "./table-properties"
import { DisplayOptions } from "./display-options"
import { TableList } from "./table-list"

interface SidePanelProps {
  // Table state
  tables: Table[]
  selectedTable: Table | null
  onSelectTable: (table: Table) => void
  onUpdateTable: (property: keyof Table, value: any) => void
  
  // Table actions
  onDeleteTable: () => void
  onDuplicateTable: () => void
  onBringToFront: () => void
  onSendToBack: () => void
  
  // Panel states
  isTablesPanelOpen: boolean
  isControlsPanelOpen: boolean
  onToggleTablesPanel: (open: boolean) => void
  onToggleControlsPanel: (open: boolean) => void
  
  // Grid settings
  isGridVisible: boolean
  gridSize: number
  snapToGrid: boolean
  onToggleGrid: () => void
  onToggleSnap: () => void
  onGridSizeChange: (size: number) => void
  
  // Display settings
  showTooltips: boolean
  showTableLabels: boolean
  showTableSeats: boolean
  showTableDimensions: boolean
  showTableStatus: boolean
  onToggleTooltips: () => void
  onToggleLabels: () => void
  onToggleSeats: () => void
  onToggleDimensions: () => void
  onToggleStatus: () => void
}

export function SidePanel({
  // Table state
  tables,
  selectedTable,
  onSelectTable,
  onUpdateTable,
  
  // Table actions
  onDeleteTable,
  onDuplicateTable,
  onBringToFront,
  onSendToBack,
  
  // Panel states
  isTablesPanelOpen,
  isControlsPanelOpen,
  onToggleTablesPanel,
  onToggleControlsPanel,
  
  // Grid settings
  isGridVisible,
  gridSize,
  snapToGrid,
  onToggleGrid,
  onToggleSnap,
  onGridSizeChange,
  
  // Display settings
  showTooltips,
  showTableLabels,
  showTableSeats,
  showTableDimensions,
  showTableStatus,
  onToggleTooltips,
  onToggleLabels,
  onToggleSeats,
  onToggleDimensions,
  onToggleStatus
}: SidePanelProps) {
  return (
    <div className="w-full lg:w-80 flex flex-col gap-4">
      {/* Table Properties */}
      <TableProperties
        selectedTable={selectedTable}
        isOpen={isTablesPanelOpen}
        onToggle={onToggleTablesPanel}
        onUpdateTable={onUpdateTable}
        onDeleteTable={onDeleteTable}
        onDuplicateTable={onDuplicateTable}
        onBringToFront={onBringToFront}
        onSendToBack={onSendToBack}
      />
      
      {/* Display Options */}
      <DisplayOptions
        isOpen={isControlsPanelOpen}
        onToggle={onToggleControlsPanel}
        
        isGridVisible={isGridVisible}
        gridSize={gridSize}
        snapToGrid={snapToGrid}
        onToggleGrid={onToggleGrid}
        onToggleSnap={onToggleSnap}
        onGridSizeChange={onGridSizeChange}
        
        showTooltips={showTooltips}
        showTableLabels={showTableLabels}
        showTableSeats={showTableSeats}
        showTableDimensions={showTableDimensions}
        showTableStatus={showTableStatus}
        onToggleTooltips={onToggleTooltips}
        onToggleLabels={onToggleLabels}
        onToggleSeats={onToggleSeats}
        onToggleDimensions={onToggleDimensions}
        onToggleStatus={onToggleStatus}
      />
      
      {/* Table List */}
      <TableList
        tables={tables}
        selectedTable={selectedTable}
        onSelectTable={onSelectTable}
      />
    </div>
  )
}