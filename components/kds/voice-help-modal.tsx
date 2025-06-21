'use client'

import { memo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  ArrowRight,
  CheckCircle,
  Clock,
  HelpCircle,
  Lightbulb,
  Mic,
  PlayCircle,
  RotateCcw,
  Settings,
  Volume2,
  Zap,
} from 'lucide-react'
import { useVoice } from '@/contexts/kds/voice-context'

interface VoiceHelpModalProps {
  trigger?: React.ReactNode
  className?: string
}

interface CommandExample {
  category: string
  description: string
  examples: string[]
  icon: React.ReactNode
  tips?: string[]
}

const COMMAND_EXAMPLES: CommandExample[] = [
  {
    category: 'Order Management',
    description: 'Control order status and workflow',
    icon: <CheckCircle className="h-5 w-5" />,
    examples: [
      'Bump order 123',
      'Complete table 5',
      'Mark order 456 ready',
      'Bump order ending in 789',
    ],
    tips: [
      'Use last 3-6 digits of order ID',
      'Say "bump", "complete", or "ready"',
      'Works with table numbers too',
    ],
  },
  {
    category: 'Order Control',
    description: 'Start prep and manage timing',
    icon: <PlayCircle className="h-5 w-5" />,
    examples: [
      'Start order 123',
      'Begin prep for table 5',
      'Start cooking order 456',
    ],
    tips: [
      'Use before starting food preparation',
      'Helps track prep timing',
      'Works with order numbers or table numbers',
    ],
  },
  {
    category: 'Priority Management',
    description: 'Adjust order priority and urgency',
    icon: <Zap className="h-5 w-5" />,
    examples: [
      'Rush order 123',
      'High priority table 5',
      'Set order 456 priority 8',
      'Make order 789 urgent',
    ],
    tips: [
      'Use "rush", "urgent", or "high priority"',
      'Set specific priority numbers 1-10',
      'Higher numbers = higher priority',
    ],
  },
  {
    category: 'Order Recall',
    description: 'Recall orders back to kitchen',
    icon: <RotateCcw className="h-5 w-5" />,
    examples: [
      'Recall order 123',
      'Return table 5',
      'Bring back order 456',
    ],
    tips: [
      'Use when orders need to come back',
      'Useful for corrections or modifications',
      'Tracks recall count automatically',
    ],
  },
  {
    category: 'Status & Information',
    description: 'Get information about orders and queue',
    icon: <Clock className="h-5 w-5" />,
    examples: [
      'Show queue status',
      'List overdue orders',
      'How many orders pending',
      'What\'s the longest wait',
    ],
    tips: [
      'Get quick status updates',
      'Check queue without touching screen',
      'Monitor performance metrics',
    ],
  },
  {
    category: 'Help & Navigation',
    description: 'Get help and navigate the system',
    icon: <HelpCircle className="h-5 w-5" />,
    examples: [
      'Show help',
      'What commands work',
      'Voice commands list',
      'How to use voice',
    ],
    tips: [
      'Opens this help dialog',
      'Shows available commands',
      'Provides usage tips',
    ],
  },
]

const BEST_PRACTICES = [
  {
    title: 'Speaking Clearly',
    description: 'Speak at normal volume and pace',
    icon: <Volume2 className="h-4 w-4" />,
    tips: [
      'Use your normal speaking voice',
      'Don\'t shout or whisper',
      'Speak at a steady pace',
      'Pause briefly between commands',
    ],
  },
  {
    title: 'Environment',
    description: 'Optimize your kitchen environment',
    icon: <Settings className="h-4 w-4" />,
    tips: [
      'Reduce background noise when possible',
      'Position yourself facing the screen',
      'Ensure good microphone access',
      'Use in relatively quiet moments',
    ],
  },
  {
    title: 'Command Structure',
    description: 'Structure commands for best recognition',
    icon: <Mic className="h-4 w-4" />,
    tips: [
      'Use simple, direct phrases',
      'Start with the action word',
      'Be specific with order numbers',
      'Avoid unnecessary words',
    ],
  },
  {
    title: 'Troubleshooting',
    description: 'What to do when commands don\'t work',
    icon: <Lightbulb className="h-4 w-4" />,
    tips: [
      'Check the listening indicator is active',
      'Repeat the command more clearly',
      'Use alternative phrasings',
      'Fall back to touch controls if needed',
    ],
  },
]

