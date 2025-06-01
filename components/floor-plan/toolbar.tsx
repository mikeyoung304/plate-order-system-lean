'use client'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  CircleIcon,
  Grid,
  Loader2,
  Move,
  RectangleHorizontal,
  Redo2,
  Save,
  Square,
  Undo2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Table } from '@/lib/floor-plan-utils'

interface ToolbarProps {
  // Undo/Redo
  undoStack: Table[][]
  redoStack: Table[][]
  onUndo: () => void
  onRedo: () => void

  // Grid and snap
  isGridVisible: boolean
  snapToGrid: boolean
  onToggleGrid: () => void
  onToggleSnap: () => void

  // Table creation
  onAddTable: (type: Table['type']) => void

  // View and save
  onResetView: () => void
  onSave: () => void

  // Loading states
  isSaving: boolean
  showTooltips: boolean
}

export function Toolbar({
  undoStack,
  redoStack,
  onUndo,
  onRedo,
  isGridVisible,
  snapToGrid,
  onToggleGrid,
  onToggleSnap,
  onAddTable,
  onResetView,
  onSave,
  isSaving,
  showTooltips = true,
}: ToolbarProps) {
  const ToolbarButton = ({
    icon,
    label,
    onClick,
    disabled = false,
    active = false,
  }: {
    icon: React.ReactNode
    label: string
    onClick: () => void
    disabled?: boolean
    active?: boolean
  }) => (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={active ? 'default' : 'outline'}
            size='icon'
            onClick={onClick}
            disabled={disabled || isSaving}
            className={cn(
              'h-9 w-9',
              active && 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            {icon}
            <span className='sr-only'>{label}</span>
          </Button>
        </TooltipTrigger>
        {showTooltips && <TooltipContent>{label}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  )

  return (
    <div className='flex items-center justify-between bg-gray-900/50 p-3 rounded-lg border border-gray-800/50 shadow-lg'>
      {/* Left side - Tools */}
      <div className='flex items-center gap-2'>
        {/* Undo/Redo */}
        <ToolbarButton
          icon={<Undo2 className='h-4 w-4' />}
          label='Undo (Ctrl+Z)'
          onClick={onUndo}
          disabled={undoStack.length <= 1 || isSaving}
        />
        <ToolbarButton
          icon={<Redo2 className='h-4 w-4' />}
          label='Redo (Ctrl+Y)'
          onClick={onRedo}
          disabled={redoStack.length === 0 || isSaving}
        />

        <div className='h-6 border-l border-gray-700 mx-1' />

        {/* Grid and Snap */}
        <ToolbarButton
          icon={<Grid className='h-4 w-4' />}
          label={isGridVisible ? 'Hide Grid (G)' : 'Show Grid (G)'}
          onClick={onToggleGrid}
          active={isGridVisible}
          disabled={isSaving}
        />
        <ToolbarButton
          icon={<Move className='h-4 w-4' />}
          label={snapToGrid ? 'Snap to Grid (S)' : 'Free Movement (S)'}
          onClick={onToggleSnap}
          active={snapToGrid}
          disabled={isSaving}
        />

        <div className='h-6 border-l border-gray-700 mx-1' />

        {/* Table Creation */}
        <ToolbarButton
          icon={<CircleIcon className='h-4 w-4' />}
          label='Add Circle Table'
          onClick={() => onAddTable('circle')}
          disabled={isSaving}
        />
        <ToolbarButton
          icon={<Square className='h-4 w-4' />}
          label='Add Square Table'
          onClick={() => onAddTable('square')}
          disabled={isSaving}
        />
        <ToolbarButton
          icon={<RectangleHorizontal className='h-4 w-4' />}
          label='Add Rectangle Table'
          onClick={() => onAddTable('rectangle')}
          disabled={isSaving}
        />
      </div>

      {/* Right side - Actions */}
      <div className='flex items-center gap-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={onResetView}
          className='text-sm gap-1'
          disabled={isSaving}
        >
          Reset View
        </Button>
        <Button
          variant='default'
          size='sm'
          onClick={onSave}
          className='text-sm gap-1 bg-blue-600 hover:bg-blue-700'
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className='h-4 w-4 mr-1 animate-spin' />
          ) : (
            <Save className='h-4 w-4 mr-1' />
          )}
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
