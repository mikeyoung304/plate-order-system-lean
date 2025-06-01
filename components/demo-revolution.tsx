'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, Mic, Clock, TrendingUp, X, Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/modassembly/supabase/client'
import { useRouter } from 'next/navigation'

interface DemoStep {
  id: string
  title: string
  description: string
  duration: number
  path?: string
  action?: () => void
  wow?: boolean
}

interface DemoJourney {
  id: string
  title: string
  subtitle: string
  audience: string
  duration: number
  steps: DemoStep[]
  primaryColor: string
}

const DEMO_JOURNEYS: DemoJourney[] = [
  {
    id: 'restaurant-owner',
    title: 'Restaurant Revolution',
    subtitle: 'See 40% efficiency gains in action',
    audience: 'Restaurant Owners',
    duration: 300, // 5 minutes
    primaryColor: 'bg-emerald-600',
    steps: [
      {
        id: 'voice-magic',
        title: 'Voice Ordering Magic',
        description: 'Watch orders flow instantly from voice to kitchen',
        duration: 60,
        path: '/server',
        wow: true
      },
      {
        id: 'efficiency-gains',
        title: 'Instant Efficiency',
        description: 'Real-time coordination eliminates delays',
        duration: 90,
        path: '/kitchen',
        wow: true
      },
      {
        id: 'resident-intelligence',
        title: 'AI-Powered Care',
        description: 'Dietary preferences remembered automatically',
        duration: 75,
        wow: true
      },
      {
        id: 'roi-analytics',
        title: 'ROI Dashboard',
        description: 'Live calculation of time and cost savings',
        duration: 75,
        path: '/admin',
        wow: true
      }
    ]
  },
  {
    id: 'facility-director',
    title: 'Care-First Experience',
    subtitle: 'Enhancing resident dining satisfaction',
    audience: 'Facility Directors',
    duration: 480, // 8 minutes
    primaryColor: 'bg-blue-600',
    steps: [
      {
        id: 'resident-recognition',
        title: 'Resident Recognition',
        description: 'Margaret gets her low-sodium preference automatically',
        duration: 120,
        wow: true
      },
      {
        id: 'dietary-intelligence',
        title: 'Smart Dietary Management',
        description: 'Allergies and preferences tracked seamlessly',
        duration: 120,
        wow: true
      },
      {
        id: 'voice-accessibility',
        title: 'Voice Accessibility',
        description: 'Natural conversation for all ability levels',
        duration: 120,
        path: '/server'
      },
      {
        id: 'care-reporting',
        title: 'Care Insights',
        description: 'Nutrition tracking and satisfaction metrics',
        duration: 120,
        path: '/admin'
      }
    ]
  },
  {
    id: 'staff-workflow',
    title: 'Workflow Revolution',
    subtitle: 'Making staff life easier every day',
    audience: 'Staff Members',
    duration: 240, // 4 minutes
    primaryColor: 'bg-purple-600',
    steps: [
      {
        id: 'simple-voice',
        title: 'Just Speak Naturally',
        description: '"Chicken, mashed potatoes, green beans" - Done!',
        duration: 60,
        path: '/server',
        wow: true
      },
      {
        id: 'smart-suggestions',
        title: 'Smart Suggestions',
        description: 'System knows what residents usually order',
        duration: 60,
        wow: true
      },
      {
        id: 'real-time-kitchen',
        title: 'Kitchen Coordination',
        description: 'Orders sync instantly, no lost tickets',
        duration: 60,
        path: '/kitchen'
      },
      {
        id: 'mobile-friendly',
        title: 'Works Everywhere',
        description: 'Tablets, phones, any device you prefer',
        duration: 60
      }
    ]
  },
  {
    id: 'tech-deep',
    title: 'Technical Excellence',
    subtitle: 'Advanced features and integration capabilities',
    audience: 'Tech Decision Makers',
    duration: 600, // 10 minutes
    primaryColor: 'bg-amber-600',
    steps: [
      {
        id: 'voice-tech',
        title: 'Voice AI Technology',
        description: 'OpenAI-powered transcription with 99% accuracy',
        duration: 120,
        wow: true
      },
      {
        id: 'real-time-sync',
        title: 'Real-Time Architecture',
        description: 'Supabase WebSocket connections for instant updates',
        duration: 120,
        wow: true
      },
      {
        id: 'floor-plan-editor',
        title: 'Dynamic Floor Plans',
        description: 'Drag-and-drop table management',
        duration: 120,
        path: '/admin'
      },
      {
        id: 'role-security',
        title: 'Role-Based Security',
        description: 'Granular permissions and access control',
        duration: 120
      },
      {
        id: 'integration-apis',
        title: 'Integration Ready',
        description: 'REST APIs for POS, EMR, and facility systems',
        duration: 120
      }
    ]
  }
]

