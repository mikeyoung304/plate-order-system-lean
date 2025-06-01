import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
)

async function cleanup() {
  await supabase.from('tables').delete().eq('label', 999)
  console.log('✅ Cleaned up test table')
}

cleanup().catch(console.error)