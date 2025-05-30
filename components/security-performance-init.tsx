// OVERNIGHT_SESSION: 2025-05-30 - Client-side security and performance initialization
// Reason: Initialize Fort Knox security and performance monitoring in browser
// Impact: Automatic startup of all security and performance systems

"use client"

import { useEffect } from 'react'
import { initializeSecurityAndPerformance } from '@/lib/initialization'

export function SecurityPerformanceInit() {
  useEffect(() => {
    // Initialize security and performance systems on client mount
    initializeSecurityAndPerformance()
  }, [])

  // This component renders nothing but initializes systems
  return null
}