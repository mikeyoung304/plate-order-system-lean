'use client'

import { useCallback, useEffect, useState } from 'react'
import { transcribeAudioFile } from '@/lib/modassembly/openai/transcribe'

// Voice command types
export interface VoiceCommand {
  action:
    | 'bump'
    | 'recall'
    | 'start'
    | 'priority'
    | 'show'
    | 'filter'
    | 'unknown'
  target?: string // Order number, station name, etc.
  value?: string | number // Priority level, filter type, etc.
  confidence: number // 0-1 confidence score
  originalText: string
}

// Command patterns for matching
const COMMAND_PATTERNS = {
  bump: [
    /(?:mark|bump|complete|ready|done|finish)\s*(?:order\s*)?#?(\d+)/i,
    /(?:order\s*)?#?(\d+)\s*(?:is\s*)?(?:ready|done|complete|finished)/i,
    /(?:bump|ready)\s*(\d+)/i,
  ],
  recall: [
    /(?:recall|bring\s*back|undo|restore)\s*(?:order\s*)?#?(\d+)/i,
    /(?:order\s*)?#?(\d+)\s*(?:recall|back)/i,
  ],
  start: [
    /(?:start|begin)\s*(?:prep|cooking|preparing)?\s*(?:order\s*)?#?(\d+)/i,
    /(?:order\s*)?#?(\d+)\s*(?:start|begin)/i,
  ],
  priority: [
    /(?:set|make|change)\s*(?:order\s*)?#?(\d+)\s*(?:priority|urgent)\s*(?:to\s*)?(\d+|high|low|medium|urgent)/i,
    /(?:priority|urgent)\s*(?:order\s*)?#?(\d+)\s*(?:to\s*)?(\d+|high|low|medium|urgent)/i,
  ],
  show: [
    /(?:show|display|view)\s*(next|new|overdue|all|preparing)\s*(?:orders?)?/i,
    /(?:what|show)\s*(?:are\s*)?(?:the\s*)?(next|new|overdue|all|preparing)\s*orders?/i,
  ],
  filter: [
    /(?:filter|show\s*only)\s*(new|preparing|overdue|all)\s*(?:orders?)?/i,
    /(?:only\s*show|display)\s*(new|preparing|overdue|all)/i,
  ],
}

// Voice feedback messages
export const VOICE_FEEDBACK = {
  bump: (orderNumber: string) => `Order ${orderNumber} marked as ready`,
  recall: (orderNumber: string) => `Order ${orderNumber} recalled`,
  start: (orderNumber: string) => `Started preparing order ${orderNumber}`,
  priority: (orderNumber: string, level: string) =>
    `Order ${orderNumber} priority set to ${level}`,
  show: (filter: string) => `Showing ${filter} orders`,
  filter: (filter: string) => `Filtering to ${filter} orders`,
  error: (message: string) => `Error: ${message}`,
  notFound: (orderNumber: string) => `Order ${orderNumber} not found`,
  listening: 'Listening for voice command...',
  processing: 'Processing command...',
  ready: 'Voice commands ready. Say "Help" for available commands.',
}

/**
 * Parse voice command from transcribed text
 */
export function parseVoiceCommand(text: string): VoiceCommand {
  const normalizedText = text.toLowerCase().trim()

  // Try to match each command pattern
  for (const [action, patterns] of Object.entries(COMMAND_PATTERNS)) {
    for (const pattern of patterns) {
      const match = normalizedText.match(pattern)
      if (match) {
        let target: string | undefined
        let value: string | number | undefined
        let confidence = 0.8 // Base confidence for pattern matches

        switch (action) {
          case 'bump':
          case 'recall':
          case 'start':
            target = match[1] // Order number
            break

          case 'priority':
            target = match[1] // Order number
            value = match[2] // Priority level

            // Convert text to numeric priority
            if (typeof value === 'string') {
              switch (value.toLowerCase()) {
                case 'urgent':
                case 'high':
                  value = 8
                  break
                case 'medium':
                  value = 5
                  break
                case 'low':
                  value = 2
                  break
                default:
                  const numValue = parseInt(value)
                  if (!isNaN(numValue) && numValue >= 0 && numValue <= 10) {
                    value = numValue
                  } else {
                    value = 5 // Default to medium
                    confidence = 0.5
                  }
              }
            }
            break

          case 'show':
          case 'filter':
            target = match[1] // Filter type
            break
        }

        return {
          action: action as VoiceCommand['action'],
          target,
          value,
          confidence,
          originalText: text,
        }
      }
    }
  }

  // Check for help command
  if (/help|commands|what\s*can\s*i\s*say/i.test(normalizedText)) {
    return {
      action: 'show',
      target: 'help',
      confidence: 0.9,
      originalText: text,
    }
  }

  // No match found
  return {
    action: 'unknown',
    confidence: 0,
    originalText: text,
  }
}

