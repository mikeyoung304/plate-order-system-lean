'use client'

import { useEffect, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  ChefHat,
  FlaskConical,
  Lightbulb,
  MessageSquare,
  Mic,
  Star,
  Users,
  Utensils,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/modassembly/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const checkForBetaWelcome = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        setProfile(userProfile)

        // Show welcome for any authenticated user who hasn't seen it yet
        if (!sessionStorage.getItem('beta-welcome-shown-v2')) {
          setIsOpen(true)
          sessionStorage.setItem('beta-welcome-shown-v2', 'true')
        }
      }
    }

    checkForBetaWelcome()
  }, [])

  const steps = [
    {
      title: 'Welcome to Plate Beta! 🎉',
      subtitle: 'The Future of Restaurant Management',
      content: (
        <div className='space-y-6'>
          <div className='text-center'>
            <div className='w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center'>
              <FlaskConical className='w-10 h-10 text-white' />
            </div>
            <p className='text-gray-600 leading-relaxed'>
              You're among the first to experience our revolutionary
              voice-powered restaurant system. This beta gives you early access
              to cutting-edge features that will transform how restaurants
              operate.
            </p>
          </div>

          <div className='bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200'>
            <div className='flex items-center gap-2 mb-2'>
              <Star className='w-4 h-4 text-yellow-500 fill-current' />
              <span className='font-semibold text-sm text-gray-700'>
                Beta Tester Exclusive
              </span>
            </div>
            <p className='text-sm text-gray-600'>
              Your feedback shapes the future of this platform. Every
              interaction helps us build something amazing.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Core Features',
      subtitle: 'Everything You Need to Know',
      content: (
        <div className='space-y-4'>
          <div className='grid grid-cols-1 gap-4'>
            <div className='flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors'>
              <div className='w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0'>
                <Mic className='w-4 h-4 text-blue-600' />
              </div>
              <div>
                <h4 className='font-medium text-gray-900'>Voice Ordering</h4>
                <p className='text-sm text-gray-600'>
                  Just speak naturally - "chicken, pasta, salad" - and watch the
                  magic happen
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors'>
              <div className='w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0'>
                <Users className='w-4 h-4 text-green-600' />
              </div>
              <div>
                <h4 className='font-medium text-gray-900'>Smart Floor Plans</h4>
                <p className='text-sm text-gray-600'>
                  Interactive table management with resident recognition and
                  preferences
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors'>
              <div className='w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0'>
                <ChefHat className='w-4 h-4 text-amber-600' />
              </div>
              <div>
                <h4 className='font-medium text-gray-900'>Real-time Kitchen</h4>
                <p className='text-sm text-gray-600'>
                  Orders sync instantly across all stations with live status
                  updates
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors'>
              <div className='w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0'>
                <BarChart3 className='w-4 h-4 text-purple-600' />
              </div>
              <div>
                <h4 className='font-medium text-gray-900'>
                  Order Intelligence
                </h4>
                <p className='text-sm text-gray-600'>
                  AI-powered suggestions based on dining patterns and
                  preferences
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Quick Start Guide',
      subtitle: 'Get Up and Running in Minutes',
      content: (
        <div className='space-y-4'>
          <div className='space-y-3'>
            <div className='flex items-center gap-3'>
              <div className='w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center'>
                1
              </div>
              <span className='text-sm font-medium'>
                Navigate to Server View from the dashboard
              </span>
            </div>
            <div className='flex items-center gap-3'>
              <div className='w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center'>
                2
              </div>
              <span className='text-sm font-medium'>
                Click any table on the floor plan
              </span>
            </div>
            <div className='flex items-center gap-3'>
              <div className='w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center'>
                3
              </div>
              <span className='text-sm font-medium'>
                Select a seat and choose order type
              </span>
            </div>
            <div className='flex items-center gap-3'>
              <div className='w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center'>
                4
              </div>
              <span className='text-sm font-medium'>
                Try voice ordering - just click and speak!
              </span>
            </div>
          </div>

          <div className='bg-blue-50 rounded-lg p-4 border border-blue-200'>
            <div className='flex items-center gap-2 mb-2'>
              <Lightbulb className='w-4 h-4 text-blue-600' />
              <span className='font-semibold text-sm text-blue-800'>
                Pro Tip
              </span>
            </div>
            <p className='text-sm text-blue-700'>
              Start with the Server View to experience the complete order flow.
              The voice recognition works best in a quiet environment.
            </p>
          </div>
        </div>
      ),
    },
  ]

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const closeModal = () => {
    setIsOpen(false)
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className='fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300'>
        {/* Header */}
        <div className='bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-6 text-white relative'>
          <button
            onClick={closeModal}
            className='absolute top-4 right-4 text-white/80 hover:text-white transition-colors'
          >
            <X size={20} />
          </button>

          <div className='flex items-center gap-3 mb-3'>
            <div className='w-10 h-10 rounded-full bg-white/20 flex items-center justify-center'>
              <FlaskConical className='w-5 h-5' />
            </div>
            <div>
              <h1 className='text-2xl font-bold'>{steps[currentStep].title}</h1>
              <p className='text-blue-100 text-sm'>
                {steps[currentStep].subtitle}
              </p>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            <Badge
              variant='secondary'
              className='bg-white/20 text-white border-white/30'
            >
              Beta Access
            </Badge>
            <div className='text-xs text-blue-100'>
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='px-6 py-6'>{steps[currentStep].content}</div>

        {/* Footer */}
        <div className='px-6 pb-6'>
          <div className='flex items-center justify-between gap-3'>
            <div className='flex-1'>
              {currentStep > 0 && (
                <Button variant='outline' onClick={prevStep} className='w-full'>
                  Previous
                </Button>
              )}
            </div>

            <div className='flex-1'>
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={nextStep}
                  className='w-full bg-blue-600 hover:bg-blue-700'
                >
                  Next
                  <ArrowRight className='w-4 h-4 ml-2' />
                </Button>
              ) : (
                <Link href='/dashboard' onClick={closeModal}>
                  <Button className='w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'>
                    Start Testing!
                    <Utensils className='w-4 h-4 ml-2' />
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Beta feedback CTA */}
          <div className='mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200'>
            <div className='flex items-center gap-2 mb-1'>
              <MessageSquare className='w-4 h-4 text-gray-600' />
              <span className='text-sm font-medium text-gray-800'>
                Love it? Have feedback?
              </span>
            </div>
            <p className='text-xs text-gray-600'>
              Your insights are invaluable. Use the feedback button in the app
              or reach out directly!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
