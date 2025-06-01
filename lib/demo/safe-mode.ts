// DEMO SAFE MODE SYSTEM
// Prevents destructive operations during demonstrations
// Provides graceful fallbacks for demo failures

export interface SafeModeConfig {
  enabled: boolean
  maxOrderDuration: number
  preventDestructiveOps: boolean
  enableFallbacks: boolean
  logLevel: 'minimal' | 'normal' | 'verbose'
  autoRecovery: boolean
}

export interface SafeModeState {
  isActive: boolean
  activatedAt: string | null
  restrictions: string[]
  fallbacksUsed: string[]
  errorCount: number
  lastError: string | null
}

class DemoSafeModeManager {
  private static instance: DemoSafeModeManager
  private config: SafeModeConfig
  private state: SafeModeState
  private listeners: ((state: SafeModeState) => void)[] = []

  private constructor() {
    this.config = this.getDefaultConfig()
    this.state = this.getInitialState()
    this.loadFromStorage()
    this.setupEventListeners()
  }

  public static getInstance(): DemoSafeModeManager {
    if (!DemoSafeModeManager.instance) {
      DemoSafeModeManager.instance = new DemoSafeModeManager()
    }
    return DemoSafeModeManager.instance
  }

  private getDefaultConfig(): SafeModeConfig {
    return {
      enabled: false,
      maxOrderDuration: 30 * 60 * 1000, // 30 minutes
      preventDestructiveOps: true,
      enableFallbacks: true,
      logLevel: 'normal',
      autoRecovery: true,
    }
  }

  private getInitialState(): SafeModeState {
    return {
      isActive: false,
      activatedAt: null,
      restrictions: [],
      fallbacksUsed: [],
      errorCount: 0,
      lastError: null,
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const storedConfig = localStorage.getItem('demo_safe_mode_config')
      const storedState = localStorage.getItem('demo_safe_mode_state')

      if (storedConfig) {
        this.config = { ...this.config, ...JSON.parse(storedConfig) }
      }

      if (storedState) {
        this.state = { ...this.state, ...JSON.parse(storedState) }
      }
    } catch (error) {
      console.warn('Failed to load safe mode from storage:', error)
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem('demo_safe_mode_config', JSON.stringify(this.config))
      localStorage.setItem('demo_safe_mode_state', JSON.stringify(this.state))
    } catch (error) {
      console.warn('Failed to save safe mode to storage:', error)
    }
  }

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return

    // Listen for demo safe mode toggle events
    window.addEventListener('demo-safe-mode-toggle', (event: any) => {
      const { enabled } = event.detail
      this.setEnabled(enabled)
    })

