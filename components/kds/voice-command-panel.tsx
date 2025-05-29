"use client"

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Mic, 
  MicOff, 
  Volume2, 
  HelpCircle, 
  CheckCircle, 
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVoiceCommands, type VoiceCommand, VOICE_FEEDBACK } from '@/lib/kds/voice-commands'
import { toast } from '@/hooks/use-toast'

interface VoiceCommandPanelProps {
  onBumpOrder?: (orderNumber: string) => Promise<void>
  onRecallOrder?: (orderNumber: string) => Promise<void>
  onStartOrder?: (orderNumber: string) => Promise<void>
  onSetPriority?: (orderNumber: string, priority: number) => Promise<void>
  onFilter?: (filter: string) => void
  orders?: Array<{ id: string; order?: { id: string } }>
  className?: string
}

export function VoiceCommandPanel({
  onBumpOrder,
  onRecallOrder,
  onStartOrder,
  onSetPriority,
  onFilter,
  orders = [],
  className
}: VoiceCommandPanelProps) {
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null)
  const [showHelp, setShowHelp] = useState(false)

  // Handle voice commands
  const handleCommand = useCallback(async (command: VoiceCommand) => {
    setLastCommand(command)
    
    try {
      switch (command.action) {
        case 'bump':
          if (command.target && onBumpOrder) {
            // Find order by partial ID match
            const orderNumber = command.target
            const order = orders.find(o => 
              o.order?.id?.endsWith(orderNumber) || 
              o.order?.id?.slice(-6) === orderNumber
            )
            
            if (order) {
              await onBumpOrder(order.id)
              setFeedbackMessage(VOICE_FEEDBACK.bump(orderNumber))
              toast({
                title: "Order Bumped",
                description: VOICE_FEEDBACK.bump(orderNumber),
                duration: 2000
              })
            } else {
              setFeedbackMessage(VOICE_FEEDBACK.notFound(orderNumber))
              toast({
                title: "Order Not Found",
                description: VOICE_FEEDBACK.notFound(orderNumber),
                variant: "destructive",
                duration: 3000
              })
            }
          }
          break
          
        case 'recall':
          if (command.target && onRecallOrder) {
            const orderNumber = command.target
            const order = orders.find(o => 
              o.order?.id?.endsWith(orderNumber) || 
              o.order?.id?.slice(-6) === orderNumber
            )
            
            if (order) {
              await onRecallOrder(order.id)
              setFeedbackMessage(VOICE_FEEDBACK.recall(orderNumber))
              toast({
                title: "Order Recalled",
                description: VOICE_FEEDBACK.recall(orderNumber),
                duration: 2000
              })
            } else {
              setFeedbackMessage(VOICE_FEEDBACK.notFound(orderNumber))
              toast({
                title: "Order Not Found",
                description: VOICE_FEEDBACK.notFound(orderNumber),
                variant: "destructive",
                duration: 3000
              })
            }
          }
          break
          
        case 'start':
          if (command.target && onStartOrder) {
            const orderNumber = command.target
            const order = orders.find(o => 
              o.order?.id?.endsWith(orderNumber) || 
              o.order?.id?.slice(-6) === orderNumber
            )
            
            if (order) {
              await onStartOrder(order.id)
              setFeedbackMessage(VOICE_FEEDBACK.start(orderNumber))
              toast({
                title: "Order Started",
                description: VOICE_FEEDBACK.start(orderNumber),
                duration: 2000
              })
            } else {
              setFeedbackMessage(VOICE_FEEDBACK.notFound(orderNumber))
              toast({
                title: "Order Not Found",
                description: VOICE_FEEDBACK.notFound(orderNumber),
                variant: "destructive",
                duration: 3000
              })
            }
          }
          break
          
        case 'priority':
          if (command.target && command.value && onSetPriority) {
            const orderNumber = command.target
            const priority = typeof command.value === 'number' ? command.value : 5
            const order = orders.find(o => 
              o.order?.id?.endsWith(orderNumber) || 
              o.order?.id?.slice(-6) === orderNumber
            )
            
            if (order) {
              await onSetPriority(order.id, priority)
              setFeedbackMessage(VOICE_FEEDBACK.priority(orderNumber, priority.toString()))
              toast({
                title: "Priority Updated",
                description: VOICE_FEEDBACK.priority(orderNumber, priority.toString()),
                duration: 2000
              })
            } else {
              setFeedbackMessage(VOICE_FEEDBACK.notFound(orderNumber))
              toast({
                title: "Order Not Found",
                description: VOICE_FEEDBACK.notFound(orderNumber),
                variant: "destructive",
                duration: 3000
              })
            }
          }
          break
          
        case 'show':
        case 'filter':
          if (command.target && onFilter) {
            if (command.target === 'help') {
              setShowHelp(true)
              setFeedbackMessage('Showing voice command help')
            } else {
              onFilter(command.target)
              setFeedbackMessage(VOICE_FEEDBACK.filter(command.target))
              toast({
                title: "Filter Applied",
                description: VOICE_FEEDBACK.filter(command.target),
                duration: 2000
              })
            }
          }
          break
          
        default:
          setFeedbackMessage(`Unknown command: "${command.originalText}"`)
          toast({
            title: "Unknown Command",
            description: `Try saying "Help" to see available commands`,
            variant: "destructive",
            duration: 3000
          })
      }
    } catch (error) {
      console.error('Error executing voice command:', error)
      setFeedbackMessage('Error executing command')
      toast({
        title: "Command Failed",
        description: "There was an error executing your voice command",
        variant: "destructive",
        duration: 3000
      })
    }
  }, [onBumpOrder, onRecallOrder, onStartOrder, onSetPriority, onFilter, orders])

  // Handle feedback messages
  const handleFeedback = useCallback((message: string) => {
    setFeedbackMessage(message)
  }, [])

  // Voice commands hook
  const {
    isListening,
    isProcessing,
    isAvailable,
    startListening,
    stopListening,
    getHelpText
  } = useVoiceCommands({
    onCommand: handleCommand,
    onFeedback: handleFeedback,
    enabled: true
  })

  // Get status icon and color
  const getStatusDisplay = () => {
    if (isProcessing) {
      return {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        color: 'bg-yellow-500',
        text: 'Processing...'
      }
    }
    if (isListening) {
      return {
        icon: <Mic className="h-4 w-4" />,
        color: 'bg-red-500 animate-pulse',
        text: 'Listening...'
      }
    }
    if (isAvailable) {
      return {
        icon: <Mic className="h-4 w-4" />,
        color: 'bg-green-500',
        text: 'Ready'
      }
    }
    return {
      icon: <MicOff className="h-4 w-4" />,
      color: 'bg-gray-500',
      text: 'Unavailable'
    }
  }

  const status = getStatusDisplay()

  if (!isAvailable) {
    return null // Don't render if voice commands aren't available
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Voice command button */}
      <Button
        variant={isListening ? "destructive" : "outline"}
        size="sm"
        onClick={isListening ? stopListening : startListening}
        disabled={isProcessing}
        className="flex items-center gap-2"
      >
        {status.icon}
        {isListening ? 'Stop' : 'Voice'}
      </Button>

      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <div className={cn('w-2 h-2 rounded-full', status.color)} />
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {status.text}
        </span>
      </div>

      {/* Feedback message */}
      {feedbackMessage && (
        <Badge 
          variant="secondary" 
          className="text-xs max-w-48 truncate"
          title={feedbackMessage}
        >
          {feedbackMessage}
        </Badge>
      )}

      {/* Help dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="px-2">
            <HelpCircle className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Voice Commands Help
            </DialogTitle>
            <DialogDescription>
              Available voice commands for hands-free kitchen operation
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <pre className="text-sm whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-800 p-3 rounded">
                  {getHelpText()}
                </pre>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Tips for Best Results
              </h4>
              <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                <li>• Speak clearly and at normal volume</li>
                <li>• Wait for the "Listening..." indicator before speaking</li>
                <li>• Use short, simple commands</li>
                <li>• Order numbers can be the last 3-6 digits</li>
                <li>• Commands work best in quiet environments</li>
              </ul>
            </div>

            {lastCommand && (
              <div className="space-y-2">
                <h4 className="font-medium">Last Command</h4>
                <div className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded">
                  <div><strong>Said:</strong> "{lastCommand.originalText}"</div>
                  <div><strong>Parsed as:</strong> {lastCommand.action}</div>
                  {lastCommand.target && <div><strong>Target:</strong> {lastCommand.target}</div>}
                  {lastCommand.value && <div><strong>Value:</strong> {lastCommand.value}</div>}
                  <div><strong>Confidence:</strong> {Math.round(lastCommand.confidence * 100)}%</div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}