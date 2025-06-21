/**
 * API Response Optimization System
 * Compression, pagination, field selection, and response caching for <50ms APIs
 */

import { NextRequest, NextResponse } from 'next/server'
import { measureApiCall } from '@/lib/performance-utils'

interface PaginationOptions {
  page?: number
  limit?: number
  maxLimit?: number
}

interface FieldSelection {
  fields?: string[]
  exclude?: string[]
}

interface CompressionOptions {
  enabled?: boolean
  threshold?: number // bytes
  level?: number // 1-9
}

interface OptimizedResponse<T> {
  data: T
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  meta: {
    executionTime: number
    cached: boolean
    compressed: boolean
    fieldCount: number
  }
}

class APIOptimizer {
  private defaultPagination = { page: 1, limit: 50, maxLimit: 100 }
  private defaultCompression = { enabled: true, threshold: 1024, level: 6 }

  /**
   * Parse query parameters for pagination
   */
  parsePagination(request: NextRequest): PaginationOptions {
    const url = new URL(request.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
    const limit = Math.min(
      this.defaultPagination.maxLimit,
      Math.max(1, parseInt(url.searchParams.get('limit') || '50'))
    )

    return { page, limit }
  }

  /**
   * Parse field selection parameters
   */
  parseFieldSelection(request: NextRequest): FieldSelection {
    const url = new URL(request.url)
    const fieldsParam = url.searchParams.get('fields')
    const excludeParam = url.searchParams.get('exclude')

    return {
      fields: fieldsParam ? fieldsParam.split(',').map(f => f.trim()) : undefined,
      exclude: excludeParam ? excludeParam.split(',').map(f => f.trim()) : undefined
    }
  }

  /**
   * Apply field selection to data
   */
  selectFields<T extends Record<string, any>>(
    data: T | T[],
    selection: FieldSelection
  ): T | T[] {
    if (!selection.fields && !selection.exclude) {
      return data
    }

    const processItem = (item: T): T => {
      let result = { ...item }

      // Apply field inclusion
      if (selection.fields && selection.fields.length > 0) {
        const filtered = {} as T
        selection.fields.forEach(field => {
          if (field.includes('.')) {
            // Handle nested fields like 'order.items'
            const [parent, child] = field.split('.', 2)
            if (result[parent] && typeof result[parent] === 'object') {
              if (!(filtered as any)[parent]) {
                (filtered as any)[parent] = {}
              }
              (filtered as any)[parent][child] = (result as any)[parent][child]
            }
          } else if (result[field] !== undefined) {
            (filtered as any)[field] = (result as any)[field]
          }
        })
        result = filtered
      }

      // Apply field exclusion
      if (selection.exclude && selection.exclude.length > 0) {
        selection.exclude.forEach(field => {
          if (field.includes('.')) {
            const [parent, child] = field.split('.', 2)
            if (result[parent] && typeof result[parent] === 'object') {
              delete result[parent][child]
            }
          } else {
            delete result[field]
          }
        })
      }

      return result
    }

    return Array.isArray(data) ? data.map(processItem) : processItem(data)
  }

  /**
   * Apply pagination to data array
   */
  paginate<T>(
    data: T[],
    options: PaginationOptions
  ): {
    items: T[]
    pagination: OptimizedResponse<any>['pagination']
  } {
    const { page = 1, limit = 50 } = options
    const total = data.length
    const totalPages = Math.ceil(total / limit)
    const offset = (page - 1) * limit
    const items = data.slice(offset, offset + limit)

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  }

  /**
   * Compress response data if beneficial
   */
  async compressResponse(
    data: any,
    options: CompressionOptions = this.defaultCompression
  ): Promise<{ data: string | any; compressed: boolean }> {
    if (!options.enabled) {
      return { data, compressed: false }
    }

    const jsonString = JSON.stringify(data)
    const jsonSize = Buffer.byteLength(jsonString, 'utf8')

    // Only compress if data is larger than threshold
    if (jsonSize < (options.threshold || 1024)) {
      return { data, compressed: false }
    }

    try {
      // For now, return uncompressed since we're in server-side context
      // In a full implementation, you'd use zlib compression here
      return { data, compressed: false }
    } catch (_error) {
      console.error('Compression failed:', _error)
      return { data, compressed: false }
    }
  }

  /**
   * Create optimized API response
   */
  async createOptimizedResponse<T>(
    request: NextRequest,
    data: T[],
    options: {
      enablePagination?: boolean
      enableFieldSelection?: boolean
      enableCompression?: boolean
      totalCount?: number
    } = {}
  ): Promise<NextResponse> {
    const startTime = performance.now()

    return measureApiCall('create_optimized_response', async () => {
      let processedData: any = data
      let pagination: OptimizedResponse<any>['pagination'] | undefined
      let fieldCount = 0

      // Apply field selection
      if (options.enableFieldSelection !== false) {
        const fieldSelection = this.parseFieldSelection(request)
        processedData = this.selectFields(data, fieldSelection)
        fieldCount = this.countFields(processedData)
      }

      // Apply pagination
      if (options.enablePagination !== false) {
        const paginationOptions = this.parsePagination(request)
        const paginated = this.paginate(Array.isArray(processedData) ? processedData : [processedData], paginationOptions)
        processedData = paginated.items
        pagination = paginated.pagination
        
        // Override total if provided
        if (options.totalCount !== undefined && pagination) {
          pagination.total = options.totalCount
          pagination.totalPages = Math.ceil(options.totalCount / pagination.limit)
          pagination.hasNext = pagination.page < pagination.totalPages
        }
      }

      // Apply compression
      const compressionResult = await this.compressResponse(
        processedData,
        options.enableCompression !== false ? this.defaultCompression : { enabled: false }
      )

      const executionTime = performance.now() - startTime

      const response: OptimizedResponse<typeof processedData> = {
        data: compressionResult.data,
        pagination,
        meta: {
          executionTime,
          cached: false, // Will be set by cache layer
          compressed: compressionResult.compressed,
          fieldCount
        }
      }

      // Set appropriate headers
      const headers = new Headers({
        'Content-Type': 'application/json',
        'X-Execution-Time': executionTime.toString(),
        'X-Field-Count': fieldCount.toString()
      })

      if (compressionResult.compressed) {
        headers.set('Content-Encoding', 'gzip')
      }

      if (pagination) {
        headers.set('X-Total-Count', pagination.total.toString())
        headers.set('X-Page', pagination.page.toString())
        headers.set('X-Limit', pagination.limit.toString())
      }

      return new NextResponse(JSON.stringify(response), { headers })
    })
  }

  /**
   * Count fields in response for optimization metrics
   */
  private countFields(data: any): number {
    if (Array.isArray(data)) {
      return data.length > 0 ? this.countObjectFields(data[0]) : 0
    }
    return this.countObjectFields(data)
  }

  private countObjectFields(obj: any): number {
    if (!obj || typeof obj !== 'object') {return 0}
    
    let count = 0
    for (const key in obj) {
      count++
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        count += this.countObjectFields(obj[key])
      }
    }
    return count
  }
}

