import { createClient } from '@/lib/modassembly/supabase/client'
import { Table } from '../../../floor-plan-utils'

interface SupabaseTable {
  id: string
  label: number
  type: string
  status: string
}

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

  // Transform tables to match mock data format with grid layout
  return tables.map((table, index): Table => {
    const defaults =
      table.type === 'circle' ? CIRCLE_TABLE_DEFAULTS : RECTANGLE_TABLE_DEFAULTS

    // Calculate grid position
    const row = Math.floor(index / GRID_CONFIG.tablesPerRow)
    const col = index % GRID_CONFIG.tablesPerRow

    // Calculate x and y coordinates based on grid position
    const x = GRID_CONFIG.startX + col * GRID_CONFIG.horizontalSpacing
    const y = GRID_CONFIG.startY + row * GRID_CONFIG.verticalSpacing

    // Add extra spacing for rectangle tables since they're wider
    const extraSpacing = table.type === 'rectangle' ? 30 : 0

    return {
      id: table.id,
      label: table.label.toString(),
      status: table.status as 'available' | 'occupied' | 'reserved',
      type: table.type as 'circle' | 'rectangle' | 'square',
      seats: seatCountMap[table.id] || 0,
      x: x + extraSpacing,
      y,
      ...defaults,
    }
  })
}

// Additional CRUD functions following Luis's patterns
export async function createTable(tableData: {
  label: string
  type: string
  status: string
  position_x?: number
  position_y?: number
  width?: number
  height?: number
  rotation?: number
}): Promise<{ id: string }> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('tables')
    .insert([
      {
        label: parseInt(tableData.label) || 1,
        type: tableData.type,
        status: tableData.status,
        // Note: position fields don't exist in current schema
        // Would need migration to add: position_x, position_y, width, height, rotation
      },
    ])
    .select('id')
    .single()

  if (error) {
    console.error('Error creating table:', error)
    throw new Error(`Failed to create table: ${error.message}`)
  }

  return data
}

export async function updateTable(
  tableId: string,
  updates: {
    label?: string
    type?: string
    status?: string
    position_x?: number
    position_y?: number
    width?: number
    height?: number
    rotation?: number
  }
): Promise<void> {
  const supabase = createClient()

  // Only update fields that exist in current schema
  const schemaUpdates: any = {}
  if (updates.label) {
    schemaUpdates.label = parseInt(updates.label) || 1
  }
  if (updates.type) {
    schemaUpdates.type = updates.type
  }
  if (updates.status) {
    schemaUpdates.status = updates.status
  }

  const { error } = await supabase
    .from('tables')
    .update(schemaUpdates)
    .eq('id', tableId)

  if (error) {
    console.error('Error updating table:', error)
    throw new Error(`Failed to update table: ${error.message}`)
  }
}

export async function deleteTable(tableId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('tables').delete().eq('id', tableId)

  if (error) {
    console.error('Error deleting table:', error)
    throw new Error(`Failed to delete table: ${error.message}`)
  }
}
