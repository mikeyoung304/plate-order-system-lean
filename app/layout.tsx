import type React from 'react'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { createClient } from '@/lib/modassembly/supabase/server'
import { headers } from 'next/headers'
import { FooterAttribution } from '@/components/footer-attribution'
import { SecurityPerformanceInit } from '@/components/security-performance-init'
// Temporarily removed emergency error boundary
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Plate | Voice Ordering System',
  description:
    'Modern restaurant order management system with voice recognition',
  generator: 'v0.dev',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side auth check
  const supabase = await createClient()
  const {
    data: { session: _session },
  } = await supabase.auth.getSession()

  // Get current path using headers
  const headersList = await headers()
  const url = headersList.get('x-url') || 'http://localhost'
  const _pathname = new URL(url).pathname

  return (
    <html lang='en' suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider defaultTheme='dark'>
          <div className='min-h-screen flex flex-col'>
            <main className='flex-grow pb-10'>{children}</main>
            <FooterAttribution />
          </div>
          <Toaster />
          <SecurityPerformanceInit />
        </ThemeProvider>
      </body>
    </html>
  )
}

// Removed redundant import './globals.css' (it's imported in ClientLayout)
