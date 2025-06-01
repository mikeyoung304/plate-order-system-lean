'use client'

import { useState } from 'react'
import {
  Bug,
  Heart,
  Lightbulb,
  MessageSquare,
  Send,
  Star,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/modassembly/supabase/client'

type FeedbackType = 'bug' | 'feature' | 'love' | 'general'

interface FeedbackOption {
  type: FeedbackType
  icon: React.ReactNode
  label: string
  color: string
  bgColor: string
}

export function BetaFeedbackButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null)
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const feedbackOptions: FeedbackOption[] = [
    {
      type: 'bug',
      icon: <Bug className='w-4 h-4' />,
      label: 'Report Bug',
      color: 'text-red-600',
      bgColor: 'bg-red-50 hover:bg-red-100 border-red-200',
    },
    {
      type: 'feature',
      icon: <Lightbulb className='w-4 h-4' />,
      label: 'Suggest Feature',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200',
    },
    {
      type: 'love',
      icon: <Heart className='w-4 h-4' />,
      label: 'Love It!',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 hover:bg-pink-100 border-pink-200',
    },
    {
      type: 'general',
      icon: <MessageSquare className='w-4 h-4' />,
      label: 'General Feedback',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
    },
  ]

  const handleSubmit = async () => {
    if (!feedback.trim() || !selectedType) {
      return
    }

    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // For now, we'll store feedback in the browser and show a success message
      // In a real implementation, you'd send this to your backend
      const feedbackData = {
        type: selectedType,
        message: feedback,
        timestamp: new Date().toISOString(),
        userId: session?.user?.id || 'anonymous',
        userAgent: navigator.userAgent,
      }

      // Store locally for demonstration
      const existingFeedback = JSON.parse(
        localStorage.getItem('beta-feedback') || '[]'
      )
      existingFeedback.push(feedbackData)
      localStorage.setItem('beta-feedback', JSON.stringify(existingFeedback))

      toast({
        title: 'Thanks for your feedback! 🙏',
        description:
          "Your input helps us build a better product. We'll review it soon.",
        duration: 5000,
      })

      // Reset form
      setFeedback('')
      setSelectedType(null)
      setIsOpen(false)
    } catch (error) {
      toast({
        title: 'Oops! Something went wrong',
        description: 'Please try again or reach out directly.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSelectedOption = () => {
    return feedbackOptions.find(option => option.type === selectedType)
  }

  return (
    <>
      {/* Floating Feedback Button */}
      <div className='fixed bottom-6 right-6 z-40'>
        <Button
          onClick={() => setIsOpen(true)}
          className='rounded-full w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 group'
          size='icon'
        >
          <MessageSquare className='w-6 h-6 group-hover:scale-110 transition-transform' />
        </Button>

        {/* Beta badge */}
        <Badge
          variant='secondary'
          className='absolute -top-2 -left-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 font-bold animate-pulse'
        >
          BETA
        </Badge>
      </div>

      {/* Feedback Modal */}
      {isOpen && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
          <Card className='w-full max-w-md bg-white shadow-2xl'>
            <CardHeader className='pb-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <div className='w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center'>
                    <MessageSquare className='w-4 h-4 text-white' />
                  </div>
                  <CardTitle className='text-lg'>Beta Feedback</CardTitle>
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => setIsOpen(false)}
                  className='h-8 w-8'
                >
                  <X className='w-4 h-4' />
                </Button>
              </div>
              <p className='text-sm text-gray-600'>
                Help us improve Plate! Your feedback is incredibly valuable.
              </p>
            </CardHeader>

            <CardContent className='space-y-4'>
              {!selectedType ? (
                <>
                  <div className='text-sm font-medium text-gray-700 mb-3'>
                    What type of feedback do you have?
                  </div>
                  <div className='grid grid-cols-2 gap-3'>
                    {feedbackOptions.map(option => (
                      <Button
                        key={option.type}
                        variant='outline'
                        onClick={() => setSelectedType(option.type)}
                        className={`h-auto p-4 flex flex-col gap-2 ${option.bgColor} ${option.color} border-2 transition-all`}
                      >
                        {option.icon}
                        <span className='text-xs font-medium'>
                          {option.label}
                        </span>
                      </Button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className='flex items-center gap-2 mb-3'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setSelectedType(null)}
                      className='p-0 h-auto text-gray-500 hover:text-gray-700'
                    >
                      ← Back
                    </Button>
                    <div
                      className={`flex items-center gap-2 ${getSelectedOption()?.color}`}
                    >
                      {getSelectedOption()?.icon}
                      <span className='font-medium'>
                        {getSelectedOption()?.label}
                      </span>
                    </div>
                  </div>

                  <Textarea
                    placeholder='Tell us more about your experience, what you loved, what could be better, or any bugs you encountered...'
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    className='min-h-[120px] resize-none'
                    autoFocus
                  />

                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      onClick={() => setSelectedType(null)}
                      className='flex-1'
                    >
                      Change Type
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={!feedback.trim() || isSubmitting}
                      className='flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                    >
                      {isSubmitting ? (
                        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                      ) : (
                        <>
                          <Send className='w-4 h-4 mr-2' />
                          Send
                        </>
                      )}
                    </Button>
                  </div>

                  <div className='text-xs text-gray-500 text-center'>
                    Your feedback helps shape the future of Plate
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