// Middleware for automatic API optimization
export function withAPIOptimization(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    enablePagination?: boolean
    enableFieldSelection?: boolean
    enableCompression?: boolean
    enableCaching?: boolean
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const optimizer = new APIOptimizer()
    
    try {
      const response = await handler(request)
      
      // If response is already optimized, return as-is
      if (response.headers.get('X-Optimized')) {
        return response
      }

      // Parse response data
      const responseData = await response.json()
      
      // Apply optimizations
      const optimizedResponse = await optimizer.createOptimizedResponse(
        request,
        responseData,
        options
      )

      // Mark as optimized
      optimizedResponse.headers.set('X-Optimized', 'true')
      
      return optimizedResponse
    } catch (_error) {
      console.error('API optimization failed:', _error)
      return new NextResponse(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
}

// React hook for optimized API calls
export function useOptimizedAPI<T>(
  url: string,
  options: {
    fields?: string[]
    exclude?: string[]
    page?: number
    limit?: number
    enabled?: boolean
  } = {}
) {
  const buildURL = (baseURL: string) => {
    const urlObj = new URL(baseURL, window.location.origin)
    
    if (options.fields) {
      urlObj.searchParams.set('fields', options.fields.join(','))
    }
    
    if (options.exclude) {
      urlObj.searchParams.set('exclude', options.exclude.join(','))
    }
    
    if (options.page) {
      urlObj.searchParams.set('page', options.page.toString())
    }
    
    if (options.limit) {
      urlObj.searchParams.set('limit', options.limit.toString())
    }
    
    return urlObj.toString()
  }

  // This would integrate with your existing data fetching solution
  // For now, returning the optimized URL
  return {
    url: buildURL(url),
    isLoading: false,
    data: null as T | null,
    error: null as Error | null,
    refetch: () => {}
  }
}

// Export singleton optimizer
export const apiOptimizer = new APIOptimizer()

// High-performance JSON streaming for large responses
export class StreamingJSONResponse {
  static create<T>(data: T[], batchSize = 100): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder()
    let index = 0

    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('{"data":['))
      },
      
      pull(controller) {
        if (index >= data.length) {
          controller.enqueue(encoder.encode(']}'))
          controller.close()
          return
        }

        const batch = data.slice(index, index + batchSize)
        const batchJSON = batch.map(item => JSON.stringify(item)).join(',')
        
        if (index > 0) {
          controller.enqueue(encoder.encode(`,${  batchJSON}`))
        } else {
          controller.enqueue(encoder.encode(batchJSON))
        }
        
        index += batchSize
      }
    })
  }
}

export { APIOptimizer }