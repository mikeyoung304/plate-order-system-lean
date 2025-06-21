'use client'

import { memo, useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  History,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  Volume2,
  X,
} from 'lucide-react'
import { useVoice } from '@/contexts/kds/voice-context'
import { format } from 'date-fns'

interface VoiceHistoryProps {
  trigger?: React.ReactNode
  className?: string
  maxItems?: number
  showRetry?: boolean
  onRetryCommand?: (command: string) => void
}

interface CommandRowProps {
  command: any
  index: number
  onRetry?: (command: string) => void
  showRetry?: boolean
}

const CommandRow = memo(function CommandRow({
  command,
  index,
  onRetry,
  showRetry = true,
}: CommandRowProps) {
  const isProcessed = command.processed
  const isRecent = Date.now() - command.timestamp < 30000 // 30 seconds
  const confidence = Math.round(command.confidence * 100)

  const getStatusIcon = () => {
    if (isProcessed) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    } else if (confidence < 70) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    } else {
      return <X className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusText = () => {
    if (isProcessed) {return 'Executed'}
    if (confidence < 70) {return 'Low Confidence'}
    return 'Failed'
  }

  const getStatusColor = () => {
    if (isProcessed) {return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'}
    if (confidence < 70) {return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'}
    return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
  }

  return (
    <div
      className={cn(
        'p-3 border rounded-lg transition-all',
        getStatusColor(),
        isRecent && 'ring-2 ring-blue-500/20'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getStatusIcon()}
            <Badge 
              variant={isProcessed ? "default" : confidence < 70 ? "secondary" : "destructive"}
              className="text-xs"
            >
              {getStatusText()}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {confidence}% confidence
            </Badge>
            {isRecent && (
              <Badge variant="outline" className="text-xs text-blue-600">
                Recent
              </Badge>
            )}
          </div>
          
          <div className="space-y-1">
            <div className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              "{command.command}"
            </div>
            
            {command.parameters && Object.keys(command.parameters).length > 0 && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <strong>Parsed:</strong>{' '}
                {Object.entries(command.parameters).map(([key, value]) => (
                  <span key={key} className="mr-2">
                    {key}: {String(value)}
                  </span>
                ))}
              </div>
            )}
            
            <div className="text-xs text-gray-500">
              {format(new Date(command.timestamp), 'MMM d, h:mm:ss a')}
            </div>
          </div>
        </div>
        
        {showRetry && onRetry && !isProcessed && (
          <div className="flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRetry(command.command)}
              className="h-8 w-8 p-0"
              title="Retry command"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
})

export const VoiceHistory = memo(function VoiceHistory({
  trigger,
  className,
  maxItems = 20,
  showRetry = true,
  onRetryCommand,
}: VoiceHistoryProps) {
  const [open, setOpen] = useState(false)
  const { getCommandHistory, clearHistory, processCommand } = useVoice()
  
  const history = getCommandHistory(maxItems)
  const recentCount = history.filter(cmd => Date.now() - cmd.timestamp < 60000).length
  const successCount = history.filter(cmd => cmd.processed).length
  const failureCount = history.length - successCount

  const handleRetry = useCallback(async (command: string) => {
    try {
      await processCommand(command, 1.0) // High confidence for manual retry
      
      if (onRetryCommand) {
        onRetryCommand(command)
      }
    } catch (_error) {
      console.error('Error retrying command:', _error)
    }
  }, [processCommand, onRetryCommand])

  const handleClearHistory = useCallback(() => {
    clearHistory()
  }, [clearHistory])

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="flex items-center gap-2">
      <History className="h-4 w-4" />
      Voice History
      {recentCount > 0 && (
        <Badge variant="secondary" className="text-xs">
          {recentCount}
        </Badge>
      )}
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild className={className}>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Voice Command History
          </DialogTitle>
          <DialogDescription>
            Recent voice commands and their execution status
          </DialogDescription>
        </DialogHeader>

        {/* Summary stats */}
        <div className="flex-shrink-0 grid grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold">{history.length}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{successCount}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Success</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">{failureCount}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">{recentCount}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Recent</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex-shrink-0 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing last {Math.min(maxItems, history.length)} commands
          </div>
          <div className="flex gap-2">
            {history.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearHistory}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-3 w-3" />
                Clear History
              </Button>
            )}
          </div>
        </div>

        {/* Command history list */}
        <div className="flex-1 overflow-hidden">
          {history.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Volume2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No Voice Commands Yet</h3>
                <p className="text-gray-400">
                  Voice commands you make will appear here for review and retry
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="space-y-3 p-1">
                {history.map((command, index) => (
                  <CommandRow
                    key={command.id}
                    command={command}
                    index={index}
                    onRetry={showRetry ? handleRetry : undefined}
                    showRetry={showRetry}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Footer info */}
        <div className="flex-shrink-0 text-xs text-gray-500 border-t pt-2">
          <div className="flex items-center justify-between">
            <span>Commands are automatically cleared after 24 hours</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Executed
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                Low Confidence
              </div>
              <div className="flex items-center gap-1">
                <X className="h-3 w-3 text-red-500" />
                Failed
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})

VoiceHistory.displayName = 'VoiceHistory'