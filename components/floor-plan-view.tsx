// File: frontend/components/floor-plan-view.tsx
"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"

import { Badge } from "@/components/ui/badge"
import { Table } from "@/lib/floor-plan-utils"
import { useSeatStatus } from "@/hooks/use-seat-status"

type FloorPlanViewProps = {
  onSelectTable: (table: Table) => void
  tables: Table[]
}

export function FloorPlanView({ onSelectTable, tables }: FloorPlanViewProps) {
  const [hoveredTable, setHoveredTable] = useState<string | null>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [spotlights, setSpotlights] = useState<{ x: number; y: number; color: string }[]>([])
  
  // Real-time seat status tracking
  const { getSeatStatus } = useSeatStatus()
  
  // Mobile zoom state
  const [zoom, setZoom] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const [touchStartDistance, setTouchStartDistance] = useState(0)
  const [lastTouchCenter, setLastTouchCenter] = useState({ x: 0, y: 0 })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null);

  // Touch utility functions
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0
    const touch1 = touches[0]
    const touch2 = touches[1]
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )
  }

  const getTouchCenter = (touches: React.TouchList) => {
    if (touches.length === 0) return { x: 0, y: 0 }
    if (touches.length === 1) return { x: touches[0].clientX, y: touches[0].clientY }
    
    const touch1 = touches[0]
    const touch2 = touches[1]
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    }
  }

  // Get seat color based on real-time status
  const getSeatColors = (tableId: string, seatNumber: number, isHovered: boolean) => {
    const seatStatus = getSeatStatus(tableId, seatNumber)
    
    if (!seatStatus || seatStatus.status === 'available') {
      // Default available seat colors
      return {
        fillStart: isHovered ? "rgba(56, 189, 174, 0.7)" : "rgba(255, 255, 255, 0.5)",
        fillEnd: isHovered ? "rgba(56, 189, 174, 0.4)" : "rgba(200, 200, 200, 0.3)",
        stroke: isHovered ? "rgba(56, 189, 174, 0.8)" : "rgba(255, 255, 255, 0.6)"
      }
    }
    
    switch (seatStatus.status) {
      case 'ordering':
        return {
          fillStart: "rgba(59, 130, 246, 0.8)", // Blue
          fillEnd: "rgba(59, 130, 246, 0.5)",
          stroke: "rgba(59, 130, 246, 1)"
        }
      case 'waiting':
        return {
          fillStart: "rgba(251, 191, 36, 0.8)", // Amber/Yellow
          fillEnd: "rgba(251, 191, 36, 0.5)",
          stroke: "rgba(251, 191, 36, 1)"
        }
      case 'eating':
        return {
          fillStart: "rgba(34, 197, 94, 0.8)", // Green
          fillEnd: "rgba(34, 197, 94, 0.5)",
          stroke: "rgba(34, 197, 94, 1)"
        }
      case 'needs_clearing':
        return {
          fillStart: "rgba(239, 68, 68, 0.8)", // Red
          fillEnd: "rgba(239, 68, 68, 0.5)",
          stroke: "rgba(239, 68, 68, 1)"
        }
      default:
        return {
          fillStart: isHovered ? "rgba(56, 189, 174, 0.7)" : "rgba(255, 255, 255, 0.5)",
          fillEnd: isHovered ? "rgba(56, 189, 174, 0.4)" : "rgba(200, 200, 200, 0.3)",
          stroke: isHovered ? "rgba(56, 189, 174, 0.8)" : "rgba(255, 255, 255, 0.6)"
        }
    }
  }

  const calculateTableBounds = (tables: Table[]) => {
    if (tables.length === 0) return { minX: 0, minY: 0, maxX: 800, maxY: 600 }
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    
    tables.forEach(table => {
      const leftX = table.x
      const rightX = table.x + table.width
      const topY = table.y
      const bottomY = table.y + table.height
      
      minX = Math.min(minX, leftX)
      maxX = Math.max(maxX, rightX)
      minY = Math.min(minY, topY)
      maxY = Math.max(maxY, bottomY)
    })
    
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
  }


  const resetToFit = () => {
    if (tables.length === 0) return
    
    const bounds = calculateTableBounds(tables)
    if (!bounds.width || !bounds.height) return
    
    const isMobile = window.innerWidth < 768
    const padding = isMobile ? 30 : 50 // Less padding on mobile
    const availableWidth = canvasSize.width - padding * 2
    const availableHeight = canvasSize.height - padding * 2
    
    const scaleX = availableWidth / bounds.width
    const scaleY = availableHeight / bounds.height
    
    // On mobile, allow more zoom to make tables easier to tap
    const maxZoom = isMobile ? 3 : 2
    const fitZoom = Math.min(scaleX, scaleY, maxZoom)
    
    setZoom(fitZoom)
    setPanOffset({
      x: (canvasSize.width - bounds.width * fitZoom) / 2 - bounds.minX * fitZoom,
      y: (canvasSize.height - bounds.height * fitZoom) / 2 - bounds.minY * fitZoom
    })
  }

  // Auto-fit on load and when tables change
  useEffect(() => {
    if (tables.length > 0) {
      resetToFit()
    }
  }, [tables, canvasSize])

  // Create random spotlight positions
  useEffect(() => {
    const spots = Array.from({ length: 5 }, (_, i) => ({
      x: Math.random() * canvasSize.width,
      y: Math.random() * canvasSize.height,
      color: i % 2 === 0 ? "teal" : "amber",
    }));
    setSpotlights(spots);
  }, [canvasSize]);

  // Adjust canvas size for mobile
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 20;
        const isMobile = window.innerWidth < 768;
        
        if (isMobile) {
          // Mobile: Use full width and taller aspect ratio for better table spacing
          const width = Math.min(600, containerWidth);
          setCanvasSize({ width, height: width * 1.2 }); // Taller on mobile
        } else {
          // Desktop: Standard sizing
          const width = Math.min(800, containerWidth);
          setCanvasSize({ width, height: width * 0.75 });
        }
      }
    };
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  // Calculate seat positions
  const calculateSeatPositions = useCallback((type: string, x: number, y: number, width: number, height: number, seats: number) => {
    const positions: { x: number; y: number }[] = [];
    const seatOffset = 15; // Fixed offset for simplicity now
    if (type === "circle") {
      const radius = width / 2 + seatOffset;
      const centerX = x + width / 2, centerY = y + height / 2;
      for (let i = 0; i < seats; i++) { const angle = (i / seats) * 2 * Math.PI - Math.PI / 2; positions.push({ x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) }); }
    } else {
      const perimeter = 2 * (width + height); if (seats <= 0) return []; const spacing = perimeter / seats; let currentDistance = spacing / 2;
      for (let i = 0; i < seats; i++) { let posX = 0, posY = 0; if (currentDistance <= width) { posX = x + currentDistance; posY = y - seatOffset; } else if (currentDistance <= width + height) { posX = x + width + seatOffset; posY = y + (currentDistance - width); } else if (currentDistance <= 2 * width + height) { posX = x + width - (currentDistance - width - height); posY = y + height + seatOffset; } else { posX = x - seatOffset; posY = y + height - (currentDistance - 2 * width - height); } positions.push({ x: posX, y: posY }); currentDistance += spacing; }
    } return positions;
  }, []); // Removed zoomLevel dependency

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;

    const drawFrame = (time: number) => {
      if (!canvasRef.current) return;
      canvas.width = canvasSize.width; canvas.height = canvasSize.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height); gradient.addColorStop(0, "rgba(17, 24, 39, 0.95)"); gradient.addColorStop(1, "rgba(10, 15, 25, 0.95)"); ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Apply zoom and pan transformation
      ctx.save()
      ctx.translate(panOffset.x, panOffset.y)
      ctx.scale(zoom, zoom)

      // Draw tables
      tables.forEach((table) => {
        const isHovered = hoveredTable === table.id;
        const rotationRad = (table.rotation || 0) * (Math.PI / 180);
        const centerX = table.x + table.width / 2, centerY = table.y + table.height / 2;
        ctx.save(); ctx.translate(centerX, centerY); ctx.rotate(rotationRad); ctx.translate(-centerX, -centerY);

        // Styling
        const baseColor = "rgba(13, 148, 136, 1)"; const hoverColor = "rgba(56, 189, 174, 1)"; const strokeColor = isHovered ? hoverColor : baseColor;
        const gradientStart = isHovered ? "rgba(56, 189, 174, 0.4)" : "rgba(13, 148, 136, 0.25)"; const gradientEnd = isHovered ? "rgba(56, 189, 174, 0.2)" : "rgba(13, 148, 136, 0.15)";
        const tableGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, table.width / 2); tableGradient.addColorStop(0, gradientStart); tableGradient.addColorStop(1, gradientEnd);
        ctx.fillStyle = tableGradient; ctx.strokeStyle = strokeColor; ctx.lineWidth = isHovered ? 2.5 : 1.5;

        // Shadow
        ctx.shadowColor = isHovered ? "rgba(56, 189, 174, 0.5)" : "rgba(0, 0, 0, 0.4)"; ctx.shadowBlur = isHovered ? 20 : 10; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = isHovered ? 6 : 4;

        // Draw Shape
        const cornerRadius = 8; ctx.beginPath();
        if (table.type === "circle") { ctx.arc(centerX, centerY, table.width / 2, 0, Math.PI * 2); }
        else { ctx.moveTo(table.x + cornerRadius, table.y); ctx.lineTo(table.x + table.width - cornerRadius, table.y); ctx.quadraticCurveTo(table.x + table.width, table.y, table.x + table.width, table.y + cornerRadius); ctx.lineTo(table.x + table.width, table.y + table.height - cornerRadius); ctx.quadraticCurveTo(table.x + table.width, table.y + table.height, table.x + table.width - cornerRadius, table.y + table.height); ctx.lineTo(table.x + cornerRadius, table.y + table.height); ctx.quadraticCurveTo(table.x, table.y + table.height, table.x, table.y + table.height - cornerRadius); ctx.lineTo(table.x, table.y + cornerRadius); ctx.quadraticCurveTo(table.x, table.y, table.x + cornerRadius, table.y); }
        ctx.fill(); ctx.stroke();

        // Reset shadow
        ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

        // Draw Label
        ctx.fillStyle = "#ffffff"; ctx.font = isHovered ? "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" : "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.translate(centerX, centerY); ctx.rotate(-rotationRad); ctx.fillText(table.label, 0, 0); ctx.rotate(rotationRad); ctx.translate(-centerX, -centerY);

        // Draw Seats with real-time status colors
        const seatRadius = 5; const seatPositions = calculateSeatPositions(table.type, table.x, table.y, table.width, table.height, table.seats);
        seatPositions.forEach((position, seatIndex) => { 
          const seatNumber = seatIndex + 1
          const seatColors = getSeatColors(table.id, seatNumber, isHovered)
          const seatGradient = ctx.createRadialGradient(position.x, position.y, 0, position.x, position.y, seatRadius)
          seatGradient.addColorStop(0, seatColors.fillStart)
          seatGradient.addColorStop(1, seatColors.fillEnd)
          ctx.fillStyle = seatGradient
          ctx.strokeStyle = seatColors.stroke
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(position.x, position.y, seatRadius, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
        });

        ctx.restore();
      });

      // Restore transformation
      ctx.restore()

      animationFrameRef.current = requestAnimationFrame(drawFrame);
    };

    drawFrame(0);
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; };
  }, [tables, hoveredTable, canvasSize, spotlights, calculateSeatPositions, zoom, panOffset]);

  // Handle canvas click - Enhanced Hit Detection with rotation support
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
    
    // Transform screen coordinates to canvas coordinates accounting for zoom/pan
    const screenX = (e.clientX - rect.left) * scaleX
    const screenY = (e.clientY - rect.top) * scaleY
    const x = (screenX - panOffset.x) / zoom
    const y = (screenY - panOffset.y) / zoom

    let clickedTable: Table | null = null;
    // Iterate reverse for Z-index
    for (let i = tables.length - 1; i >= 0; i--) {
        const table = tables[i];
        
        // Enhanced hit detection that better handles rotation
        const centerX = table.x + table.width / 2;
        const centerY = table.y + table.height / 2;
        const rotationRad = (table.rotation || 0) * (Math.PI / 180);
        
        // Translate point relative to table center
        const relX = x - centerX;
        const relY = y - centerY;
        
        // Rotate point in opposite direction of table rotation
        const rotatedX = relX * Math.cos(-rotationRad) - relY * Math.sin(-rotationRad);
        const rotatedY = relX * Math.sin(-rotationRad) + relY * Math.cos(-rotationRad);
        
        // Add buffer for easier clicking - larger on mobile
        const isMobile = window.innerWidth < 768;
        const buffer = isMobile ? 25 : 15; // Much larger tap area on mobile
        
        if (table.type === "circle") {
            // For circle, check if point is within radius
            const distance = Math.sqrt(rotatedX * rotatedX + rotatedY * rotatedY);
            if (distance <= (table.width / 2) + buffer) {
                clickedTable = table;
                break;
            }
        } else {
            // For rectangles and squares, check if rotated point is within bounds
            if (
                rotatedX >= -table.width / 2 - buffer &&
                rotatedX <= table.width / 2 + buffer &&
                rotatedY >= -table.height / 2 - buffer &&
                rotatedY <= table.height / 2 + buffer
            ) {
                clickedTable = table;
                break;
            }
        }
    }

    if (clickedTable) {
      onSelectTable(clickedTable);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
    
    // Transform screen coordinates to canvas coordinates accounting for zoom/pan
    const screenX = (e.clientX - rect.left) * scaleX
    const screenY = (e.clientY - rect.top) * scaleY
    const x = (screenX - panOffset.x) / zoom
    const y = (screenY - panOffset.y) / zoom

    let hoveredTableId: string | null = null;
    // Find hovered table (iterate reverse for Z-index) - Using enhanced detection
    for (let i = tables.length - 1; i >= 0; i--) {
        const table = tables[i];
        
        // Enhanced hit detection that handles rotation
        const centerX = table.x + table.width / 2;
        const centerY = table.y + table.height / 2;
        const rotationRad = (table.rotation || 0) * (Math.PI / 180);
        
        // Translate point relative to table center
        const relX = x - centerX;
        const relY = y - centerY;
        
        // Rotate point in opposite direction of table rotation
        const rotatedX = relX * Math.cos(-rotationRad) - relY * Math.sin(-rotationRad);
        const rotatedY = relX * Math.sin(-rotationRad) + relY * Math.cos(-rotationRad);
        
        // Small buffer for hover
        const buffer = 5;
        
        if (table.type === "circle") {
            // For circle, check if point is within radius
            const distance = Math.sqrt(rotatedX * rotatedX + rotatedY * rotatedY);
            if (distance <= (table.width / 2) + buffer) {
                hoveredTableId = table.id;
                break;
            }
        } else {
            // For rectangles and squares, check if rotated point is within bounds
            if (
                rotatedX >= -table.width / 2 - buffer &&
                rotatedX <= table.width / 2 + buffer &&
                rotatedY >= -table.height / 2 - buffer &&
                rotatedY <= table.height / 2 + buffer
            ) {
                hoveredTableId = table.id;
                break;
            }
        }
    }
    // Only update state if hover actually changes to prevent unnecessary re-renders
    if (hoveredTableId !== hoveredTable) {
        setHoveredTable(hoveredTableId);
    }
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    
    if (e.touches.length === 1) {
      // Single touch - start panning
      const touch = e.touches[0]
      setIsPanning(true)
      setLastPanPoint({ x: touch.clientX, y: touch.clientY })
    } else if (e.touches.length === 2) {
      // Two fingers - start pinch zoom
      setIsPanning(false)
      const distance = getTouchDistance(e.touches)
      const center = getTouchCenter(e.touches)
      setTouchStartDistance(distance)
      setLastTouchCenter(center)
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    
    if (e.touches.length === 1 && isPanning) {
      // Single touch panning
      const touch = e.touches[0]
      const deltaX = touch.clientX - lastPanPoint.x
      const deltaY = touch.clientY - lastPanPoint.y
      
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      
      setLastPanPoint({ x: touch.clientX, y: touch.clientY })
    } else if (e.touches.length === 2) {
      // Two finger pinch zoom
      const currentDistance = getTouchDistance(e.touches)
      const currentCenter = getTouchCenter(e.touches)
      
      if (touchStartDistance > 0) {
        const scaleChange = currentDistance / touchStartDistance
        const newZoom = Math.max(0.5, Math.min(3, zoom * scaleChange))
        
        // Zoom toward touch center
        const canvas = canvasRef.current
        if (canvas) {
          const rect = canvas.getBoundingClientRect()
          const centerX = (currentCenter.x - rect.left) * (canvas.width / rect.width)
          const centerY = (currentCenter.y - rect.top) * (canvas.height / rect.height)
          
          const zoomFactor = newZoom / zoom
          setPanOffset(prev => ({
            x: centerX - (centerX - prev.x) * zoomFactor,
            y: centerY - (centerY - prev.y) * zoomFactor
          }))
        }
        
        setZoom(newZoom)
        setTouchStartDistance(currentDistance)
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    
    if (e.touches.length === 0) {
      setIsPanning(false)
      setTouchStartDistance(0)
    } else if (e.touches.length === 1) {
      // Went from two fingers to one
      const touch = e.touches[0]
      setLastPanPoint({ x: touch.clientX, y: touch.clientY })
      setIsPanning(true)
      setTouchStartDistance(0)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div
        ref={containerRef}
        className="relative w-full bg-gray-900/70 border border-gray-700/50 rounded-xl shadow-lg overflow-hidden"
        style={{ height: canvasSize.height, minHeight: '300px' }}
      >
        {/* Table count - Desktop only */}
        {tables.length > 0 && (
          <div className="absolute top-2 right-2 z-10 hidden md:block">
            <Badge variant="outline" className="bg-gray-800 text-gray-400 border-gray-700">
              {tables.length} {tables.length === 1 ? 'table' : 'tables'}
            </Badge>
          </div>
        )}

        {/* Canvas for drawing */}
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredTable(null)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="absolute inset-0 transition-opacity duration-300 touch-manipulation"
          aria-label="Floor plan"
        />

        {/* Minimal Zoom Controls - Apple Style */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-10 md:hidden">
          <button
            onClick={resetToFit}
            className="w-8 h-8 bg-black/40 backdrop-blur-md hover:bg-black/60 text-white rounded-full flex items-center justify-center touch-manipulation border border-white/10"
            aria-label="Reset view"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>

      </div>
      
    </motion.div>
  )
}
