'use client'

import { useState, useCallback, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

interface UseSeatNavigationProps {
  tableId: string
  initialSeat?: number
  maxSeats?: number
  onSeatComplete?: (seatNumber: number) => void
  onTableComplete?: () => void
}

interface SeatOrder {
  seatNumber: number
  hasOrder: boolean
  orderCount: number
  lastOrderTime?: Date
}

export function useSeatNavigation({
  tableId,
  initialSeat = 1,
  maxSeats = 8,
  onSeatComplete,
  onTableComplete,
}: UseSeatNavigationProps) {
  const [currentSeat, setCurrentSeat] = useState(initialSeat)
  const [seatOrders, setSeatOrders] = useState<SeatOrder[]>(
    Array.from({ length: maxSeats }, (_, i) => ({
      seatNumber: i + 1,
      hasOrder: false,
      orderCount: 0,
    }))
  )
  const { toast } = useToast()

  // Mark seat as having an order
  const markSeatComplete = useCallback(
    (seatNumber: number) => {
      setSeatOrders(prev =>
        prev.map(seat =>
          seat.seatNumber === seatNumber
            ? {
                ...seat,
                hasOrder: true,
                orderCount: seat.orderCount + 1,
                lastOrderTime: new Date(),
              }
            : seat
        )
      )
      onSeatComplete?.(seatNumber)

      toast({
        title: 'Order Added',
        description: `Seat ${seatNumber} order recorded`,
        duration: 2000,
      })
    },
    [onSeatComplete, toast]
  )

  // Navigate to next available seat
  const goToNextSeat = useCallback(() => {
    const nextAvailableSeat = seatOrders.find(
      seat => seat.seatNumber > currentSeat && !seat.hasOrder
    )

    if (nextAvailableSeat) {
      setCurrentSeat(nextAvailableSeat.seatNumber)
      return true
    }

    // If no seats ahead, go to first available seat
    const firstAvailableSeat = seatOrders.find(seat => !seat.hasOrder)
    if (firstAvailableSeat) {
      setCurrentSeat(firstAvailableSeat.seatNumber)
      return true
    }

    // All seats have orders
    return false
  }, [currentSeat, seatOrders])

  // Smart navigation after order completion
  const completeCurrentSeatAndNext = useCallback(() => {
    markSeatComplete(currentSeat)

    // Auto-advance to next seat
    setTimeout(() => {
      const moved = goToNextSeat()
      if (!moved) {
        // All seats complete
        toast({
          title: 'Table Complete! 🎉',
          description: `All seats at Table ${tableId} have ordered`,
          duration: 3000,
        })
        onTableComplete?.()
      }
    }, 500) // Small delay for better UX
  }, [
    currentSeat,
    markSeatComplete,
    goToNextSeat,
    tableId,
    toast,
    onTableComplete,
  ])

  // Check if all seats are complete
  const isTableComplete = seatOrders.every(seat => seat.hasOrder)

  // Get completion statistics
  const completedSeats = seatOrders.filter(seat => seat.hasOrder).length
  const completionPercentage = Math.round((completedSeats / maxSeats) * 100)

  // Reset table state
  const resetTable = useCallback(() => {
    setSeatOrders(prev =>
      prev.map(seat => ({
        ...seat,
        hasOrder: false,
        orderCount: 0,
        lastOrderTime: undefined,
      }))
    )
    setCurrentSeat(1)
  }, [])

  // Auto-save progress to localStorage
  useEffect(() => {
    const saveKey = `table-${tableId}-progress`
    localStorage.setItem(
      saveKey,
      JSON.stringify({
        currentSeat,
        seatOrders,
        timestamp: new Date().toISOString(),
      })
    )
  }, [tableId, currentSeat, seatOrders])

  // Load saved progress on mount
  useEffect(() => {
    const saveKey = `table-${tableId}-progress`
    const saved = localStorage.getItem(saveKey)
    if (saved) {
      try {
        const { currentSeat: savedSeat, seatOrders: savedOrders } =
          JSON.parse(saved)
        setCurrentSeat(savedSeat)
        setSeatOrders(savedOrders)
      } catch (error) {
        console.warn('Failed to load saved progress:', error)
      }
    }
  }, [tableId])

  return {
    // State
    currentSeat,
    seatOrders,
    isTableComplete,
    completedSeats,
    completionPercentage,
    maxSeats,

    // Actions
    setCurrentSeat,
    markSeatComplete,
    completeCurrentSeatAndNext,
    goToNextSeat,
    resetTable,

    // Derived data
    currentSeatOrder: seatOrders.find(s => s.seatNumber === currentSeat),
    nextAvailableSeat: seatOrders.find(
      s => s.seatNumber > currentSeat && !s.hasOrder
    )?.seatNumber,
    availableSeats: seatOrders.filter(s => !s.hasOrder).map(s => s.seatNumber),
  }
}
