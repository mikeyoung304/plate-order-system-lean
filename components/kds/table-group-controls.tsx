'use client'

import { memo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import {
  Eye,
  EyeOff,
  Filter,
  Layout,
  Maximize2,
  Minimize2,
  Palette,
  Settings,
  SortAsc,
  Timer,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

interface TableGroupControlsProps {
  onToggleCompactMode: (compact: boolean) => void
  onToggleAutoCollapse: (enabled: boolean) => void
  onSetCollapseDelay: (seconds: number) => void
  onToggleColorCoding: (enabled: boolean) => void
  onToggleDragReorder: (enabled: boolean) => void
  onToggleTimeline: (enabled: boolean) => void
  onToggleAnalytics: (enabled: boolean) => void
  isCompactMode: boolean
  isAutoCollapse: boolean
  collapseDelay: number
  isColorCoding: boolean
  isDragReorder: boolean
  isTimelineVisible: boolean
  isAnalyticsVisible: boolean
  className?: string
}

export const TableGroupControls = memo(function TableGroupControls({
  onToggleCompactMode,
  onToggleAutoCollapse,
  onSetCollapseDelay,
  onToggleColorCoding,
  onToggleDragReorder,
  onToggleTimeline,
  onToggleAnalytics,
  isCompactMode,
  isAutoCollapse,
  collapseDelay,
  isColorCoding,
  isDragReorder,
  isTimelineVisible,
  isAnalyticsVisible,
  className,
}: TableGroupControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Group Controls
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="space-y-6">
              {/* Display Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  Display Settings
                </h3>
                
                <div className="space-y-3">
                  {/* Compact Mode */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="compact-mode" className="flex items-center gap-2">
                      {isCompactMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                      Compact Mode
                    </Label>
                    <Switch
                      id="compact-mode"
                      checked={isCompactMode}
                      onCheckedChange={onToggleCompactMode}
                    />
                  </div>

                  {/* Color Coding */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="color-coding" className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Time-based Colors
                    </Label>
                    <Switch
                      id="color-coding"
                      checked={isColorCoding}
                      onCheckedChange={onToggleColorCoding}
                    />
                  </div>

                  {/* Drag Reorder */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="drag-reorder" className="flex items-center gap-2">
                      <SortAsc className="h-4 w-4" />
                      Drag to Reorder
                    </Label>
                    <Switch
                      id="drag-reorder"
                      checked={isDragReorder}
                      onCheckedChange={onToggleDragReorder}
                    />
                  </div>
                </div>
              </div>

              {/* View Options */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  View Options
                </h3>
                
                <div className="space-y-3">
                  {/* Timeline View */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="timeline-view" className="flex items-center gap-2">
                      <Timer className="h-4 w-4" />
                      Show Timeline
                    </Label>
                    <Switch
                      id="timeline-view"
                      checked={isTimelineVisible}
                      onCheckedChange={onToggleTimeline}
                    />
                  </div>

                  {/* Analytics View */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="analytics-view" className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Show Analytics
                    </Label>
                    <Switch
                      id="analytics-view"
                      checked={isAnalyticsVisible}
                      onCheckedChange={onToggleAnalytics}
                    />
                  </div>
                </div>
              </div>

              {/* Auto Collapse Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  Auto Collapse
                </h3>
                
                <div className="space-y-3">
                  {/* Auto Collapse Toggle */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-collapse">
                      Collapse completed tables
                    </Label>
                    <Switch
                      id="auto-collapse"
                      checked={isAutoCollapse}
                      onCheckedChange={onToggleAutoCollapse}
                    />
                  </div>

                  {/* Collapse Delay Slider */}
                  {isAutoCollapse && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span>Delay before collapse</span>
                        <Badge variant="secondary">{collapseDelay}s</Badge>
                      </div>
                      <Slider
                        value={[collapseDelay]}
                        onValueChange={([value]) => onSetCollapseDelay(value)}
                        min={5}
                        max={60}
                        step={5}
                        className="w-full"
                      />
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onToggleCompactMode(true)
                    onToggleColorCoding(true)
                    onToggleAutoCollapse(true)
                    onSetCollapseDelay(30)
                  }}
                >
                  Optimize for Rush
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onToggleCompactMode(false)
                    onToggleTimeline(true)
                    onToggleAnalytics(true)
                  }}
                >
                  Detailed View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onToggleCompactMode(false)
                    onToggleColorCoding(false)
                    onToggleAutoCollapse(false)
                    onToggleTimeline(false)
                    onToggleAnalytics(false)
                  }}
                >
                  Reset to Default
                </Button>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
})