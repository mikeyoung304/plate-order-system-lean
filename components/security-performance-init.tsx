'use client'

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
