import { NextRequest, NextResponse } from 'next/server'
import { optimizedTranscribeAudioFile } from '@/lib/modassembly/openai/optimized-transcribe'
import { getUsageTracker } from '@/lib/modassembly/openai/usage-tracking'
import { Security } from '@/lib/security'
import { createClient } from '@/lib/modassembly/supabase/server'
import { measureApiCall } from '@/lib/performance-utils'
import { ApiResponse, TranscriptionResult } from '@/types/api'

type TranscribeResponse = ApiResponse<TranscriptionResult>

export async function POST(request: NextRequest) {
  return measureApiCall('transcribe_api', async () => {
    // 1. Fort Knox Request Validation
    const validation = Security.validate.validateRequest(request)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.errors },
        {
          status: 400,
          headers: Security.headers.getHeaders(),
        }
      )
    }

    // 2. Authentication & Session Security
    const supabase = await createClient()
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        {
          status: 401,
          headers: Security.headers.getHeaders(),
        }
      )
    }

    // 3. Enhanced Rate Limiting with Cost-Based Budgets
    const usageTracker = getUsageTracker()
    
    // Check if user is within daily budget
    const dailyStats = await usageTracker.getUsageStats('day', session.user.id)
    const dailyBudget = 5.0 // $5 daily budget per user
    
    if (dailyStats.totalCost >= dailyBudget) {
      return NextResponse.json(
        {
          error: `Daily budget exceeded ($${dailyBudget}). Current usage: $${dailyStats.totalCost.toFixed(3)}`,
        },
        {
          status: 429,
          headers: {
            ...Security.headers.getHeaders(),
            'Retry-After': '86400', // 24 hours
          },
        }
      )
    }

    // Standard rate limiting
    const isAllowed = Security.rateLimit.isAllowed(
      session.user.id,
      'transcribe',
      10, // Increased to 10 per minute (caching should reduce actual OpenAI calls)
      10 / 60 // Rate per second
    )

    if (!isAllowed) {
      return NextResponse.json(
        {
          error:
            'Rate limit exceeded. Voice transcription is limited to 10 requests per minute.',
        },
        {
          status: 429,
          headers: {
            ...Security.headers.getHeaders(),
            'Retry-After': '60',
          },
        }
      )
    }

    // 4. Advanced File Security Validation
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json(
        { error: 'Invalid form data' },
        {
          status: 400,
          headers: Security.headers.getHeaders(),
        }
      )
    }

    const audioFile = formData.get('audio') as File
    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json(
        { error: 'No valid audio file provided' },
        {
          status: 400,
          headers: Security.headers.getHeaders(),
        }
      )
    }

    // 5. Optimized File Validation with Auto-Optimization
    const maxFileSize = 25 * 1024 * 1024 // OpenAI limit (optimization will reduce size)
    const minFileSize = 100 // Minimum 100 bytes
    const targetFileSize = 1 * 1024 * 1024 // 1MB target for optimization

    if (audioFile.size > maxFileSize) {
      return NextResponse.json(
        { error: 'Audio file too large. Maximum size is 25MB.' },
        {
          status: 413,
          headers: Security.headers.getHeaders(),
        }
      )
    }

    if (audioFile.size < minFileSize) {
      return NextResponse.json(
        { error: 'Audio file too small or corrupted.' },
        {
          status: 400,
          headers: Security.headers.getHeaders(),
        }
      )
    }

    // Log large files for optimization tracking
    if (audioFile.size > targetFileSize) {
      // console.log('Large audio file detected, will optimize:', {
      //   userId: session.user.id,
      //   originalSize: audioFile.size,
      //   fileName: Security.sanitize.sanitizeIdentifier(audioFile.name || 'unknown'),
      // })
    }

    // Strict MIME type validation
    const allowedTypes = [
      'audio/wav',
      'audio/mpeg',
      'audio/mp4',
      'audio/webm',
      'audio/ogg',
    ]
    if (!allowedTypes.includes(audioFile.type)) {
      return NextResponse.json(
        { error: `Invalid audio format. Allowed: ${allowedTypes.join(', ')}` },
        {
          status: 400,
          headers: Security.headers.getHeaders(),
        }
      )
    }

    // Sanitize filename for logging (security)
    const safeFileName = Security.sanitize.sanitizeIdentifier(
      audioFile.name || 'unknown'
    )

    // 6. Optimized Audio Processing with Full Pipeline
    let transcriptionResult
    try {
      const audioBlob = new Blob([await audioFile.arrayBuffer()], {
        type: audioFile.type,
      })
      
      // Use optimized transcription service with caching, optimization, and tracking
      const result = await optimizedTranscribeAudioFile(
        audioBlob,
        session.user.id,
        safeFileName,
        {
          enableOptimization: true,
          enableCaching: true,
          enableFallback: true,
          maxRetries: 3,
          confidenceThreshold: 0.7,
          preferredModel: 'gpt-3.5-turbo', // Cost-effective for menu parsing
        }
      )
      
      transcriptionResult = result
      
    } catch (transcriptionError: any) {
      console.error('Optimized transcription failed:', {
        error: transcriptionError.message,
        code: transcriptionError.code,
        retryable: transcriptionError.retryable,
        userId: session.user.id,
        fileSize: audioFile.size,
        fileType: audioFile.type,
      })

      // Provide more specific error messages based on error type
      let errorMessage = 'Audio transcription failed. Please try again with a clearer recording.'
      let statusCode = 422

      if (transcriptionError.code === 'RATE_LIMITED') {
        errorMessage = 'Service temporarily unavailable due to high demand. Please try again in a moment.'
        statusCode = 503
      } else if (transcriptionError.code === 'AUDIO_TOO_LARGE') {
        errorMessage = 'Audio file is too large. Please record a shorter message.'
        statusCode = 413
      } else if (transcriptionError.code === 'INVALID_FORMAT') {
        errorMessage = 'Audio format not supported. Please use a different recording format.'
        statusCode = 400
      } else if (transcriptionError.code === 'TIMEOUT') {
        errorMessage = 'Transcription timed out. Please try recording a shorter message.'
        statusCode = 408
      }

      const errorResponse: TranscribeResponse = {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }

      return NextResponse.json(errorResponse, {
        status: statusCode,
        headers: Security.headers.getHeaders(),
      })
    }

    const { items: transcriptionItems, transcription } = transcriptionResult

    // 7. Fort Knox Output Sanitization
    const safeTranscription = Security.sanitize.sanitizeHTML(
      transcription || ''
    )
    const safeItems = transcriptionItems
      .map(item => Security.sanitize.sanitizeOrderItem(item))
      .filter(item => item.length > 0)
      .slice(0, 20) // Limit to 20 items for security

    // 8. Enhanced Logging with Optimization Metrics
    // console.log('Optimized transcription completed:', {
    //   userId: session.user.id,
    //   itemCount: safeItems.length,
    //   transcriptionLength: safeTranscription.length,
    //   originalFileSize: audioFile.size,
    //   // optimizationMetrics: transcriptionResult.metadata || {},
    // })

    const response: TranscribeResponse = {
      success: true,
      data: {
        transcript: safeTranscription,
        items: safeItems,
        // Include optimization metadata for debugging (remove in production)
        // metadata: process.env.NODE_ENV === 'development' ? {
        //   cached: transcriptionResult.metadata?.cached,
        //   optimized: transcriptionResult.metadata?.optimized,
        //   compressionRatio: transcriptionResult.metadata?.compressionRatio,
        //   cost: transcriptionResult.metadata?.cost,
        //   latency: transcriptionResult.metadata?.latency,
        // } : undefined,
      },
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(response, {
      headers: Security.headers.getHeaders(),
    })
  })
}

// Security: No other HTTP methods allowed
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    {
      status: 405,
      headers: {
        ...Security.headers.getHeaders(),
        Allow: 'POST',
      },
    }
  )
}
