// File: frontend/components/seat-picker-overlay.tsx
'use client'

import React from 'react' // Ensure React is imported
// PERFORMANCE_OPTIMIZATION: Eliminated framer-motion completely
// Original: Full framer-motion library (~150KB) for seat animations
// Changed to: Pure CSS animations with equivalent functionality
// Impact: 100% reduction in motion-related bundle size for seat picker
// Risk: None - same visual effects, better performance
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { Table } from '@/lib/floor-plan-utils' // Use shared type

type SeatPickerOverlayProps = {
  table: Table | null
  onClose: () => void
  onSelectSeat: (seatNumber: number) => void
}

// Enhanced visual representation of seats with CSS animations
const Seat = ({
  seatNumber,
  onClick,
}: {
  seatNumber: number
  onClick: () => void
}) => (
  <button
    className='seat-picker-seat w-16 h-16 rounded-full border-2 flex items-center justify-center cursor-pointer bg-gray-700/60 border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-gray-800 touch-manipulation'
    onClick={onClick}
    aria-label={`Select Seat ${seatNumber}`}
  >
    <span className='font-medium text-lg text-gray-200'>{seatNumber}</span>
  </button>
)

export function SeatPickerOverlay({
  table,
  onClose,
  onSelectSeat,
}: SeatPickerOverlayProps) {
  // Generate seat numbers from 1 to table.seats (only if table exists)
  const seatNumbers = table
    ? Array.from({ length: table.seats }, (_, i) => i + 1)
    : []

  const handleSeatClick = (seatNumber: number) => {
    if (!table) {
      return
    } // Should not happen if overlay is visible, but good practice
    console.log(
      `[SeatPicker] Seat ${seatNumber} selected for table ${table.label}`
    )
    onSelectSeat(seatNumber)
    // onClose(); // Keep overlay open until next step usually
  }

  return (
    // Conditional rendering with CSS animations
    table && (
      <div
        className='seat-picker-backdrop fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4'
        onClick={onClose} // Close on backdrop click
      >
        {/* Inner modal content with CSS animation */}
        <div
          className='seat-picker-modal bg-gray-800/80 border border-gray-700 rounded-xl shadow-2xl p-6 max-w-md w-full relative'
          onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal
        >
          {/* Close Button */}
          <Button
            variant='ghost'
            size='icon'
            className='absolute top-3 right-3 text-gray-400 hover:text-white hover:bg-gray-700/50 min-w-[44px] min-h-[44px]'
            onClick={onClose}
            aria-label='Close seat selection'
          >
            <X className='h-5 w-5' />
          </Button>

          {/* Header */}
          <div className='text-center mb-6'>
            <h2 className='text-2xl font-semibold text-white mb-1'>
              Select Seat
            </h2>
            <p className='text-gray-400'>
              Table {table.label} ({table.seats} seats)
            </p>
          </div>

          {/* Seat Grid */}
          <div className='flex flex-wrap gap-4 justify-center items-center'>
            {seatNumbers.map(seatNum => (
              <Seat
                key={seatNum}
                seatNumber={seatNum}
                onClick={() => handleSeatClick(seatNum)}
              />
            ))}
          </div>

          {/* Optional: Add confirmation button if needed */}
          {/* <div className="mt-6 text-center">
              <Button onClick={onClose}>Cancel</Button>
            </div> */}
        </div>
      </div>
    )
  )
}
