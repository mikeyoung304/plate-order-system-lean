import { useEffect, useCallback, useRef } from 'react'

// Hook for screen reader announcements
export function useAnnounce() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', priority)
    announcer.setAttribute('aria-atomic', 'true')
    announcer.className = 'sr-only fixed'
    announcer.textContent = message
    
    document.body.appendChild(announcer)
    
    setTimeout(() => {
      if (announcer.parentNode) {
        announcer.parentNode.removeChild(announcer)
      }
    }, 1000)
  }, [])

  return announce
}

// Hook for keyboard navigation
export function useKeyboardNavigation(
  onEnter?: () => void,
  onEscape?: () => void,
  onArrowKeys?: (direction: 'up' | 'down' | 'left' | 'right') => void
) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        if (onEnter) {
          e.preventDefault()
          onEnter()
        }
        break
      case 'Escape':
        if (onEscape) {
          e.preventDefault()
          onEscape()
        }
        break
      case 'ArrowUp':
        if (onArrowKeys) {
          e.preventDefault()
          onArrowKeys('up')
        }
        break
      case 'ArrowDown':
        if (onArrowKeys) {
          e.preventDefault()
          onArrowKeys('down')
        }
        break
      case 'ArrowLeft':
        if (onArrowKeys) {
          e.preventDefault()
          onArrowKeys('left')
        }
        break
      case 'ArrowRight':
        if (onArrowKeys) {
          e.preventDefault()
          onArrowKeys('right')
        }
        break
    }
  }, [onEnter, onEscape, onArrowKeys])

  return { handleKeyDown }
}