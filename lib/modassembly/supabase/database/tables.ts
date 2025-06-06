/**
 * File enhanced by Modular Assembly
 * IMPORTANT!!! Ask the user before editing this file.
 */

import { createClient } from '@/lib/modassembly/supabase/client'
import { Table } from '../../../floor-plan-utils'
import { Security } from '@/lib/security'
import { measureApiCall } from '@/lib/performance-utils'
import {
  Database,
  Table as DatabaseTable,
  TableInsert,
  TableStatus,
  TableUpdate,
} from '@/types/database'

type SupabaseTable = DatabaseTable

interface SupabaseSeat {
  id: string
  table_id: string
  label: number
  status: string
}

// Default circle table dimensions from mock data
const CIRCLE_TABLE_DEFAULTS = {
  width: 80,
  height: 80,
  rotation: 0,
  floor_plan_id: 'default',
}

// Default rectangle table dimensions from mock data
const RECTANGLE_TABLE_DEFAULTS = {
  width: 120,
  height: 80,
  rotation: 0,
  floor_plan_id: 'default',
}

// Grid layout configuration
const GRID_CONFIG = {
  startX: 100,
  startY: 100,
  horizontalSpacing: 150,
  verticalSpacing: 150,
  tablesPerRow: 3,
}

export async function fetchTables(): Promise<Table[]> {
  return measureApiCall('fetch_tables', async () => {
    const supabase = createClient()

    // Fetch tables and their seats in parallel
    const [tablesResponse, seatsResponse] = await Promise.all([
      supabase.from('tables').select('*').order('label'),
      supabase.from('seats').select('*'),
    ])

    if (tablesResponse.error) {
      console.error('Error fetching tables:', tablesResponse.error)
      throw new Error('Failed to fetch tables')
    }

    if (seatsResponse.error) {
      console.error('Error fetching seats:', seatsResponse.error)
      throw new Error('Failed to fetch seats')
    }

    const tables = tablesResponse.data as SupabaseTable[]
    const seats = seatsResponse.data as SupabaseSeat[]

    // Create a map of table_id to seat count
    const seatCountMap = seats.reduce(
      (acc, seat) => {
        acc[seat.table_id] = (acc[seat.table_id] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // Transform tables to match frontend format with PERSISTENT positions
    return tables.map((table, index): Table => {
      const defaults =
        table.type === 'circle'
          ? CIRCLE_TABLE_DEFAULTS
          : RECTANGLE_TABLE_DEFAULTS

      // CRITICAL FIX: Use stored positions if available, fallback to grid for new tables
      let x, y

      if (
        table.position_x !== null &&
        table.position_x !== undefined &&
        table.position_y !== null &&
        table.position_y !== undefined
      ) {
        // Use stored positions - this preserves user's floor plan layout
        x = table.position_x
        y = table.position_y
      } else {
        // Fallback to grid layout for new tables without saved positions
        const row = Math.floor(index / GRID_CONFIG.tablesPerRow)
        const col = index % GRID_CONFIG.tablesPerRow
        x = GRID_CONFIG.startX + col * GRID_CONFIG.horizontalSpacing
        y = GRID_CONFIG.startY + row * GRID_CONFIG.verticalSpacing

        // Add extra spacing for rectangle tables since they're wider
        const extraSpacing = table.type === 'rectangle' ? 30 : 0
        x += extraSpacing
      }

      // Security: Sanitize and validate all returned data
      return {
        id: Security.sanitize.sanitizeIdentifier(table.id),
        label: Security.sanitize.sanitizeUserName(table.label),
        status: (['available', 'occupied', 'reserved'].includes(table.status)
          ? table.status
          : 'available') as 'available' | 'occupied' | 'reserved',
        type: (['circle', 'rectangle', 'square'].includes(
          table.shape || table.type
        )
          ? table.shape || table.type === 'oval'
            ? 'circle'
            : table.shape || table.type
          : 'rectangle') as 'circle' | 'rectangle' | 'square',
        seats: Math.max(0, Math.min(20, seatCountMap[table.id] || 0)), // Clamp seats to valid range
        x: Math.max(0, Math.min(2000, x)), // Clamp position to canvas bounds
        y: Math.max(0, Math.min(2000, y)), // Clamp position to canvas bounds
        width: Math.max(50, Math.min(200, table.width || defaults.width)), // Reasonable size limits
        height: Math.max(50, Math.min(200, table.height || defaults.height)),
        rotation: Math.max(
          0,
          Math.min(360, table.rotation || defaults.rotation)
        ),
        zIndex: 1, // Default z-index since this field doesn't exist in DB
      }
    })
  }) // End of measureApiCall
}

/**
 * Create a new table in the database
 * @param tableData Table data to create
 * @returns The created table
 */
export async function createTable(
  tableData: Omit<TableInsert, 'id' | 'created_at' | 'updated_at' | 'table_id'>
): Promise<SupabaseTable> {
  return measureApiCall('create_table', async () => {
    // Security: Validate and sanitize input data
    const validTypes = ['circle', 'rectangle', 'square']
    const validStatuses = ['available', 'occupied', 'reserved']

    const sanitizedData = {
      table_id: `table_${Date.now()}`, // Generate unique table_id
      label: tableData.label || 'Table',
      type: validTypes.includes(tableData.type || '')
        ? tableData.type
        : 'rectangle',
      status:
        tableData.status && validStatuses.includes(tableData.status)
          ? tableData.status
          : 'available',
      position_x:
        tableData.position_x !== undefined && tableData.position_x !== null
          ? Math.max(0, Math.min(2000, tableData.position_x))
          : null,
      position_y:
        tableData.position_y !== undefined && tableData.position_y !== null
          ? Math.max(0, Math.min(2000, tableData.position_y))
          : null,
      width:
        tableData.width !== undefined && tableData.width !== null
          ? Math.max(50, Math.min(200, tableData.width))
          : null,
      height:
        tableData.height !== undefined && tableData.height !== null
          ? Math.max(50, Math.min(200, tableData.height))
          : null,
      rotation:
        tableData.rotation !== undefined && tableData.rotation !== null
          ? Math.max(0, Math.min(360, tableData.rotation))
          : null,
      shape: (['circle', 'rectangle', 'oval'].includes(
        tableData.shape || tableData.type || ''
      )
        ? tableData.shape || tableData.type
        : 'rectangle') as 'rectangle' | 'circle' | 'oval',
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from('tables')
      .insert([sanitizedData])
      .select()
      .single()

    if (error) {
      console.error('Error creating table:', error)
      throw new Error(`Failed to create table: ${error.message}`)
    }

    return data as SupabaseTable
  })
}

/**
 * Update an existing table
 * @param tableId Table ID to update
 * @param updates Table data to update
 * @returns The updated table
 */
export async function updateTable(
  tableId: string,
  updates: Partial<TableUpdate>
): Promise<SupabaseTable> {
  return measureApiCall('update_table', async () => {
    // Security: Validate table ID
    const sanitizedTableId = Security.sanitize.sanitizeIdentifier(tableId)
    if (!sanitizedTableId) {
      throw new Error('Invalid table ID')
    }

    // Security: Validate and sanitize update data
    const validTypes = ['circle', 'rectangle', 'square']
    const validStatuses = ['available', 'occupied', 'reserved']

    const sanitizedUpdates: Partial<TableUpdate> = {}

    if (updates.label !== undefined) {
      sanitizedUpdates.label = updates.label
    }

    if (updates.type !== undefined) {
      sanitizedUpdates.type = validTypes.includes(updates.type)
        ? updates.type
        : 'rectangle'
    }

    if (updates.status !== undefined) {
      sanitizedUpdates.status = validStatuses.includes(updates.status)
        ? updates.status
        : 'available'
    }

    if (updates.position_x !== undefined) {
      sanitizedUpdates.position_x =
        updates.position_x !== null
          ? Math.max(0, Math.min(2000, updates.position_x))
          : null
    }

    if (updates.position_y !== undefined) {
      sanitizedUpdates.position_y =
        updates.position_y !== null
          ? Math.max(0, Math.min(2000, updates.position_y))
          : null
    }

    if (updates.width !== undefined) {
      sanitizedUpdates.width =
        updates.width !== null
          ? Math.max(50, Math.min(200, updates.width))
          : null
    }

    if (updates.height !== undefined) {
      sanitizedUpdates.height =
        updates.height !== null
          ? Math.max(50, Math.min(200, updates.height))
          : null
    }

    if (updates.rotation !== undefined) {
      sanitizedUpdates.rotation =
        updates.rotation !== null
          ? Math.max(0, Math.min(360, updates.rotation))
          : null
    }

    if ('shape' in updates && updates.shape !== undefined) {
      sanitizedUpdates.shape = (
        ['circle', 'rectangle', 'oval'].includes(updates.shape || '')
          ? updates.shape
          : 'rectangle'
      ) as 'rectangle' | 'circle' | 'oval' | null
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from('tables')
      .update(sanitizedUpdates)
      .eq('id', sanitizedTableId)
      .select()
      .single()

    if (error) {
      console.error('Error updating table:', error)
      throw new Error(`Failed to update table: ${error.message}`)
    }

    return data as SupabaseTable
  })
}

/**
 * Delete a table from the database
 * @param tableId Table ID to delete
 */
export async function deleteTable(tableId: string): Promise<void> {
  return measureApiCall('delete_table', async () => {
    // Security: Validate table ID
    const sanitizedTableId = Security.sanitize.sanitizeIdentifier(tableId)
    if (!sanitizedTableId) {
      throw new Error('Invalid table ID')
    }

    // UUID validation for extra security
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(sanitizedTableId)) {
      throw new Error('Invalid table ID format')
    }

    const supabase = createClient()

    const { error } = await supabase
      .from('tables')
      .delete()
      .eq('id', sanitizedTableId)

    if (error) {
      console.error('Error deleting table:', error)
      throw new Error(`Failed to delete table: ${error.message}`)
    }
  })
}
