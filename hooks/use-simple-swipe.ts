"use client"

import { useRef } from 'react'

// Only for order completion - simple and stable
export const useSimpleSwipe = (onSwipeRight: () => void) => {
  const startX = useRef(0)
  
  const handleTouchStart = (e: TouchEvent) => {
    startX.current = e.touches[0].clientX
  }
  
  const handleTouchEnd = (e: TouchEvent) => {
    const endX = e.changedTouches[0].clientX
    const diff = endX - startX.current
    
    if (diff > 100) { // Simple threshold
      onSwipeRight()
    }
  }
  
  return { handleTouchStart, handleTouchEnd }
}