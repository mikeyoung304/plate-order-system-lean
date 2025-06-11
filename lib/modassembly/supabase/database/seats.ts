import { createClient } from '@/lib/modassembly/supabase/client'

/**
 * Fetch a seat ID based on table and seat label
 */
export async function fetchSeatId(
  tableId: string,
  seatLabel: number
): Promise<string | null> {
  const supabase = createClient()
  const seatData = await supabase
    .from('seats')
    .select('id')
    .eq('table_id', tableId)
    .eq('label', seatLabel)
    .single()

  if (seatData.error || !seatData.data) {
    console.error('Error fetching seat:', seatData.error)
    return null
  }

  return seatData.data.id
}

/**
 * Seat interface
 */
export interface Seat {
  id: string
  table_id: string
  label: number
  position_x: number
  position_y: number
  created_at?: string
}

// Additional CRUD functions following Luis's patterns
export async function createSeatsForTable(
  tableId: string,
  seatCount: number
): Promise<void> {
  const supabase = createClient()

  // Create seats with basic labels (1, 2, 3, etc.)
  const seats = Array.from({ length: seatCount }, (_, i) => ({
    table_id: tableId,
    label: i + 1,
    position_x: 0, // Default positions - would need floor plan logic for real positioning
    position_y: 0,
  }))

  const { error } = await supabase.from('seats').insert(seats)

  if (error) {
    console.error('Error creating seats:', error)
    throw new Error(`Failed to create seats: ${error.message}`)
  }
}

export async function updateSeatsForTable(
  tableId: string,
  newSeatCount: number
): Promise<void> {
  const supabase = createClient()

  // Get current seats for this table
  const { data: currentSeats, error: fetchError } = await supabase
    .from('seats')
    .select('id, label')
    .eq('table_id', tableId)
    .order('label')

  if (fetchError) {
    console.error('Error fetching current seats:', fetchError)
    throw new Error(`Failed to fetch current seats: ${fetchError.message}`)
  }

  const currentSeatCount = currentSeats?.length || 0

  if (newSeatCount > currentSeatCount) {
    // Add new seats
    const seatsToAdd = Array.from(
      { length: newSeatCount - currentSeatCount },
      (_, i) => ({
        table_id: tableId,
        label: currentSeatCount + i + 1,
        position_x: 0,
        position_y: 0,
      })
    )

    const { error: insertError } = await supabase
      .from('seats')
      .insert(seatsToAdd)

    if (insertError) {
      console.error('Error adding seats:', insertError)
      throw new Error(`Failed to add seats: ${insertError.message}`)
    }
  } else if (newSeatCount < currentSeatCount) {
    // Remove excess seats (highest label numbers first)
    const seatsToRemove =
      currentSeats?.slice(newSeatCount)?.map(seat => seat.id) || []

    if (seatsToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('seats')
        .delete()
        .in('id', seatsToRemove)

      if (deleteError) {
        console.error('Error removing seats:', deleteError)
        throw new Error(`Failed to remove seats: ${deleteError.message}`)
      }
    }
  }
}

export async function deleteSeatsForTable(tableId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('seats')
    .delete()
    .eq('table_id', tableId)

  if (error) {
    console.error('Error deleting seats:', error)
    throw new Error(`Failed to delete seats: ${error.message}`)
  }
}