    // Listen for error events
    window.addEventListener('error', (event) => {
      if (this.state.isActive) {
        this.handleError(event.error || event.message)
      }
    })

    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (this.state.isActive) {
        this.handleError(event.reason)
      }
    })
  }

  // PUBLIC API

  public setEnabled(enabled: boolean): void {
    const wasEnabled = this.config.enabled
    this.config.enabled = enabled

    if (enabled && !wasEnabled) {
      this.activate()
    } else if (!enabled && wasEnabled) {
      this.deactivate()
    }

    this.saveToStorage()
    this.notifyListeners()
  }

  public isEnabled(): boolean {
    return this.config.enabled
  }

  public isActive(): boolean {
    return this.state.isActive
  }

  public getState(): SafeModeState {
    return { ...this.state }
  }

  public getConfig(): SafeModeConfig {
    return { ...this.config }
  }

  public updateConfig(updates: Partial<SafeModeConfig>): void {
    this.config = { ...this.config, ...updates }
    this.saveToStorage()
    this.notifyListeners()
  }

  // OPERATION VALIDATION

  public canPerformOperation(operation: string): boolean {
    if (!this.state.isActive) return true

    const restrictedOperations = [
      'delete_user',
      'delete_table',
      'delete_order_history',
      'reset_database',
      'modify_permissions',
      'delete_resident_data',
    ]

    if (this.config.preventDestructiveOps && restrictedOperations.includes(operation)) {
      this.addRestriction(`Blocked operation: ${operation}`)
      return false
    }

    return true
  }

  public validateOrderOperation(orderId: string, operation: string): boolean {
    if (!this.state.isActive) return true

    // Check order duration in safe mode
    if (operation === 'delete' || operation === 'modify') {
      // In safe mode, only allow modifications to recent orders
      const now = Date.now()
      const maxAge = this.config.maxOrderDuration

      // This would need actual order timestamp checking in real implementation
      // For now, just allow operations but log them
      this.logOperation(`Order ${operation} on ${orderId}`)
      return true
    }

    return true
  }

  // FALLBACK SYSTEM

  public useFallback(operation: string, fallbackDescription: string): void {
    if (!this.config.enableFallbacks) return

    this.state.fallbacksUsed.push(`${operation}: ${fallbackDescription}`)
    this.logOperation(`Fallback used for ${operation}: ${fallbackDescription}`)
    this.saveToStorage()
    this.notifyListeners()
  }

  public getFallbackOption(operation: string): string | null {
    const fallbacks: Record<string, string> = {
      'voice_ordering': 'manual_text_entry',
      'realtime_updates': 'manual_refresh',
      'database_write': 'local_storage_cache',
      'file_upload': 'skip_with_message',
      'api_call': 'mock_response',
    }

    return fallbacks[operation] || null
  }

  // ERROR HANDLING

  public handleError(error: any): void {
    this.state.errorCount++
    this.state.lastError = error?.message || String(error)

    this.logError(error)

    if (this.config.autoRecovery && this.state.errorCount > 3) {
      this.triggerAutoRecovery()
    }

    this.saveToStorage()
    this.notifyListeners()
  }

  private triggerAutoRecovery(): void {
    this.logOperation('Auto-recovery triggered due to multiple errors')
    
    // Reset error state
    this.state.errorCount = 0
    this.state.lastError = null

    // Enable additional restrictions
    this.config.preventDestructiveOps = true
    this.config.enableFallbacks = true

    // Notify application
    window.dispatchEvent(new CustomEvent('demo-auto-recovery', {
      detail: { reason: 'multiple_errors', timestamp: new Date().toISOString() }
    }))
  }

  // MONITORING AND LOGGING

  public addListener(listener: (state: SafeModeState) => void): void {
    this.listeners.push(listener)
  }

  public removeListener(listener: (state: SafeModeState) => void): void {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.state)
      } catch (error) {
        console.warn('Safe mode listener error:', error)
      }
    })
  }

  private addRestriction(restriction: string): void {
    this.state.restrictions.push(restriction)
    this.logOperation(`Restriction added: ${restriction}`)
    this.saveToStorage()
    this.notifyListeners()
  }

  private logOperation(message: string): void {
    if (this.config.logLevel === 'minimal') return

    console.log(`[Demo Safe Mode] ${message}`)
  }

  private logError(error: any): void {
    console.error(`[Demo Safe Mode] Error:`, error)
  }

  // LIFECYCLE

  private activate(): void {
    this.state.isActive = true
    this.state.activatedAt = new Date().toISOString()
    this.state.restrictions = []
    this.state.fallbacksUsed = []

    this.logOperation('Safe mode activated')

    // Notify application
    window.dispatchEvent(new CustomEvent('demo-safe-mode-activated', {
      detail: { timestamp: this.state.activatedAt }
    }))

    this.saveToStorage()
    this.notifyListeners()
  }

  private deactivate(): void {
    this.state.isActive = false
    this.state.activatedAt = null

    this.logOperation('Safe mode deactivated')

    // Notify application
    window.dispatchEvent(new CustomEvent('demo-safe-mode-deactivated', {
      detail: { timestamp: new Date().toISOString() }
    }))

    this.saveToStorage()
    this.notifyListeners()
  }

  // UTILITIES

  public getStatusSummary(): string {
    if (!this.state.isActive) return 'Safe mode disabled'

    const duration = this.state.activatedAt 
      ? Math.round((Date.now() - new Date(this.state.activatedAt).getTime()) / 1000)
      : 0

    return `Active for ${duration}s | Restrictions: ${this.state.restrictions.length} | Fallbacks: ${this.state.fallbacksUsed.length} | Errors: ${this.state.errorCount}`
  }

  public reset(): void {
    this.state = this.getInitialState()
    this.config = this.getDefaultConfig()
    this.saveToStorage()
    this.notifyListeners()
  }
}

// REACT HOOK

export function useDemoSafeMode() {
  const [state, setState] = useState(DemoSafeModeManager.getInstance().getState())
  const [config, setConfig] = useState(DemoSafeModeManager.getInstance().getConfig())

  useEffect(() => {
    const manager = DemoSafeModeManager.getInstance()
    
    const updateState = (newState: SafeModeState) => {
      setState(newState)
      setConfig(manager.getConfig())
    }

    manager.addListener(updateState)

    return () => {
      manager.removeListener(updateState)
    }
  }, [])

  const safeMode = DemoSafeModeManager.getInstance()

  return {
    state,
    config,
    isEnabled: safeMode.isEnabled(),
    isActive: safeMode.isActive(),
    setEnabled: (enabled: boolean) => safeMode.setEnabled(enabled),
    canPerformOperation: (operation: string) => safeMode.canPerformOperation(operation),
    useFallback: (operation: string, description: string) => safeMode.useFallback(operation, description),
    handleError: (error: any) => safeMode.handleError(error),
    reset: () => safeMode.reset(),
  }
}

// CONVENIENT EXPORTS

export const safeMode = DemoSafeModeManager.getInstance()

export default DemoSafeModeManager

// React useState import
import { useState, useEffect } from 'react'