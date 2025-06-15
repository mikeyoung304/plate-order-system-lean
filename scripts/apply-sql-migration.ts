#!/usr/bin/env tsx

/**
 * Plate Restaurant System - SQL Migration Applicator
 * 
 * This script applies the RLS security SQL migration using a more direct approach.
 * It reads the SQL file and executes it using Supabase's SQL editor API.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { config } from 'dotenv'

// Load environment variables
config({ path: join(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

async function applySQLMigration() {
  console.log('🔄 Reading SQL migration file...')
  
  const sqlFilePath = join(process.cwd(), 'fix_rls_security.sql')
  let sqlContent: string
  
  try {
    sqlContent = readFileSync(sqlFilePath, 'utf-8')
    console.log('✅ SQL file loaded successfully')
  } catch (err) {
    console.error('❌ Failed to read SQL file:', err)
    return false
  }

  console.log('🔄 Applying SQL migration via REST API...')
  
  // Split SQL into individual statements (basic approach)
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

  console.log(`📝 Found ${statements.length} SQL statements to execute`)

  // Execute each statement
  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    
    if (statement.toLowerCase().includes('begin') || 
        statement.toLowerCase().includes('commit') ||
        statement.toLowerCase().includes('select') && statement.includes('UNION ALL')) {
      // Skip transaction control and summary statements
      console.log(`⏭️  Skipping statement ${i + 1}: ${statement.substring(0, 50)}...`)
      continue
    }

    console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`)
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        },
        body: JSON.stringify({
          sql_query: statement + ';'
        })
      })

      if (response.ok) {
        console.log(`✅ Statement ${i + 1} executed successfully`)
        successCount++
      } else {
        const errorText = await response.text()
        console.log(`⚠️  Statement ${i + 1} failed: ${errorText}`)
        errorCount++
      }
    } catch (err) {
      console.log(`❌ Statement ${i + 1} error: ${err}`)
      errorCount++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('🔒 SQL MIGRATION SUMMARY')
  console.log('='.repeat(50))
  console.log(`✅ Successful statements: ${successCount}`)
  console.log(`❌ Failed statements: ${errorCount}`)
  console.log(`📊 Success rate: ${Math.round((successCount / (successCount + errorCount)) * 100)}%`)

  return successCount > errorCount
}

// Alternative approach using manual policy creation
async function createPoliciesManually() {
  console.log('\n🔄 Creating policies manually via Supabase client...')
  
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const policies = [
    // Tables policies
    {
      table: 'tables',
      name: 'guests_can_read_tables',
      definition: 'CREATE POLICY "guests_can_read_tables" ON public.tables FOR SELECT TO anon USING (true);'
    },
    // Add more policies as needed
  ]

  console.log('⚠️  Manual policy creation requires SQL execution')
  console.log('🔧 Recommended: Use Supabase Dashboard SQL Editor instead')
  
  return false // Not implemented in this approach
}

async function main() {
  console.log('🔒 Plate Restaurant System - SQL Migration Applicator')
  console.log('================================================\n')

  // Try to apply the SQL migration
  const migrationSuccess = await applySQLMigration()
  
  if (!migrationSuccess) {
    console.log('\n⚠️  SQL migration had issues. Alternative approaches:')
    console.log('1. 📊 Use Supabase Dashboard SQL Editor:')
    console.log(`   - Go to: ${supabaseUrl.replace('https://', 'https://app.')}/project/sql`)
    console.log('   - Copy and paste the contents of fix_rls_security.sql')
    console.log('   - Execute the SQL directly')
    console.log('')
    console.log('2. 🔧 Use Supabase CLI:')
    console.log('   - Run: supabase db push')
    console.log('   - Or create a new migration file')
    console.log('')
    console.log('3. 📁 Manual execution:')
    console.log('   - File location: /Users/mike/Plate-Restaurant-System-App/fix_rls_security.sql')
  }

  console.log('\n🎯 NEXT STEPS:')
  console.log('1. Apply the SQL migration using one of the methods above')
  console.log('2. Test anonymous access to tables/seats (should work)')  
  console.log('3. Test anonymous access to orders/profiles (should be blocked)')
  console.log('4. Verify authenticated users have proper role-based access')
  console.log('5. Run the validation script: npm run test:security')

  return migrationSuccess
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().then(success => {
    process.exit(success ? 0 : 1)
  }).catch(err => {
    console.error('❌ Fatal error:', err)
    process.exit(1)
  })
}

export { applySQLMigration }