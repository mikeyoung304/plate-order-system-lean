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
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background animation */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md space-y-12">
        <div className="flex flex-col items-center space-y-8">
          {/* Premium logo with hover effect */}
          <div 
            className="w-40 h-40 relative mb-4 cursor-pointer transform hover:scale-105 transition-all duration-300 hover:drop-shadow-2xl"
            onClick={() => {
              const authSection = document.getElementById('auth-section');
              authSection?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Plate_Logo_HighRes_Transparent-KHpujinpES74Q3nyKx1Nd3ogN1r9t7.png"
              alt="Plate Logo"
              fill
              className="object-contain drop-shadow-lg"
              priority
            />
          </div>
          
          {/* Premium branding */}
          <div className="text-center space-y-3">
            <h1 className="text-5xl font-extralight text-white tracking-wide">
              Plate
            </h1>
            <h2 className="text-2xl font-light text-white/90">
              Restaurant Systems
            </h2>
            <p className="text-lg text-white/60 font-light">
              by Mike Young
            </p>
          </div>
          
          {/* Elegant description */}
          <div className="text-center space-y-2 max-w-sm">
            <p className="text-white/80 font-light leading-relaxed">
              Modern voice-enabled ordering and kitchen management for assisted living facilities
            </p>
            <p className="text-sm text-white/50">
              Streamlined • Intuitive • Professional
            </p>
          </div>
        </div>
        
        {/* Auth section */}
        <div id="auth-section" className="space-y-6">
          <AuthForm />
        </div>
      </div>
    </div>
  )
}