interface DemoRevolutionProps {
  autoStart?: boolean
  onComplete?: () => void
}

export function DemoRevolution({ autoStart = false, onComplete }: DemoRevolutionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedJourney, setSelectedJourney] = useState<DemoJourney | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (autoStart) {
      // Auto-detect audience based on user behavior or preferences
      const defaultJourney = DEMO_JOURNEYS[0] // Default to restaurant owner
      setSelectedJourney(defaultJourney)
      setIsOpen(true)
    }
  }, [autoStart])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying && selectedJourney) {
      interval = setInterval(() => {
        setTimeElapsed(prev => {
          const newTime = prev + 1
          const currentStepDuration = selectedJourney.steps[currentStep]?.duration || 60
          const stepProgress = (newTime % currentStepDuration) / currentStepDuration * 100
          setProgress(stepProgress)
          
          // Auto-advance to next step
          if (newTime > 0 && newTime % currentStepDuration === 0) {
            if (currentStep < selectedJourney.steps.length - 1) {
              setCurrentStep(prev => prev + 1)
              executeStepAction(selectedJourney.steps[currentStep + 1])
            } else {
              setIsPlaying(false)
              onComplete?.()
            }
          }
          
          return newTime
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, currentStep, selectedJourney, onComplete])

  const executeStepAction = (step: DemoStep) => {
    if (step.path) {
      router.push(step.path)
    }
    if (step.action) {
      step.action()
    }
  }

  const startDemo = (journey: DemoJourney) => {
    setSelectedJourney(journey)
    setCurrentStep(0)
    setProgress(0)
    setTimeElapsed(0)
    setIsPlaying(true)
    executeStepAction(journey.steps[0])
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const nextStep = () => {
    if (!selectedJourney) return
    if (currentStep < selectedJourney.steps.length - 1) {
      setCurrentStep(prev => prev + 1)
      setProgress(0)
      setTimeElapsed(0)
      executeStepAction(selectedJourney.steps[currentStep + 1])
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
      setProgress(0)
      setTimeElapsed(0)
      executeStepAction(selectedJourney.steps[currentStep - 1])
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const closeDemo = () => {
    setIsOpen(false)
    setIsPlaying(false)
    setSelectedJourney(null)
    setCurrentStep(0)
    setProgress(0)
    setTimeElapsed(0)
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white shadow-lg"
      >
        <Play className="w-4 h-4 mr-2" />
        Start Demo
      </Button>
    )
  }

  if (!selectedJourney) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-blue-600 px-6 py-6 text-white relative">
            <button
              onClick={closeDemo}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            <h1 className="text-3xl font-bold mb-2">Restaurant Revolution Demo</h1>
            <p className="text-emerald-100">
              Choose your demo experience - tailored for your role and interests
            </p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {DEMO_JOURNEYS.map((journey) => (
                <div
                  key={journey.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => startDemo(journey)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-3 h-3 rounded-full ${journey.primaryColor}`} />
                    <Badge variant="secondary">{journey.audience}</Badge>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {journey.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{journey.subtitle}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {Math.ceil(journey.duration / 60)} min demo
                    </div>
                    <div className="flex items-center gap-1">
                      {journey.steps.filter(s => s.wow).map((_, i) => (
                        <div key={i} className="w-2 h-2 bg-yellow-400 rounded-full" />
                      ))}
                    </div>
                  </div>
                  
                  <Button className="w-full mt-4">
                    Start {journey.title}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentStepData = selectedJourney.steps[currentStep]
  const totalProgress = ((currentStep * 100) + progress) / selectedJourney.steps.length

  return (
    <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 max-w-sm w-full">
      <div className={`${selectedJourney.primaryColor} px-4 py-3 text-white relative`}>
        <button
          onClick={closeDemo}
          className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
        
        <div className="flex items-center gap-2 mb-2">
          {currentStepData?.wow && (
            <Badge className="bg-yellow-400 text-yellow-900 text-xs">WOW!</Badge>
          )}
          <span className="text-sm font-medium">
            Step {currentStep + 1} of {selectedJourney.steps.length}
          </span>
        </div>
        
        <h3 className="font-bold text-lg leading-tight">{currentStepData?.title}</h3>
      </div>
      
      <div className="p-4">
        <p className="text-gray-600 text-sm mb-4">{currentStepData?.description}</p>
        
        <div className="space-y-3">
          <Progress value={totalProgress} className="h-2" />
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{formatTime(timeElapsed)}</span>
            <span>{formatTime(selectedJourney.duration)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            
            <Button
              size="sm"
              onClick={togglePlayPause}
              className="flex-1"
            >
              {isPlaying ? (
                <><Pause className="w-4 h-4 mr-1" /> Pause</>
              ) : (
                <><Play className="w-4 h-4 mr-1" /> Play</>
              )}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={nextStep}
              disabled={currentStep === selectedJourney.steps.length - 1}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}