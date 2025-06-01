'use client'

import { useState, useEffect } from 'react'
import { X, ArrowRight, Play, CheckCircle, Lightbulb, Star, Mic, Users, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface QuickStartStep {
  id: string
  title: string
  description: string
  action: string
  href: string
  icon: React.ReactNode
  isCompleted: boolean
  estimatedTime: string
}

export function QuickStartGuide() {
  const [isOpen, setIsOpen] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const pathname = usePathname()

  // Load completed steps from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('quick-start-completed')
    if (saved) {
      setCompletedSteps(JSON.parse(saved))
    }
  }, [])

  // Show guide if user hasn't completed all steps and hasn't dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('quick-start-dismissed')
    const hasCompletedAll = completedSteps.length >= 4
    
    if (!dismissed && !hasCompletedAll && pathname === '/dashboard') {
      const timer = setTimeout(() => setIsOpen(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [completedSteps, pathname])

  const markStepCompleted = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      const newCompleted = [...completedSteps, stepId]
      setCompletedSteps(newCompleted)
      localStorage.setItem('quick-start-completed', JSON.stringify(newCompleted))
    }
  }

  const dismissGuide = () => {
    setIsOpen(false)
    localStorage.setItem('quick-start-dismissed', 'true')
  }

  const reopenGuide = () => {
    setIsOpen(true)
    localStorage.removeItem('quick-start-dismissed')
  }

  const steps: QuickStartStep[] = [
    {
      id: 'visit-server',
      title: 'Visit Server View',
      description: 'Explore the main order-taking interface',
      action: 'Go to Server View',
      href: '/server',
      icon: <Users className="w-4 h-4" />,
      isCompleted: completedSteps.includes('visit-server'),
      estimatedTime: '1 min'
    },
    {
      id: 'select-table',
      title: 'Select a Table',
      description: 'Click on any table in the floor plan',
      action: 'Try Floor Plan',
      href: '/server',
      icon: <Users className="w-4 h-4" />,
      isCompleted: completedSteps.includes('select-table'),
      estimatedTime: '30 sec'
    },
    {
      id: 'voice-order',
      title: 'Try Voice Ordering',
      description: 'Experience the voice recognition system',
      action: 'Start Voice Order',
      href: '/server',
      icon: <Mic className="w-4 h-4" />,
      isCompleted: completedSteps.includes('voice-order'),
      estimatedTime: '2 min'
    },
    {
      id: 'kitchen-view',
      title: 'Check Kitchen View',
      description: 'See how orders appear in the kitchen',
      action: 'Visit Kitchen',
      href: '/kitchen',
      icon: <Clock className="w-4 h-4" />,
      isCompleted: completedSteps.includes('kitchen-view'),
      estimatedTime: '1 min'
    }
  ]

  // Auto-mark steps as completed based on user actions
  useEffect(() => {
    if (pathname === '/server' && !completedSteps.includes('visit-server')) {
      markStepCompleted('visit-server')
    }
    if (pathname === '/kitchen' && !completedSteps.includes('kitchen-view')) {
      markStepCompleted('kitchen-view')
    }
  }, [pathname, completedSteps])

  const progress = (completedSteps.length / steps.length) * 100
  const isCompleted = completedSteps.length >= steps.length

  // Quick start trigger button (always visible)
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 left-6 z-40">
        <Button
          onClick={reopenGuide}
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-sm border-gray-300 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Play className="w-4 h-4 mr-2" />
          Quick Start
          {!isCompleted && (
            <Badge variant="secondary" className="ml-2 bg-blue-600 text-white">
              {completedSteps.length}/{steps.length}
            </Badge>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-white shadow-2xl max-h-[90vh] overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Play className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-xl">Quick Start Guide</CardTitle>
                <p className="text-blue-100 text-sm">Get up and running in 5 minutes</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={dismissGuide}
              className="text-white/80 hover:text-white hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Progress</span>
              <span className="text-sm">{completedSteps.length}/{steps.length} completed</span>
            </div>
            <Progress value={progress} className="h-2 bg-white/20" />
          </div>
        </CardHeader>
        
        <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
          {isCompleted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Congratulations! 🎉</h3>
              <p className="text-gray-600 mb-6">
                You've completed the quick start guide. You're now ready to use Plate like a pro!
              </p>
              
              <div className="bg-yellow-50 rounded-lg p-4 mb-6 border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">What's Next?</span>
                </div>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Explore admin settings to customize your setup</li>
                  <li>• Try the expo view for order coordination</li>
                  <li>• Share feedback using the feedback button</li>
                </ul>
              </div>
              
              <Button onClick={dismissGuide} className="bg-green-600 hover:bg-green-700">
                Start Using Plate!
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-2">Let's Get You Started</h3>
                <p className="text-gray-600">
                  Follow these steps to experience the core features of Plate
                </p>
              </div>
              
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    step.isCompleted
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {step.isCompleted ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-bold">{index + 1}</span>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {step.icon}
                        <h4 className="font-medium">{step.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {step.estimatedTime}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                    
                    {!step.isCompleted && (
                      <Link href={step.href} onClick={() => setIsOpen(false)}>
                        <Button size="sm" variant="outline">
                          {step.action}
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="bg-blue-50 rounded-lg p-4 mt-6 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Pro Tips</span>
                </div>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Voice ordering works best in quiet environments</li>
                  <li>• You can see all orders in real-time across stations</li>
                  <li>• Use the feedback button to report any issues</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}