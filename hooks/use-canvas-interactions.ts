'use client'

import { useCallback, useRef, useState } from 'react'
import type { Table } from '@/lib/floor-plan-utils'

export interface CanvasInteractions {
  // State
  isDragging: boolean
  isResizing: boolean
  isRotating: boolean
  isPanning: boolean
  selectedTable: Table | null
  hoveredTable: string | null
  dragOffset: { x: number; y: number }
  resizeDirection: string | null
  resizeStart: { x: number; y: number }
  rotateStart: number
  initialRotation: number
  panStart: { x: number; y: number }
  zoomLevel: number
  panOffset: { x: number; y: number }

  // Actions
  setIsDragging: (value: boolean) => void
  setIsResizing: (value: boolean) => void
  setIsRotating: (value: boolean) => void
  setIsPanning: (value: boolean) => void
  setSelectedTable: (table: Table | null) => void
  setHoveredTable: (tableId: string | null) => void
  setDragOffset: (offset: { x: number; y: number }) => void
  setResizeDirection: (direction: string | null) => void
  setResizeStart: (position: { x: number; y: number }) => void
  setRotateStart: (angle: number) => void
  setInitialRotation: (rotation: number) => void
  setPanStart: (position: { x: number; y: number }) => void
  setZoomLevel: (level: number) => void
  setPanOffset: (offset: { x: number; y: number }) => void

  // Helper functions
  screenToCanvas: (screenX: number, screenY: number) => { x: number; y: number }
  findTableAtPosition: (x: number, y: number, tables: Table[]) => Table | null
  findResizeHandleAtPosition: (x: number, y: number) => string | null
  findRotationHandleAtPosition: (x: number, y: number) => boolean
  resetView: () => void
}

export function useCanvasInteractions(
  canvasRef: React.RefObject<HTMLCanvasElement | null>
): CanvasInteractions {
  // State
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [hoveredTable, setHoveredTable] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizeDirection, setResizeDirection] = useState<string | null>(null)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 })
  const [rotateStart, setRotateStart] = useState(0)
  const [initialRotation, setInitialRotation] = useState(0)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })

  // Helper functions
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number): { x: number; y: number } => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }

      const rect = canvas.getBoundingClientRect()
      return {
        x: (screenX - rect.left - panOffset.x) / zoomLevel,
        y: (screenY - rect.top - panOffset.y) / zoomLevel,
      }
    },
    [panOffset, zoomLevel]
  )

  const findTableAtPosition = useCallback(
    (x: number, y: number, tables: Table[]): Table | null => {
      for (let i = tables.length - 1; i >= 0; i--) {
        const table = tables[i]
        const rotation = (table.rotation || 0) * (Math.PI / 180)
        const centerX = table.x + table.width / 2
        const centerY = table.y + table.height / 2

        const translatedX = x - centerX
        const translatedY = y - centerY
        const rotatedX =
          translatedX * Math.cos(-rotation) - translatedY * Math.sin(-rotation)
        const rotatedY =
          translatedX * Math.sin(-rotation) + translatedY * Math.cos(-rotation)
        const localX = rotatedX + centerX
        const localY = rotatedY + centerY

        if (table.type === 'circle') {
          const radius = table.width / 2
          if (
            (localX - centerX) ** 2 + (localY - centerY) ** 2 <=
            radius ** 2
          ) {
            return table
          }
        } else {
          if (
            localX >= table.x &&
            localX <= table.x + table.width &&
            localY >= table.y &&
            localY <= table.y + table.height
          ) {
            return table
          }
        }
      }
      return null
    },
    []
  )

  const findResizeHandleAtPosition = useCallback(
    (x: number, y: number): string | null => {
      if (!selectedTable) return null

      const handleHitboxSize = 20 / zoomLevel
      const table = selectedTable
      const rotation = (table.rotation || 0) * (Math.PI / 180)
      const centerX = table.x + table.width / 2
      const centerY = table.y + table.height / 2

      const translatedX = x - centerX
      const translatedY = y - centerY
      const rotatedX =
        translatedX * Math.cos(-rotation) - translatedY * Math.sin(-rotation)
      const rotatedY =
        translatedX * Math.sin(-rotation) + translatedY * Math.cos(-rotation)
      const localX = rotatedX + centerX
      const localY = rotatedY + centerY

      let handles: { x: number; y: number; dir: string }[] = []

      if (table.type === 'circle') {
        handles = [
          { x: centerX, y: table.y, dir: 'tc' },
          { x: table.x + table.width, y: centerY, dir: 'rc' },
          { x: centerX, y: table.y + table.height, dir: 'bc' },
          { x: table.x, y: centerY, dir: 'lc' },
        ]
      } else {
        handles = [
          { x: table.x, y: table.y, dir: 'tl' },
          { x: centerX, y: table.y, dir: 'tc' },
          { x: table.x + table.width, y: table.y, dir: 'tr' },
          { x: table.x + table.width, y: centerY, dir: 'rc' },
          { x: table.x + table.width, y: table.y + table.height, dir: 'br' },
          { x: centerX, y: table.y + table.height, dir: 'bc' },
          { x: table.x, y: table.y + table.height, dir: 'bl' },
          { x: table.x, y: centerY, dir: 'lc' },
        ]
      }

      for (const handle of handles) {
        if (
          localX >= handle.x - handleHitboxSize / 2 &&
          localX <= handle.x + handleHitboxSize / 2 &&
          localY >= handle.y - handleHitboxSize / 2 &&
          localY <= handle.y + handleHitboxSize / 2
        ) {
          return handle.dir
        }
      }

      return null
    },
    [selectedTable, zoomLevel]
  )

  const findRotationHandleAtPosition = useCallback(
    (x: number, y: number): boolean => {
      if (!selectedTable) return false

      const handleHitboxRadius = 15 / zoomLevel
      const table = selectedTable
      const rotation = (table.rotation || 0) * (Math.PI / 180)
      const centerX = table.x + table.width / 2
      const centerY = table.y + table.height / 2

      const rotationHandleLineOffset = 25 / zoomLevel
      const handleOffsetX_unrotated = 0
      const handleOffsetY_unrotated =
        -(table.height / 2) - rotationHandleLineOffset - 6 / zoomLevel

      const cosR = Math.cos(rotation)
      const sinR = Math.sin(rotation)
      const handleCenterX =
        centerX +
        (handleOffsetX_unrotated * cosR - handleOffsetY_unrotated * sinR)
      const handleCenterY =
        centerY +
        (handleOffsetX_unrotated * sinR + handleOffsetY_unrotated * cosR)

      return (
        (x - handleCenterX) ** 2 + (y - handleCenterY) ** 2 <=
        handleHitboxRadius ** 2
      )
    },
    [selectedTable, zoomLevel]
  )

  const resetView = useCallback(() => {
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })
  }, [])

  return {
    // State
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

    // Actions
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

    // Helper functions
    screenToCanvas,
    findTableAtPosition,
    findResizeHandleAtPosition,
    findRotationHandleAtPosition,
    resetView,
  }
}
