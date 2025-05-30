"use client"

import { useState, useActionState, useEffect, useTransition } from "react"
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

export function AuthForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // Initialize with the server actions
  const [signInState, signInAction] = useActionState(signIn, null)
  const [signUpState, signUpAction] = useActionState(signUp, null)

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

    const formData = new FormData(e.currentTarget)
    
    // Handle Guest username -> email conversion
    const emailInput = formData.get('email') as string
    if (emailInput.toLowerCase() === 'guest') {
      formData.set('email', 'guest@demo.plate')
    }
    
    try {
      if (isSignUp) {
        startTransition(() => {
          signUpAction(formData);
        });
      } else {
        startTransition(() => {
          signInAction(formData);
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 
        isSignUp ? "Could not create account. Please try again." : "Invalid email or password."
      setStatus({
        message: errorMessage,
        type: 'error'
      })
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestDemo = async () => {
    setEmail('Guest')
    setPassword('Temp1')
    setIsLoading(true)
    setStatus({ message: '', type: null })

    const formData = new FormData()
    formData.append('email', 'guest@demo.plate')
    formData.append('password', 'Temp1')
    
    try {
      startTransition(() => {
        signInAction(formData);
      });
    } catch (error) {
      setStatus({
        message: 'Failed to access demo. Please try again.',
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

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
            onChange={(e) => setEmail(e.target.value)}
            required
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
            onChange={(e) => setPassword(e.target.value)}
            required
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
        {status.message && (
          <Alert variant={status.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>
              {status.message}
            </AlertDescription>
          </Alert>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || isPending}
        >
          {(isLoading || isPending) ? "Loading..." : (isSignUp ? "Create Account" : "Sign In")}
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
            disabled={isLoading || isPending}
            className="w-full bg-gray-900 text-white hover:bg-gray-800 
                     transition-colors flex items-center justify-center gap-2"
          >
            <span>🎯</span> Try Demo
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