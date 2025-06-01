import { useCallback, useEffect, useReducer, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Security } from '@/lib/security'

export type AuthMode = 'signin' | 'signup'
export type AuthStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'
  | 'rate_limited'

export interface AuthFormState {
  mode: AuthMode
  status: AuthStatus
  email: string
  password: string
  name: string
  role: string
  error: string | null
  successMessage: string | null
  attemptCount: number
  isRateLimited: boolean
}

export interface AuthFormActions {
  setMode: (mode: AuthMode) => void
  setEmail: (email: string) => void
  setPassword: (password: string) => void
  setName: (name: string) => void
  setRole: (role: string) => void
  setStatus: (status: AuthStatus, message?: string) => void
  incrementAttempts: () => void
  resetRateLimit: () => void
  validateAndPrepareData: () => {
    email: string
    password: string
    name: string
    role: string
  }
  reset: () => void
}

type AuthFormReducerAction =
  | { type: 'SET_MODE'; payload: AuthMode }
  | { type: 'SET_EMAIL'; payload: string }
  | { type: 'SET_PASSWORD'; payload: string }
  | { type: 'SET_NAME'; payload: string }
  | { type: 'SET_ROLE'; payload: string }
  | { type: 'SET_STATUS'; payload: { status: AuthStatus; message?: string } }
  | { type: 'INCREMENT_ATTEMPTS' }
  | { type: 'RESET_RATE_LIMIT' }
  | { type: 'RESET' }

const initialState: AuthFormState = {
  mode: 'signin',
  status: 'idle',
  email: '',
  password: '',
  name: '',
  role: 'server',
  error: null,
  successMessage: null,
  attemptCount: 0,
  isRateLimited: false,
}

function authFormReducer(
  state: AuthFormState,
  action: AuthFormReducerAction
): AuthFormState {
  switch (action.type) {
    case 'SET_MODE':
      return {
        ...state,
        mode: action.payload,
        error: null,
        successMessage: null,
        status: 'idle',
      }

    case 'SET_EMAIL':
      return { ...state, email: action.payload }

    case 'SET_PASSWORD':
      return { ...state, password: action.payload }

    case 'SET_NAME':
      return { ...state, name: action.payload }

    case 'SET_ROLE':
      return { ...state, role: action.payload }

    case 'SET_STATUS':
      return {
        ...state,
        status: action.payload.status,
        error:
          action.payload.status === 'error'
            ? action.payload.message || 'An error occurred'
            : null,
        successMessage:
          action.payload.status === 'success'
            ? action.payload.message || 'Success!'
            : null,
      }

    case 'INCREMENT_ATTEMPTS':
      const newAttemptCount = state.attemptCount + 1
      return {
        ...state,
        attemptCount: newAttemptCount,
        isRateLimited: newAttemptCount >= 5,
        status: newAttemptCount >= 5 ? 'rate_limited' : state.status,
        error:
          newAttemptCount >= 5
            ? 'Too many failed attempts. Please wait 5 minutes.'
            : state.error,
      }

    case 'RESET_RATE_LIMIT':
      return {
        ...state,
        isRateLimited: false,
        attemptCount: 0,
        status: state.status === 'rate_limited' ? 'idle' : state.status,
        error: state.status === 'rate_limited' ? null : state.error,
      }

    case 'RESET':
      return initialState

    default:
      return state
  }
}

export function useAuthFormState() {
  const [state, dispatch] = useReducer(authFormReducer, initialState)
  const { toast } = useToast()

  // Auto-reset rate limiting after 5 minutes
  useEffect(() => {
    if (state.isRateLimited) {
      const timeout = setTimeout(
        () => {
          dispatch({ type: 'RESET_RATE_LIMIT' })
        },
        5 * 60 * 1000
      ) // 5 minutes

      return () => clearTimeout(timeout)
    }
  }, [state.isRateLimited])

  // Validation and sanitization
  const validateAndPrepareData = useCallback((): {
    email: string
    password: string
    name: string
    role: string
  } => {
    // Check rate limiting first
    if (state.isRateLimited) {
      throw new Error(
        'Too many failed attempts. Please wait 5 minutes before trying again.'
      )
    }

    // Sanitize inputs
    const sanitizedEmail = Security.sanitize
      .sanitizeHTML(state.email.trim())
      .toLowerCase()
    const sanitizedName = Security.sanitize.sanitizeUserName(state.name || '')
    const sanitizedRole = ['server', 'cook', 'admin'].includes(state.role)
      ? state.role
      : 'server'

    // Validate email format (unless it's the special 'guest' case)
    if (
      sanitizedEmail !== 'guest' &&
      sanitizedEmail !== 'guest@demo.plate' &&
      sanitizedEmail !== 'guest@restaurant.plate'
    ) {
      if (!sanitizedEmail || sanitizedEmail.length < 3) {
        throw new Error('Please enter a valid email address')
      }
      if (sanitizedEmail.length > 254) {
        throw new Error('Email address is too long')
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
        throw new Error('Please enter a valid email format')
      }
    }

    // Validate password
    if (!state.password || state.password.length < 6) {
      throw new Error('Password must be at least 6 characters long')
    }
    if (state.password.length > 128) {
      throw new Error('Password is too long')
    }

    // Validate name for signup
    if (state.mode === 'signup') {
      if (!sanitizedName || sanitizedName.length < 2) {
        throw new Error('Please enter a valid name')
      }
      if (sanitizedName.length > 100) {
        throw new Error('Name is too long')
      }
    }

    return {
      email: sanitizedEmail,
      password: state.password, // Don't sanitize password, just validate
      name: sanitizedName,
      role: sanitizedRole,
    }
  }, [state])

  // Show toast notifications for status changes
  useEffect(() => {
    if (state.error) {
      toast({
        title: 'Error',
        description: state.error,
        variant: 'destructive',
      })
    } else if (state.successMessage) {
      toast({
        title: 'Success!',
        description: state.successMessage,
      })
    }
  }, [state.error, state.successMessage, toast])

  const actions: AuthFormActions = {
    setMode: mode => dispatch({ type: 'SET_MODE', payload: mode }),
    setEmail: email => dispatch({ type: 'SET_EMAIL', payload: email }),
    setPassword: password =>
      dispatch({ type: 'SET_PASSWORD', payload: password }),
    setName: name => dispatch({ type: 'SET_NAME', payload: name }),
    setRole: role => dispatch({ type: 'SET_ROLE', payload: role }),
    setStatus: (status, message) =>
      dispatch({ type: 'SET_STATUS', payload: { status, message } }),
    incrementAttempts: () => dispatch({ type: 'INCREMENT_ATTEMPTS' }),
    resetRateLimit: () => dispatch({ type: 'RESET_RATE_LIMIT' }),
    validateAndPrepareData,
    reset: () => dispatch({ type: 'RESET' }),
  }

  return { state, actions }
}
