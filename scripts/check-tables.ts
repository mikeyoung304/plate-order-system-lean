import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function checkTables() {
  const { data, error, count } = await supabase
    .from('tables')
    .select('*', { count: 'exact' })
  
  console.log('Tables count:', count)
  console.log('Tables data:', data)
  console.log('Error:', error)
}

checkTables()