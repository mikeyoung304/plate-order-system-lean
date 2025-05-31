import { useState, useEffect } from 'react'
import { createClient } from '@/lib/modassembly/supabase/client'

export type SeatStatus = {
  seatId: string
  tableId: string
  seatNumber: number
  status: 'available' | 'ordering' | 'waiting' | 'eating' | 'needs_clearing'
  residentName?: string
  orderTime?: string
  estimatedWaitTime?: number
  lastOrderId?: string
}

export type TableStatus = {
  tableId: string
  totalSeats: number
  occupiedSeats: number
  availableSeats: number
  hasWaitingOrders: boolean
  avgWaitTime?: number
}

export function useSeatStatus() {
  const [seatStatuses, setSeatStatuses] = useState<SeatStatus[]>([])
  const [tableStatuses, setTableStatuses] = useState<TableStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSeatStatuses = async () => {
    try {
      const supabase = createClient()
      
      // Get all seats with their current orders and residents
      const { data, error } = await supabase
        .from('seats')
        .select(`
          id,
          table_id,
          label,
          tables!inner(id, label),
          orders!left(
            id,
            status,
            created_at,
            items,
            profiles!orders_resident_id_fkey(name)
          )
        `)
        .order('table_id')
        .order('label')

      if (error) throw error

      // Process the data to determine seat statuses
      const processedStatuses: SeatStatus[] = data?.map((seat: any) => {
        const recentOrders = seat.orders
          ?.filter((order: any) => ['new', 'in_progress', 'ready'].includes(order.status))
          ?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        const currentOrder = recentOrders?.[0]
        
        let status: SeatStatus['status'] = 'available'
        let estimatedWaitTime: number | undefined
        
        if (currentOrder) {
          const orderAge = Date.now() - new Date(currentOrder.created_at).getTime()
          const minutesAgo = Math.floor(orderAge / (1000 * 60))
          
          switch (currentOrder.status) {
            case 'new':
            case 'in_progress':
              status = 'waiting'
              // Estimate 15-25 minutes for food preparation
              estimatedWaitTime = Math.max(0, 20 - minutesAgo)
              break
            case 'ready':
              status = 'needs_clearing'
              break
          }
          
          // If order is very recent (< 2 minutes), consider them still ordering
          if (minutesAgo < 2) {
            status = 'ordering'
          }
          
          // If order is old but still active, they're probably eating
          if (minutesAgo > 25 && currentOrder.status === 'in_progress') {
            status = 'eating'
          }
        }

        return {
          seatId: seat.id,
          tableId: seat.table_id,
          seatNumber: seat.label,
          status,
          residentName: currentOrder?.profiles?.name,
          orderTime: currentOrder?.created_at,
          estimatedWaitTime,
          lastOrderId: currentOrder?.id
        }
      }) || []

      setSeatStatuses(processedStatuses)

      // Calculate table-level statuses
      const tableStats = processedStatuses.reduce((acc, seat) => {
        const tableId = seat.tableId
        if (!acc[tableId]) {
          acc[tableId] = {
            tableId,
            totalSeats: 0,
            occupiedSeats: 0,
            availableSeats: 0,
            hasWaitingOrders: false,
            waitTimes: []
          }
        }
        
        acc[tableId].totalSeats++
        
        if (seat.status !== 'available') {
          acc[tableId].occupiedSeats++
        } else {
          acc[tableId].availableSeats++
        }
        
        if (seat.status === 'waiting' || seat.status === 'ordering') {
          acc[tableId].hasWaitingOrders = true
        }
        
        if (seat.estimatedWaitTime) {
          acc[tableId].waitTimes.push(seat.estimatedWaitTime)
        }
        
        return acc
      }, {} as Record<string, any>)

      const tableStatusArray: TableStatus[] = Object.values(tableStats).map((stats: any) => ({
        tableId: stats.tableId,
        totalSeats: stats.totalSeats,
        occupiedSeats: stats.occupiedSeats,
        availableSeats: stats.availableSeats,
        hasWaitingOrders: stats.hasWaitingOrders,
        avgWaitTime: stats.waitTimes.length > 0 
          ? Math.round(stats.waitTimes.reduce((a: number, b: number) => a + b, 0) / stats.waitTimes.length)
          : undefined
      }))

      setTableStatuses(tableStatusArray)
      setError(null)
    } catch (err) {
      console.error('Error fetching seat statuses:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch seat statuses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSeatStatuses()

    // Set up real-time subscription
    const supabase = createClient()
    const channel = supabase
      .channel('seat-status-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchSeatStatuses()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'seats' },
        () => fetchSeatStatuses()
      )
      .subscribe()

    // Refresh every 30 seconds to keep wait times current
    const interval = setInterval(fetchSeatStatuses, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

  const getSeatStatus = (tableId: string, seatNumber: number): SeatStatus | undefined => {
    return seatStatuses.find(s => s.tableId === tableId && s.seatNumber === seatNumber)
  }

  const getTableStatus = (tableId: string): TableStatus | undefined => {
    return tableStatuses.find(t => t.tableId === tableId)
  }

  return {
    seatStatuses,
    tableStatuses,
    loading,
    error,
    getSeatStatus,
    getTableStatus,
    refresh: fetchSeatStatuses
  }
}