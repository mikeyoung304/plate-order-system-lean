// OVERNIGHT_SESSION: 2025-05-30 - World-class accessibility system
// Reason: Inclusive design is essential for assisted living facility users
// Impact: WCAG 2.1 AA compliance, screen reader support, keyboard navigation

import { useEffect, useCallback, useRef } from 'react'

// Accessibility utilities and hooks
export class AccessibilityManager {
  private static instance: AccessibilityManager
  private focusHistory: HTMLElement[] = []
  private announcements = new Set<string>()
  
  static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager()
    }
    return AccessibilityManager.instance
  }

  // Announce to screen readers
  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    // Prevent duplicate announcements
    if (this.announcements.has(message)) return
    
    this.announcements.add(message)
    setTimeout(() => this.announcements.delete(message), 1000)

    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', priority)
    announcer.setAttribute('aria-atomic', 'true')
    announcer.className = 'sr-only'
    announcer.textContent = message
    
    document.body.appendChild(announcer)
    
    // Clean up after announcement
    setTimeout(() => {
      if (announcer.parentNode) {
        announcer.parentNode.removeChild(announcer)
      }
    }, 1000)
  }

  // Focus management
  pushFocus(element: HTMLElement) {
    this.focusHistory.push(document.activeElement as HTMLElement)
    element.focus()
  }

  popFocus() {
    const previousElement = this.focusHistory.pop()
    if (previousElement && previousElement.focus) {
      previousElement.focus()
    }
  }
}