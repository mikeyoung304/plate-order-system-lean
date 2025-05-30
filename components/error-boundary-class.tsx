// AI: Created proper class-based error boundary for Plate Order System

'use client'

import React, { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showDetails?: boolean
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({ errorInfo })
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-lg w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Oops! Something went wrong
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  An unexpected error occurred
                </p>
              </div>
            </div>

            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We apologize for the inconvenience. The error has been logged and we're working to fix it.
            </p>

            {this.props.showDetails && this.state.error && (
              <div className="mb-4">
                <details className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md">
                  <summary className="text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer">
                    Error Details
                  </summary>
                  <div className="mt-2 text-xs font-mono text-gray-500 dark:text-gray-500 break-all">
                    <p><strong>Message:</strong> {this.state.error.message}</p>
                    {this.state.error.stack && (
                      <pre className="mt-2 whitespace-pre-wrap">{this.state.error.stack}</pre>
                    )}
                  </div>
                </details>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Page
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="flex items-center justify-center gap-2"
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}