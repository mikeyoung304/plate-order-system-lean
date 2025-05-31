"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from "next/image"

import { AuthForm } from "@/components/auth/AuthForm"
import { useAuth } from '@/lib/modassembly/supabase/auth'

export default function LandingPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // Client-side redirect for authenticated users
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard')
    }
  }, [user, isLoading, router])

  // Don't render anything while loading to avoid flash
  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  // Don't render if user is authenticated (preventing flash before redirect)
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen w-full bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 relative mb-8">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Plate_Logo_HighRes_Transparent-KHpujinpES74Q3nyKx1Nd3ogN1r9t7.png"
              alt="Plate Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-light text-white text-center">
            modern restaurant solutions
          </h1>
          <p className="mt-2 text-sm text-white/60 text-center">
            Streamlined ordering and kitchen management
          </p>
        </div>
        
        <AuthForm />
      </div>
    </div>
  )
}
