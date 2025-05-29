"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Settings, ChevronRight } from "lucide-react"

interface DisplayOptionsProps {
  isOpen: boolean
  onToggle: (open: boolean) => void
  
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

export function DisplayOptions({
  isOpen,
  onToggle,
  
  isGridVisible,
  gridSize,
  snapToGrid,
  onToggleGrid,
  onToggleSnap,
  onGridSizeChange,
  
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
}: DisplayOptionsProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle} className="bg-gray-900/50 rounded-lg border border-gray-800 overflow-hidden shadow-lg">
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/50">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-medium">Display Options</h3>
          </div>
          <ChevronRight className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="p-4 border-t border-gray-800 space-y-4">
          {/* Grid Settings */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-300 border-b border-gray-800 pb-2">Grid Settings</h4>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-grid" className="text-sm">Show Grid</Label>
              <Switch
                id="show-grid"
                checked={isGridVisible}
                onCheckedChange={onToggleGrid}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="snap-to-grid" className="text-sm">Snap to Grid</Label>
              <Switch
                id="snap-to-grid"
                checked={snapToGrid}
                onCheckedChange={onToggleSnap}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="grid-size" className="text-sm">Grid Size ({gridSize}px)</Label>
              <Slider
                id="grid-size"
                value={[gridSize]}
                onValueChange={(value) => onGridSizeChange(value[0])}
                min={10}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </div>

          {/* Table Display */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-300 border-b border-gray-800 pb-2">Table Display</h4>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-labels" className="text-sm">Show Labels</Label>
              <Switch
                id="show-labels"
                checked={showTableLabels}
                onCheckedChange={onToggleLabels}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-seats" className="text-sm">Show Seats</Label>
              <Switch
                id="show-seats"
                checked={showTableSeats}
                onCheckedChange={onToggleSeats}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-dimensions" className="text-sm">Show Dimensions</Label>
              <Switch
                id="show-dimensions"
                checked={showTableDimensions}
                onCheckedChange={onToggleDimensions}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-status" className="text-sm">Show Status</Label>
              <Switch
                id="show-status"
                checked={showTableStatus}
                onCheckedChange={onToggleStatus}
              />
            </div>
          </div>

          {/* Interface Settings */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-300 border-b border-gray-800 pb-2">Interface</h4>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-tooltips" className="text-sm">Show Tooltips</Label>
              <Switch
                id="show-tooltips"
                checked={showTooltips}
                onCheckedChange={onToggleTooltips}
              />
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}