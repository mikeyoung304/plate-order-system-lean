/**
 * Centralized Demo Configuration
 * Security-hardened demo system configuration
 */

export const DEMO_CONFIG = {
  // Demo user credentials (moved from hardcoded values)
  EMAIL: process.env.DEMO_USER_EMAIL || 'guest@restaurant.plate',
  PASSWORD: process.env.DEMO_USER_PASSWORD || 'guest12345',
  
  // Demo user profile
  PROFILE: {
    name: 'Demo Guest',
    role: 'server' as const,
  },
  
  // Demo session settings
  SESSION: {
    timeout: parseInt(process.env.DEMO_SESSION_TIMEOUT || '3600', 10), // 1 hour
    autoReset: process.env.DEMO_AUTO_RESET === 'true',
    resetInterval: parseInt(process.env.DEMO_DATA_RESET_INTERVAL || '86400', 10), // 24 hours
  },
  
  // Demo mode toggle
  ENABLED: process.env.DEMO_MODE_ENABLED !== 'false', // Default enabled
  
  // Demo data settings
  DATA: {
    tableCount: 6,
    initialOrders: 5,
    resetOnStartup: process.env.DEMO_RESET_ON_STARTUP === 'true',
  },
  
  // Security settings
  SECURITY: {
    maxLoginAttempts: 5,
    lockoutDuration: 300000, // 5 minutes
    requirePasswordChange: false, // Demo accounts don't require password changes
  }
} as const

/**
 * Demo user management utilities
 */
export const DEMO_UTILS = {
  /**
   * Check if demo mode is enabled
   */
  isEnabled(): boolean {
    return DEMO_CONFIG.ENABLED
  },
  
  /**
   * Get demo user credentials (for internal use only)
   */
  getCredentials() {
    if (!DEMO_CONFIG.ENABLED) {
      throw new Error('Demo mode is disabled')
    }
    
    return {
      email: DEMO_CONFIG.EMAIL,
      password: DEMO_CONFIG.PASSWORD,
      profile: DEMO_CONFIG.PROFILE,
    }
  },
  
  /**
   * Validate demo user email
   */
  isDemoUser(email: string): boolean {
    return email === DEMO_CONFIG.EMAIL
  },
  
  /**
   * Get demo session configuration
   */
  getSessionConfig() {
    return DEMO_CONFIG.SESSION
  }
} as const

// Type exports
export type DemoCredentials = {
  email: string
  password: string
  profile: typeof DEMO_CONFIG.PROFILE
}

export type DemoSessionConfig = typeof DEMO_CONFIG.SESSION