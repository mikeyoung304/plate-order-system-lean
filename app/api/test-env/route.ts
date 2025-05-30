// OVERNIGHT_SESSION: 2025-05-30 - Secure environment testing endpoint
// Reason: Environment configuration exposure is a critical security risk
// Impact: Safe environment debugging without exposing sensitive configuration

import { NextRequest, NextResponse } from 'next/server'
import { Security } from '@/lib/security'
import { measureApiCall } from '@/lib/performance/monitoring'

export async function GET(request: NextRequest) {
  return measureApiCall('test_env_api', async () => {
    // 1. CRITICAL: Disable in production entirely
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Environment testing disabled in production for security' },
        { 
          status: 403,
          headers: Security.headers.getHeaders()
        }
      );
    }

    // 2. Rate Limiting (prevent environment discovery attacks)
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const isAllowed = Security.rateLimit.isAllowed(
      clientIP,
      'env_test',
      5, // Only 5 requests per minute
      5 / 60 // Rate per second
    );
    
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            ...Security.headers.getHeaders(),
            'Retry-After': '60'
          }
        }
      );
    }

    // 3. Minimal Environment Status (development only)
    const envStatus = {
      supabaseConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      openaiConfigured: !!process.env.OPENAI_API_KEY,
      environment: process.env.NODE_ENV,
      platform: process.env.VERCEL ? 'vercel' : 'local'
    }

    const configurationHealth = {
      status: 'development_check',
      timestamp: new Date().toISOString(),
      services: envStatus,
      allConfigured: envStatus.supabaseConfigured && envStatus.openaiConfigured,
      recommendations: [
        !envStatus.supabaseConfigured && 'Configure Supabase environment variables',
        !envStatus.openaiConfigured && 'Configure OpenAI API key',
        'Never expose this endpoint in production'
      ].filter(Boolean)
    }

    return NextResponse.json(configurationHealth, {
      headers: Security.headers.getHeaders()
    });
  });
}

// Security: No other HTTP methods allowed
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { 
      status: 405,
      headers: {
        ...Security.headers.getHeaders(),
        'Allow': 'GET'
      }
    }
  );
}