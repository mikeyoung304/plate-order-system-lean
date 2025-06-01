// AI: Created demo data seeder for Plate Order System

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DEMO_RESIDENTS = [
  {
    name: 'Dorothy Johnson',
    email: 'dorothy@platetest.com',
    nickname: 'Dot',
    dietary_restrictions: 'No onions, extra butter preferred',
    favorite_items: ['Grilled cheese', 'Tomato soup', 'Sweet tea'],
    usual_table: 'Table 5',
    usual_seat: 1,
    personality: 'Sweet and talkative, loves comfort food',
  },
  {
    name: 'Harold Martinez',
    email: 'harold@platetest.com',
    nickname: 'Harry',
    dietary_restrictions: 'Diabetic - low sugar',
    favorite_items: [
      'Grilled chicken',
      'Steamed vegetables',
      'Unsweetened tea',
    ],
    usual_table: 'Table 3',
    usual_seat: 2,
    personality: 'Practical and health-conscious',
  },
  {
    name: "Margaret O'Brien",
    email: 'margaret@platetest.com',
    nickname: 'Maggie',
    dietary_restrictions: 'Soft foods only',
    favorite_items: ['Meatloaf', 'Mashed potatoes', 'Chocolate pudding'],
    usual_table: 'Table 1',
    usual_seat: 1,
    personality: 'Gentle and appreciative',
  },
  {
    name: 'Frank Thompson',
    email: 'frank@platetest.com',
    nickname: 'Frankie',
    dietary_restrictions: 'No fish, loves spicy food',
    favorite_items: ['BBQ ribs', 'Mac and cheese', 'Spicy wings'],
    usual_table: 'Table 2',
    usual_seat: 3,
    personality: 'Outgoing and loves bold flavors',
  },
  {
    name: 'Eleanor Davis',
    email: 'eleanor@platetest.com',
    nickname: 'Ellie',
    dietary_restrictions: 'Vegetarian',
    favorite_items: ['Garden salad', 'Vegetable soup', 'Fruit parfait'],
    usual_table: 'Table 4',
    usual_seat: 2,
    personality: 'Thoughtful and health-focused',
  },
  {
    name: 'Robert Wilson',
    email: 'robert@platetest.com',
    nickname: 'Bob',
    dietary_restrictions: 'Low sodium',
    favorite_items: ['Baked salmon', 'Rice pilaf', 'Green beans'],
    usual_table: 'Table 6',
    usual_seat: 1,
    personality: 'Quiet and appreciates simple, well-prepared meals',
  },
  {
    name: 'Betty Lou Parker',
    email: 'betty@platetest.com',
    nickname: 'Betty Lou',
    dietary_restrictions: 'Gluten-free',
    favorite_items: ['Grilled chicken salad', 'Quinoa bowl', 'Fresh fruit'],
    usual_table: 'Table 7',
    usual_seat: 2,
    personality: 'Energetic and health-conscious',
  },
  {
    name: 'William Anderson',
    email: 'william@platetest.com',
    nickname: 'Bill',
    dietary_restrictions: 'Heart-healthy diet',
    favorite_items: ['Lean turkey sandwich', 'Vegetable soup', 'Oatmeal'],
    usual_table: 'Table 8',
    usual_seat: 1,
    personality: 'Methodical and follows doctor recommendations',
  },
]

const DEMO_STAFF = [
  {
    name: 'Sarah Mitchell',
    email: 'sarah@platestaff.com',
    role: 'server',
    personality: 'Warm and attentive, knows all residents by name',
  },
  {
    name: 'Maria Garcia',
    email: 'maria@platestaff.com',
    role: 'server',
    personality: 'Efficient and caring, excellent with dietary restrictions',
  },
  {
    name: 'Chef Antoine Dubois',
    email: 'antoine@platestaff.com',
    role: 'cook',
    personality: 'Experienced chef who takes pride in nutrition and taste',
  },
  {
    name: 'James Cook',
    email: 'james@platestaff.com',
    role: 'cook',
    personality: 'Reliable line cook, great at managing multiple orders',
  },
  {
    name: 'Administrator Lisa Chen',
    email: 'lisa@platestaff.com',
    role: 'admin',
    personality: 'Organized facility manager who oversees operations',
  },
]

