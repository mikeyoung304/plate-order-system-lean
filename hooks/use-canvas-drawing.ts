"use client"

import { useCallback, useEffect, useRef } from "react"
import type { Table } from "@/lib/floor-plan-utils"

export interface DrawingOptions {
  isGridVisible: boolean
  gridSize: number
  showTableLabels: boolean
  showTableSeats: boolean
  showTableDimensions: boolean
  showTableStatus: boolean
}

export interface CanvasDrawing {
  calculateSeatPositions: (type: string, x: number, y: number, width: number, height: number, seats: number) => { x: number; y: number }[]
}

export function useCanvasDrawing(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  tables: Table[],
  selectedTable: Table | null,
  hoveredTable: string | null,
  canvasSize: { width: number; height: number },
  zoomLevel: number,
  panOffset: { x: number; y: number },
  drawingOptions: DrawingOptions
): CanvasDrawing {

  const calculateSeatPositions = useCallback((
    type: string, 
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    seats: number
  ): { x: number; y: number }[] => {
    const positions: { x: number; y: number }[] = []
    const seatOffset = 15 / zoomLevel

    if (type === "circle") {
      const radius = width / 2 + seatOffset
      const centerX = x + width / 2
      const centerY = y + height / 2
      
      for (let i = 0; i < seats; i++) {
        const angle = (i / seats) * 2 * Math.PI
        positions.push({
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        })
      }
    } else {
      const perimeter = 2 * (width + height)
      if (seats <= 0) return []
      
      const spacing = perimeter / seats
      let currentDistance = spacing / 2
      
      for (let i = 0; i < seats; i++) {
        let posX = 0, posY = 0
        
        if (currentDistance <= width) {
          posX = x + currentDistance
          posY = y - seatOffset
        } else if (currentDistance <= width + height) {
          posX = x + width + seatOffset
          posY = y + (currentDistance - width)
        } else if (currentDistance <= 2 * width + height) {
          posX = x + width - (currentDistance - width - height)
          posY = y + height + seatOffset
        } else {
          posX = x - seatOffset
          posY = y + height - (currentDistance - 2 * width - height)
        }
        
        positions.push({ x: posX, y: posY })
        currentDistance += spacing
      }
    }
    
    return positions
  }, [zoomLevel])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const drawFrame = () => {
      if (!canvasRef.current) return
      
      // Only resize if canvas size changed
      if (canvas.width !== canvasSize.width || canvas.height !== canvasSize.height) {
        canvas.width = canvasSize.width
        canvas.height = canvasSize.height
      }
      
      ctx.save()
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.translate(panOffset.x, panOffset.y)
      ctx.scale(zoomLevel, zoomLevel)

      // Draw grid
      if (drawingOptions.isGridVisible) {
        ctx.beginPath()
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
        ctx.lineWidth = 1 / zoomLevel
        
        const viewLeft = -panOffset.x / zoomLevel
        const viewTop = -panOffset.y / zoomLevel
        const viewRight = (canvasSize.width - panOffset.x) / zoomLevel
        const viewBottom = (canvasSize.height - panOffset.y) / zoomLevel
        
        const startX = Math.floor(viewLeft / drawingOptions.gridSize) * drawingOptions.gridSize
        const startY = Math.floor(viewTop / drawingOptions.gridSize) * drawingOptions.gridSize
        const endX = Math.ceil(viewRight / drawingOptions.gridSize) * drawingOptions.gridSize
        const endY = Math.ceil(viewBottom / drawingOptions.gridSize) * drawingOptions.gridSize
        
        for (let gx = startX; gx <= endX; gx += drawingOptions.gridSize) {
          ctx.moveTo(gx, viewTop)
          ctx.lineTo(gx, viewBottom)
        }
        
        for (let gy = startY; gy <= endY; gy += drawingOptions.gridSize) {
          ctx.moveTo(viewLeft, gy)
          ctx.lineTo(viewRight, gy)
        }
        
        ctx.stroke()
      }

      // Draw tables
      const sortedTables = [...tables].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
      
      sortedTables.forEach((table) => {
        ctx.save()
        
        const rotation = (table.rotation || 0) * (Math.PI / 180)
        const centerX = table.x + table.width / 2
        const centerY = table.y + table.height / 2
        
        ctx.translate(centerX, centerY)
        ctx.rotate(rotation)
        ctx.translate(-centerX, -centerY)
        
        const isSelected = selectedTable?.id === table.id
        const isHovered = hoveredTable === table.id
        
        ctx.fillStyle = isSelected 
          ? "rgba(59, 130, 246, 0.5)" 
          : isHovered 
            ? "rgba(255, 255, 255, 0.2)" 
            : "rgba(255, 255, 255, 0.1)"
        ctx.strokeStyle = isSelected 
          ? "#3B82F6" 
          : isHovered 
            ? "#ffffff" 
            : "#6b7280"
        ctx.lineWidth = isSelected ? 3 / zoomLevel : 1.5 / zoomLevel
        
        ctx.beginPath()
        if (table.type === "circle") {
          ctx.arc(centerX, centerY, table.width / 2, 0, 2 * Math.PI)
        } else {
          ctx.rect(table.x, table.y, table.width, table.height)
        }
        ctx.fill()
        ctx.stroke()

        // Draw seats
        if (drawingOptions.showTableSeats) {
          const seatPositions = calculateSeatPositions(
            table.type, table.x, table.y, table.width, table.height, table.seats
          )
          ctx.fillStyle = "#cbd5e1"
          const seatRadius = 5 / zoomLevel
          
          seatPositions.forEach(pos => {
            ctx.beginPath()
            ctx.arc(pos.x, pos.y, seatRadius, 0, 2 * Math.PI)
            ctx.fill()
          })
        }

        // Draw labels
        if (drawingOptions.showTableLabels) {
          ctx.fillStyle = "#e5e7eb"
          ctx.font = `${14 / zoomLevel}px sans-serif`
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(table.label, centerX, centerY)
        }

        // Draw dimensions
        if (drawingOptions.showTableDimensions) {
          ctx.fillStyle = "#9ca3af"
          ctx.font = `${10 / zoomLevel}px sans-serif`
          ctx.textAlign = "center"
          ctx.textBaseline = "bottom"
          ctx.fillText(
            `${Math.round(table.width)}x${Math.round(table.height)}`,
            centerX,
            table.y - 5 / zoomLevel
          )
        }

        // Draw status indicator
        if (drawingOptions.showTableStatus && table.status) {
          let statusColor = "#6b7280"
          if (table.status === "available") statusColor = "#10B981"
          else if (table.status === "occupied") statusColor = "#EF4444"
          else if (table.status === "reserved") statusColor = "#F59E0B"
          
          ctx.fillStyle = statusColor
          ctx.beginPath()
          ctx.arc(
            table.x + table.width - 8 / zoomLevel,
            table.y + 8 / zoomLevel,
            5 / zoomLevel,
            0,
            2 * Math.PI
          )
          ctx.fill()
        }
        
        ctx.restore()
      })

      // Draw selection handles
      if (selectedTable) {
        const table = tables.find(t => t.id === selectedTable.id)
        if (table) {
          ctx.save()
          
          const rotation = (table.rotation || 0) * (Math.PI / 180)
          const centerX = table.x + table.width / 2
          const centerY = table.y + table.height / 2
          
          ctx.translate(centerX, centerY)
          ctx.rotate(rotation)
          ctx.translate(-centerX, -centerY)
          
          const handleDrawSize = 8 / zoomLevel
          const handleOffset = handleDrawSize / 2
          ctx.fillStyle = "#3B82F6"
          
          let handles: { x: number; y: number }[] = []
          if (table.type === "circle") {
            handles = [
              { x: centerX, y: table.y },
              { x: table.x + table.width, y: centerY },
              { x: centerX, y: table.y + table.height },
              { x: table.x, y: centerY }
            ]
          } else {
            handles = [
              { x: table.x, y: table.y },
              { x: centerX, y: table.y },
              { x: table.x + table.width, y: table.y },
              { x: table.x + table.width, y: centerY },
              { x: table.x + table.width, y: table.y + table.height },
              { x: centerX, y: table.y + table.height },
              { x: table.x, y: table.y + table.height },
              { x: table.x, y: centerY }
            ]
          }
          
          handles.forEach(handle => {
            ctx.fillRect(
              handle.x - handleOffset,
              handle.y - handleOffset,
              handleDrawSize,
              handleDrawSize
            )
          })

          // Draw rotation handle
          const rotationHandleRadius = 6 / zoomLevel
          const rotationHandleLineOffset = 25 / zoomLevel
          const rotationHandleX = centerX
          const rotationHandleY = table.y - rotationHandleLineOffset - rotationHandleRadius
          
          ctx.beginPath()
          ctx.arc(rotationHandleX, rotationHandleY, rotationHandleRadius, 0, 2 * Math.PI)
          ctx.fill()
          
          ctx.beginPath()
          ctx.moveTo(centerX, table.y)
          ctx.lineTo(rotationHandleX, rotationHandleY)
          ctx.strokeStyle = "#3B82F6"
          ctx.lineWidth = 1 / zoomLevel
          ctx.stroke()
          
          ctx.restore()
        }
      }
      
      ctx.restore()
    }

    // Draw once when dependencies change
    drawFrame()
  }, [
    tables,
    selectedTable,
    hoveredTable,
    canvasSize,
    zoomLevel,
    panOffset,
    drawingOptions,
    calculateSeatPositions
  ])

  return {
    calculateSeatPositions
  }
}