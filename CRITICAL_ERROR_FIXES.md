# Critical Error Handling Fixes

## 🚨 IMMEDIATE ACTION REQUIRED

Based on the error handling audit, these fixes should be implemented immediately to prevent application crashes and improve user experience.

## Fix 1: Add Root Error Boundary (CRITICAL)

### Issue
The main app layout lacks a root error boundary, making the entire application vulnerable to unhandled errors.

### Fix
Update the root layout to include error boundary:

```tsx
// app/layout.tsx
import { RootErrorBoundary } from '@/components/error-boundaries'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const headersList = await headers()
  const url = headersList.get('x-url') || 'http://localhost'

  return (
    <html lang='en' suppressHydrationWarning>
      <body className={inter.className}>
        <RootErrorBoundary>
          <ThemeProvider defaultTheme='dark'>
            <AuthProvider>
              <div className='min-h-screen flex flex-col'>
                <main className='flex-grow pb-10'>{children}</main>
                <FooterAttribution />
              </div>
              <Toaster />
              <SecurityPerformanceInit />
            </AuthProvider>
          </ThemeProvider>
        </RootErrorBoundary>
      </body>
    </html>
  )
}
```

## Fix 2: Add Context Error Isolation (HIGH)

### Issue
Domain contexts can crash and propagate errors throughout the application.

### Fix
Wrap context providers with error boundaries:

```tsx
// lib/state/domains/connection-context.tsx
import { ErrorBoundary } from 'react-error-boundary'

function ConnectionErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
      <h3 className="text-red-800 font-medium">Connection Error</h3>
      <p className="text-red-600 text-sm mt-1">
        Unable to establish real-time connection. Some features may be limited.
      </p>
      <button 
        onClick={resetErrorBoundary}
        className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm"
      >
        Retry Connection
      </button>
    </div>
  )
}

export function ConnectionProvider({ children, onConnectionChange }: ConnectionProviderProps) {
  // ... existing provider logic
  
  return (
    <ErrorBoundary
      FallbackComponent={ConnectionErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Connection Context Error:', error, errorInfo)
        // Report to monitoring service
      }}
    >
      <ConnectionContext.Provider value={contextValue}>
        {children}
      </ConnectionContext.Provider>
    </ErrorBoundary>
  )
}
```

## Fix 3: Add Auth Layout Error Boundary (HIGH)

### Issue
The auth layout lacks error boundary protection.

### Fix
```tsx
// app/(auth)/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/modassembly/supabase/server'
import { RestaurantStateProvider } from '@/lib/state/restaurant-state-context'
import { AuthErrorBoundary } from '@/components/error-boundaries'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      redirect('/')
    }
  }

  return (
    <AuthErrorBoundary>
      <RestaurantStateProvider>
        {children}
      </RestaurantStateProvider>
    </AuthErrorBoundary>
  )
}
```

## Fix 4: Add Context Error Notifications (HIGH)

### Issue
Context errors fail silently without user notification.

### Fix
Create error notification hook:

```tsx
// lib/hooks/use-error-notifications.ts
'use client'

import { useToast } from '@/hooks/use-toast'
import { useCallback } from 'react'

export interface ErrorNotificationOptions {
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  duration?: number
  variant?: 'default' | 'destructive'
}

export function useErrorNotifications() {
  const { toast } = useToast()

  const notifyError = useCallback((error: Error, options: ErrorNotificationOptions) => {
    toast({
      title: options.title,
      description: options.description,
      variant: options.variant || 'destructive',
      duration: options.duration || 5000,
      action: options.action ? (
        <button onClick={options.action.onClick}>
          {options.action.label}
        </button>
      ) : undefined,
    })
  }, [toast])

  const notifyConnectionError = useCallback((retry: () => void) => {
    notifyError(new Error('Connection failed'), {
      title: 'Connection Issue',
      description: 'Lost connection to server. Attempting to reconnect...',
      action: {
        label: 'Retry Now',
        onClick: retry,
      },
    })
  }, [notifyError])

  const notifyDataError = useCallback((retry: () => void) => {
    notifyError(new Error('Data sync failed'), {
      title: 'Sync Issue',
      description: 'Unable to sync data. Your changes are saved locally.',
      action: {
        label: 'Retry Sync',
        onClick: retry,
      },
    })
  }, [notifyError])

  const notifyVoiceError = useCallback((retry: () => void) => {
    notifyError(new Error('Voice recognition failed'), {
      title: 'Voice Issue',
      description: 'Check microphone permissions and try again.',
      action: {
        label: 'Retry',
        onClick: retry,
      },
    })
  }, [notifyError])

  return {
    notifyError,
    notifyConnectionError,
    notifyDataError,
    notifyVoiceError,
  }
}
```

