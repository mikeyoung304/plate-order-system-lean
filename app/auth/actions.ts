'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/modassembly/supabase/server'

type ActionResult = {
  error?: string
  success?: boolean
}

async function cleanGuestData(userId: string) {
  const supabase = await createClient()

  try {
    // Clean orders older than 2 hours for guest account
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

    await supabase
      .from('orders')
      .delete()
      .eq('server_id', userId)
      .lt('created_at', twoHoursAgo)
  } catch (_error) {
    // Guest cleanup failed, but this is not critical
  }
}

export async function signIn(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  // Debug logging for troubleshooting
  console.log('🔍 [signIn] Attempting login with:', { email: data.email, hasPassword: !!data.password })

  const { error, data: authData } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error('🔍 [signIn] Login failed:', error.message)
    return { error: error.message }
  }

  console.log('🔍 [signIn] Login successful:', { userId: authData.user?.id, hasSession: !!authData.session })

  // Clean guest data if this is a guest login
  if (
    (data.email === 'guest@demo.plate' ||
      data.email === 'guest@restaurant.plate') &&
    authData.user
  ) {
    await cleanGuestData(authData.user.id)
  }

  // Force a session refresh to ensure cookies are properly written
  console.log('🔍 [signIn] Refreshing session...')
  const { error: refreshError } = await supabase.auth.refreshSession()
  
  if (refreshError) {
    console.error('🔍 [signIn] Session refresh failed:', refreshError.message)
    return { error: 'Failed to establish session. Please try again.' }
  }

  console.log('🔍 [signIn] Session refreshed successfully, redirecting to dashboard...')
  revalidatePath('/', 'layout')
  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function signUp(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  const role = formData.get('role') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
