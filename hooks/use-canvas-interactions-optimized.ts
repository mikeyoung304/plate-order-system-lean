'use client'

import { useCallback, useRef } from 'react'
import type { Table } from '@/lib/floor-plan-utils'
import type { FloorPlanState } from './use-floor-plan-reducer'

export interface CanvasInteractionsOptimized {
  // Helper functions
  screenToCanvas: (screenX: number, screenY: number) => { x: number; y: number }
  findTableAtPosition: (x: number, y: number, tables: Table[]) => Table | null
  findResizeHandleAtPosition: (
    x: number,
    y: number,
    selectedTable: Table | null,
    zoomLevel: number
  ) => string | null
  findRotationHandleAtPosition: (
    x: number,
    y: number,
    selectedTable: Table | null,
    zoomLevel: number
  ) => boolean

  // Cursor helpers
  getCursorStyle: (
    x: number,
    y: number,
    selectedTable: Table | null,
    hoveredTable: Table | null,
    tables: Table[],
    zoomLevel: number,
    ctrlPressed: boolean
  ) => string
}

export function useCanvasInteractionsOptimized(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  zoomLevel: number,
  panOffset: { x: number; y: number }
): CanvasInteractionsOptimized {
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
      // Iterate in reverse order to check tables with higher z-index first
      for (let i = tables.length - 1; i >= 0; i--) {
        const table = tables[i]
        const rotation = (table.rotation || 0) * (Math.PI / 180)
        const centerX = table.x + table.width / 2
        const centerY = table.y + table.height / 2

        // Transform point to table's local coordinate system
        const translatedX = x - centerX
        const translatedY = y - centerY
        const rotatedX =
          translatedX * Math.cos(-rotation) - translatedY * Math.sin(-rotation)
        const rotatedY =
          translatedX * Math.sin(-rotation) + translatedY * Math.cos(-rotation)
        const localX = rotatedX + centerX
        const localY = rotatedY + centerY

        // Check if point is inside table
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
    (
      x: number,
      y: number,
      selectedTable: Table | null,
      zoomLevel: number
    ): string | null => {
      if (!selectedTable) return null

      const handleHitboxSize = 20 / zoomLevel
      const table = selectedTable
      const rotation = (table.rotation || 0) * (Math.PI / 180)
      const centerX = table.x + table.width / 2
      const centerY = table.y + table.height / 2

      // Transform point to table's local coordinate system
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
    []
  )

  const findRotationHandleAtPosition = useCallback(
    (
      x: number,
      y: number,
      selectedTable: Table | null,
      zoomLevel: number
    ): boolean => {
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
    []
  )

  // Cursor style helpers
  const getDiagonalResizeCursor = useCallback(
    (angle: number, baseCursor: 'nwse' | 'nesw'): string => {
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
    },
    []
  )

  const getStraightResizeCursor = useCallback(
    (angle: number, baseCursor: 'ns' | 'ew'): string => {
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
    },
    []
  )

  const getCursorStyle = useCallback(
    (
      x: number,
      y: number,
      selectedTable: Table | null,
      hoveredTable: Table | null,
      tables: Table[],
      zoomLevel: number,
      ctrlPressed: boolean
    ): string => {
      if (selectedTable) {
        const resizeDir = findResizeHandleAtPosition(
          x,
          y,
          selectedTable,
          zoomLevel
        )
        if (resizeDir) {
          const rotation = selectedTable.rotation || 0
          if (resizeDir === 'tc' || resizeDir === 'bc') {
            return getStraightResizeCursor(rotation, 'ns')
          } else if (resizeDir === 'lc' || resizeDir === 'rc') {
            return getStraightResizeCursor(rotation, 'ew')
          } else if (resizeDir === 'tl' || resizeDir === 'br') {
            return getDiagonalResizeCursor(rotation, 'nwse')
          } else if (resizeDir === 'tr' || resizeDir === 'bl') {
            return getDiagonalResizeCursor(rotation, 'nesw')
          }
        }

        if (findRotationHandleAtPosition(x, y, selectedTable, zoomLevel)) {
          return 'grab'
        }

        if (hoveredTable?.id === selectedTable.id) {
          return 'move'
        }
      }

      if (hoveredTable) {
        return 'move'
      }

      if (ctrlPressed) {
        return 'grab'
      }

      return 'default'
    },
    [
      findResizeHandleAtPosition,
      findRotationHandleAtPosition,
      getStraightResizeCursor,
      getDiagonalResizeCursor,
    ]
  )

  return {
    screenToCanvas,
    findTableAtPosition,
    findResizeHandleAtPosition,
    findRotationHandleAtPosition,
    getCursorStyle,
  }
}