const SAMPLE_MENU_ITEMS = {
  breakfast: [
    'Scrambled eggs',
    'French toast',
    'Oatmeal with berries',
    'Bacon',
    'Sausage links',
    'Hash browns',
    'Fresh fruit cup',
    'Yogurt parfait',
    'Pancakes',
    'English muffin',
  ],
  lunch: [
    'Grilled chicken',
    'Meatloaf',
    'Fish and chips',
    'Chicken soup',
    'Caesar salad',
    'Turkey sandwich',
    'Mac and cheese',
    'Vegetable stir fry',
    'Beef stew',
    'Grilled cheese',
  ],
  dinner: [
    'Baked salmon',
    'BBQ ribs',
    'Roast beef',
    'Chicken parmesan',
    'Pork tenderloin',
    'Vegetable lasagna',
    'Mashed potatoes',
    'Green beans',
    'Rice pilaf',
    'Dinner roll',
  ],
  beverages: [
    'Coffee',
    'Tea',
    'Sweet tea',
    'Unsweetened tea',
    'Orange juice',
    'Apple juice',
    'Milk',
    'Water',
    'Hot chocolate',
    'Lemonade',
  ],
  desserts: [
    'Chocolate pudding',
    'Vanilla ice cream',
    'Apple pie',
    'Cookies',
    'Fresh fruit',
    'Jello',
    'Cake slice',
    'Sherbet',
    'Pie slice',
    'Brownies',
  ],
}

async function createDemoUsers() {
  console.log('🔑 Creating demo users...')

  const users = [...DEMO_RESIDENTS, ...DEMO_STAFF]

  for (const user of users) {
    try {
      // Create auth user
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: user.email,
          password: 'demo123!', // Simple demo password
          email_confirm: true,
          user_metadata: {
            name: user.name,
            role: (user as any).role || 'resident',
          },
        })

      if (authError) {
        console.log(`User ${user.email} may already exist:`, authError.message)
        continue
      }

      if (!authData.user) {
        console.error(`Failed to create user ${user.email}`)
        continue
      }

      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: authData.user.id,
          name: user.name,
          role: (user as any).role || 'resident',
          email: user.email,
          metadata: {
            nickname: (user as any).nickname,
            dietary_restrictions: (user as any).dietary_restrictions,
            favorite_items: (user as any).favorite_items,
            usual_table: (user as any).usual_table,
            usual_seat: (user as any).usual_seat,
            personality: (user as any).personality,
          },
        },
      ])

      if (profileError) {
        console.log(
          `Profile for ${user.email} may already exist:`,
          profileError.message
        )
      }

      // Assign role
      const { error: roleError } = await supabase.from('user_roles').insert([
        {
          user_id: authData.user.id,
          role: (user as any).role || 'resident',
        },
      ])

      if (roleError) {
        console.log(
          `Role for ${user.email} may already exist:`,
          roleError.message
        )
      }

      console.log(`✅ Created user: ${user.name} (${user.email})`)
    } catch (error) {
      console.error(`❌ Failed to create user ${user.name}:`, error)
    }
  }
}

async function createDemoTables() {
  console.log('🪑 Creating demo tables...')

  // Check if tables already exist
  const { data: existingTables } = await supabase
    .from('tables')
    .select('id')
    .limit(1)

  if (existingTables && existingTables.length > 0) {
    console.log('Demo tables already exist, skipping...')
    return
  }

  const tables = [
    {
      label: 1,
      type: 'circle',
      status: 'available',
      position_x: 100,
      position_y: 100,
      seats: 4,
    },
    {
      label: 2,
      type: 'rectangle',
      status: 'available',
      position_x: 250,
      position_y: 100,
      seats: 6,
    },
    {
      label: 3,
      type: 'square',
      status: 'available',
      position_x: 400,
      position_y: 100,
      seats: 4,
    },
    {
      label: 4,
      type: 'circle',
      status: 'available',
      position_x: 100,
      position_y: 250,
      seats: 4,
    },
    {
      label: 5,
      type: 'rectangle',
      status: 'available',
      position_x: 250,
      position_y: 250,
      seats: 6,
    },
    {
      label: 6,
      type: 'circle',
      status: 'available',
      position_x: 400,
      position_y: 250,
      seats: 4,
    },
    {
      label: 7,
      type: 'square',
      status: 'available',
      position_x: 100,
      position_y: 400,
      seats: 4,
    },
    {
      label: 8,
      type: 'circle',
      status: 'available',
      position_x: 250,
      position_y: 400,
      seats: 4,
    },
  ]

  for (const table of tables) {
    const { data: tableData, error: tableError } = await supabase
      .from('tables')
      .insert([
        {
          label: table.label,
          type: table.type,
          status: table.status,
        },
      ])
      .select()
      .single()

    if (tableError) {
      console.error(`Failed to create table ${table.label}:`, tableError)
      continue
    }

    // Create seats for the table
    const seats = []
    for (let i = 1; i <= table.seats; i++) {
      seats.push({
        table_id: tableData.id,
        label: i,
        status: 'available',
      })
    }

    const { error: seatsError } = await supabase.from('seats').insert(seats)

    if (seatsError) {
      console.error(
        `Failed to create seats for table ${table.label}:`,
        seatsError
      )
    } else {
      console.log(`✅ Created Table ${table.label} with ${table.seats} seats`)
    }
  }
}

