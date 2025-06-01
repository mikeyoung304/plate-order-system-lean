#!/usr/bin/env tsx
/**
 * PLATER RESTAURANT DEMO STATE GENERATOR
 * 
 * Creates realistic, intelligent demo data that makes the restaurant feel alive and busy.
 * This script generates:
 * - Realistic table occupancy patterns with resident assignments
 * - Active orders in various states (new, preparing, ready)
 * - Live kitchen queue with appropriate preparation timing
 * - Performance metrics and analytics data
 * 
 * INTELLIGENT DEFAULTS MISSION:
 * Transform empty demo into bustling restaurant operations
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Environment setup
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eiipozoogrrfudhjoqms.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// REALISTIC RESTAURANT DATA
const RESIDENTS = [
  { name: 'Margaret Thompson', dietary_restrictions: 'vegetarian, low sodium' },
  { name: 'Robert Chen', dietary_restrictions: 'diabetic' },
  { name: 'Dorothy Williams', dietary_restrictions: 'gluten-free' },
  { name: 'Frank Rodriguez', dietary_restrictions: null },
  { name: 'Helen Davis', dietary_restrictions: 'lactose intolerant' },
  { name: 'Charles Johnson', dietary_restrictions: 'heart healthy' },
  { name: 'Betty Anderson', dietary_restrictions: null },
  { name: 'Harold Wilson', dietary_restrictions: 'soft foods only' },
  { name: 'Ruth Garcia', dietary_restrictions: 'diabetic, low sodium' },
  { name: 'George Martinez', dietary_restrictions: null },
  { name: 'Patricia Lewis', dietary_restrictions: 'vegetarian' },
  { name: 'James Clark', dietary_restrictions: null },
]

const SERVERS = [
  { name: 'Sarah Mitchell', role: 'server' },
  { name: 'Michael Torres', role: 'server' },
  { name: 'Ashley Brown', role: 'server' },
  { name: 'David Kim', role: 'server' },
]

const COOKS = [
  { name: 'Chef Rodriguez', role: 'cook' },
  { name: 'Lisa Chen', role: 'cook' },
  { name: 'Marcus Johnson', role: 'cook' },
]

// MENU ITEMS BY CATEGORY
const MENU_ITEMS = {
  breakfast: [
    'scrambled eggs', 'toast', 'bacon', 'pancakes', 'oatmeal', 'fruit bowl',
    'coffee', 'orange juice', 'yogurt', 'muffin'
  ],
  lunch: [
    'grilled chicken', 'caesar salad', 'soup of the day', 'sandwich',
    'french fries', 'grilled vegetables', 'pasta', 'fish and chips',
    'burger', 'mashed potatoes', 'green beans', 'dinner roll'
  ],
  dinner: [
    'roast beef', 'baked salmon', 'chicken parmesan', 'pork chops',
    'meatloaf', 'lasagna', 'rice pilaf', 'steamed broccoli',
    'garlic bread', 'house salad', 'baked potato', 'apple pie'
  ],
  beverages: [
    'coffee', 'tea', 'water', 'orange juice', 'milk', 'iced tea',
    'soda', 'apple juice', 'hot chocolate', 'lemonade'
  ]
}

// INTELLIGENT ORDER GENERATION
function generateRealisticOrder(mealType: 'breakfast' | 'lunch' | 'dinner' = 'lunch'): string[] {
  const items: string[] = []
  const menuItems = MENU_ITEMS[mealType]
  const beverages = MENU_ITEMS.beverages
  
  // Main items (2-4 items)
  const mainItemCount = Math.floor(Math.random() * 3) + 2
  const selectedItems = [...menuItems].sort(() => 0.5 - Math.random()).slice(0, mainItemCount)
  items.push(...selectedItems)
  
  // Always include a beverage
  const beverage = beverages[Math.floor(Math.random() * beverages.length)]
  items.push(beverage)
  
  return items
}

// TIME SIMULATION
function getRealisticTimestamp(minutesAgo: number): string {
  const now = new Date()
  now.setMinutes(now.getMinutes() - minutesAgo)
  return now.toISOString()
}

// ORDER STATUS DISTRIBUTION (realistic kitchen flow)
const ORDER_STATUSES = [
  { status: 'new', weight: 0.2, avgAge: 2 },           // 20% - just arrived
  { status: 'in_progress', weight: 0.5, avgAge: 8 },   // 50% - being prepared  
  { status: 'ready', weight: 0.25, avgAge: 15 },       // 25% - ready for pickup
  { status: 'delivered', weight: 0.05, avgAge: 25 },   // 5% - recently delivered
]

class DemoStateGenerator {
  private profiles: any[] = []
  private tables: any[] = []
  private stations: any[] = []

  async run() {
    console.log('🚀 PLATER DEMO STATE GENERATOR')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    try {
      await this.setupProfiles()
      await this.fetchTables()
      await this.fetchStations()
      await this.generateTableOccupancy()
      await this.generateActiveOrders()
      // Skip KDS queue generation if tables don't exist
      if (this.stations.length > 0 && this.stations[0].id.includes('station-')) {
        console.log('   ⚠️  Skipping KDS queue generation (tables not available)')
        console.log('   ⚠️  Skipping metrics generation (KDS tables not available)')
      } else {
        await this.generateKDSQueue()
        await this.generateMetrics()
      }
      
      console.log('✅ Demo state generation completed successfully!')
      console.log('🎯 Restaurant is now live and bustling!')
      
    } catch (error) {
      console.error('❌ Demo state generation failed:', error)
      process.exit(1)
    }
  }

  async setupProfiles() {
    console.log('👥 Setting up user profiles...')
    
    // Try to fetch existing profiles first
    const { data: existingProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
    
    if (!fetchError && existingProfiles && existingProfiles.length > 0) {
      this.profiles = existingProfiles.map(profile => ({
        ...profile,
        type: profile.role || 'resident'
      }))
      console.log(`   ✓ Found ${this.profiles.length} existing profiles`)
      return
    }
    
    // If no profiles exist, create mock profiles for demo purposes
    console.log('   📝 Creating mock profiles for demo...')
    
    // Create mock residents
    RESIDENTS.forEach((resident, index) => {
      this.profiles.push({
        id: `resident-${index + 1}`,
        user_id: `user-resident-${index + 1}`,
        role: 'resident',
        name: resident.name,
        dietary_restrictions: resident.dietary_restrictions,
        type: 'resident'
      })
    })
    
    // Create mock servers
    SERVERS.forEach((server, index) => {
      this.profiles.push({
        id: `server-${index + 1}`,
        user_id: `user-server-${index + 1}`,
        role: server.role,
        name: server.name,
        type: 'server'
      })
    })
    
    // Create mock cooks
    COOKS.forEach((cook, index) => {
      this.profiles.push({
        id: `cook-${index + 1}`,
        user_id: `user-cook-${index + 1}`,
        role: cook.role,
        name: cook.name,
        type: 'cook'
      })
    })

    console.log(`   ✓ Created ${this.profiles.length} mock profiles`)
  }

  async fetchTables() {
    console.log('🪑 Fetching table configuration...')
    
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .order('label')
    
    if (error) throw error
    
    this.tables = data || []
    console.log(`   ✓ Found ${this.tables.length} tables`)
  }

  async fetchStations() {
    console.log('🏭 Fetching KDS stations...')
    
    const { data, error } = await supabase
      .from('kds_stations')
      .select('*')
      .eq('is_active', true)
      .order('position')
    
    if (error) {
      if (error.code === '42P01') {
        console.log('   ⚠️  KDS tables not found, creating default stations...')
        await this.createDefaultStations()
        return
      }
      throw error
    }
    
    this.stations = data || []
    console.log(`   ✓ Found ${this.stations.length} active stations`)
  }

  async createDefaultStations() {
    // Create a simple version of KDS stations if they don't exist
    console.log('   📝 Creating default KDS configuration...')
    
    const defaultStations = [
      { name: 'Grill Station', type: 'grill', position: 1 },
      { name: 'Fryer Station', type: 'fryer', position: 2 },
      { name: 'Salad Station', type: 'salad', position: 3 },
      { name: 'Expo Station', type: 'expo', position: 4 },
      { name: 'Bar Station', type: 'bar', position: 5 },
    ]
    
    // For now, just create mock stations for the demo
    this.stations = defaultStations.map((station, index) => ({
      id: `station-${index + 1}`,
      ...station,
      color: ['#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#06B6D4'][index],
      is_active: true,
      settings: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))
    
    console.log(`   ✓ Created ${this.stations.length} default stations`)
  }

  async generateTableOccupancy() {
    console.log('🎯 Generating intelligent table occupancy...')
    
    const residents = this.profiles.filter(p => p.type === 'resident')
    
    // Assign residents to seats with realistic patterns
    for (const table of this.tables) {
      // 60% chance table is occupied during meal time
      const isOccupied = Math.random() < 0.6
      
      if (isOccupied) {
        // Get seats for this table
        const { data: seats } = await supabase
          .from('seats')
          .select('*')
          .eq('table_id', table.id)
          .order('label')
        
        if (seats && seats.length > 0) {
          // Occupy 70-100% of seats
          const occupiedSeatCount = Math.max(1, Math.floor(seats.length * (0.7 + Math.random() * 0.3)))
          
          for (let i = 0; i < occupiedSeatCount; i++) {
            const seat = seats[i]
            const resident = residents[Math.floor(Math.random() * residents.length)]
            
            await supabase
              .from('seats')
              .update({
                resident_id: resident.id,
                status: 'occupied'
              })
              .eq('id', seat.id)
          }
          
          // Update table status
          await supabase
            .from('tables')
            .update({ status: 'occupied' })
            .eq('id', table.id)
        }
      }
    }
    
    console.log('   ✓ Applied realistic occupancy patterns')
  }

  async generateActiveOrders() {
    console.log('📋 Generating active order queue...')
    
    const residents = this.profiles.filter(p => p.type === 'resident')
    const servers = this.profiles.filter(p => p.type === 'server')
    
    // Generate 8-12 active orders
    const orderCount = Math.floor(Math.random() * 5) + 8
    
    for (let i = 0; i < orderCount; i++) {
      // Select random resident and server
      const resident = residents[Math.floor(Math.random() * residents.length)]
      const server = servers[Math.floor(Math.random() * servers.length)]
      
      // Get occupied seats to assign orders to
      const { data: occupiedSeats } = await supabase
        .from('seats')
        .select('id, table_id, label')
        .eq('status', 'occupied')
      
      if (!occupiedSeats || occupiedSeats.length === 0) continue
      
      const seat = occupiedSeats[Math.floor(Math.random() * occupiedSeats.length)]
      
      // Choose realistic order status and timing
      const statusInfo = this.chooseOrderStatus()
      const createdAt = getRealisticTimestamp(statusInfo.avgAge + Math.floor(Math.random() * 10))
      
      // Generate realistic order items
      const orderType = Math.random() < 0.8 ? 'food' : 'beverage'
      const items = orderType === 'food' 
        ? generateRealisticOrder('lunch')
        : [MENU_ITEMS.beverages[Math.floor(Math.random() * MENU_ITEMS.beverages.length)]]
      
      // Create the order
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          table_id: seat.table_id,
          seat_id: seat.id,
          resident_id: resident.id,
          server_id: server.id,
          items: items,
          transcript: `Order for ${resident.name}: ${items.join(', ')}`,
          type: orderType,
          status: statusInfo.status,
          created_at: createdAt,
        })
        .select()
        .single()
      
      if (error) {
        console.log(`   ⚠️  Error creating order: ${error.message}`)
        continue
      }
    }
    
    console.log(`   ✓ Generated ${orderCount} active orders`)
  }

  chooseOrderStatus() {
    const random = Math.random()
    let cumulative = 0
    
    for (const status of ORDER_STATUSES) {
      cumulative += status.weight
      if (random <= cumulative) {
        return status
      }
    }
    
    return ORDER_STATUSES[0] // Fallback
  }

  async generateKDSQueue() {
    console.log('👨‍🍳 Populating KDS queue with realistic orders...')
    
    // Get all in_progress orders for KDS routing
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('type', 'food')
      .in('status', ['new', 'in_progress'])
    
    if (!orders || orders.length === 0) {
      console.log('   ⚠️  No food orders found for KDS routing')
      return
    }
    
    for (const order of orders) {
      // Route to appropriate stations based on intelligent logic
      const stations = this.getStationsForOrder(order.items)
      
      let sequence = 1
      for (const station of stations) {
        const routedAt = getRealisticTimestamp(Math.floor(Math.random() * 15) + 5)
        const priority = Math.floor(Math.random() * 3) + 1
        
        // Determine if this station step is started/completed
        const isStarted = Math.random() < 0.7 // 70% chance started
        const isCompleted = isStarted && Math.random() < 0.4 // 40% of started are completed
        
        const routingData: any = {
          order_id: order.id,
          station_id: station.id,
          sequence: sequence++,
          priority: priority,
          routed_at: routedAt,
        }
        
        if (isStarted) {
          routingData.started_at = getRealisticTimestamp(Math.floor(Math.random() * 10) + 2)
        }
        
        if (isCompleted) {
          routingData.completed_at = getRealisticTimestamp(Math.floor(Math.random() * 5) + 1)
          
          // Add realistic prep time
          const prepTimeMinutes = this.getRealisticPrepTime(station.type)
          routingData.actual_prep_time = prepTimeMinutes * 60
        }
        
        await supabase
          .from('kds_order_routing')
          .insert(routingData)
      }
    }
    
    console.log('   ✓ KDS queue populated with realistic workflow')
  }

  getStationsForOrder(items: string[]): any[] {
    const itemText = items.join(' ').toLowerCase()
    const selectedStations: any[] = []
    
    // Grill station for meat items
    if (itemText.includes('chicken') || itemText.includes('beef') || itemText.includes('burger') || itemText.includes('steak')) {
      const grillStation = this.stations.find(s => s.type === 'grill')
      if (grillStation) selectedStations.push(grillStation)
    }
    
    // Fryer station for fried items
    if (itemText.includes('fries') || itemText.includes('fried') || itemText.includes('chips')) {
      const fryerStation = this.stations.find(s => s.type === 'fryer')
      if (fryerStation) selectedStations.push(fryerStation)
    }
    
    // Salad station for fresh items
    if (itemText.includes('salad') || itemText.includes('vegetables') || itemText.includes('fresh')) {
      const saladStation = this.stations.find(s => s.type === 'salad')
      if (saladStation) selectedStations.push(saladStation)
    }
    
    // Always end with expo for coordination
    const expoStation = this.stations.find(s => s.type === 'expo')
    if (expoStation && !selectedStations.find(s => s.id === expoStation.id)) {
      selectedStations.push(expoStation)
    }
    
    // If no specific stations, use prep and expo
    if (selectedStations.length === 0) {
      const prepStation = this.stations.find(s => s.type === 'prep')
      if (prepStation) selectedStations.push(prepStation)
      if (expoStation) selectedStations.push(expoStation)
    }
    
    return selectedStations
  }

  getRealisticPrepTime(stationType: string): number {
    const prepTimes = {
      grill: 12,      // 12 minutes for grilled items
      fryer: 6,       // 6 minutes for fried items
      salad: 4,       // 4 minutes for salads
      prep: 8,        // 8 minutes for prep work
      expo: 3,        // 3 minutes for expediting
      bar: 5,         // 5 minutes for beverages
      dessert: 7,     // 7 minutes for desserts
    }
    
    return prepTimes[stationType as keyof typeof prepTimes] || 8
  }

  async generateMetrics() {
    console.log('📊 Generating performance metrics...')
    
    // Generate hourly metrics for today
    const today = new Date()
    const hoursToGenerate = Math.min(new Date().getHours() + 1, 12) // Up to current hour or 12 hours
    
    for (let hour = Math.max(0, hoursToGenerate - 8); hour < hoursToGenerate; hour++) {
      for (const station of this.stations) {
        // Generate realistic metrics for this hour
        const prepTime = this.getRealisticPrepTime(station.type) * 60 // Convert to seconds
        const variance = prepTime * 0.3 // 30% variance
        
        // Generate 3-8 metrics per hour per station
        const metricCount = Math.floor(Math.random() * 6) + 3
        
        for (let i = 0; i < metricCount; i++) {
          const actualPrepTime = Math.floor(prepTime + (Math.random() - 0.5) * variance)
          
          await supabase
            .from('kds_metrics')
            .insert({
              station_id: station.id,
              metric_type: 'prep_time',
              value_seconds: Math.max(60, actualPrepTime), // Minimum 1 minute
              recorded_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, Math.floor(Math.random() * 60)).toISOString(),
              shift_date: today.toISOString().split('T')[0],
              hour_of_day: hour,
            })
        }
      }
    }
    
    console.log(`   ✓ Generated metrics for ${hoursToGenerate} hours across ${this.stations.length} stations`)
  }
}

// Execute the demo state generator
async function main() {
  const generator = new DemoStateGenerator()
  await generator.run()
}

main().catch(console.error)