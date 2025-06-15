import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fixGuestUser() {
  console.log('🔧 Fixing guest user role assignment...')
  
  // First, get the guest user ID
  const { data: authUser, error: authError } = await supabase.auth.signInWithPassword({
    email: 'guest@restaurant.plate',
    password: 'guest12345'
  })
  
  if (authError || !authUser.user) {
    console.error('❌ Cannot authenticate guest user:', authError)
    return
  }
  
  const guestUserId = authUser.user.id
  console.log('✅ Guest user ID:', guestUserId)
  
  // Update guest user profile using user_id
  const { data, error } = await supabase
    .from('profiles')
    .update({ 
      role: 'server', 
      name: 'Demo Server'
    })
    .eq('user_id', guestUserId)
    .select()
    
  if (error) {
    console.error('❌ Error updating profile:', error)
    return
  } else {
    console.log('✅ Guest user profile updated:', data)
  }
  
  // Verify the fix
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', guestUserId)
    .single()
    
  console.log('📋 Current guest profile:', profile)
  
  // Sign out to clean up
  await supabase.auth.signOut()
  
  // Test authentication with corrected user
  console.log('\n🔐 Testing guest authentication...')
  const { data: testAuthData, error: testAuthError } = await supabase.auth.signInWithPassword({
    email: 'guest@restaurant.plate',
    password: 'guest12345'
  })
  
  if (testAuthError) {
    console.error('❌ Authentication test failed:', testAuthError)
  } else {
    console.log('✅ Authentication test successful')
    console.log('   User ID:', testAuthData.user?.id)
    console.log('   Email:', testAuthData.user?.email)
    
    // Sign out after test
    await supabase.auth.signOut()
    console.log('✅ Test session cleaned up')
  }
}

fixGuestUser().catch(console.error)