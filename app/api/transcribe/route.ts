import { NextRequest, NextResponse } from 'next/server'
import { transcribeAudioFile } from '@/lib/modassembly/openai/transcribe'
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

    // 3. Rate Limiting (stricter for expensive OpenAI calls)
    const isAllowed = Security.rateLimit.isAllowed(
      session.user.id,
      'transcribe',
      5, // Only 5 transcriptions per minute
      5 / 60 // Rate per second
    )

    if (!isAllowed) {
      return NextResponse.json(
        {
          error:
            'Rate limit exceeded. Voice transcription is limited to 5 requests per minute.',
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
    } catch (error) {
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

    // 5. Comprehensive File Validation (Fort Knox level)
    const maxFileSize = 5 * 1024 * 1024 // Reduced to 5MB for security
    const minFileSize = 1024 // Minimum 1KB to prevent empty uploads

    if (audioFile.size > maxFileSize) {
      return NextResponse.json(
        { error: 'Audio file too large. Maximum size is 5MB.' },
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

    // 6. Secure Audio Processing with Error Boundaries
    let transcriptionResult
    try {
      const audioBlob = new Blob([await audioFile.arrayBuffer()], {
        type: audioFile.type,
      })
      transcriptionResult = await transcribeAudioFile(audioBlob, safeFileName)
    } catch (transcriptionError: any) {
      console.error('Transcription failed:', {
        error: transcriptionError.message,
        userId: session.user.id,
        fileSize: audioFile.size,
        fileType: audioFile.type,
      })

      const errorResponse: TranscribeResponse = {
        success: false,
        error: 'Audio transcription failed. Please try again with a clearer recording.',
        timestamp: new Date().toISOString(),
      }

      return NextResponse.json(errorResponse, {
        status: 422,
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

    // 8. Security Logging
    console.log('Secure transcription completed:', {
      userId: session.user.id,
      itemCount: safeItems.length,
      transcriptionLength: safeTranscription.length,
      fileSize: audioFile.size,
    })

    const response: TranscribeResponse = {
      success: true,
      data: {
        transcript: safeTranscription,
        items: safeItems,
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
