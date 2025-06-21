/**
 * Optimized KDS Stations API Endpoint
 * High-performance endpoint for station data with caching
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchKDSStations } from '@/lib/modassembly/supabase/database/kds/core'
import { withAPIOptimization } from '@/lib/api/optimization'
import { measureApiCall } from '@/lib/performance-utils'

/**
 * GET /api/kds/stations
 * Fetch KDS stations with optimization features
 */
async function handler(_request: NextRequest): Promise<NextResponse> {
  return measureApiCall('kds_stations_api', async () => {
    try {
      const stations = await fetchKDSStations()

      return new NextResponse(JSON.stringify(stations), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60', // 1 minute cache for stations
        }
      })
    } catch (_error) {
      // Only log critical errors in production
      if (process.env.NODE_ENV !== 'production') {
        console.error('KDS Stations API _error:', _error)
      }
      
      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to fetch stations',
          message: _error instanceof Error ? _error.message : 'Unknown error'
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
  enablePagination: false, // Stations are typically small datasets
  enableFieldSelection: true,
  enableCompression: true,
  enableCaching: true
})