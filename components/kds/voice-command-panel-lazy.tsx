/**
 * Lazy-loaded Voice Command Panel wrapper
 * Optimizes bundle size by only loading voice features when needed
 */
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff } from 'lucide-react'

interface VoiceCommandPanelLazyProps {
  onBumpOrder?: (orderNumber: string) => Promise<void>
  onRecallOrder?: (orderNumber: string) => Promise<void>
  onStartOrder?: (orderNumber: string) => Promise<void>
  onSetPriority?: (orderNumber: string, priority: number) => Promise<void>
  onFilter?: (filter: string) => void
  orders?: Array<{ id: string; order?: { id: string } }>
  className?: string
}

export function VoiceCommandPanelLazy(props: VoiceCommandPanelLazyProps) {
  const [VoicePanel, setVoicePanel] = useState<React.ComponentType<any> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  const [supportsVoice, setSupportsVoice] = useState(false)

  // Check if voice is supported
  useEffect(() => {
    const hasVoiceSupport = typeof window !== 'undefined' && 
      !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    setSupportsVoice(hasVoiceSupport)
  }, [])

  // Load voice panel component when enabled
  const loadVoicePanel = async () => {
    if (VoicePanel || isLoading) {return}

    setIsLoading(true)
    try {
      const module = await import('@/components/kds/voice-command-panel')
      setVoicePanel(() => module.VoiceCommandPanel)
    } catch (_error) {
      console.error('Failed to load voice command panel:', _error)
    } finally {
      setIsLoading(false)
    }
  }

  // Enable voice commands
  const enableVoice = async () => {
    setIsEnabled(true)
    await loadVoicePanel()
  }

  // If voice not supported, show nothing
  if (!supportsVoice) {
    return null
  }

  // If not enabled, show enable button
  if (!isEnabled) {
    return (
      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <MicOff className="h-4 w-4 text-blue-600" />
        <span className="text-sm text-blue-800 flex-1">
          Enable voice commands for hands-free operation
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={enableVoice}
          disabled={isLoading}
          className="border-blue-300 text-blue-700 hover:bg-blue-100"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-1" />
              Loading...
            </>
          ) : (
            <>
              <Mic className="h-4 w-4 mr-1" />
              Enable
            </>
          )}
        </Button>
      </div>
    )
  }

  // Show loading state while component loads
  if (isLoading || !VoicePanel) {
    return (
      <div className="flex items-center justify-center p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-600">Initializing voice commands...</span>
        </div>
      </div>
    )
  }

  // Render the loaded voice panel
  return <VoicePanel {...props} />
}

// Add typing for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}