'use client'

import { useEffect, useState } from 'react'
import { connectionPool } from '@/lib/database-connection-pool'
import { ultraSmartCache } from '@/lib/cache/ultra-smart-cache'

export function useConnectionPoolStats() {
  const [stats, setStats] = useState(connectionPool.getStats())

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(connectionPool.getStats())
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  return stats
}

export function useCacheStats() {
  const [stats, setStats] = useState(ultraSmartCache.getStats())

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(ultraSmartCache.getStats())
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  return stats
}