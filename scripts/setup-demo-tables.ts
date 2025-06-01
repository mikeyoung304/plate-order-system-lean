/**
 * Demo table setup script with intelligent layout
 * Creates an optimized restaurant floor plan with proper table positioning
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface TableLayout {
  label: number
  type: 'circle' | 'rectangle'
  seats: number
  position_x: number
  position_y: number
  width: number
  height: number
  section: string
  description: string
}

// Intelligent table layout with realistic restaurant positioning
const optimalLayout: TableLayout[] = [
  {
    label: 1,
    type: 'circle',
    seats: 4,
    position_x: 150,
    position_y: 120,
    width: 80,
    height: 80,
    section: 'A',
    description: 'Front window table, 4-top round'
  },
  {
    label: 2,
    type: 'circle',
    seats: 4,
    position_x: 450,
    position_y: 120,
    width: 80,
    height: 80,
    section: 'C',
    description: 'Front corner table, 4-top round'
  },
  {
    label: 3,
    type: 'circle',
    seats: 6,
    position_x: 150,
    position_y: 280,
    width: 100,
    height: 100,
    section: 'A',
    description: 'Back section, 6-top round family table'
  },
  {
    label: 4,
    type: 'rectangle',
    seats: 2,
    position_x: 450,
    position_y: 300,
    width: 60,
    height: 60,
    section: 'C',
    description: 'Intimate bistro table, 2-top'
  },
  {
    label: 5,
    type: 'rectangle',
    seats: 8,
    position_x: 300,
    position_y: 200,
    width: 120,
    height: 60,
    section: 'B',
    description: 'Center feature table, 8-top rectangular'
  },
  {
    label: 6,
    type: 'rectangle',
    seats: 6,
    position_x: 450,
    position_y: 200,
    width: 100,
    height: 50,
    section: 'C',
    description: 'Mid-section, 6-top rectangular'
  }
]

async function setupOptimalTableLayout() {
  console.log('🍽️  Setting up optimal restaurant table layout...')

  try {
    // Update existing tables with optimal positioning
    for (const table of optimalLayout) {
      console.log(`📍 Positioning Table ${table.label} (${table.description})`)
      
      const { error: updateError } = await supabase
        .from('tables')
        .update({
          type: table.type,
          position_x: table.position_x,
          position_y: table.position_y,
          width: table.width,
          height: table.height,
          rotation: 0,
          z_index: 1
        })
        .eq('label', table.label)

      if (updateError) {
        console.error(`❌ Error updating table ${table.label}:`, updateError)
        continue
      }

      // Get table ID for seat management
      const { data: tableData, error: selectError } = await supabase
        .from('tables')
        .select('id')
        .eq('label', table.label)
        .single()

      if (selectError || !tableData) {
        console.error(`❌ Could not find table ${table.label}`)
        continue
      }

      // Adjust seat count if needed
      const { data: currentSeats } = await supabase
        .from('seats')
        .select('id')
        .eq('table_id', tableData.id)

      const currentSeatCount = currentSeats?.length || 0
      
      if (currentSeatCount !== table.seats) {
        if (currentSeatCount > table.seats) {
          // Remove excess seats
          const seatsToRemove = currentSeatCount - table.seats
          const seatsToDelete = currentSeats?.slice(-seatsToRemove) || []
          
          for (const seat of seatsToDelete) {
            await supabase
              .from('seats')
              .delete()
              .eq('id', seat.id)
          }
          console.log(`🪑 Removed ${seatsToRemove} seats from Table ${table.label}`)
        } else {
          // Add missing seats
          const seatsToAdd = table.seats - currentSeatCount
          const newSeats = []
          
          for (let i = 1; i <= seatsToAdd; i++) {
            newSeats.push({
              table_id: tableData.id,
              label: currentSeatCount + i,
              status: 'available'
            })
          }
          
          await supabase
            .from('seats')
            .insert(newSeats)
          console.log(`🪑 Added ${seatsToAdd} seats to Table ${table.label}`)
        }
      }

      console.log(`✅ Table ${table.label} optimized: ${table.seats} seats at Section ${table.section}`)
    }

    // Add some realistic sample orders for demo
    console.log('\n🍳 Adding sample orders for demonstration...')
    
    // Get some table and seat IDs for sample orders
    const { data: tables } = await supabase
      .from('tables')
      .select('id, label')
      .limit(3)

    if (tables && tables.length > 0) {
      const sampleOrders = [
        {
          table_id: tables[0].id,
          items: ['Grilled Salmon', 'Caesar Salad', 'Sparkling Water'],
          status: 'in_progress',
          type: 'food',
          transcript: 'grilled salmon, caesar salad, sparkling water'
        },
        {
          table_id: tables[1].id, 
          items: ['Ribeye Steak', 'Mashed Potatoes', 'Red Wine'],
          status: 'new',
          type: 'food',
          transcript: 'ribeye steak, mashed potatoes, red wine'
        },
        {
          table_id: tables[0].id,
          items: ['Coffee', 'Chocolate Cake'],
          status: 'ready',
          type: 'beverage',
          transcript: 'coffee, chocolate cake'
        }
      ]

      for (const order of sampleOrders) {
        const { error } = await supabase
          .from('orders')
          .insert([order])
        
        if (!error) {
          console.log(`📝 Added sample order for Table ${tables.find(t => t.id === order.table_id)?.label}`)
        }
      }
    }

    console.log('\n🎉 Optimal table layout complete!')
    console.log('\n📊 Restaurant Layout Summary:')
    console.log('   Section A (Left): Tables 1, 3 - Window seating')
    console.log('   Section B (Center): Table 5 - Feature table') 
    console.log('   Section C (Right): Tables 2, 4, 6 - Corner/wall seating')
    console.log('\n🚀 Ready for 2-click navigation testing!')

  } catch (error) {
    console.error('❌ Error setting up table layout:', error)
    process.exit(1)
  }
}

// Run the setup
setupOptimalTableLayout()