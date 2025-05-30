'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DebugRedirect() {
  const [status, setStatus] = useState('Checking authentication...')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  useEffect(() => {
    async function checkAuth() {
      try {
        // Check auth status
        const authResponse = await fetch('/api/auth-check')
        const authData = await authResponse.json()
        
        setStatus(`Auth check: ${JSON.stringify(authData, null, 2)}`)
        
        if (authData.hasUser) {
          setStatus(prev => prev + '\n\nUser authenticated! Redirecting to server page in 3 seconds...')
          
          // Try to load server page content
          setTimeout(() => {
            router.push('/server-bypass')
          }, 3000)
        } else {
          setStatus(prev => prev + '\n\nNo user found. Redirecting to login...')
          setTimeout(() => {
            router.push('/')
          }, 3000)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }
    
    checkAuth()
  }, [router])
  
  return (
    <div className="p-8 bg-black text-white min-h-screen">
      <h1 className="text-2xl mb-4">Debug Redirect Page</h1>
      
      <div className="mb-4">
        <h2 className="text-xl mb-2">Current Status:</h2>
        <pre className="bg-gray-900 p-4 rounded whitespace-pre-wrap">
          {status}
        </pre>
      </div>
      
      {error && (
        <div className="bg-red-900 p-4 rounded">
          <h2 className="text-xl mb-2">Error:</h2>
          <pre>{error}</pre>
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-xl mb-2">Manual Navigation:</h2>
        <div className="space-x-4">
          <button 
            onClick={() => router.push('/')}
            className="bg-blue-600 px-4 py-2 rounded"
          >
            Go to Login
          </button>
          <button 
            onClick={() => router.push('/server-bypass')}
            className="bg-green-600 px-4 py-2 rounded"
          >
            Go to Server Bypass
          </button>
          <button 
            onClick={() => window.location.href = '/api/vercel-auth'}
            className="bg-purple-600 px-4 py-2 rounded"
          >
            Check Auth Debug
          </button>
        </div>
      </div>
    </div>
  )
}