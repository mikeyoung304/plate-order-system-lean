/**
 * Demo System - Centralized Export
 * 
 * This module provides a centralized demo system for the Plate Restaurant System.
 * All demo-related functionality should go through this module to maintain
 * security and consistency.
 */

export { DEMO_CONFIG, DEMO_UTILS } from './config'
export { DemoUserManager, createDemoUserManager } from './user-manager'

export type { DemoCredentials, DemoSessionConfig } from './config'

// Import for re-export
import { DEMO_UTILS } from './config'

// Re-export commonly used functions for convenience
export const isDemoEnabled = DEMO_UTILS.isEnabled
export const getDemoCredentials = DEMO_UTILS.getCredentials
export const isDemoUser = DEMO_UTILS.isDemoUser
export const getDemoSessionConfig = DEMO_UTILS.getSessionConfig