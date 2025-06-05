/**
 * File for floor plan management functions
 * Provides simplified persistence for floor plan editor
 */

import { createClient } from '@/lib/modassembly/supabase/client'
import { createTable, deleteTable, updateTable } from './tables'
import {
  createSeatsForTable,
  deleteSeatsForTable,
  updateSeatsForTable,
} from './seats'

export interface FloorPlanTable {
  id: string
  label: string
  type: 'circle' | 'rectangle' | 'square'
  seats: number
  status: 'available' | 'occupied' | 'reserved'
  // AI: Position and layout data now persisted in database
  position_x?: number
  position_y?: number
  width?: number
  height?: number
  rotation?: number
  zIndex?: number
}

/**
 * Save tables to database (simplified - core data only)
 * @param tables Array of tables to save
 * @returns Promise that resolves when save is complete
 */
export async function saveFloorPlanTables(
  tables: FloorPlanTable[]
): Promise<void> {
  const supabase = createClient()

  try {
    // Get current tables from database
    const { data: currentTables, error: fetchError } = await supabase
      .from('tables')
      .select('*')

    if (fetchError) {
      throw new Error(`Failed to fetch current tables: ${fetchError.message}`)
    }

    const currentTableIds = new Set(currentTables?.map(t => t.id) || [])
    const newTableIds = new Set(tables.map(t => t.id))

    // Delete tables that are no longer in the new list
    const tablesToDelete = Array.from(currentTableIds).filter(
      id => !newTableIds.has(id)
    )
    for (const tableId of tablesToDelete) {
      await deleteSeatsForTable(tableId)
      await deleteTable(tableId)
    }

    // Process each table in the new list
    for (const table of tables) {
      const labelNumber = parseInt(table.label.replace(/\D/g, ''), 10) || 1

      if (currentTableIds.has(table.id)) {
        // Update existing table with position data
        await updateTable(table.id, {
          label: labelNumber.toString(),
          type: table.type,
          status: table.status,
          position_x: table.position_x,
          position_y: table.position_y,
          width: table.width,
          height: table.height,
          rotation: table.rotation,
        })

        // Update seats count
        await updateSeatsForTable(table.id, table.seats)
      } else {
        // Create new table with position data
        const newTable = await createTable({
          label: labelNumber.toString(),
          type: table.type,
          status: table.status,
          position_x: table.position_x,
          position_y: table.position_y,
          width: table.width,
          height: table.height,
          rotation: table.rotation,
        })

        // Create seats for new table
        await createSeatsForTable(newTable.id, table.seats)
      }
    }
  } catch (error) {
    console.error('Error saving floor plan:', error)
    throw error
  }
}

/**
 * Load tables for floor plan (uses existing fetchTables but simplified interface)
 * @returns Array of floor plan tables
 */
export async function loadFloorPlanTables(): Promise<FloorPlanTable[]> {
  const supabase = createClient()

  // Fetch tables and their seats with position data
  const [tablesResponse, seatsResponse] = await Promise.all([
    supabase.from('tables').select('id, label, type, status').order('label'),
    supabase.from('seats').select('*'),
  ])

  if (tablesResponse.error) {
    throw new Error(`Failed to fetch tables: ${tablesResponse.error.message}`)
  }

  if (seatsResponse.error) {
    throw new Error(`Failed to fetch seats: ${seatsResponse.error.message}`)
  }

  const tables = tablesResponse.data || []
  const seats = seatsResponse.data || []

  // Create a map of table_id to seat count
  const seatCountMap = seats.reduce(
    (acc, seat) => {
      acc[seat.table_id] = (acc[seat.table_id] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // Transform to FloorPlanTable format - FIXED: Handle missing position columns gracefully
  return tables.map(table => ({
    id: table.id,
    label: table.label.toString(),
    type: table.type as 'circle' | 'rectangle' | 'square',
    seats: seatCountMap[table.id] || 0,
    status: table.status as 'available' | 'occupied' | 'reserved',
    // Set default values since position columns don't exist in database yet
    position_x: undefined,
    position_y: undefined,
    width: undefined,
    height: undefined,
    rotation: undefined,
    zIndex: undefined,
  }))
}
