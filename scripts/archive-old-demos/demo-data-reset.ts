// DEMO DATA RESET PROCEDURES
// Automated demo data reset and restoration system

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
config({ path: '.env.local' })

interface ResetOptions {
  level: 'quick' | 'full' | 'complete'
  preserveUsers: boolean
  preserveHistory: boolean
  seedFreshData: boolean
  backupBeforeReset: boolean
}

interface ResetResults {
  success: boolean
  operations: {
    backup?: boolean
    clearOrders?: boolean
    clearSessions?: boolean
    resetTables?: boolean
    resetSeats?: boolean
    seedUsers?: boolean
    seedTables?: boolean
    seedOrders?: boolean
  }
  errors: string[]
  timing: {
    start: string
    end: string
    duration: number
  }
  dataState: {
    before: any
    after: any
  }
}

class DemoDataResetManager {
  private supabase: any
  private backupDir: string

  constructor() {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      throw new Error('Missing required Supabase environment variables')
    }

    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    this.backupDir = path.join(process.cwd(), 'demo-backups')
    this.ensureBackupDir()
  }

  private ensureBackupDir(): void {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true })
    }
  }

  // MAIN RESET OPERATIONS

  async quickReset(): Promise<ResetResults> {
    return this.performReset({
      level: 'quick',
      preserveUsers: true,
      preserveHistory: true,
      seedFreshData: false,
      backupBeforeReset: false,
    })
  }

  async fullReset(): Promise<ResetResults> {
    return this.performReset({
      level: 'full',
      preserveUsers: true,
      preserveHistory: false,
      seedFreshData: true,
      backupBeforeReset: true,
    })
  }

  async completeReset(): Promise<ResetResults> {
    return this.performReset({
      level: 'complete',
      preserveUsers: false,
      preserveHistory: false,
      seedFreshData: true,
      backupBeforeReset: true,
    })
  }

  private async performReset(options: ResetOptions): Promise<ResetResults> {
    const startTime = Date.now()
    const results: ResetResults = {
      success: false,
      operations: {},
      errors: [],
      timing: {
        start: new Date().toISOString(),
        end: '',
        duration: 0,
      },
      dataState: {
        before: null,
        after: null,
      },
    }

    try {
      console.log(`🔄 Starting ${options.level} demo reset...`)

      // Capture initial state
      results.dataState.before = await this.captureDataState()

      // Create backup if requested
      if (options.backupBeforeReset) {
        console.log('💾 Creating backup...')
        results.operations.backup = await this.createBackup()
      }

      // Clear active orders and sessions
      if (
        options.level === 'quick' ||
        options.level === 'full' ||
        options.level === 'complete'
      ) {
        console.log('🗑️ Clearing active orders...')
        results.operations.clearOrders = await this.clearActiveOrders(
          options.preserveHistory
        )

        console.log('🔐 Clearing sessions...')
        results.operations.clearSessions = await this.clearSessions()
      }

      // Reset table and seat states
      if (options.level === 'full' || options.level === 'complete') {
        console.log('🪑 Resetting tables...')
        results.operations.resetTables = await this.resetTableStates()

        console.log('💺 Resetting seats...')
        results.operations.resetSeats = await this.resetSeatStates(
          options.preserveUsers
        )
      }

      // Complete user reset
      if (options.level === 'complete') {
        console.log('👥 Resetting users...')
        await this.resetUsers()
      }

      // Seed fresh data if requested
      if (options.seedFreshData) {
        console.log('🌱 Seeding fresh demo data...')

        if (options.level === 'complete') {
          results.operations.seedUsers = await this.seedDemoUsers()
        }

        results.operations.seedTables = await this.seedDemoTables()
        results.operations.seedOrders = await this.seedSampleOrders()
      }

      // Capture final state
      results.dataState.after = await this.captureDataState()

      results.success = true
      console.log(`✅ ${options.level} reset completed successfully`)
    } catch (error) {
      results.errors.push(
        error instanceof Error ? error.message : String(error)
      )
      console.error(`❌ Reset failed:`, error)
    }

    results.timing.end = new Date().toISOString()
    results.timing.duration = Date.now() - startTime

    return results
  }

  // DATA CLEARING OPERATIONS

  private async clearActiveOrders(preserveHistory: boolean): Promise<boolean> {
    try {
      if (preserveHistory) {
        // Only clear recent active orders
        const { error } = await this.supabase
          .from('orders')
          .delete()
          .in('status', ['pending', 'preparing', 'ready'])

        return !error
      } else {
        // Clear all orders from last 24 hours
        const oneDayAgo = new Date(
          Date.now() - 24 * 60 * 60 * 1000
        ).toISOString()

        const { error } = await this.supabase
          .from('orders')
          .delete()
          .gte('created_at', oneDayAgo)

        return !error
      }
    } catch (error) {
      console.error('Failed to clear orders:', error)
      return false
    }
  }

  private async clearSessions(): Promise<boolean> {
    try {
      // Clear any session-related data
      // Note: We can't directly clear auth sessions, but we can clear related data
      return true
    } catch (error) {
      console.error('Failed to clear sessions:', error)
      return false
    }
  }

  private async resetTableStates(): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('tables')
        .update({ status: 'available' })
        .neq('id', '00000000-0000-0000-0000-000000000000') // Update all

      return !error
    } catch (error) {
      console.error('Failed to reset table states:', error)
      return false
    }
  }

  private async resetSeatStates(preserveUsers: boolean): Promise<boolean> {
    try {
      const updateData: any = { status: 'available' }

      if (!preserveUsers) {
        updateData.resident_id = null
      }

      const { error } = await this.supabase
        .from('seats')
        .update(updateData)
        .neq('id', '00000000-0000-0000-0000-000000000000') // Update all

      return !error
    } catch (error) {
      console.error('Failed to reset seat states:', error)
      return false
    }
  }

  private async resetUsers(): Promise<boolean> {
    try {
      // Get all non-admin users
      const { data: authUsers } = await this.supabase.auth.admin.listUsers()

      if (authUsers?.users) {
        for (const user of authUsers.users) {
          // Skip the current admin user
          if (
            user.email?.includes('admin') ||
            user.email?.includes('guest@restaurant.plate')
          ) {
            continue
          }

          await this.supabase.auth.admin.deleteUser(user.id)
        }
      }

      return true
    } catch (error) {
      console.error('Failed to reset users:', error)
      return false
    }
  }

  // DATA SEEDING OPERATIONS

  private async seedDemoUsers(): Promise<boolean> {
    try {
      // Import and run the demo data seeder
      const { execSync } = await import('child_process')
      execSync('node scripts/seed-demo-data.ts', { stdio: 'inherit' })
      return true
    } catch (error) {
      console.error('Failed to seed demo users:', error)
      return false
    }
  }

  private async seedDemoTables(): Promise<boolean> {
    try {
      // Check if tables exist
      const { data: existingTables } = await this.supabase
        .from('tables')
        .select('id')
        .limit(1)

      if (existingTables && existingTables.length > 0) {
        return true // Tables already exist
      }

      // Create demo tables
      const tables = [
        {
          label: 1,
          type: 'circle',
          seats: 4,
          position_x: 100,
          position_y: 100,
        },
        {
          label: 2,
          type: 'rectangle',
          seats: 6,
          position_x: 250,
          position_y: 100,
        },
        {
          label: 3,
          type: 'square',
          seats: 4,
          position_x: 400,
          position_y: 100,
        },
        {
          label: 4,
          type: 'circle',
          seats: 4,
          position_x: 100,
          position_y: 250,
        },
        {
          label: 5,
          type: 'rectangle',
          seats: 6,
          position_x: 250,
          position_y: 250,
        },
        {
          label: 6,
          type: 'circle',
          seats: 4,
          position_x: 400,
          position_y: 250,
        },
        {
          label: 7,
          type: 'square',
          seats: 4,
          position_x: 100,
          position_y: 400,
        },
        {
          label: 8,
          type: 'circle',
          seats: 4,
          position_x: 250,
          position_y: 400,
        },
      ]

      for (const table of tables) {
        const { data: tableData, error } = await this.supabase
          .from('tables')
          .insert([
            {
              label: table.label,
              type: table.type,
              status: 'available',
              position_x: table.position_x,
              position_y: table.position_y,
              width:
                table.type === 'circle'
                  ? 80
                  : table.type === 'square'
                    ? 100
                    : 120,
              height:
                table.type === 'circle'
                  ? 80
                  : table.type === 'square'
                    ? 100
                    : 80,
              rotation: 0,
              z_index: 1,
            },
          ])
          .select()
          .single()

        if (!error && tableData) {
          // Create seats
          const seats = []
          for (let i = 1; i <= table.seats; i++) {
            seats.push({
              table_id: tableData.id,
              label: i,
              status: 'available',
            })
          }
          await this.supabase.from('seats').insert(seats)
        }
      }

      return true
    } catch (error) {
      console.error('Failed to seed demo tables:', error)
      return false
    }
  }

  private async seedSampleOrders(): Promise<boolean> {
    try {
      // Create a few sample historical orders for demo purposes
      const { data: residents } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('role', 'resident')
        .limit(3)

      const { data: servers } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('role', 'server')
        .limit(1)

      const { data: tables } = await this.supabase
        .from('tables')
        .select('id')
        .limit(3)

      const { data: seats } = await this.supabase
        .from('seats')
        .select('id, table_id')
        .limit(5)

      if (
        residents &&
        servers &&
        tables &&
        seats &&
        residents.length > 0 &&
        servers.length > 0
      ) {
        const sampleOrders = [
          {
            table_id: tables[0].id,
            seat_id: seats[0].id,
            resident_id: residents[0].id,
            server_id: servers[0].id,
            items: ['Grilled cheese', 'Tomato soup'],
            transcript: 'Grilled cheese and tomato soup please',
            status: 'delivered',
            type: 'food',
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          },
          {
            table_id: tables[1]?.id || tables[0].id,
            seat_id: seats[1]?.id || seats[0].id,
            resident_id: residents[1]?.id || residents[0].id,
            server_id: servers[0].id,
            items: ['Coffee', 'Apple pie'],
            transcript: 'Coffee and apple pie',
            status: 'delivered',
            type: 'food',
            created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
          },
        ]

        await this.supabase.from('orders').insert(sampleOrders)
      }

      return true
    } catch (error) {
      console.error('Failed to seed sample orders:', error)
      return false
    }
  }

  // BACKUP AND RESTORATION

  private async createBackup(): Promise<boolean> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupFile = path.join(
        this.backupDir,
        `demo-backup-${timestamp}.json`
      )

      const backupData = {
        timestamp,
        profiles: await this.exportTable('profiles'),
        tables: await this.exportTable('tables'),
        seats: await this.exportTable('seats'),
        orders: await this.exportTable('orders'),
      }

      fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2))
      console.log(`💾 Backup created: ${backupFile}`)

      return true
    } catch (error) {
      console.error('Failed to create backup:', error)
      return false
    }
  }

  private async exportTable(tableName: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase.from(tableName).select('*')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error(`Failed to export table ${tableName}:`, error)
      return []
    }
  }

  // STATE MONITORING

  private async captureDataState(): Promise<any> {
    try {
      const [profiles, tables, seats, orders] = await Promise.all([
        this.supabase.from('profiles').select('count'),
        this.supabase.from('tables').select('count'),
        this.supabase.from('seats').select('count'),
        this.supabase.from('orders').select('count'),
      ])

      return {
        timestamp: new Date().toISOString(),
        counts: {
          profiles: profiles.data?.[0]?.count || 0,
          tables: tables.data?.[0]?.count || 0,
          seats: seats.data?.[0]?.count || 0,
          orders: orders.data?.[0]?.count || 0,
        },
      }
    } catch (error) {
      console.error('Failed to capture data state:', error)
      return null
    }
  }

  // UTILITY METHODS

  async checkResetReadiness(): Promise<{ ready: boolean; issues: string[] }> {
    const issues: string[] = []

    try {
      // Check database connection
      const { error: dbError } = await this.supabase
        .from('profiles')
        .select('count')
        .limit(1)

      if (dbError) {
        issues.push(`Database connection failed: ${dbError.message}`)
      }

      // Check for demo users
      const { data: adminUsers } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')

      if (!adminUsers || adminUsers.length === 0) {
        issues.push('No admin users found - complete reset may be risky')
      }

      // Check backup directory
      if (!fs.existsSync(this.backupDir)) {
        issues.push('Backup directory not accessible')
      }
    } catch (error) {
      issues.push(`Readiness check failed: ${error}`)
    }

    return {
      ready: issues.length === 0,
      issues,
    }
  }

  async listBackups(): Promise<string[]> {
    try {
      const files = fs.readdirSync(this.backupDir)
      return files
        .filter(
          file => file.startsWith('demo-backup-') && file.endsWith('.json')
        )
        .sort()
        .reverse() // Most recent first
    } catch (error) {
      console.error('Failed to list backups:', error)
      return []
    }
  }
}

