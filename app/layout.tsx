import type React from "react"
import { Inter } from "next/font/google"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/lib/modassembly/supabase/auth"
import { WelcomeModal } from "@/components/welcome-modal"
import { FooterAttribution } from "@/components/footer-attribution"
import { AuthStatusPanel } from "@/components/debug/auth-status-panel"
import { SecurityPerformanceInit } from "@/components/security-performance-init"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Plate | Voice Ordering System",
  description: "Modern restaurant order management system with voice recognition",
  generator: 'v0.dev'
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="dark">
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              <main className="flex-grow pb-10">
                {children}
              </main>
              <FooterAttribution />
            </div>
            <WelcomeModal />
            <Toaster />
            <AuthStatusPanel />
            <SecurityPerformanceInit />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

// Removed redundant import './globals.css' (it's imported in ClientLayout)