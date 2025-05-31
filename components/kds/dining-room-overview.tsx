"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Users, AlertTriangle, CheckCircle, Timer } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSeatStatus } from '@/hooks/use-seat-status'

type DiningRoomOverviewProps = {
  className?: string
}

export function DiningRoomOverview({ className = '' }: DiningRoomOverviewProps) {
  const { tableStatuses, seatStatuses, loading } = useSeatStatus()

  const getTableStatusColor = (table: any) => {
    if (table.hasWaitingOrders) return 'border-yellow-500 bg-yellow-50'
    if (table.occupiedSeats === table.totalSeats) return 'border-green-500 bg-green-50'
    if (table.occupiedSeats > 0) return 'border-blue-500 bg-blue-50'
    return 'border-gray-300 bg-gray-50'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ordering':
        return <Timer className="h-4 w-4 text-blue-600" />
      case 'waiting':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'eating':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'needs_clearing':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Users className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ordering':
        return 'Ordering'
      case 'waiting':
        return 'Waiting'
      case 'eating':
        return 'Eating'
      case 'needs_clearing':
        return 'Clear Table'
      default:
        return 'Available'
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Dining Room Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading dining room status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Group seats by table
  const seatsByTable = seatStatuses.reduce((acc, seat) => {
    if (!acc[seat.tableId]) acc[seat.tableId] = []
    acc[seat.tableId].push(seat)
    return acc
  }, {} as Record<string, typeof seatStatuses>)

  const tablesWithSeats = tableStatuses.map(table => ({
    ...table,
    seats: seatsByTable[table.tableId] || []
  }))

  // Calculate summary statistics
  const totalTables = tableStatuses.length
  const totalSeats = tableStatuses.reduce((sum, t) => sum + t.totalSeats, 0)
  const occupiedSeats = tableStatuses.reduce((sum, t) => sum + t.occupiedSeats, 0)
  const tablesWithWaiting = tableStatuses.filter(t => t.hasWaitingOrders).length

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Dining Room Overview
        </CardTitle>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>{totalTables} Tables</span>
          <span>{occupiedSeats}/{totalSeats} Seats Occupied</span>
          {tablesWithWaiting > 0 && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-300">
              {tablesWithWaiting} Waiting
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {tablesWithSeats.map((table) => (
              <motion.div
                key={table.tableId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className={`transition-all duration-200 ${getTableStatusColor(table)}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">Table {table.tableId}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{table.occupiedSeats}/{table.totalSeats}</span>
                      </div>
                    </div>

                    {/* Wait time indicator */}
                    {table.avgWaitTime && table.avgWaitTime > 0 && (
                      <div className="mb-3 flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span className="text-yellow-700">Avg wait: {table.avgWaitTime}m</span>
                      </div>
                    )}

                    {/* Seat grid */}
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: table.totalSeats }, (_, i) => {
                        const seatNumber = i + 1
                        const seat = table.seats.find(s => s.seatNumber === seatNumber)
                        const status = seat?.status || 'available'
                        
                        return (
                          <div
                            key={seatNumber}
                            className={`
                              h-8 w-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-all duration-200
                              ${status === 'available' ? 'bg-gray-200 text-gray-600' : ''}
                              ${status === 'ordering' ? 'bg-blue-500 text-white' : ''}
                              ${status === 'waiting' ? 'bg-yellow-500 text-white animate-pulse' : ''}
                              ${status === 'eating' ? 'bg-green-500 text-white' : ''}
                              ${status === 'needs_clearing' ? 'bg-red-500 text-white animate-bounce' : ''}
                            `}
                            title={`Seat ${seatNumber}: ${getStatusText(status)}${seat?.residentName ? ` - ${seat.residentName}` : ''}${seat?.estimatedWaitTime ? ` (${seat.estimatedWaitTime}m wait)` : ''}`}
                          >
                            {seatNumber}
                          </div>
                        )
                      })}
                    </div>

                    {/* Status summary for table */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {table.seats
                        .filter(seat => seat.status !== 'available')
                        .map((seat) => (
                          <div
                            key={`${seat.tableId}-${seat.seatNumber}`}
                            className="flex items-center gap-1 text-xs bg-white/50 rounded px-2 py-1"
                          >
                            {getStatusIcon(seat.status)}
                            <span>{seat.seatNumber}</span>
                            {seat.estimatedWaitTime && seat.estimatedWaitTime > 0 && (
                              <span className="text-gray-500">({seat.estimatedWaitTime}m)</span>
                            )}
                          </div>
                        ))}
                    </div>

                    {/* Priority alerts */}
                    {table.seats.some(seat => seat.status === 'needs_clearing') && (
                      <div className="mt-2 flex items-center gap-2 text-red-700 bg-red-100 rounded px-2 py-1 text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Needs Attention</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Overall status summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-3">Status Legend</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Ordering</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>Waiting</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Eating</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Needs Clearing</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}