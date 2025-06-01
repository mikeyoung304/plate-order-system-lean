import { z } from 'zod'

const envSchema = z.object({
  // Public environment variables
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'Supabase anon key is required'),

  // Server-side only environment variables
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'Supabase service role key is required')
    .optional(),
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required').optional(),

  // Development/Production flags
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),

  // Database credentials (for direct PostgreSQL access)
  SUPABASE_DB_PASSWORD: z.string().optional(),
})

type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
  try {
    return envSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      SUPABASE_DB_PASSWORD: process.env.SUPABASE_DB_PASSWORD,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join('\n')
      throw new Error(`Environment validation failed:\n${errorMessage}`)
    }
    throw error
  }
}

// Validate environment variables at module load time
export const env = validateEnv()

// Helper functions for runtime environment checks
export const isProduction = env.NODE_ENV === 'production'
export const isDevelopment = env.NODE_ENV === 'development'
export const isTest = env.NODE_ENV === 'test'

// Client-side safe environment access
export const publicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NODE_ENV: env.NODE_ENV,
} as const

// Type guard for server-side environment variables
export function assertServerEnv(envToCheck = env): asserts envToCheck is Env & {
  SUPABASE_SERVICE_ROLE_KEY: string
  OPENAI_API_KEY: string
} {
  if (typeof window !== 'undefined') {
    throw new Error('Server environment variables accessed on client side')
  }

  if (!envToCheck.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required on server side')
  }

  if (!envToCheck.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for voice features')
  }
}
