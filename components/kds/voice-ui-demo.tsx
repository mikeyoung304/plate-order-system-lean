'use client'

import { VoiceCommandIndicator } from './voice-command-indicator'
import { VoiceHelpModal } from './voice-help-modal'
import { VoiceHistory } from './voice-history'
import { VoiceFeedback } from './voice-feedback'
import { VoiceProvider } from '@/contexts/kds/voice-context'

// Demo component to showcase all voice UI components
export function VoiceUIDemo() {
  return (
    <VoiceProvider>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold">Voice UI Components Demo</h1>
        
        <div className="grid gap-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Voice Command Indicator</h2>
            <div className="flex gap-4">
              <VoiceCommandIndicator variant="minimal" />
              <VoiceCommandIndicator variant="badge" />
              <VoiceCommandIndicator variant="detailed" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Voice Help Modal</h2>
            <VoiceHelpModal />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Voice History</h2>
            <VoiceHistory />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Voice Feedback</h2>
            <VoiceFeedback showVisualOnly position="center" />
          </div>
        </div>
      </div>
    </VoiceProvider>
  )
}