'use client'

import React, { useActionState, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { signIn, signUp } from '@/lib/modassembly/supabase/auth/actions'
import { useAuthFormState } from '@/lib/hooks/use-auth-form-state'

export function AuthForm() {
  const { state, actions } = useAuthFormState()
  const _router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Initialize with the server actions
  const [signInState, signInAction] = useActionState(signIn, null)
  const [signUpState, signUpAction] = useActionState(signUp, null)

  // Check server states whenever they change
  React.useEffect(() => {
    if (signInState?.error) {
      actions.setStatus('error', signInState.error)
      actions.incrementAttempts()
    }

    if (signUpState?.error) {
      actions.setStatus('error', signUpState.error)
      actions.incrementAttempts()
    }

    if (signUpState?.success) {
      actions.setStatus(
        'success',
        'Check your email for the confirmation link.'
      )
    }
  }, [signInState, signUpState, actions])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    actions.setStatus('loading')

    try {
      // Validate and prepare data (includes rate limiting check)
      const validatedInputs = actions.validateAndPrepareData()
      const finalEmail = validatedInputs.email

      // Create secure form data
      const secureFormData = new FormData()
      secureFormData.set('email', finalEmail)
      secureFormData.set('password', validatedInputs.password)
      if (state.mode === 'signup') {
        secureFormData.set('name', validatedInputs.name)
        secureFormData.set('role', validatedInputs.role)
      }

      // Submit with transition
      if (state.mode === 'signup') {
        startTransition(() => {
          signUpAction(secureFormData)
        })
      } else {
        startTransition(() => {
          signInAction(secureFormData)
        })
      }
    } catch (error) {
      actions.incrementAttempts()
      const errorMessage =
        error instanceof Error
          ? error.message
          : state.mode === 'signup'
            ? 'Could not create account. Please try again.'
            : 'Invalid email or password.'
      actions.setStatus('error', errorMessage)
    }
  }

  const isLoading = state.status === 'loading' || isPending

  return (
    <div className='w-full space-y-4'>
      <form onSubmit={handleSubmit} className='space-y-4'>
        {state.mode === 'signup' && (
          <div className='space-y-2'>
            <Label htmlFor='name'>Name</Label>
            <Input
              id='name'
              name='name'
              type='text'
              placeholder='Enter your name'
              value={state.name}
              onChange={e => actions.setName(e.target.value)}
              disabled={state.isRateLimited || isLoading}
              maxLength={100}
              required
            />
          </div>
        )}

        <div className='space-y-2'>
          <Label htmlFor='email'>Username or Email</Label>
          <Input
            id='email'
            name='email'
            type='text'
            placeholder='Enter your email address'
            value={state.email}
            onChange={e => actions.setEmail(e.target.value)}
            disabled={state.isRateLimited || isLoading}
            maxLength={254}
            required
            autoComplete='email'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='password'>Password</Label>
          <Input
            id='password'
            name='password'
            type='password'
            placeholder='Enter your password'
            value={state.password}
            onChange={e => actions.setPassword(e.target.value)}
            disabled={state.isRateLimited || isLoading}
            maxLength={128}
            required
            autoComplete={
              state.mode === 'signup' ? 'new-password' : 'current-password'
            }
          />
        </div>

        {state.mode === 'signup' && (
          <div className='space-y-2'>
            <Label htmlFor='role'>Role</Label>
            <Select value={state.role} onValueChange={actions.setRole}>
              <SelectTrigger>
                <SelectValue placeholder='Select your role' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='server'>Server</SelectItem>
                <SelectItem value='cook'>Cook</SelectItem>
                <SelectItem value='admin'>Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {state.error && (
          <Alert variant='destructive'>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        {state.successMessage && (
          <Alert>
            <AlertDescription>{state.successMessage}</AlertDescription>
          </Alert>
        )}

        <Button
          type='submit'
          className='w-full'
          disabled={state.isRateLimited || isLoading}
        >
          {isLoading
            ? 'Processing...'
            : state.mode === 'signup'
              ? 'Sign Up'
              : 'Sign In'}
        </Button>
      </form>

      <div className='text-center space-y-4'>
        {/* Guest Demo Login Button */}
        <Button
          variant='default'
          onClick={() => {
            actions.setStatus('loading')
            const guestFormData = new FormData()
            guestFormData.set('email', 'guest@restaurant.plate')
            guestFormData.set('password', 'guest12345')
            startTransition(() => {
              signInAction(guestFormData)
            })
          }}
          className='w-full bg-blue-600 hover:bg-blue-700 text-white'
          disabled={isLoading}
        >
          🍽️ Guest Demo Login
        </Button>

        <Button
          variant='outline'
          onClick={() =>
            actions.setMode(state.mode === 'signup' ? 'signin' : 'signup')
          }
          className='w-full'
          disabled={isLoading}
        >
          {state.mode === 'signup'
            ? 'Already have an account? Sign In'
            : 'Need an account? Sign Up'}
        </Button>
      </div>

      {state.isRateLimited && (
        <Alert variant='destructive'>
          <AlertDescription>
            Too many failed attempts. Please wait 5 minutes before trying again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