/**
 * Voice command processor class
 */
export class VoiceCommandProcessor {
  private isListening = false
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private onCommand?: (command: VoiceCommand) => void
  private onFeedback?: (message: string) => void
  private onStateChange?: (state: 'idle' | 'listening' | 'processing') => void

  constructor(
    options: {
      onCommand?: (command: VoiceCommand) => void
      onFeedback?: (message: string) => void
      onStateChange?: (state: 'idle' | 'listening' | 'processing') => void
    } = {}
  ) {
    this.onCommand = options.onCommand
    this.onFeedback = options.onFeedback
    this.onStateChange = options.onStateChange
  }

  /**
   * Start listening for voice commands
   */
  async startListening(): Promise<void> {
    if (this.isListening) {
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })

      this.audioChunks = []

      this.mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, {
          type: 'audio/webm;codecs=opus',
        })
        await this.processAudioCommand(audioBlob)

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop())
      }

      this.mediaRecorder.start()
      this.isListening = true

      this.onStateChange?.('listening')
      this.onFeedback?.(VOICE_FEEDBACK.listening)

      // Stop listening after 5 seconds or when silence is detected
      setTimeout(() => {
        if (this.isListening) {
          this.stopListening()
        }
      }, 5000)
    } catch (error) {
      console.error('Error starting voice recognition:', error)
      this.onFeedback?.(VOICE_FEEDBACK.error('Failed to access microphone'))
      this.onStateChange?.('idle')
    }
  }

  /**
   * Stop listening for voice commands
   */
  stopListening(): void {
    if (!this.isListening || !this.mediaRecorder) {
      return
    }

    this.isListening = false
    this.mediaRecorder.stop()
  }

  /**
   * Process audio command
   */
  private async processAudioCommand(audioBlob: Blob): Promise<void> {
    this.onStateChange?.('processing')
    this.onFeedback?.(VOICE_FEEDBACK.processing)

    try {
      // Convert blob to file
      const audioFile = new File([audioBlob], 'voice-command.webm', {
        type: 'audio/webm;codecs=opus',
      })

      // Transcribe audio using existing OpenAI connection
      const result = await transcribeAudioFile(audioBlob, 'voice-command.webm')
      const transcript = result.transcription

      if (!transcript || transcript.trim().length === 0) {
        this.onFeedback?.(VOICE_FEEDBACK.error('No speech detected'))
        this.onStateChange?.('idle')
        return
      }

      // Parse command
      const command = parseVoiceCommand(transcript)

      if (command.action === 'unknown') {
        this.onFeedback?.(
          VOICE_FEEDBACK.error(`Unknown command: "${transcript}"`)
        )
      } else {
        this.onCommand?.(command)
      }
    } catch (error) {
      console.error('Error processing voice command:', error)
      this.onFeedback?.(VOICE_FEEDBACK.error('Failed to process voice command'))
    }

    this.onStateChange?.('idle')
  }

  /**
   * Get available voice commands help text
   */
  getHelpText(): string {
    return `
Available voice commands:

• "Mark order 123 ready" - Bump an order
• "Recall order 123" - Recall a bumped order  
• "Start order 123" - Begin preparing an order
• "Set order 123 priority high" - Change order priority
• "Show new orders" - Filter to new orders
• "Show overdue orders" - Filter to overdue orders
• "Show all orders" - Show all orders

Order numbers can be said with or without "order" and "#".
Priority levels: urgent (8), high (8), medium (5), low (2), or numbers 1-10.
    `.trim()
  }
}

/**
 * React hook for voice commands
 */
export function useVoiceCommands(options: {
  onCommand?: (command: VoiceCommand) => void
  onFeedback?: (message: string) => void
  enabled?: boolean
}) {
  const { onCommand, onFeedback, enabled = true } = options

  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processor, setProcessor] = useState<VoiceCommandProcessor | null>(null)

  useEffect(() => {
    if (!enabled) {
      return
    }

    const voiceProcessor = new VoiceCommandProcessor({
      onCommand,
      onFeedback,
      onStateChange: state => {
        setIsListening(state === 'listening')
        setIsProcessing(state === 'processing')
      },
    })

    setProcessor(voiceProcessor)

    return () => {
      // Cleanup - stopListening handles its own state checks
      voiceProcessor.stopListening()
    }
  }, [enabled, onCommand, onFeedback])

  const startListening = useCallback(() => {
    processor?.startListening()
  }, [processor])

  const stopListening = useCallback(() => {
    processor?.stopListening()
  }, [processor])

  const getHelpText = useCallback(() => {
    return processor?.getHelpText() || ''
  }, [processor])

  return {
    isListening,
    isProcessing,
    isAvailable: !!processor && enabled,
    startListening,
    stopListening,
    getHelpText,
  }
}
