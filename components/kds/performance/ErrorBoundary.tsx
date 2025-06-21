'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Bug, ExternalLink, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetOnPropsChange?: boolean
  resetKeys?: Array<string | number>
  isolate?: boolean
  level?: 'component' | 'section' | 'page'
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
  retryCount: number
}

// Component-level error boundary for KDS components
export class KDSErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate a unique error ID for tracking
    const errorId = `kds-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo,
    })

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 KDS Error Boundary Caught Error')
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.groupEnd()
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo)
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props
    const { hasError } = this.state

    // Reset error state when props change (if enabled)
    if (
      hasError &&
      resetOnPropsChange &&
      resetKeys &&
      resetKeys.some((key, index) => prevProps.resetKeys?.[index] !== key)
    ) {
      this.resetErrorBoundary()
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Implement your error reporting service here
    // Examples: Sentry, LogRocket, Bugsnag, etc.
    try {
      const errorData = {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        errorInfo: {
          componentStack: errorInfo.componentStack,
        },
        context: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          errorId: this.state.errorId,
          level: this.props.level || 'component',
        },
      }

      // Mock error reporting - replace with actual service
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error reported:', errorData)
      }
    } catch (reportingError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to report error:', reportingError)
      }
    }
  }

  private resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
    })
  }

  private handleRetry = () => {
    const { retryCount } = this.state
    const maxRetries = 3

    if (retryCount < maxRetries) {
      this.setState({ retryCount: retryCount + 1 })
      
      // Add small delay before retry to prevent rapid retries
      this.resetTimeoutId = window.setTimeout(() => {
        this.resetErrorBoundary()
      }, 1000)
    }
  }

  private handleReload = () => {
    window.location.reload()
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  render() {
    const { hasError, error, errorInfo, errorId, retryCount } = this.state
    const { children, fallback, isolate = false, level = 'component' } = this.props

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback
      }

      // Different error displays based on level
      if (level === 'component') {
        return (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-red-800 dark:text-red-200 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Component Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-red-700 dark:text-red-300">
                  A component failed to render properly. This may be due to invalid data or a temporary issue.
                </p>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={this.handleRetry}
                    disabled={retryCount >= 3}
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry ({retryCount}/3)
                  </Button>
                  
                  {process.env.NODE_ENV === 'development' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Error details are only logged in development
                        if (process.env.NODE_ENV === 'development') {
                          console.log('Error details:', { error, errorInfo })
                        }
                      }}
                      className="border-red-300 text-red-700 hover:bg-red-100"
                    >
                      <Bug className="h-3 w-3 mr-1" />
                      Debug
                    </Button>
                  )}
                </div>

                {process.env.NODE_ENV === 'development' && error && (
                  <details className="mt-3 text-xs">
                    <summary className="cursor-pointer text-red-600 hover:text-red-800">
                      Show error details
                    </summary>
                    <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900 rounded text-red-800 dark:text-red-200 overflow-auto">
                      {error.toString()}
                      {errorInfo?.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            </CardContent>
          </Card>
        )
      }

      if (level === 'section') {
        return (
          <Alert variant="destructive" className="m-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Section Error</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>This section of the Kitchen Display System encountered an error and cannot be displayed.</p>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={this.handleRetry}
                  disabled={retryCount >= 3}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry Section
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={this.handleReload}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Reload Page
                </Button>
              </div>

              {errorId && (
                <p className="text-xs text-muted-foreground">
                  Error ID: {errorId}
                </p>
              )}
            </AlertDescription>
          </Alert>
        )
      }

      // Page-level error
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
          <Card className="max-w-md w-full border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-red-800 dark:text-red-200 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Application Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-red-700 dark:text-red-300">
                  The Kitchen Display System encountered an unexpected error. Please try reloading the page or contact support if the problem persists.
                </p>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={this.handleReload}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload Application
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={this.handleRetry}
                    disabled={retryCount >= 3}
                  >
                    Try Again ({retryCount}/3)
                  </Button>
                </div>

                {errorId && (
                  <div className="p-3 bg-red-100 dark:bg-red-900 rounded text-xs">
                    <p className="font-medium text-red-800 dark:text-red-200">Error ID</p>
                    <p className="text-red-600 dark:text-red-400 font-mono">{errorId}</p>
                    <p className="text-red-500 dark:text-red-500 mt-1">
                      Please include this ID when reporting the issue.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return children
  }
}

// HOC for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <KDSErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </KDSErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Specialized error boundaries for different KDS sections
export const OrderCardErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <KDSErrorBoundary level="component" isolate>
    {children}
  </KDSErrorBoundary>
)

export const OrderListErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <KDSErrorBoundary level="section">
    {children}
  </KDSErrorBoundary>
)

export const KDSPageErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <KDSErrorBoundary level="page">
    {children}
  </KDSErrorBoundary>
)

// Hook for programmatic error reporting
export function useErrorReporting() {
  const reportError = React.useCallback((error: Error, context?: Record<string, any>) => {
    const errorData = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context: {
        ...context,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      },
    }

    if (process.env.NODE_ENV === 'development') {
      console.error('Manual error report:', errorData)
    } else {
      // Report to error tracking service
      // In production, this would send to a real error tracking service
    }
  }, [])

  return { reportError }
}