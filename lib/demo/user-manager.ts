/**
 * Demo User Management Utilities
 * Centralized demo user creation, management, and lifecycle
 */

import { createClient } from '@supabase/supabase-js'
import { DEMO_UTILS, type DemoCredentials } from './config'

export class DemoUserManager {
  private supabase: ReturnType<typeof createClient>

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }

  /**
   * Create or reset demo user account
   */
  async createDemoUser(): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      if (!DEMO_UTILS.isEnabled()) {
        return { success: false, error: 'Demo mode is disabled' }
      }

      const credentials = DEMO_UTILS.getCredentials()

      // Clean up any orphaned data first
      try {
        // Get any existing profiles with this email (orphaned from deleted auth users)
        const { data: orphanedProfiles } = await this.supabase
          .from('profiles')
          .select('user_id')
          .eq('name', credentials.profile.name) // Match by name since we don't have user_id
        
        if (orphanedProfiles && orphanedProfiles.length > 0) {
          for (const profile of orphanedProfiles) {
            const typedProfile = profile as { user_id: string }
            await this.supabase.from('user_roles').delete().eq('user_id', typedProfile.user_id)
            await this.supabase.from('profiles').delete().eq('user_id', typedProfile.user_id)
          }
        }
      } catch (e) {
        // Ignore cleanup errors
      }

      // Check for existing user
      const { data: authUsers } = await this.supabase.auth.admin.listUsers()
      const existingUser = authUsers?.users?.find(u => u.email === credentials.email)

      if (existingUser) {
        // Update existing user instead of deleting and recreating
        const { error: updateError } = await this.supabase.auth.admin.updateUserById(existingUser.id, {
          password: credentials.password,
          user_metadata: {
            name: credentials.profile.name,
            role: credentials.profile.role,
          },
        })

        if (updateError) {
          return { success: false, error: updateError.message }
        }

        // Update the profile
        const { error: profileUpdateError } = await this.supabase
          .from('profiles')
          .upsert({
            user_id: existingUser.id,
            name: credentials.profile.name,
            role: credentials.profile.role,
          })

        if (profileUpdateError) {
          return { success: false, error: profileUpdateError.message }
        }

        return { success: true, user: existingUser }
      }

      // Create fresh user
      const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
        email: credentials.email,
        password: credentials.password,
        email_confirm: true,
        user_metadata: {
          name: credentials.profile.name,
          role: credentials.profile.role,
        },
      })

      if (authError || !authData.user) {
        return { success: false, error: authError?.message || 'Failed to create user' }
      }

      // Create profile (user should be fresh after deletion)
      const { error: profileError } = await this.supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          name: credentials.profile.name,
          role: credentials.profile.role,
        })

      // Also clean up any auto-created user_roles after profile creation
      if (!profileError) {
        try {
          // Remove any duplicate role entries
          const { data: existingRoles } = await this.supabase
            .from('user_roles')
            .select('id')
            .eq('user_id', authData.user.id)
            .eq('role', credentials.profile.role)
          
          if (existingRoles && existingRoles.length > 1) {
            // Keep only the first one, delete duplicates
            const idsToDelete = existingRoles.slice(1).map(r => r.id)
            await this.supabase
              .from('user_roles')
              .delete()
              .in('id', idsToDelete)
          }
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      if (profileError) {
        return { success: false, error: profileError.message }
      }

      return { success: true, user: authData.user }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Reset demo user password
   */
  async resetDemoPassword(): Promise<{ success: boolean; error?: string }> {
    try {
      const credentials = DEMO_UTILS.getCredentials()
      
      const { data: users } = await this.supabase.auth.admin.listUsers()
      const demoUser = users?.users?.find(u => u.email === credentials.email)

      if (!demoUser) {
        return { success: false, error: 'Demo user not found' }
      }

      const { error } = await this.supabase.auth.admin.updateUserById(demoUser.id, {
        password: credentials.password
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Validate demo user login
   */
  async validateDemoLogin(): Promise<{ success: boolean; error?: string }> {
    try {
      const credentials = DEMO_UTILS.getCredentials()
      
      const { error } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Check if user is demo user
   */
  isDemoUser(email: string): boolean {
    return DEMO_UTILS.isDemoUser(email)
  }

  /**
   * Clean up old demo data (orders, sessions, etc.)
   */
  async cleanupDemoData(hoursOld: number = 4): Promise<{ success: boolean; cleaned: number; error?: string }> {
    try {
      const credentials = DEMO_UTILS.getCredentials()
      const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000).toISOString()

      // Find demo user
      const { data: authUsers } = await this.supabase.auth.admin.listUsers()
      const demoUser = authUsers?.users?.find(u => u.email === credentials.email)

      if (!demoUser) {
        return { success: true, cleaned: 0 }
      }

      // Get demo user profile
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', demoUser.id)
        .single()

      if (profileError || !profile) {
        return { success: true, cleaned: 0 }
      }

      // Type assertion for profile data
      const typedProfile = profile as { user_id: string }

      // Clean old orders
      const { data: deletedOrders, error } = await this.supabase
        .from('orders')
        .delete()
        .eq('server_id', typedProfile.user_id)
        .lt('created_at', cutoffTime)
        .select()

      if (error) {
        return { success: false, cleaned: 0, error: error.message }
      }

      return { success: true, cleaned: deletedOrders?.length || 0 }
    } catch (error) {
      return { 
        success: false, 
        cleaned: 0,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}

/**
 * Factory function to create demo user manager
 */
export function createDemoUserManager(supabaseUrl: string, serviceRoleKey: string) {
  return new DemoUserManager(supabaseUrl, serviceRoleKey)
}