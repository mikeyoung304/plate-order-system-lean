import { useState, useEffect } from 'react'

interface DemoState {
  isActive: boolean
  isDemoMode: boolean
  currentJourney: string | null
  currentStep: number
  hasSeenDemo: boolean
}

export function useDemoRevolution() {
  const [demoState, setDemoState] = useState<DemoState>({
    isActive: false,
    isDemoMode: false,
    currentJourney: null,
    currentStep: 0,
    hasSeenDemo: false
  })

  useEffect(() => {
    // Check if user has seen demo before
    const hasSeenDemo = localStorage.getItem('demo-revolution-seen') === 'true'
    const isDemoMode = localStorage.getItem('demo-mode') === 'true'
    
    setDemoState(prev => ({
      ...prev,
      hasSeenDemo,
      isDemoMode
    }))
  }, [])

  const startDemo = (journeyId?: string) => {
    setDemoState(prev => ({
      ...prev,
      isActive: true,
      currentJourney: journeyId || null,
      currentStep: 0
    }))
  }

  const completeDemo = () => {
    localStorage.setItem('demo-revolution-seen', 'true')
    setDemoState(prev => ({
      ...prev,
      isActive: false,
      hasSeenDemo: true,
      currentJourney: null,
      currentStep: 0
    }))
  }

  const enableDemoMode = () => {
    localStorage.setItem('demo-mode', 'true')
    setDemoState(prev => ({ ...prev, isDemoMode: true }))
  }

  const disableDemoMode = () => {
    localStorage.setItem('demo-mode', 'false')
    setDemoState(prev => ({ ...prev, isDemoMode: false }))
  }

  const shouldShowDemo = () => {
    // Show demo for new users or in demo mode
    return !demoState.hasSeenDemo || demoState.isDemoMode
  }

  const trackDemoEvent = (event: string, data?: any) => {
    // Track demo analytics
    console.log('Demo Event:', event, data)
    // In production, send to analytics service
  }

  return {
    ...demoState,
    startDemo,
    completeDemo,
    enableDemoMode,
    disableDemoMode,
    shouldShowDemo,
    trackDemoEvent
  }
}