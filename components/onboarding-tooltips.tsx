'use client'

import { useState, useEffect } from 'react'
import { HelpCircle, X, ArrowRight, Mic, Users, Coffee, Utensils } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface TooltipStep {
  id: string
  title: string
  description: string
  target: string
  icon: React.ReactNode
  position: 'top' | 'bottom' | 'left' | 'right'
  page: string
}

const tooltipSteps: TooltipStep[] = [
  {
    id: 'dashboard-server',
    title: 'Server View',
    description: 'Click here to start taking orders and managing tables',
    target: '[href="/server"]',
    icon: <Utensils className="w-4 h-4" />,
    position: 'bottom',
    page: '/dashboard'
  },
  {
    id: 'floor-plan-table',
    title: 'Select a Table',
    description: 'Click any table to start placing orders for that table',
    target: '.floor-plan-table',
    icon: <Users className="w-4 h-4" />,
    position: 'top',
    page: '/server'
  },
  {
    id: 'voice-order-button',
    title: 'Voice Ordering',
    description: 'Click and speak your order naturally - "chicken, pasta, salad"',
    target: '.voice-order-button',
    icon: <Mic className="w-4 h-4" />,
    position: 'top',
    page: '/server'
  }
]

export function OnboardingTooltips() {
  const [currentStep, setCurrentStep] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState('')
  const [hasSeenTooltips, setHasSeenTooltips] = useState(true)

  useEffect(() => {
    // Check if user has seen tooltips
    const seen = localStorage.getItem('onboarding-tooltips-seen')
    if (!seen) {
      setHasSeenTooltips(false)
      setCurrentPage(window.location.pathname)
    }
  }, [])

  useEffect(() => {
    // Update current page and show relevant tooltips
    const handleLocationChange = () => {
      const newPage = window.location.pathname
      setCurrentPage(newPage)
      
      if (!hasSeenTooltips) {
        const pageSteps = tooltipSteps.filter(step => step.page === newPage)
        if (pageSteps.length > 0) {
          setTimeout(() => {
            setCurrentStep(0)
          }, 1000) // Delay to let page load
        }
      }
    }

    handleLocationChange()
    window.addEventListener('popstate', handleLocationChange)
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange)
    }
  }, [hasSeenTooltips])

  const getCurrentTooltip = () => {
    if (currentStep === null) return null
    const pageSteps = tooltipSteps.filter(step => step.page === currentPage)
    return pageSteps[currentStep] || null
  }

  const nextStep = () => {
    const pageSteps = tooltipSteps.filter(step => step.page === currentPage)
    if (currentStep !== null && currentStep < pageSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      finishTour()
    }
  }

  const skipTour = () => {
    finishTour()
  }

  const finishTour = () => {
    setCurrentStep(null)
    setHasSeenTooltips(true)
    localStorage.setItem('onboarding-tooltips-seen', 'true')
  }

  const tooltip = getCurrentTooltip()
  if (!tooltip || hasSeenTooltips) return null

  return (
    <TooltipOverlay
      tooltip={tooltip}
      onNext={nextStep}
      onSkip={skipTour}
      stepNumber={currentStep! + 1}
      totalSteps={tooltipSteps.filter(step => step.page === currentPage).length}
    />
  )
}

interface TooltipOverlayProps {
  tooltip: TooltipStep
  onNext: () => void
  onSkip: () => void
  stepNumber: number
  totalSteps: number
}

function TooltipOverlay({ tooltip, onNext, onSkip, stepNumber, totalSteps }: TooltipOverlayProps) {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    const findTarget = () => {
      const element = document.querySelector(tooltip.target) as HTMLElement
      if (element) {
        setTargetElement(element)
        
        // Calculate tooltip position
        const rect = element.getBoundingClientRect()
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
        
        let top = 0
        let left = 0
        
        switch (tooltip.position) {
          case 'top':
            top = rect.top + scrollTop - 120
            left = rect.left + scrollLeft + rect.width / 2 - 150
            break
          case 'bottom':
            top = rect.bottom + scrollTop + 20
            left = rect.left + scrollLeft + rect.width / 2 - 150
            break
          case 'left':
            top = rect.top + scrollTop + rect.height / 2 - 60
            left = rect.left + scrollLeft - 320
            break
          case 'right':
            top = rect.top + scrollTop + rect.height / 2 - 60
            left = rect.right + scrollLeft + 20
            break
        }
        
        setTooltipPosition({ top, left })
        
        // Highlight the target element
        element.style.position = 'relative'
        element.style.zIndex = '1000'
        element.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.2)'
        element.style.borderRadius = '8px'
        element.style.transition = 'all 0.3s ease'
      }
    }

    // Try to find target immediately, then retry with delays
    findTarget()
    const timeout1 = setTimeout(findTarget, 500)
    const timeout2 = setTimeout(findTarget, 1000)
    
    return () => {
      if (targetElement) {
        targetElement.style.position = ''
        targetElement.style.zIndex = ''
        targetElement.style.boxShadow = ''
        targetElement.style.borderRadius = ''
        targetElement.style.transition = ''
      }
      clearTimeout(timeout1)
      clearTimeout(timeout2)
    }
  }, [tooltip, targetElement])

  if (!targetElement) return null

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999]" />
      
      {/* Tooltip */}
      <div
        className="fixed z-[1001] w-80"
        style={{
          top: tooltipPosition.top,
          left: Math.max(20, Math.min(window.innerWidth - 340, tooltipPosition.left))
        }}
      >
        <Card className="bg-white shadow-2xl border-2 border-blue-200">
          <CardContent className="p-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  {tooltip.icon}
                </div>
                <h3 className="font-semibold">{tooltip.title}</h3>
                <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-white/30">
                  {stepNumber} of {totalSteps}
                </Badge>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-4">
              <p className="text-gray-700 mb-4 leading-relaxed">{tooltip.description}</p>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onSkip}
                  className="flex-1"
                  size="sm"
                >
                  Skip Tour
                </Button>
                <Button
                  onClick={onNext}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  {stepNumber === totalSteps ? 'Finish' : 'Next'}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

// Helper component for manual tooltip trigger
export function HelpButton({ tooltipId }: { tooltipId?: string }) {
  const [showHelp, setShowHelp] = useState(false)

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setShowHelp(!showHelp)}
      className="w-8 h-8 text-gray-400 hover:text-gray-600"
      title="Get help"
    >
      <HelpCircle className="w-4 h-4" />
    </Button>
  )
}