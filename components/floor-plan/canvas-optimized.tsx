'use client'

import React, { useCallback, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Table } from '@/lib/floor-plan-utils'
import { useCanvasDrawing } from '@/hooks/use-canvas-drawing'
import type { CanvasInteractionsOptimized } from '@/hooks/use-canvas-interactions-optimized'
import type { FloorPlanState } from '@/hooks/use-floor-plan-reducer'

// Throttle utility function
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean
  let lastResult: ReturnType<T>
  return function (
    this: ThisParameterType<T>,
    ...args: Parameters<T>
  ): ReturnType<T> {
    if (!inThrottle) {
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
      lastResult = func.apply(this, args)
    }
    return lastResult
  } as T
}

interface CanvasOptimizedProps {
  tables: Table[]
  canvasSize: { width: number; height: number }
  isLoading: boolean
  selectedTable: Table | null
  hoveredTableId: string | null
  zoomLevel: number
  panOffset: { x: number; y: number }
  canvasRef: React.RefObject<HTMLCanvasElement>

  // Drawing options
  isGridVisible: boolean
  gridSize: number
  snapToGrid: boolean
  showTableLabels: boolean
  showTableSeats: boolean
  showTableDimensions: boolean
  showTableStatus: boolean

  // Interaction state
  interactionMode: FloorPlanState['interaction']['mode']

  // Interactions
  interactions: CanvasInteractionsOptimized

  // Event handlers
  onTableUpdate: (tableId: string, updates: Partial<Table>) => void
  onSelectTable: (tableId: string | null) => void
  onSetHoveredTable: (tableId: string | null) => void
  onSetInteractionMode: (mode: FloorPlanState['interaction']['mode']) => void
  onSetDragOffset: (offset: { x: number; y: number }) => void
  onSetResizeDirection: (direction: string | null) => void
  onSetResizeStart: (start: { x: number; y: number }) => void
  onSetRotateStart: (start: number) => void
  onSetInitialRotation: (rotation: number) => void
  onSetPanStart: (start: { x: number; y: number }) => void
  onSetZoom: (level: number) => void
  onSetPanOffset: (offset: { x: number; y: number }) => void
  onAddToUndoStack: (tables: Table[]) => void
}

