'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/modassembly/supabase/server'

type ActionResult = {
  error?: string;
  success?: boolean;
}

export async function signIn(prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  console.log('🔑 AUTH DEBUG: Attempting login for:', data.email)

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.log('❌ AUTH DEBUG: Login failed:', error.message)
    return { error: error.message }
  }

  // Check if session was created
  if (authData.session) {
    console.log('✅ AUTH DEBUG: Session created successfully')
    console.log('📋 AUTH DEBUG: User ID:', authData.user?.id)
    console.log('📋 AUTH DEBUG: User Email:', authData.user?.email)
    console.log('📋 AUTH DEBUG: Access Token Present:', !!authData.session.access_token)
  } else {
    console.log('⚠️ AUTH DEBUG: No session in auth response')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signUp(prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
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
        role
      }
    }
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