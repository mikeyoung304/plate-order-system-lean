// Station-specific components for Kitchen Display System
// These components handle domain-specific order processing and display

export { GrillStation } from './GrillStation'
export { FryerStation } from './FryerStation'
export { SaladStation } from './SaladStation'
export { ExpoStation } from './ExpoStation'
export { BarStation } from './BarStation'

// Station types for configuration
export const STATION_TYPES = {
  grill: 'grill',
  fryer: 'fryer',
  salad: 'salad',
  expo: 'expo',
  bar: 'bar',
  all: 'all',
} as const

export type StationType = keyof typeof STATION_TYPES

// Station configuration
export const STATION_CONFIG = {
  grill: {
    name: 'Grill Station',
    icon: 'Flame',
    color: 'orange',
    items: ['steak', 'burger', 'chicken', 'fish', 'sausage', 'grill'],
  },
  fryer: {
    name: 'Fryer Station',
    icon: 'Zap',
    color: 'yellow',
    items: ['fries', 'rings', 'nuggets', 'wings', 'calamari', 'tempura', 'fried'],
  },
  salad: {
    name: 'Salad Station',
    icon: 'Leaf',
    color: 'green',
    items: ['salad', 'soup', 'gazpacho', 'ceviche', 'appetizer', 'cold'],
  },
  expo: {
    name: 'Expo Station',
    icon: 'Eye',
    color: 'purple',
    items: [], // Expo handles all completed orders
  },
  bar: {
    name: 'Bar Station',
    icon: 'Wine',
    color: 'purple',
    items: ['wine', 'beer', 'cocktail', 'martini', 'mojito', 'margarita', 'coffee', 'espresso', 'latte', 'drink'],
  },
}

// Helper function to determine which station an order belongs to
export function getOrderStation(order: any): StationType {
  const items = order.items || []
  
  for (const [stationType, config] of Object.entries(STATION_CONFIG)) {
    if (stationType === 'expo') {continue} // Expo is special case
    
    const hasStationItems = items.some((item: string) => 
      config.items.some(stationItem => 
        item.toLowerCase().includes(stationItem)
      )
    )
    
    if (hasStationItems) {
      return stationType as StationType
    }
  }
  
  return 'grill' // Default to grill if no specific station found
}

// Helper function to filter orders by station
export function filterOrdersByStation(orders: any[], stationType: StationType): any[] {
  if (stationType === 'all') {return orders}
  if (stationType === 'expo') {
    // Expo shows orders that are ready or nearly complete
    return orders.filter(order => {
      const completedItems = order.completed_items?.length || 0
      const totalItems = order.items?.length || 1
      const completeness = (completedItems / totalItems) * 100
      return order.status === 'ready' || completeness >= 80
    })
  }
  
  const config = STATION_CONFIG[stationType]
  if (!config) {return []}
  
  return orders.filter(order => {
    const items = order.items || []
    return items.some((item: string) => 
      config.items.some(stationItem => 
        item.toLowerCase().includes(stationItem)
      )
    )
  })
}