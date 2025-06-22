import type React from 'react'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { FooterAttribution } from '@/components/footer-attribution'
import { SessionProvider } from '@/lib/auth/session-manager'
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
  // Temporarily disable server-side auth check to fix startup hang
  // const supabase = await createClient()
  let _session = null
  // try {
  //   const {
  //     data: { session },
  //   } = await supabase.auth.getSession()
  //   _session = session
  // } catch (error) {
  //   // Handle refresh token errors gracefully
  //   if (error instanceof Error && error.message.includes('Refresh Token Not Found')) {
  //     console.warn('Clearing invalid refresh token in layout')
  //     await supabase.auth.signOut()
  //   }
  //   // Continue with no session
  // }

  // Get current path using headers
  // const headersList = await headers()
  // const url = headersList.get('x-url') || 'http://localhost'
  // const _pathname = new URL(url).pathname

  return (
    <html lang='en' suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider defaultTheme='dark'>
            <div className='min-h-screen flex flex-col'>
              <main className='flex-grow pb-10'>{children}</main>
              <FooterAttribution />
            </div>
            <Toaster />
            {/* <SecurityPerformanceInit /> */}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}

// Removed redundant import './globals.css' (it's imported in ClientLayout)
