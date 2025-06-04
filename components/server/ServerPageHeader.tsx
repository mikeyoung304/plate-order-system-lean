'use client'

import { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, RefreshCw, Users, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useServerPageData } from '@/lib/hooks/use-server-page-data'

interface ServerPageHeaderProps {
  className?: string
}

function CurrentTime() {
  const now = new Date()
  const timeString = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  const dateString = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="flex items-center gap-2 text-white">
      <Clock className="h-5 w-5 text-blue-400" />
      <div className="flex flex-col">
        <span className="text-lg font-semibold">{timeString}</span>
        <span className="text-sm text-gray-400">{dateString}</span>
      </div>
    </div>
  )
}

function ConnectionStatus() {
  // For now, assume connected - this would come from a connection status hook
  const isConnected = true
  
  return (
    <div className="flex items-center gap-2">
      {isConnected ? (
        <>
          <Wifi className="h-4 w-4 text-green-400" />
          <Badge variant="secondary" className="bg-green-900/40 text-green-400 border-green-700">
            Connected
          </Badge>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-red-400" />
          <Badge variant="secondary" className="bg-red-900/40 text-red-400 border-red-700">
            Disconnected
          </Badge>
        </>
      )}
    </div>
  )
}

function ServerStats() {
  const { tables, recentOrders, loading } = useServerPageData()
  
  if (loading) {
    return (
      <div className="flex items-center gap-4">
        <div className="animate-pulse bg-gray-700 h-6 w-20 rounded" />
        <div className="animate-pulse bg-gray-700 h-6 w-20 rounded" />
      </div>
    )
  }

  const occupiedTables = tables.filter((t: any) => t.status === 'occupied').length
  const pendingOrders = recentOrders.filter((o: any) => o.status === 'new' || o.status === 'in_progress').length

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-blue-400" />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white">
            {occupiedTables}
          </span>
          <span className="text-xs text-gray-400">
            Occupied Tables
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white">
            {pendingOrders}
          </span>
          <span className="text-xs text-gray-400">
            Pending Orders
          </span>
        </div>
      </div>
    </div>
  )
}

function QuickActions() {
  const { reload } = useServerPageData()
  
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={reload}
        className="border-gray-600 hover:bg-gray-800"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  )
}

export const ServerPageHeader = memo<ServerPageHeaderProps>(({ className }) => {
  return (
    <div className={cn(
      "flex items-center justify-between p-6 bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-lg mb-6",
      className
    )}>
      <div className="flex items-center gap-6">
        <CurrentTime />
        <ServerStats />
      </div>
      
      <div className="flex items-center gap-4">
        <ConnectionStatus />
        <QuickActions />
      </div>
    </div>
  )
})

ServerPageHeader.displayName = 'ServerPageHeader'