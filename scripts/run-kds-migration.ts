#!/usr/bin/env tsx
/**
 * KDS MIGRATION RUNNER
 *
 * Ensures KDS system tables are created in production database
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://eiipozoogrrfudhjoqms.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  console.log('🚀 Running KDS migration...')

  try {
    // Check if kds_stations table exists
    const { data, error } = await supabase
      .from('kds_stations')
      .select('count')
      .limit(1)

    if (!error) {
      console.log('✅ KDS tables already exist')
      return
    }

    // Read the KDS migration file
    const migrationPath = join(
      process.cwd(),
      'supabase/migrations/20250527000001_create_kds_system.sql'
    )
    const migrationSQL = readFileSync(migrationPath, 'utf8')

    console.log('📄 Executing KDS migration...')

    // Execute the migration
    const { error: migrationError } = await supabase.rpc('exec_sql', {
      sql: migrationSQL,
    })

    if (migrationError) {
      // Try alternative approach - execute via REST API
      console.log('🔄 Trying alternative migration approach...')

      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          apikey: SUPABASE_SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({ sql: migrationSQL }),
      })

      if (!response.ok) {
        throw new Error(`Migration failed: ${await response.text()}`)
      }
    }

    console.log('✅ KDS migration completed successfully!')

    // Verify tables were created
    const { data: stations, error: verifyError } = await supabase
      .from('kds_stations')
      .select('count')

    if (verifyError) {
      throw new Error(`Verification failed: ${verifyError.message}`)
    }

    console.log('🎯 KDS system is ready!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

main().catch(console.error)
