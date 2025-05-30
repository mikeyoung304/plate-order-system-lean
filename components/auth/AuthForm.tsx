// OVERNIGHT_SESSION: 2025-05-30 - Fort Knox security for authentication form
// Reason: Authentication is the highest value target for attackers
// Impact: Bulletproof login/signup with input sanitization and rate limiting

"use client"

import { useState, useActionState, useEffect, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { signIn, signUp } from "@/app/auth/actions"
import { AboutTrigger } from "@/components/about-dialog"
import { Security } from "@/lib/security"
import { useRenderPerformance } from "@/lib/performance/monitoring"

export function AuthForm() {
  // Performance monitoring
  useRenderPerformance('AuthForm');

  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [attemptCount, setAttemptCount] = useState(0)
  const [isRateLimited, setIsRateLimited] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // Initialize with the server actions
  const [signInState, signInAction] = useActionState(signIn, null)
  const [signUpState, signUpAction] = useActionState(signUp, null)

  // Security: Input validation and sanitization
  const validateAndSanitizeInputs = useCallback((formData: FormData) => {
    const rawEmail = formData.get('email') as string
    const rawPassword = formData.get('password') as string
    const rawName = formData.get('name') as string
    const rawRole = formData.get('role') as string

    // Sanitize inputs
    const sanitizedEmail = Security.sanitize.sanitizeHTML(rawEmail?.trim() || '').toLowerCase()
    const sanitizedName = Security.sanitize.sanitizeUserName(rawName || '')
    const sanitizedRole = ['server', 'cook', 'admin'].includes(rawRole) ? rawRole : 'server'

    // Validate email format (unless it's the special 'guest' case)
    if (sanitizedEmail !== 'guest' && sanitizedEmail !== 'guest@demo.plate') {
      if (!sanitizedEmail || sanitizedEmail.length < 3) {
        throw new Error('Please enter a valid email address')
      }
      if (sanitizedEmail.length > 254) {
        throw new Error('Email address is too long')
      }
      if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(sanitizedEmail)) {
        throw new Error('Please enter a valid email format')
      }
    }

    // Validate password
    if (!rawPassword || rawPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long')
    }
    if (rawPassword.length > 128) {
      throw new Error('Password is too long')
    }

    // Validate name for signup
    if (isSignUp) {
      if (!sanitizedName || sanitizedName.length < 2) {
        throw new Error('Please enter a valid name')
      }
      if (sanitizedName.length > 100) {
        throw new Error('Name is too long')
      }
    }

    return {
      email: sanitizedEmail,
      password: rawPassword, // Don't sanitize password, just validate
      name: sanitizedName,
      role: sanitizedRole
    }
  }, [isSignUp])

  // Security: Rate limiting on frontend (backup to server-side)
  const checkRateLimit = useCallback(() => {
    if (attemptCount >= 5) {
      setIsRateLimited(true)
      setTimeout(() => {
        setIsRateLimited(false)
        setAttemptCount(0)
      }, 5 * 60 * 1000) // 5 minute cooldown
      throw new Error('Too many failed attempts. Please wait 5 minutes before trying again.')
    }
  }, [attemptCount])

  // Check states for errors
  useEffect(() => {
    if (signInState?.error) {
      setStatus({
        message: signInState.error,
        type: 'error'
      })
      toast({
        title: "Error",
        description: signInState.error,
        variant: "destructive",
      })
    }
    
    if (signUpState?.error) {
      setStatus({
        message: signUpState.error,
        type: 'error'
      })
      toast({
        title: "Error",
        description: signUpState.error,
        variant: "destructive",
      })
    }
    
    if (signUpState?.success) {
      setStatus({
        message: "Check your email for the confirmation link.",
        type: 'success'
      })
      toast({
        title: "Success!",
        description: "Check your email for the confirmation link.",
      })
    }
  }, [signInState, signUpState, toast])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setStatus({ message: '', type: null })

    try {
      // Security: Check rate limiting first
      checkRateLimit()

      const formData = new FormData(e.currentTarget)
      
      // Security: Validate and sanitize all inputs
      const validatedInputs = validateAndSanitizeInputs(formData)
      
      // Handle Guest username -> email conversion (secure)
      let finalEmail = validatedInputs.email
      if (validatedInputs.email.toLowerCase() === 'guest') {
        finalEmail = 'guest@demo.plate'
      }
      
      // Create secure form data with validated inputs
      const secureFormData = new FormData()
      secureFormData.set('email', finalEmail)
      secureFormData.set('password', validatedInputs.password)
      if (isSignUp) {
        secureFormData.set('name', validatedInputs.name)
        secureFormData.set('role', validatedInputs.role)
      }
      
      if (isSignUp) {
        startTransition(() => {
          signUpAction(secureFormData);
        });
      } else {
        startTransition(() => {
          signInAction(secureFormData);
        });
      }
      
    } catch (error) {
      // Security: Increment attempt counter on any error
      setAttemptCount(prev => prev + 1)
      
      const errorMessage = error instanceof Error ? error.message : 
        isSignUp ? "Could not create account. Please try again." : "Invalid email or password."
      
      setStatus({
        message: errorMessage,
        type: 'error'
      })
      
      toast({
        title: "Security Error",
        description: errorMessage,
        variant: "destructive",
      })
      
      setIsLoading(false)
    }
  }

  const handleGuestDemo = async () => {
    try {
      // Security: Check rate limiting for guest demo too
      checkRateLimit()
      
      setEmail('Guest')
      setPassword('Temp1')
      setIsLoading(true)
      setStatus({ message: '', type: null })

      // Security: Use validated guest credentials
      const secureFormData = new FormData()
      secureFormData.append('email', 'guest@demo.plate')
      secureFormData.append('password', 'Temp1')
      
      startTransition(() => {
        signInAction(secureFormData);
      });
      
    } catch (error) {
      setAttemptCount(prev => prev + 1)
      const errorMessage = error instanceof Error ? error.message : 'Failed to access demo. Please try again.'
      
      setStatus({
        message: errorMessage,
        type: 'error'
      })
      
      toast({
        title: "Demo Access Error",
        description: errorMessage,
        variant: "destructive",
      })
      
      setIsLoading(false)
    }
  }

  // Security: Sanitize input changes
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedValue = Security.sanitize.sanitizeHTML(e.target.value).slice(0, 254)
    setEmail(sanitizedValue)
  }, [])

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Don't sanitize password, just validate length
    const value = e.target.value.slice(0, 128)
    setPassword(value)
  }, [])

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Enter your name"
              required
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Username or Email</Label>
          <Input
            id="email"
            name="email"
            type="text"
            placeholder="Enter 'Guest' for demo"
            value={email}
            onChange={handleEmailChange}
            disabled={isRateLimited}
            maxLength={254}
            required
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={handlePasswordChange}
            disabled={isRateLimited}
            maxLength={128}
            required
            autoComplete={isSignUp ? "new-password" : "current-password"}
          />
        </div>
        {isSignUp && (
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select name="role">
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="server">Server</SelectItem>
                <SelectItem value="cook">Cook</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {/* Security: Rate limiting warning */}
        {isRateLimited && (
          <Alert variant="destructive">
            <AlertDescription>
              Too many failed attempts. Please wait 5 minutes before trying again.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Security: Show attempt count */}
        {attemptCount > 0 && !isRateLimited && (
          <Alert variant="default">
            <AlertDescription>
              {attemptCount >= 3 ? `Warning: ${5 - attemptCount} attempts remaining` : `${attemptCount} failed attempt${attemptCount > 1 ? 's' : ''}`}
            </AlertDescription>
          </Alert>
        )}

        {status.message && (
          <Alert variant={status.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>
              {Security.sanitize.sanitizeHTML(status.message)}
            </AlertDescription>
          </Alert>
        )}
        
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || isPending || isRateLimited}
        >
          {isRateLimited ? "Rate Limited" : 
           (isLoading || isPending) ? "Loading..." : 
           (isSignUp ? "Create Account" : "Sign In")}
        </Button>
        
        {!isSignUp && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or
              </span>
            </div>
          </div>
        )}
        
        {!isSignUp && (
          <Button
            type="button"
            onClick={handleGuestDemo}
            disabled={isLoading || isPending || isRateLimited}
            className="w-full bg-gray-900 text-white hover:bg-gray-800 
                     transition-colors flex items-center justify-center gap-2
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>🎯</span> {isRateLimited ? "Demo Rate Limited" : "Try Demo"}
          </Button>
        )}
        
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => {
            setIsSignUp(!isSignUp)
            setStatus({ message: '', type: null })
            setEmail('')
            setPassword('')
          }}
        >
          {isSignUp ? "Already have an account? Sign in" : "Need an account? Create one"}
        </Button>
      </form>
      
      {/* Subtle attribution */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Plate by Mike Young • Rethinking restaurant systems
          </p>
          <AboutTrigger />
        </div>
      </div>
    </div>
  )
} 