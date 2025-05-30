import { NextResponse } from 'next/server'

export async function GET() {
  // Check which environment variables are present (not their values for security)
  const envStatus = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: !!process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
  }

  // Add partial values for debugging (first 10 chars only)
  const partialValues = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'sk-' + '*'.repeat(20) : 'NOT SET',
  }

  return NextResponse.json({
    message: 'Environment variable check',
    timestamp: new Date().toISOString(),
    status: envStatus,
    partial: partialValues,
    allEnvVarsSet: Object.entries(envStatus)
      .filter(([key]) => !key.startsWith('VERCEL') && key !== 'NODE_ENV')
      .every(([_, value]) => value === true)
  })
}