export const VoiceHelpModal = memo(function VoiceHelpModal({
  trigger,
  className,
}: VoiceHelpModalProps) {
  const [open, setOpen] = useState(false)
  const { state, getSuccessRate } = useVoice()

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="flex items-center gap-2">
      <HelpCircle className="h-4 w-4" />
      Voice Help
    </Button>
  )

  const successRate = getSuccessRate()
  const totalCommands = state.totalCommands

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild className={className}>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Voice Commands Guide
          </DialogTitle>
          <DialogDescription>
            Complete guide to hands-free kitchen operations
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="commands" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
            <TabsTrigger value="commands">Commands</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
            <TabsTrigger value="tips">Best Practices</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="commands" className="h-full">
              <ScrollArea className="h-full">
                <div className="grid gap-4 p-1">
                  {COMMAND_EXAMPLES.map((category, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          {category.icon}
                          {category.category}
                        </CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <h4 className="font-medium mb-2">Example Commands:</h4>
                          <div className="grid gap-2">
                            {category.examples.map((example, exampleIndex) => (
                              <div
                                key={exampleIndex}
                                className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded"
                              >
                                <ArrowRight className="h-3 w-3 text-gray-400" />
                                <code className="text-sm font-mono">"{example}"</code>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {category.tips && (
                          <div>
                            <h4 className="font-medium mb-2">Tips:</h4>
                            <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                              {category.tips.map((tip, tipIndex) => (
                                <li key={tipIndex} className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="examples" className="h-full">
              <ScrollArea className="h-full">
                <div className="space-y-6 p-1">
                  <Card>
                    <CardHeader>
                      <CardTitle>Common Scenarios</CardTitle>
                      <CardDescription>
                        Real kitchen situations and voice commands
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="p-3 border rounded-lg">
                          <h4 className="font-medium mb-2">Scenario: Food is ready to serve</h4>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Order 12345 is plated and ready for pickup
                          </div>
                          <div className="bg-green-50 dark:bg-green-950 p-2 rounded">
                            <code>"Bump order 345"</code> or <code>"Complete order 12345"</code>
                          </div>
                        </div>

                        <div className="p-3 border rounded-lg">
                          <h4 className="font-medium mb-2">Scenario: Starting food prep</h4>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Beginning to cook order 67890
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded">
                            <code>"Start order 890"</code> or <code>"Begin prep order 67890"</code>
                          </div>
                        </div>

                        <div className="p-3 border rounded-lg">
                          <h4 className="font-medium mb-2">Scenario: Rush order needed</h4>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Customer needs order 11111 prioritized
                          </div>
                          <div className="bg-orange-50 dark:bg-orange-950 p-2 rounded">
                            <code>"Rush order 11111"</code> or <code>"High priority order 1111"</code>
                          </div>
                        </div>

                        <div className="p-3 border rounded-lg">
                          <h4 className="font-medium mb-2">Scenario: Order needs to come back</h4>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Server needs to modify order 22222
                          </div>
                          <div className="bg-red-50 dark:bg-red-950 p-2 rounded">
                            <code>"Recall order 22222"</code> or <code>"Return order 2222"</code>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="tips" className="h-full">
              <ScrollArea className="h-full">
                <div className="grid gap-4 p-1">
                  {BEST_PRACTICES.map((practice, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2">
                          {practice.icon}
                          {practice.title}
                        </CardTitle>
                        <CardDescription>{practice.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {practice.tips.map((tip, tipIndex) => (
                            <li key={tipIndex} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="settings" className="h-full">
              <ScrollArea className="h-full">
                <div className="space-y-6 p-1">
                  <Card>
                    <CardHeader>
                      <CardTitle>Voice Recognition Status</CardTitle>
                      <CardDescription>
                        Current voice system status and performance
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Recognition Support</div>
                          <Badge variant={state.recognitionSupported ? "default" : "destructive"}>
                            {state.recognitionSupported ? "Supported" : "Not Supported"}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Audio Feedback</div>
                          <Badge variant={state.audioEnabled ? "default" : "secondary"}>
                            {state.audioEnabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Language</div>
                          <Badge variant="outline">{state.language}</Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Volume</div>
                          <Badge variant="outline">{Math.round(state.volume * 100)}%</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Metrics</CardTitle>
                      <CardDescription>
                        Your voice command usage statistics
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Total Commands</div>
                          <div className="text-2xl font-bold">{totalCommands}</div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Success Rate</div>
                          <div className="text-2xl font-bold">
                            {totalCommands > 0 ? `${Math.round(successRate)}%` : "—"}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Successful Commands</div>
                          <div className="text-2xl font-bold">{state.successfulCommands}</div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Avg. Processing Time</div>
                          <div className="text-2xl font-bold">
                            {state.averageProcessingTime > 0 
                              ? `${Math.round(state.averageProcessingTime)}ms`
                              : "—"
                            }
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {state.recognitionError && (
                    <Card className="border-red-200 dark:border-red-800">
                      <CardHeader>
                        <CardTitle className="text-red-700 dark:text-red-300">
                          Recognition Error
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-red-600 dark:text-red-400">
                          {state.recognitionError}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
})

VoiceHelpModal.displayName = 'VoiceHelpModal'