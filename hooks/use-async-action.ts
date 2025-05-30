import { useState, useCallback } from 'react'

// Reusable hook for async actions with loading state
export function useAsyncAction<T extends any[]>(
  action: (...args: T) => Promise<void>,
  onError?: (error: Error) => void
) {
  const [loading, setLoading] = useState(false)

  const execute = useCallback(async (...args: T) => {
    setLoading(true)
    try {
      await action(...args)
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error')
      onError?.(err)
      console.error('Action failed:', err)
    } finally {
      setLoading(false)
    }
  }, [action, onError])

  return { execute, loading }
}

// For Set-based loading states (like tracking multiple order IDs)
export function useAsyncSetAction<T>(
  action: (id: T) => Promise<void>,
  onError?: (error: Error, id: T) => void
) {
  const [loadingIds, setLoadingIds] = useState<Set<T>>(new Set())

  const execute = useCallback(async (id: T) => {
    setLoadingIds(prev => new Set(prev).add(id))
    try {
      await action(id)
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error')
      onError?.(err, id)
      console.error('Action failed:', err)
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }, [action, onError])

  const isLoading = useCallback((id: T) => loadingIds.has(id), [loadingIds])

  return { execute, isLoading, loadingIds }
}