export const CanvasOptimized = React.memo(function CanvasOptimized({
  tables,
  canvasSize,
  isLoading,
  selectedTable,
  hoveredTableId,
  zoomLevel,
  panOffset,

  // Drawing options
  isGridVisible,
  gridSize,
  snapToGrid,
  showTableLabels,
  showTableSeats,
  showTableDimensions,
  showTableStatus,

  // Interaction state
  interactionMode,

  // Interactions
  interactions,

  // Event handlers
  onTableUpdate,
  onSelectTable,
  onSetHoveredTable,
  onSetInteractionMode,
  onSetDragOffset,
  onSetResizeDirection,
  onSetResizeStart,
  onSetRotateStart,
  onSetInitialRotation,
  onSetPanStart,
  onSetZoom,
  onSetPanOffset,
  onAddToUndoStack,
  canvasRef,
}: CanvasOptimizedProps) {
  // Memoized drawing options
  const drawingOptions = useMemo(
    () => ({
      isGridVisible,
      gridSize,
      showTableLabels,
      showTableSeats,
      showTableDimensions,
      showTableStatus,
    }),
    [
      isGridVisible,
      gridSize,
      showTableLabels,
      showTableSeats,
      showTableDimensions,
      showTableStatus,
    ]
  )

  // Drawing hook
  const { calculateSeatPositions } = useCanvasDrawing(
    canvasRef,
    tables,
    selectedTable,
    hoveredTableId,
    canvasSize,
    zoomLevel,
    panOffset,
    drawingOptions
  )

  const snapToGridValue = useCallback(
    (value: number): number => {
      return snapToGrid ? Math.round(value / gridSize) * gridSize : value
    },
    [snapToGrid, gridSize]
  )

  // Use ref for throttling to prevent infinite updates
  const lastMoveTime = useRef(0)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const now = performance.now()
      if (now - lastMoveTime.current < 16) {
        return
      } // Max 60fps
      lastMoveTime.current = now

      const { x, y } = interactions.screenToCanvas(e.clientX, e.clientY)
      const canvas = canvasRef.current
      if (!canvas) {
        return
      }

      if (interactionMode === 'panning') {
        // Handle panning - get panStart from somewhere or track it
        return
      }

      if (interactionMode === 'rotating' && selectedTable) {
        const centerX = selectedTable.x + selectedTable.width / 2
        const centerY = selectedTable.y + selectedTable.height / 2
        const currentAngle = Math.atan2(y - centerY, x - centerX)
        // Get rotateStart and initialRotation from state
        // const angleDiff = currentAngle - rotateStart
        // const newRotation = initialRotation + (angleDiff * 180) / Math.PI
        // onTableUpdate(selectedTable.id, { rotation: newRotation })
        return
      }

      if (interactionMode === 'resizing' && selectedTable) {
        const MIN_SIZE = 20
        // Get resizeStart and resizeDirection from state
        // Handle resizing logic
        return
      }

      if (interactionMode === 'dragging' && selectedTable) {
        // Get dragOffset from state
        // Handle dragging logic
        return
      }

      // Update hover state and cursor
      const hoveredTable = interactions.findTableAtPosition(x, y, tables)
      onSetHoveredTable(hoveredTable?.id || null)

      const cursorStyle = interactions.getCursorStyle(
        x,
        y,
        selectedTable,
        hoveredTable,
        tables,
        zoomLevel,
        e.ctrlKey || e.metaKey
      )
      canvas.style.cursor = cursorStyle
    },
    [
      interactionMode,
      selectedTable,
      interactions,
      tables,
      onSetHoveredTable,
      zoomLevel,
      onTableUpdate,
    ]
  )

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (interactionMode !== 'idle') {
        return
      }

      const { x, y } = interactions.screenToCanvas(e.clientX, e.clientY)

      if (selectedTable) {
        if (
          interactions.findResizeHandleAtPosition(
            x,
            y,
            selectedTable,
            zoomLevel
          )
        ) {
          return
        }
        if (
          interactions.findRotationHandleAtPosition(
            x,
            y,
            selectedTable,
            zoomLevel
          )
        ) {
          return
        }
      }

      const clickedTable = interactions.findTableAtPosition(x, y, tables)
      onSelectTable(clickedTable?.id || null)
    },
    [
      interactionMode,
      selectedTable,
      interactions,
      tables,
      onSelectTable,
      zoomLevel,
    ]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) {
        return
      } // Only left click

      const { x, y } = interactions.screenToCanvas(e.clientX, e.clientY)

      if (selectedTable) {
        const resizeDir = interactions.findResizeHandleAtPosition(
          x,
          y,
          selectedTable,
          zoomLevel
        )
        if (resizeDir) {
          onSetInteractionMode('resizing')
          onSetResizeDirection(resizeDir)
          onSetResizeStart({ x, y })
          onAddToUndoStack([...tables])
          return
        }

        if (
          interactions.findRotationHandleAtPosition(
            x,
            y,
            selectedTable,
            zoomLevel
          )
        ) {
          onSetInteractionMode('rotating')
          const centerX = selectedTable.x + selectedTable.width / 2
          const centerY = selectedTable.y + selectedTable.height / 2
          onSetRotateStart(Math.atan2(y - centerY, x - centerX))
          onSetInitialRotation(selectedTable.rotation || 0)
          onAddToUndoStack([...tables])
          return
        }
      }

      const clickedTable = interactions.findTableAtPosition(x, y, tables)
      if (clickedTable) {
        if (!selectedTable || selectedTable.id !== clickedTable.id) {
          onSelectTable(clickedTable.id)
        }
        onSetInteractionMode('dragging')
        onSetDragOffset({ x: x - clickedTable.x, y: y - clickedTable.y })
        onAddToUndoStack([...tables])

        // Haptic feedback on mobile
        if (navigator.vibrate) {
          navigator.vibrate(50)
        }
      } else if (e.ctrlKey || e.metaKey) {
        onSetInteractionMode('panning')
        onSetPanStart({ x: e.clientX, y: e.clientY })
      } else {
        onSelectTable(null)
      }
    },
    [
      interactions,
      selectedTable,
      tables,
      zoomLevel,
      onSetInteractionMode,
      onSetResizeDirection,
      onSetResizeStart,
      onAddToUndoStack,
      onSetRotateStart,
      onSetInitialRotation,
      onSelectTable,
      onSetDragOffset,
      onSetPanStart,
    ]
  )

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      onSetInteractionMode('panning')
      onSetPanStart({ x: e.clientX, y: e.clientY })
    },
    [onSetInteractionMode, onSetPanStart]
  )

  const handleMouseUp = useCallback(() => {
    onSetInteractionMode('idle')

    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'default'
    }
  }, [onSetInteractionMode])

  const handleWheel = useMemo(
    () =>
      throttle((e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault()

        const delta = -e.deltaY
        const zoomFactor = delta > 0 ? 1.1 : 0.9
        const newZoomLevel = Math.max(0.1, Math.min(5, zoomLevel * zoomFactor))

        const canvas = canvasRef.current
        if (!canvas) {
          return
        }

        const rect = canvas.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        const pointXBeforeZoom = (mouseX - panOffset.x) / zoomLevel
        const pointYBeforeZoom = (mouseY - panOffset.y) / zoomLevel

        const newPanOffsetX = mouseX - pointXBeforeZoom * newZoomLevel
        const newPanOffsetY = mouseY - pointYBeforeZoom * newZoomLevel

        onSetZoom(newZoomLevel)
        onSetPanOffset({ x: newPanOffsetX, y: newPanOffsetY })
      }, 50),
    [zoomLevel, panOffset, onSetZoom, onSetPanOffset]
  )

  return (
    <div className='flex-1 relative border border-gray-800 rounded-xl overflow-hidden bg-gray-900/50 shadow-lg'>
      {isLoading && (
        <div className='absolute inset-0 flex items-center justify-center bg-gray-900/50 z-50'>
          <Loader2 className='h-8 w-8 text-blue-500 animate-spin' />
        </div>
      )}

      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
        className={cn(
          'w-full h-auto touch-manipulation',
          interactionMode !== 'idle' ? '' : 'cursor-default',
          isLoading && 'opacity-50'
        )}
      />

      {/* Zoom controls */}
      <div className='absolute bottom-4 right-4 flex items-center gap-2 bg-gray-900/80 backdrop-blur-sm p-2 rounded-lg border border-gray-800'>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => onSetZoom(Math.max(0.1, zoomLevel / 1.2))}
          className='h-8 w-8 text-gray-400'
        >
          <span className='text-lg'>−</span>
        </Button>
        <span className='text-sm text-gray-300 min-w-[60px] text-center'>
          {Math.round(zoomLevel * 100)}%
        </span>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => onSetZoom(Math.min(5, zoomLevel * 1.2))}
          className='h-8 w-8 text-gray-400'
        >
          <span className='text-lg'>+</span>
        </Button>
      </div>
    </div>
  )
})
