/**
 * Voice Ordering System Diagnostic Script
 * Tests all components of the voice ordering pipeline
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Browser-side checks (for manual testing)
const browserChecks = `
// Run these checks in the browser console at localhost:3001

// 1. Check HTTPS requirement
console.log('Protocol:', window.location.protocol)
console.log('HTTPS Required for microphone:', window.location.protocol !== 'https:' && window.location.hostname !== 'localhost')

// 2. Check MediaDevices API availability
console.log('MediaDevices supported:', !!navigator.mediaDevices)
console.log('getUserMedia supported:', !!navigator.mediaDevices?.getUserMedia)

// 3. Check MediaRecorder support
console.log('MediaRecorder supported:', typeof MediaRecorder !== 'undefined')

// Test supported audio formats
const formats = [
  'audio/webm;codecs=opus',
  'audio/webm', 
  'audio/mp4',
  'audio/mpeg',
  'audio/wav'
]
formats.forEach(format => {
  console.log(format + ':', MediaRecorder.isTypeSupported(format))
})

// 4. Test microphone permission
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log('✓ Microphone access granted')
    stream.getTracks().forEach(track => track.stop())
  })
  .catch(err => {
    console.error('✗ Microphone access denied:', err.message)
  })

// 5. Test authentication
fetch('/api/transcribe', { method: 'GET' })
  .then(r => r.json())
  .then(data => console.log('Auth check:', data))
  .catch(err => console.error('Auth error:', err))
`

async function checkBackendSystems() {
  console.log('🔍 VOICE ORDERING SYSTEM DIAGNOSTICS\\n')
  
  try {
    // 1. Environment Variables
    console.log('1. ENVIRONMENT CONFIGURATION')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing')
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing')  
    console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✓ Set' : '✗ Missing')
    console.log('')

    // 2. Database Connection
    console.log('2. DATABASE CONNECTION')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    const { data: healthCheck, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      
    if (error) {
      console.log('Database connection: ✗ Failed -', error.message)
    } else {
      console.log('Database connection: ✓ Working')
    }
    console.log('')

    // 3. Authentication Test
    console.log('3. AUTHENTICATION SYSTEM')
    const { data: session } = await supabase.auth.getSession()
    console.log('Current session:', session.session ? '✓ Active' : '✗ No session')
    
    // Test guest login
    const { data: guestAuth, error: guestError } = await supabase.auth.signInWithPassword({
      email: 'guest@restaurant.plate',
      password: 'guest12345'
    })
    
    if (guestError) {
      console.log('Guest authentication: ✗ Failed -', guestError.message)
    } else {
      console.log('Guest authentication: ✓ Working')
      await supabase.auth.signOut()
    }
    console.log('')

    // 4. Required Tables/Functions
    console.log('4. DATABASE SCHEMA')
    const tables = ['profiles', 'orders', 'tables', 'seats']
    
    for (const table of tables) {
      try {
        const { error: tableError } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        console.log(`Table "${table}": ${tableError ? '✗ ' + tableError.message : '✓ Accessible'}`)
      } catch (err) {
        console.log(`Table "${table}": ✗ Error - ${err.message}`)
      }
    }
    console.log('')

    // 5. File System Checks
    console.log('5. FILE SYSTEM COMPONENTS')
    const fs = require('fs')
    const path = require('path')
    
    const criticalFiles = [
      'components/voice-order-panel.tsx',
      'lib/hooks/use-voice-recording-state.ts', 
      'lib/modassembly/audio-recording/record.ts',
      'app/api/transcribe/route.ts',
      'lib/modassembly/openai/optimized-transcribe.ts'
    ]
    
    criticalFiles.forEach(file => {
      const exists = fs.existsSync(path.join(__dirname, file))
      console.log(`${file}: ${exists ? '✓ Found' : '✗ Missing'}`)
    })
    console.log('')

    // 6. API Dependencies
    console.log('6. API DEPENDENCIES')
    try {
      // Test if OpenAI module can be imported
      const openaiPath = path.join(__dirname, 'lib/modassembly/openai/optimized-transcribe.ts')
      console.log('OpenAI transcription module:', fs.existsSync(openaiPath) ? '✓ Available' : '✗ Missing')
      
      // Check security module
      const securityPath = path.join(__dirname, 'lib/security/index.ts')
      console.log('Security module:', fs.existsSync(securityPath) ? '✓ Available' : '✗ Missing')
      
    } catch (err) {
      console.log('Module check error:', err.message)
    }
    console.log('')

    console.log('🌐 BROWSER TESTING INSTRUCTIONS:')
    console.log('Copy and paste this into your browser console at localhost:3001:')
    console.log('\n' + browserChecks)
    
  } catch (err) {
    console.error('Diagnostic error:', err.message)
  }
}

if (require.main === module) {
  checkBackendSystems()
}

module.exports = { checkBackendSystems }