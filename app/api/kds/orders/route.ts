/**
 * Optimized KDS Orders API Endpoint
 * High-performance endpoint with caching, compression, and field selection
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchAllActiveOrders, fetchStationOrders } from '@/lib/modassembly/supabase/database/kds/core'
import { withAPIOptimization } from '@/lib/api/optimization'
import { measureApiCall } from '@/lib/performance-utils'

/**
 * GET /api/kds/orders
 * Fetch KDS orders with optimization features:
 * - Query params: station_id, fields, exclude, page, limit
 * - Response compression for large datasets
 * - Field selection to reduce payload size
 * - Pagination for better performance
 */
async function handler(request: NextRequest): Promise<NextResponse> {
  return measureApiCall('kds_orders_api', async () => {
    try {
      const url = new URL(request.url)
      const stationId = url.searchParams.get('station_id')

      // Fetch data based on query parameters
      let orders
      if (stationId) {
        orders = await fetchStationOrders(stationId)
      } else {
        orders = await fetchAllActiveOrders()
      }

      // The withAPIOptimization middleware will handle:
      // - Field selection (?fields=id,priority,order.items)
      // - Pagination (?page=1&limit=25)
      // - Response compression
      // - Performance headers
      
      return new NextResponse(JSON.stringify(orders), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=10', // 10 second cache for active orders
        }
      })
    } catch (error) {
      // Only log critical errors in production
      if (process.env.NODE_ENV !== 'production') {
        console.error('KDS Orders API error:', error)
      }
      
      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to fetch orders',
          message: error instanceof Error ? error.message : 'Unknown error'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  })
}

// Apply optimization middleware
export const GET = withAPIOptimization(handler, {
  enablePagination: true,
  enableFieldSelection: true,
  enableCompression: true,
  enableCaching: true
})