async function createSampleOrders() {
  console.log('📝 Creating sample order history...')

  // Get residents and servers
  const { data: residents } = await supabase
    .from('profiles')
    .select('user_id, name')
    .eq('role', 'resident')

  const { data: servers } = await supabase
    .from('profiles')
    .select('user_id, name')
    .eq('role', 'server')

  const { data: tables } = await supabase.from('tables').select('id, label')

  const { data: seats } = await supabase
    .from('seats')
    .select('id, table_id, label')

  if (!residents || !servers || !tables || !seats) {
    console.log('Missing data for creating orders, skipping...')
    console.log('Debug info:')
    console.log('- Residents:', residents?.length || 0)
    console.log('- Servers:', servers?.length || 0)  
    console.log('- Tables:', tables?.length || 0)
    console.log('- Seats:', seats?.length || 0)
    return
  }

  // Create order history for each resident with sample favorite items
  for (const resident of residents) {
    // Use sample favorite items since metadata doesn't exist yet
    const favoriteItems = [
      'Grilled chicken', 'Meatloaf', 'Soup', 'Salad', 'Coffee', 'Tea'
    ]

    // Create 10-15 historical orders
    const orderCount = Math.floor(Math.random() * 6) + 10

    for (let i = 0; i < orderCount; i++) {
      const daysAgo = Math.floor(Math.random() * 30) + 1
      const orderDate = new Date()
      orderDate.setDate(orderDate.getDate() - daysAgo)

      // Pick a random table and seat
      const randomTable = tables[Math.floor(Math.random() * tables.length)]
      const tableSeats = seats.filter(s => s.table_id === randomTable.id)
      const randomSeat =
        tableSeats[Math.floor(Math.random() * tableSeats.length)]
      const randomServer = servers[Math.floor(Math.random() * servers.length)]

      // Create order with favorite items + some variety
      const orderItems = []

      // Include 1-2 favorite items
      const favItemCount = Math.floor(Math.random() * 2) + 1
      for (let j = 0; j < favItemCount; j++) {
        orderItems.push(
          favoriteItems[Math.floor(Math.random() * favoriteItems.length)]
        )
      }

      // Add 1-2 random menu items
      const menuCategories = Object.values(SAMPLE_MENU_ITEMS).flat()
      const randomItemCount = Math.floor(Math.random() * 2) + 1
      for (let j = 0; j < randomItemCount; j++) {
        orderItems.push(
          menuCategories[Math.floor(Math.random() * menuCategories.length)]
        )
      }

      const { error: orderError } = await supabase.from('orders').insert([
        {
          table_id: randomTable.id,
          seat_id: randomSeat.id,
          resident_id: resident.user_id,
          server_id: randomServer.user_id,
          items: orderItems,
          transcript: `Order for ${resident.name}: ${orderItems.join(', ')}`,
          status: 'delivered',
          type: Math.random() > 0.2 ? 'food' : 'drink',
          created_at: orderDate.toISOString(),
        },
      ])

      if (orderError) {
        console.error(
          `Failed to create order for ${resident.name}:`,
          orderError
        )
      }
    }

    console.log(`✅ Created order history for ${resident.name}`)
  }
}

async function seedDemo() {
  console.log('🌱 Seeding Plate demo data...')
  console.log('=====================================')

  try {
    await createDemoUsers()
    console.log('')
    await createDemoTables()
    console.log('')
    await createSampleOrders()

    console.log('')
    console.log('✅ Demo data seeded successfully!')
    console.log('')
    console.log('📋 Demo Login Credentials:')
    console.log('Admin: lisa@platestaff.com / demo123!')
    console.log('Server: sarah@platestaff.com / demo123!')
    console.log('Cook: antoine@platestaff.com / demo123!')
    console.log('Resident: dorothy@platetest.com / demo123!')
    console.log('')
    console.log('🎯 Key Features to Demo:')
    console.log('- Voice ordering with resident suggestions')
    console.log('- Kitchen Display System with real-time updates')
    console.log('- Floor plan editor with persistent table positions')
    console.log('- Order history and resident preferences')
    console.log('- Role-based access control')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

// Run if called directly
seedDemo().then(() => process.exit(0))
