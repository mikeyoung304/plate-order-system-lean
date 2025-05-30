// Production wrapper for Vercel - enhances existing server.ts without changing it
import { createClient as createOriginalClient } from './server'

export async function createClient() {
  const client = await createOriginalClient()
  
  // Add production logging without modifying original
  if (process.env.NODE_ENV === 'production') {
    // Log auth operations without modifying the client
    const originalGetSession = client.auth.getSession.bind(client.auth)
    const originalGetUser = client.auth.getUser.bind(client.auth)
    
    // Override specific methods while keeping the rest intact
    client.auth.getSession = async () => {
      const result = await originalGetSession()
      if (result.error) {
        console.error('[Vercel] getSession error:', result.error.message)
      }
      return result
    }
    
    client.auth.getUser = async () => {
      const result = await originalGetUser()
      if (result.error) {
        console.error('[Vercel] getUser error:', result.error.message)
      }
      return result
    }
  }
  
  return client
}