'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/modassembly/supabase/auth'
import { createClient } from '@/lib/modassembly/supabase/client'

interface AuthDebugInfo {
  timestamp: string
  contextState: {
    isLoading: boolean
    hasUser: boolean
    hasProfile: boolean
    userEmail?: string
    userRole?: string
  }
  sessionState: {
    hasSession: boolean
    expiresAt?: string
    error?: string
  }
}

export function AuthStatusPanel() {
  const { user, profile, isLoading, session } = useAuth()
  const [debugInfo, setDebugInfo] = useState<AuthDebugInfo | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show if debug query param present
    const params = new URLSearchParams(window.location.search)
    setIsVisible(params.has('debug-auth'))
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const updateDebugInfo = async () => {
      try {
        const supabase = createClient()
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()

        setDebugInfo({
          timestamp: new Date().toISOString(),
          contextState: {
            isLoading,
            hasUser: !!user,
            hasProfile: !!profile,
            userEmail: user?.email,
            userRole: profile?.role
          },
          sessionState: {
            hasSession: !!currentSession,
            expiresAt: currentSession?.expires_at ? new Date(currentSession.expires_at * 1000).toISOString() : undefined,
            error: error?.message
          }
        })
      } catch (err) {
        console.error('Auth debug info failed:', err)
      }
    }

    updateDebugInfo()
    const interval = setInterval(updateDebugInfo, 2000)
    return () => clearInterval(interval)
  }, [isVisible, user, profile, isLoading, session])

  if (!isVisible || !debugInfo) return null

  const getStatusColor = () => {
    if (debugInfo.contextState.isLoading) return 'bg-yellow-500'
    if (debugInfo.contextState.hasUser && debugInfo.contextState.hasProfile) return 'bg-green-500'
    if (debugInfo.sessionState.hasSession) return 'bg-blue-500'
    return 'bg-red-500'
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-black/90 text-white text-xs p-3 rounded-lg border border-gray-700 max-w-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <span className="font-mono font-bold">AUTH DEBUG</span>
          <button 
            onClick={() => setIsVisible(false)}
            className="ml-auto text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-1">
          <div>
            <span className="text-gray-400">Context:</span>
            {debugInfo.contextState.isLoading ? (
              <span className="text-yellow-400 ml-1">Loading</span>
            ) : (
              <span className={debugInfo.contextState.hasUser ? 'text-green-400 ml-1' : 'text-red-400 ml-1'}>
                {debugInfo.contextState.hasUser ? 'User OK' : 'No User'}
              </span>
            )}
          </div>
          
          <div>
            <span className="text-gray-400">Session:</span>
            <span className={debugInfo.sessionState.hasSession ? 'text-green-400 ml-1' : 'text-red-400 ml-1'}>
              {debugInfo.sessionState.hasSession ? 'Active' : 'None'}
            </span>
          </div>
          
          {debugInfo.contextState.userRole && (
            <div>
              <span className="text-gray-400">Role:</span>
              <span className="text-teal-400 ml-1">{debugInfo.contextState.userRole}</span>
            </div>
          )}
          
          {debugInfo.sessionState.expiresAt && (
            <div>
              <span className="text-gray-400">Expires:</span>
              <span className="text-gray-300 ml-1">
                {new Date(debugInfo.sessionState.expiresAt).toLocaleTimeString()}
              </span>
            </div>
          )}
          
          {debugInfo.sessionState.error && (
            <div className="text-red-400 text-xs break-words">
              Error: {debugInfo.sessionState.error}
            </div>
          )}
        </div>
        
        <div className="text-gray-500 text-xs mt-2">
          {debugInfo.timestamp.split('T')[1].split('.')[0]}
        </div>
      </div>
    </div>
  )
}