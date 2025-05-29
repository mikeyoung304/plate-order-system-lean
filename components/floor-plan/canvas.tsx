"use client"

import { useCallback, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Table } from "@/lib/floor-plan-utils"
import { useCanvasDrawing } from "@/hooks/use-canvas-drawing"
import type { CanvasInteractions } from "@/hooks/use-canvas-interactions"

// Throttle utility function
function throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
  let inThrottle: boolean
  let lastResult: ReturnType<T>
  return function(this: ThisParameterType<T>, ...args: Parameters<T>): ReturnType<T> {
    if (!inThrottle) {
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
      lastResult = func.apply(this, args)
    }
    return lastResult
  } as T
}

interface CanvasProps extends CanvasInteractions {
  tables: Table[]
  canvasSize: { width: number; height: number }
  isLoading: boolean
  canvasRef: React.RefObject<HTMLCanvasElement>
  
  // Drawing options
  isGridVisible: boolean
  gridSize: number
  snapToGrid: boolean
  showTableLabels: boolean
  showTableSeats: boolean
  showTableDimensions: boolean
  showTableStatus: boolean
  
  // Event handlers
  onTableUpdate: (tableId: string, updates: Partial<Table>) => void
  onAddToUndoStack: (tables: Table[]) => void
}

export function Canvas({
  tables,
  canvasSize,
  isLoading,
  
  // Drawing options
  isGridVisible,
  gridSize,
  snapToGrid,
  showTableLabels,
  showTableSeats,
  showTableDimensions,
  showTableStatus,
  
  // Interactions
  isDragging,
  isResizing,
  isRotating,
  isPanning,
  selectedTable,
  hoveredTable,
  dragOffset,
  resizeDirection,
  resizeStart,
  rotateStart,
  initialRotation,
  panStart,
  zoomLevel,
  panOffset,
  
  setIsDragging,
  setIsResizing,
  setIsRotating,
  setIsPanning,
  setSelectedTable,
  setHoveredTable,
  setDragOffset,
  setResizeDirection,
  setResizeStart,
  setRotateStart,
  setInitialRotation,
  setPanStart,
  setZoomLevel,
  setPanOffset,
  
  screenToCanvas,
  findTableAtPosition,
  findResizeHandleAtPosition,
  findRotationHandleAtPosition,
  
  // Event handlers
  onTableUpdate,
  onAddToUndoStack,
  canvasRef
}: CanvasProps) {

  // Drawing hook
  const { calculateSeatPositions } = useCanvasDrawing(
    canvasRef,
    tables,
    selectedTable,
    hoveredTable,
    canvasSize,
    zoomLevel,
    panOffset,
    {
      isGridVisible,
      gridSize,
      showTableLabels,
      showTableSeats,
      showTableDimensions,
      showTableStatus
    }
  )

  const snapToGridValue = useCallback((value: number): number => {
    return snapToGrid ? Math.round(value / gridSize) * gridSize : value
  }, [snapToGrid, gridSize])

  // Cursor style helpers
  const getDiagonalResizeCursor = useCallback((angle: number, baseCursor: 'nwse' | 'nesw'): string => {
    const normalizedAngle = ((angle % 180) + 180) % 180
    if (normalizedAngle > 22.5 && normalizedAngle <= 67.5) {
      return baseCursor === 'nwse' ? 'ns-resize' : 'ew-resize'
    }
    if (normalizedAngle > 67.5 && normalizedAngle <= 112.5) {
      return baseCursor === 'nwse' ? 'nesw-resize' : 'nwse-resize'
    }
    if (normalizedAngle > 112.5 && normalizedAngle <= 157.5) {
      return baseCursor === 'nwse' ? 'ew-resize' : 'ns-resize'
    }
    return `${baseCursor}-resize`
  }, [])

  const getStraightResizeCursor = useCallback((angle: number, baseCursor: 'ns' | 'ew'): string => {
    const normalizedAngle = ((angle % 180) + 180) % 180
    if (normalizedAngle > 22.5 && normalizedAngle <= 67.5) {
      return baseCursor === 'ns' ? 'nesw-resize' : 'nwse-resize'
    }
    if (normalizedAngle > 67.5 && normalizedAngle <= 112.5) {
      return baseCursor === 'ns' ? 'ew-resize' : 'ns-resize'
    }
    if (normalizedAngle > 112.5 && normalizedAngle <= 157.5) {
      return baseCursor === 'ns' ? 'nwse-resize' : 'nesw-resize'
    }
    return `${baseCursor}-resize`
  }, [])

  // Use ref for throttling to prevent infinite updates  
  const lastMoveTime = useRef(0)
  
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const now = performance.now()
    if (now - lastMoveTime.current < 16) return // Max 60fps
    lastMoveTime.current = now
    
    const { x, y } = screenToCanvas(e.clientX, e.clientY)
    const canvas = canvasRef.current
    if (!canvas) return

      if (isPanning) {
        const deltaX = e.clientX - panStart.x
        const deltaY = e.clientY - panStart.y
        setPanOffset({
          x: panOffset.x + deltaX,
          y: panOffset.y + deltaY
        })
        setPanStart({ x: e.clientX, y: e.clientY })
        return
      }

      if (isRotating && selectedTable) {
        const centerX = selectedTable.x + selectedTable.width / 2
        const centerY = selectedTable.y + selectedTable.height / 2
        const currentAngle = Math.atan2(y - centerY, x - centerX)
        const angleDiff = currentAngle - rotateStart
        const newRotation = initialRotation + (angleDiff * 180) / Math.PI
        
        onTableUpdate(selectedTable.id, { rotation: newRotation })
        return
      }

      if (isResizing && selectedTable && resizeDirection) {
        const MIN_SIZE = 20
        const deltaX = x - resizeStart.x
        const deltaY = y - resizeStart.y
        
        let newWidth = selectedTable.width
        let newHeight = selectedTable.height
        let newX = selectedTable.x
        let newY = selectedTable.y

        // Handle different resize directions
        if (resizeDirection.includes('r')) newWidth = Math.max(MIN_SIZE, selectedTable.width + deltaX)
        if (resizeDirection.includes('l')) {
          newWidth = Math.max(MIN_SIZE, selectedTable.width - deltaX)
          newX = selectedTable.x + deltaX
        }
        if (resizeDirection.includes('b')) newHeight = Math.max(MIN_SIZE, selectedTable.height + deltaY)
        if (resizeDirection.includes('t')) {
          newHeight = Math.max(MIN_SIZE, selectedTable.height - deltaY)
          newY = selectedTable.y + deltaY
        }

        // For circles, maintain aspect ratio
        if (selectedTable.type === "circle") {
          const size = Math.max(newWidth, newHeight)
          newWidth = size
          newHeight = size
        }

        if (snapToGrid) {
          newX = snapToGridValue(newX)
          newY = snapToGridValue(newY)
          newWidth = snapToGridValue(newWidth)
          newHeight = snapToGridValue(newHeight)
        }

        onTableUpdate(selectedTable.id, {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight
        })
        return
      }

      if (isDragging && selectedTable) {
        let newX = x - dragOffset.x
        let newY = y - dragOffset.y

        if (snapToGrid) {
          newX = snapToGridValue(newX)
          newY = snapToGridValue(newY)
        }

        // Only update if position actually changed significantly
        const threshold = 2
        if (Math.abs(newX - selectedTable.x) > threshold || Math.abs(newY - selectedTable.y) > threshold) {
          onTableUpdate(selectedTable.id, { x: newX, y: newY })
        }
        return
      }

      // Update hover state and cursor
      const hoveredTableFound = findTableAtPosition(x, y, tables)
      setHoveredTable(hoveredTableFound?.id || null)

      let cursorStyle = "default"
      if (selectedTable) {
        const resizeDir = findResizeHandleAtPosition(x, y)
        if (resizeDir) {
          const rotation = selectedTable.rotation || 0
          if (resizeDir === "tc" || resizeDir === "bc") {
            cursorStyle = getStraightResizeCursor(rotation, 'ns')
          } else if (resizeDir === "lc" || resizeDir === "rc") {
            cursorStyle = getStraightResizeCursor(rotation, 'ew')
          } else if (resizeDir === "tl" || resizeDir === "br") {
            cursorStyle = getDiagonalResizeCursor(rotation, 'nwse')
          } else if (resizeDir === "tr" || resizeDir === "bl") {
            cursorStyle = getDiagonalResizeCursor(rotation, 'nesw')
          }
        } else if (findRotationHandleAtPosition(x, y)) {
          cursorStyle = "grab"
        } else if (hoveredTableFound?.id === selectedTable.id) {
          cursorStyle = "move"
        }
      } else if (hoveredTableFound) {
        cursorStyle = "move"
      } else if (e.ctrlKey || e.metaKey) {
        cursorStyle = "grab"
      }
      
      canvas.style.cursor = cursorStyle
  }, [
    isPanning, panStart, panOffset, setPanOffset, setPanStart,
    isRotating, selectedTable, rotateStart, initialRotation, onTableUpdate,
    isResizing, resizeDirection, resizeStart, snapToGrid, snapToGridValue,
    isDragging, dragOffset, screenToCanvas, findTableAtPosition,
    findResizeHandleAtPosition, findRotationHandleAtPosition,
    getDiagonalResizeCursor, getStraightResizeCursor, tables, setHoveredTable
  ])

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging || isResizing || isRotating || isPanning) return
    
    const { x, y } = screenToCanvas(e.clientX, e.clientY)
    
    if (selectedTable) {
      if (findResizeHandleAtPosition(x, y)) return
      if (findRotationHandleAtPosition(x, y)) return
    }
    
    const clickedTable = findTableAtPosition(x, y, tables)
    setSelectedTable(clickedTable)
  }, [
    isDragging, isResizing, isRotating, isPanning, selectedTable,
    screenToCanvas, findResizeHandleAtPosition, findRotationHandleAtPosition,
    findTableAtPosition, tables, setSelectedTable
  ])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return // Only left click
    
    const { x, y } = screenToCanvas(e.clientX, e.clientY)
    
    if (selectedTable) {
      const resizeDir = findResizeHandleAtPosition(x, y)
      if (resizeDir) {
        setIsResizing(true)
        setResizeDirection(resizeDir)
        setResizeStart({ x, y })
        onAddToUndoStack([...tables])
        return
      }
      
      if (findRotationHandleAtPosition(x, y)) {
        setIsRotating(true)
        const centerX = selectedTable.x + selectedTable.width / 2
        const centerY = selectedTable.y + selectedTable.height / 2
        setRotateStart(Math.atan2(y - centerY, x - centerX))
        setInitialRotation(selectedTable.rotation || 0)
        onAddToUndoStack([...tables])
        return
      }
    }
    
    const clickedTable = findTableAtPosition(x, y, tables)
    if (clickedTable) {
      if (!selectedTable || selectedTable.id !== clickedTable.id) {
        setSelectedTable(clickedTable)
      }
      setIsDragging(true)
      setDragOffset({ x: x - clickedTable.x, y: y - clickedTable.y })
      onAddToUndoStack([...tables])
      
      // Haptic feedback on mobile
      if (navigator.vibrate) navigator.vibrate(50)
    } else if (e.ctrlKey || e.metaKey) {
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY })
    } else {
      setSelectedTable(null)
    }
  }, [
    screenToCanvas, selectedTable, findResizeHandleAtPosition,
    findRotationHandleAtPosition, findTableAtPosition, tables,
    setIsResizing, setResizeDirection, setResizeStart, onAddToUndoStack,
    setIsRotating, setRotateStart, setInitialRotation, setSelectedTable,
    setIsDragging, setDragOffset, setIsPanning, setPanStart
  ])

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    setIsPanning(true)
    setPanStart({ x: e.clientX, y: e.clientY })
  }, [setIsPanning, setPanStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setIsRotating(false)
    setIsPanning(false)
    
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "default"
    }
  }, [setIsDragging, setIsResizing, setIsRotating, setIsPanning])

  const handleWheel = useMemo(
    () => throttle((e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      
      const delta = -e.deltaY
      const zoomFactor = delta > 0 ? 1.1 : 0.9
      const newZoomLevel = Math.max(0.1, Math.min(5, zoomLevel * zoomFactor))
      
      const canvas = canvasRef.current
      if (!canvas) return
      
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
    
    const pointXBeforeZoom = (mouseX - panOffset.x) / zoomLevel
    const pointYBeforeZoom = (mouseY - panOffset.y) / zoomLevel
    
    const newPanOffsetX = mouseX - pointXBeforeZoom * newZoomLevel
    const newPanOffsetY = mouseY - pointYBeforeZoom * newZoomLevel
    
      setZoomLevel(newZoomLevel)
      setPanOffset({ x: newPanOffsetX, y: newPanOffsetY })
    }, 50), [zoomLevel, panOffset, setZoomLevel, setPanOffset])

  return (
    <div className="flex-1 relative border border-gray-800 rounded-xl overflow-hidden bg-gray-900/50 shadow-lg">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-50">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
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
          "w-full h-auto touch-manipulation",
          (isDragging || isResizing || isRotating || isPanning) ? "" : "cursor-default",
          isLoading && "opacity-50"
        )}
      />
      
      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-gray-900/80 backdrop-blur-sm p-2 rounded-lg border border-gray-800">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setZoomLevel(Math.max(0.1, zoomLevel / 1.2))}
          className="h-8 w-8 text-gray-400"
        >
          <span className="text-lg">−</span>
        </Button>
        <span className="text-sm text-gray-300 min-w-[60px] text-center">
          {Math.round(zoomLevel * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setZoomLevel(Math.min(5, zoomLevel * 1.2))}
          className="h-8 w-8 text-gray-400"
        >
          <span className="text-lg">+</span>
        </Button>
      </div>
    </div>
  )
}