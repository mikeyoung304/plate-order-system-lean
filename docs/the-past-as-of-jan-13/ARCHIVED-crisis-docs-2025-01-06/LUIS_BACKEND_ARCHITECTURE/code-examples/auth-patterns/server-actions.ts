/**
 * Luis's Authentic Server Actions Pattern
 * Source: lib/modassembly/supabase/auth/actions.ts (git commit 56f4526)
 *
 * This is Luis's actual server-first authentication implementation.
 * No client-side auth state management - everything runs on the server.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/modassembly/supabase/server'

export interface ActionResult {
  error?: string
}

/**
 * Sign in server action
 * Uses FormData extraction and server-side auth
 */
export async function signIn(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

/**
 * Sign up server action
 * Same pattern as sign in - server-side only
 */
export async function signUp(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

/**
 * Sign out server action
 * Simple server-side sign out with redirect
 */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

/**
 * Luis's Server Action Pattern Characteristics:
 *
 * 1. 'use server' directive - Ensures server-side execution
 * 2. FormData extraction - Native form handling
 * 3. Direct Supabase operations - No abstraction layers
 * 4. revalidatePath() - Clears Next.js cache
 * 5. redirect() - Server-side navigation
 * 6. Error objects - Simple error reporting
 * 7. No client state - Everything handled server-side
 */
