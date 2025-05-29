"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, Users, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Seat {
  id: number
  hasOrder: boolean
  orderCount: number
}

interface SeatNavigationProps {
  tableId: string
  currentSeat: number
  maxSeats: number
  onSeatChange: (seatNumber: number) => void
  onContinueToNext?: () => void
  seats?: Seat[]
}

export function SeatNavigation({
  tableId,
  currentSeat,
  maxSeats,
  onSeatChange,
  onContinueToNext,
  seats = []
}: SeatNavigationProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Swipe detection
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && currentSeat < maxSeats) {
      onSeatChange(currentSeat + 1)
    }
    if (isRightSwipe && currentSeat > 1) {
      onSeatChange(currentSeat - 1)
    }
  }, [touchStart, touchEnd, currentSeat, maxSeats, onSeatChange])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentSeat > 1) {
        e.preventDefault()
        onSeatChange(currentSeat - 1)
      }
      if (e.key === 'ArrowRight' && currentSeat < maxSeats) {
        e.preventDefault()
        onSeatChange(currentSeat + 1)
      }
      if (e.key === 'Enter' && onContinueToNext) {
        e.preventDefault()
        onContinueToNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentSeat, maxSeats, onSeatChange, onContinueToNext])

  const getSeatStatus = (seatNumber: number) => {
    const seat = seats.find(s => s.id === seatNumber)
    if (!seat) return 'empty'
    if (seat.hasOrder) return 'ordered'
    return 'empty'
  }

  const getSeatIcon = (seatNumber: number) => {
    const status = getSeatStatus(seatNumber)
    if (status === 'ordered') return <Check className="w-3 h-3" />
    return seatNumber
  }

  const getAllOrdersComplete = () => {
    return Array.from({ length: maxSeats }, (_, i) => i + 1)
      .every(seatNum => getSeatStatus(seatNum) === 'ordered')
  }

  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          <span className="text-lg font-semibold text-white">Table {tableId}</span>
          <Badge variant="outline" className="text-blue-400">
            {seats.filter(s => s.hasOrder).length}/{maxSeats} seated
          </Badge>
        </div>
        
        {getAllOrdersComplete() && onContinueToNext && (
          <Button 
            onClick={onContinueToNext}
            className="bg-green-600 hover:bg-green-700"
          >
            Complete Table
          </Button>
        )}
      </div>

      {/* Seat Navigation */}
      <div 
        className="flex items-center justify-between p-4 bg-slate-900 rounded-lg touch-manipulation"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Previous Seat Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSeatChange(currentSeat - 1)}
          disabled={currentSeat <= 1}
          className="p-2 h-10 w-10"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        {/* Seat Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Seat</span>
          <div className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-full font-semibold">
            <span className="text-lg">{currentSeat}</span>
          </div>
          <span className="text-sm text-gray-400">of {maxSeats}</span>
        </div>

        {/* Next Seat Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSeatChange(currentSeat + 1)}
          disabled={currentSeat >= maxSeats}
          className="p-2 h-10 w-10"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Seat Grid Overview */}
      <div className="grid grid-cols-4 gap-2 p-4 bg-slate-800 rounded-lg">
        {Array.from({ length: maxSeats }, (_, i) => {
          const seatNumber = i + 1
          const status = getSeatStatus(seatNumber)
          const isCurrentSeat = seatNumber === currentSeat
          
          return (
            <button
              key={seatNumber}
              onClick={() => onSeatChange(seatNumber)}
              className={cn(
                "aspect-square rounded-lg border-2 flex items-center justify-center font-semibold text-sm transition-all",
                isCurrentSeat && "ring-2 ring-blue-400 scale-110",
                status === 'ordered' && "bg-green-600 border-green-500 text-white",
                status === 'empty' && "bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600"
              )}
            >
              {getSeatIcon(seatNumber)}
            </button>
          )
        })}
      </div>

      {/* Swipe Hint */}
      <div className="text-center text-sm text-gray-500">
        👈 Swipe or use arrow keys to navigate seats 👉
      </div>
    </div>
  )
}