## Fix 5: Enhanced Connection Error Handling (MEDIUM)

### Issue
Connection context errors don't provide adequate user feedback.

### Fix
Update connection context with notifications:

```tsx
// lib/state/domains/connection-context.tsx (updated)
import { useErrorNotifications } from '@/lib/hooks/use-error-notifications'

export function ConnectionProvider({ children, onConnectionChange }: ConnectionProviderProps) {
  const { notifyConnectionError } = useErrorNotifications()
  
  // ... existing state and refs
  
  const connect = useCallback(async () => {
    if (!supabaseRef.current || !mountedRef.current) return
    
    try {
      // ... existing connection logic
    } catch (error) {
      console.error('Connection error:', error)
      updateConnectionStatus('disconnected')
      
      // Notify user of connection issue
      notifyConnectionError(() => reconnect())
      
      scheduleReconnect()
    }
  }, [updateConnectionStatus, notifyConnectionError, reconnect])
  
  // ... rest of implementation
}
```

## Fix 6: Orders Context Error Recovery (MEDIUM)

### Issue
Orders context errors don't provide recovery mechanisms.

### Fix
```tsx
// lib/state/domains/orders-context.tsx (updated)
import { useErrorNotifications } from '@/lib/hooks/use-error-notifications'

export function OrdersProvider({ children, autoRefresh, refreshInterval }: OrdersProviderProps) {
  const { notifyDataError } = useErrorNotifications()
  
  const loadOrders = useCallback(async (filters?: OrderFilters) => {
    if (!mountedRef.current) return
    
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      const fetchedOrders = await getOrders(filters)
      
      if (mountedRef.current) {
        dispatch({ type: 'SET_ORDERS', payload: fetchedOrders })
      }
    } catch (error) {
      console.error('Error loading orders:', error)
      
      if (mountedRef.current) {
        dispatch({ 
          type: 'SET_ERROR', 
          payload: error instanceof Error ? error.message : 'Failed to load orders'
        })
        
        // Notify user with retry option
        notifyDataError(() => loadOrders(filters))
      }
    }
  }, [notifyDataError])
  
  // ... rest of implementation
}
```

## Fix 7: Production Error Tracking Setup (MEDIUM)

### Issue
No production error tracking for monitoring and alerting.

### Fix
Add error tracking service:

```tsx
// lib/error-tracking.ts
interface ErrorContext {
  component?: string
  userId?: string
  sessionId?: string
  url?: string
  userAgent?: string
  timestamp?: string
  additional?: Record<string, any>
}

class ErrorTracker {
  private isDevelopment = process.env.NODE_ENV === 'development'
  
  captureError(error: Error, context: ErrorContext = {}) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...context,
    }
    
    if (this.isDevelopment) {
      console.group('🐛 Error Captured')
      console.error('Error:', error)
      console.log('Context:', context)
      console.groupEnd()
      return
    }
    
    // In production, send to monitoring service
    this.sendToMonitoringService(errorData)
  }
  
  private async sendToMonitoringService(errorData: any) {
    try {
      // Send to your monitoring service (Sentry, LogRocket, etc.)
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      })
    } catch (err) {
      console.error('Failed to report error:', err)
    }
  }
  
  captureContext(context: Partial<ErrorContext>) {
    // Update global context for all future errors
    this.globalContext = { ...this.globalContext, ...context }
  }
  
  private globalContext: Partial<ErrorContext> = {}
}

export const errorTracker = new ErrorTracker()

// Hook for easy usage
export function useErrorTracking() {
  const captureError = useCallback((error: Error, context: ErrorContext = {}) => {
    errorTracker.captureError(error, context)
  }, [])
  
  return { captureError }
}
```

## Implementation Order

1. **IMMEDIATE (Day 1)**:
   - Fix 1: Add root error boundary
   - Fix 3: Add auth layout error boundary

2. **HIGH PRIORITY (Week 1)**:
   - Fix 2: Context error isolation
   - Fix 4: Error notifications

3. **MEDIUM PRIORITY (Week 2)**:
   - Fix 5: Enhanced connection handling
   - Fix 6: Orders context recovery
   - Fix 7: Production error tracking

## Testing Strategy

After implementing fixes, test these scenarios:

1. **Component Errors**: Throw errors in various components
2. **Network Failures**: Disable internet connection
3. **Authentication Issues**: Clear session storage
4. **Database Errors**: Modify database to cause constraint violations
5. **Voice Errors**: Deny microphone permissions
6. **Memory Issues**: Simulate out of memory conditions

## Monitoring & Alerts

Set up alerts for:
- Error rate > 1% of sessions
- Specific error types (auth, network, database)
- User-reported errors through the error boundary UI
- Performance impact of error handling

These fixes will significantly improve the application's resilience and user experience during error conditions.