// CLI EXECUTION
async function main() {
  const command = process.argv[2]
  const manager = new DemoDataResetManager()

  try {
    switch (command) {
      case 'quick':
        console.log('🚀 Performing quick reset...')
        const quickResult = await manager.quickReset()
        console.log('Results:', JSON.stringify(quickResult, null, 2))
        break

      case 'full':
        console.log('🔄 Performing full reset...')
        const fullResult = await manager.fullReset()
        console.log('Results:', JSON.stringify(fullResult, null, 2))
        break

      case 'complete':
        console.log('💥 Performing complete reset...')
        const completeResult = await manager.completeReset()
        console.log('Results:', JSON.stringify(completeResult, null, 2))
        break

      case 'check':
        console.log('🔍 Checking reset readiness...')
        const readiness = await manager.checkResetReadiness()
        console.log('Readiness:', JSON.stringify(readiness, null, 2))
        break

      case 'backup':
        console.log('💾 Creating backup...')
        const backupResult = await manager.createBackup()
        console.log('Backup result:', backupResult)
        break

      case 'list-backups':
        console.log('📋 Listing backups...')
        const backups = await manager.listBackups()
        console.log('Available backups:')
        backups.forEach(backup => console.log(`  - ${backup}`))
        break

      default:
        console.log('Demo Data Reset Manager')
        console.log('Usage: node demo-data-reset.ts <command>')
        console.log('')
        console.log('Commands:')
        console.log('  quick       - Clear active orders and sessions only')
        console.log('  full        - Reset tables, seats, and recent data')
        console.log('  complete    - Full reset including users (dangerous)')
        console.log('  check       - Check system readiness for reset')
        console.log('  backup      - Create data backup')
        console.log('  list-backups - List available backups')
        break
    }
  } catch (error) {
    console.error('❌ Command failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error)
    process.exit(1)
  })
}

export { DemoDataResetManager, type ResetOptions, type ResetResults }
