import { NextRequest, NextResponse } from 'next/server'
import { batchTranscribeAudio } from '@/lib/modassembly/openai/batch-processor'
import { Security } from '@/lib/security'
import { createClient } from '@/lib/modassembly/supabase/server'
import { measureApiCall } from '@/lib/performance-utils'
import { ApiResponse } from '@/types/api'

interface BatchTranscribeResult {
  id: string
  success: boolean
  transcript?: string
  items?: string[]
  error?: string
  metadata?: {
    cached?: boolean
    optimized?: boolean
    cost?: number
    latency?: number
  }
}

type BatchTranscribeResponse = ApiResponse<{
  results: BatchTranscribeResult[]
  summary: {
    totalJobs: number
    successfulJobs: number
    failedJobs: number
    totalCost: number
    cacheHitRate: number
    averageLatency: number
  }
}>

export async function POST(request: NextRequest) {
  return measureApiCall('batch_transcribe_api', async () => {
    // 1. Request Validation
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

    // 2. Authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        {
          status: 401,
          headers: Security.headers.getHeaders(),
        }
      )
    }

    // 3. Enhanced Rate Limiting for Batch Operations
    const isAllowed = Security.rateLimit.isAllowed(
      user.id,
      'batch_transcribe',
      2, // Only 2 batch requests per minute
      2 / 60
    )

    if (!isAllowed) {
      return NextResponse.json(
        {
          error:
            'Rate limit exceeded. Batch transcription is limited to 2 requests per minute.',
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

    // 4. Parse and Validate Batch Request
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

    // Extract audio files from form data
    const audioFiles: Array<{
      blob: Blob
      id: string
      userId: string
      filename?: string
    }> = []
    const maxBatchSize = 10 // Limit batch size
    let fileCount = 0

    for (const [key, value] of formData.entries()) {
      if (key.startsWith('audio_') && value instanceof File) {
        if (fileCount >= maxBatchSize) {
          return NextResponse.json(
            { error: `Batch size limited to ${maxBatchSize} files` },
            {
              status: 400,
              headers: Security.headers.getHeaders(),
            }
          )
        }

        // Validate individual audio file
        const validationResult = validateAudioFile(value)
        if (!validationResult.valid) {
          return NextResponse.json(
            { error: `File ${key}: ${validationResult.error}` },
            {
              status: 400,
              headers: Security.headers.getHeaders(),
            }
          )
        }

        const audioBlob = new Blob([await value.arrayBuffer()], {
          type: value.type,
        })

        audioFiles.push({
          blob: audioBlob,
          id: key.replace('audio_', ''),
          userId: user.id,
          filename: Security.sanitize.sanitizeIdentifier(
            value.name || `audio_${fileCount}`
          ),
        })

        fileCount++
      }
    }

    if (audioFiles.length === 0) {
      return NextResponse.json(
        { error: 'No valid audio files provided' },
        {
          status: 400,
          headers: Security.headers.getHeaders(),
        }
      )
    }

    // 5. Process Batch with Optimizations
    let batchResults
    try {
      batchResults = await batchTranscribeAudio(audioFiles, {
        concurrency: 3,
        enableOptimization: true,
        enableCaching: true,
        retryFailedJobs: true,
        maxRetries: 2,
        timeoutMs: 45000, // 45 seconds per job
      })
    } catch (batchError: any) {
      console.error('Batch transcription failed:', {
        error: batchError.message,
        userId: user.id,
        batchSize: audioFiles.length,
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Batch transcription failed. Please try again.',
          timestamp: new Date().toISOString(),
        },
        {
          status: 500,
          headers: Security.headers.getHeaders(),
        }
      )
    }

    // 6. Process and Sanitize Results
    const sanitizedResults: BatchTranscribeResult[] = []
    let totalCost = 0
    let totalLatency = 0
    let cacheHits = 0
    let successfulJobs = 0

    for (const result of batchResults) {
      if (result.result) {
        const safeTranscription = Security.sanitize.sanitizeHTML(
          result.result.transcription || ''
        )
        const safeItems = result.result.items
          .map(item => Security.sanitize.sanitizeOrderItem(item))
          .filter(item => item.length > 0)
          .slice(0, 20)

        sanitizedResults.push({
          id: result.id,
          success: true,
          transcript: safeTranscription,
          items: safeItems,
          metadata:
            process.env.NODE_ENV === 'development'
              ? {
                  cached: result.result.metadata?.cached,
                  optimized: result.result.metadata?.optimized,
                  cost: result.result.metadata?.cost,
                  latency: result.result.metadata?.latency,
                }
              : undefined,
        })

        if (result.result.metadata?.cached) {
          cacheHits++
        }
        if (result.result.metadata?.cost) {
          totalCost += result.result.metadata.cost
        }
        if (result.result.metadata?.latency) {
          totalLatency += result.result.metadata.latency
        }
        successfulJobs++
      } else {
        sanitizedResults.push({
          id: result.id,
          success: false,
          error: result.error?.message || 'Transcription failed',
        })
      }
    }

    const summary = {
      totalJobs: audioFiles.length,
      successfulJobs,
      failedJobs: audioFiles.length - successfulJobs,
      totalCost,
      cacheHitRate: audioFiles.length > 0 ? cacheHits / audioFiles.length : 0,
      averageLatency: successfulJobs > 0 ? totalLatency / successfulJobs : 0,
    }

    // 7. Enhanced Logging
    // console.log('Batch transcription completed:', {
    //   userId: user.id,
    //   batchSize: audioFiles.length,
    //   summary,
    // })

    const response: BatchTranscribeResponse = {
      success: true,
      data: {
        results: sanitizedResults,
        summary,
      },
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(response, {
      headers: Security.headers.getHeaders(),
    })
  })
}

// Helper function to validate individual audio files
function validateAudioFile(file: File): { valid: boolean; error?: string } {
  const maxFileSize = 25 * 1024 * 1024 // 25MB
  const minFileSize = 100 // 100 bytes

  if (file.size > maxFileSize) {
    return { valid: false, error: 'File too large (max 25MB)' }
  }

  if (file.size < minFileSize) {
    return { valid: false, error: 'File too small or corrupted' }
  }

  const allowedTypes = [
    'audio/wav',
    'audio/mpeg',
    'audio/mp4',
    'audio/webm',
    'audio/ogg',
  ]

  if (!allowedTypes.some(type => file.type.includes(type))) {
    return {
      valid: false,
      error: `Invalid format. Allowed: ${allowedTypes.join(', ')}`,
    }
  }

  return { valid: true }
}

// Only POST method allowed
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
