'use client'

import { useEffect, useState, useRef, useCallback, RefObject } from 'react'

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean
  initialIsIntersecting?: boolean
}

interface UseIntersectionObserverReturn {
  isIntersecting: boolean
  hasIntersected: boolean
  entry: IntersectionObserverEntry | null
  observer: IntersectionObserver | null
}

/**
 * Custom hook for intersection observer with performance optimizations
 * Useful for lazy loading and infinite scroll implementations
 */
export function useIntersectionObserver(
  elementRef: RefObject<Element | null>,
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0%',
    freezeOnceVisible = false,
    initialIsIntersecting = false,
  } = options

  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)
  const [isIntersecting, setIsIntersecting] = useState(initialIsIntersecting)
  const [hasIntersected, setHasIntersected] = useState(false)
  const [observer, setObserver] = useState<IntersectionObserver | null>(null)
  
  const frozen = useRef(false)

  const updateEntry = useCallback(
    ([entry]: IntersectionObserverEntry[]): void => {
      const isIntersecting = entry.isIntersecting
      
      setEntry(entry)
      setIsIntersecting(isIntersecting)
      
      if (isIntersecting && !hasIntersected) {
        setHasIntersected(true)
      }

      if (freezeOnceVisible && isIntersecting) {
        frozen.current = true
      }
    },
    [freezeOnceVisible, hasIntersected]
  )

  useEffect(() => {
    const node = elementRef?.current
    const hasIOSupport = !!window.IntersectionObserver

    if (!hasIOSupport || frozen.current || !node) {
      return
    }

    const observerParams = { threshold, root, rootMargin }
    const observer = new IntersectionObserver(updateEntry, observerParams)

    observer.observe(node)
    setObserver(observer)

    return () => {
      observer.disconnect()
      setObserver(null)
    }
  }, [elementRef, threshold, root, rootMargin, updateEntry])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observer) {
        observer.disconnect()
      }
    }
  }, [observer])

  return {
    isIntersecting,
    hasIntersected,
    entry,
    observer,
  }
}

/**
 * Hook for tracking multiple elements with intersection observer
 * Useful for lazy loading lists of items
 */
export function useMultipleIntersectionObserver(
  elementsMap: Map<string, RefObject<Element | null>>,
  options: UseIntersectionObserverOptions = {}
) {
  const [intersectingElements, setIntersectingElements] = useState<Set<string>>(
    new Set()
  )
  const [hasIntersectedElements, setHasIntersectedElements] = useState<Set<string>>(
    new Set()
  )
  const observerRef = useRef<IntersectionObserver | null>(null)

  const {
    threshold = 0,
    root = null,
    rootMargin = '0%',
    freezeOnceVisible = false,
  } = options

  const updateIntersectingElements = useCallback(
    (entries: IntersectionObserverEntry[]): void => {
      entries.forEach((entry) => {
        const elementId = entry.target.getAttribute('data-id')
        if (!elementId) return

        const isIntersecting = entry.isIntersecting

        setIntersectingElements((prev) => {
          const next = new Set(prev)
          if (isIntersecting) {
            next.add(elementId)
          } else {
            next.delete(elementId)
          }
          return next
        })

        if (isIntersecting) {
          setHasIntersectedElements((prev) => new Set([...prev, elementId]))
        }

        if (freezeOnceVisible && isIntersecting && observerRef.current) {
          observerRef.current.unobserve(entry.target)
        }
      })
    },
    [freezeOnceVisible]
  )

  useEffect(() => {
    const hasIOSupport = !!window.IntersectionObserver
    if (!hasIOSupport) return

    const observerParams = { threshold, root, rootMargin }
    const observer = new IntersectionObserver(updateIntersectingElements, observerParams)
    observerRef.current = observer

    // Observe all elements
    elementsMap.forEach((elementRef, id) => {
      const element = elementRef.current
      if (element) {
        element.setAttribute('data-id', id)
        observer.observe(element)
      }
    })

    return () => {
      observer.disconnect()
      observerRef.current = null
    }
  }, [elementsMap, threshold, root, rootMargin, updateIntersectingElements])

  return {
    intersectingElements,
    hasIntersectedElements,
    isIntersecting: (id: string) => intersectingElements.has(id),
    hasIntersected: (id: string) => hasIntersectedElements.has(id),
  }
}

/**
 * Hook for lazy loading images with intersection observer
 */
export function useLazyImage(src: string, options: UseIntersectionObserverOptions = {}) {
  const [imageSrc, setImageSrc] = useState<string>('')
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null)
  const { isIntersecting } = useIntersectionObserver(
    { current: imageRef },
    {
      rootMargin: '50px',
      ...options,
    }
  )

  useEffect(() => {
    if (isIntersecting && src) {
      setImageSrc(src)
    }
  }, [isIntersecting, src])

  return { imageSrc, setImageRef }
}

/**
 * Hook for implementing infinite scroll with intersection observer
 */
export function useInfiniteScroll(
  callback: () => void | Promise<void>,
  options: UseIntersectionObserverOptions & {
    enabled?: boolean
    hasNextPage?: boolean
    isFetchingNextPage?: boolean
  } = {}
) {
  const [loadMoreRef, setLoadMoreRef] = useState<HTMLDivElement | null>(null)
  const {
    enabled = true,
    hasNextPage = true,
    isFetchingNextPage = false,
    rootMargin = '100px',
    ...intersectionOptions
  } = options

  const { isIntersecting } = useIntersectionObserver(
    { current: loadMoreRef },
    {
      rootMargin,
      ...intersectionOptions,
    }
  )

  useEffect(() => {
    if (
      isIntersecting &&
      enabled &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      callback()
    }
  }, [isIntersecting, enabled, hasNextPage, isFetchingNextPage, callback])

  return { loadMoreRef: setLoadMoreRef }
}