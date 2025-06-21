import {
  KDSConfiguration as DatabaseKDSConfiguration,
  KDSMetric as DatabaseKDSMetric,
  KDSOrderRouting as DatabaseKDSOrderRouting,
  KDSStation as DatabaseKDSStation,
  OrderType,
} from '@/types/database'

// Re-export database types for backward compatibility
export type KDSStation = DatabaseKDSStation
export type KDSOrderRouting = DatabaseKDSOrderRouting & {
  // Joined data
  order?: {
    id: string
    table_id: string
    seat_id: string
    server_id?: string
    items: any[]
    transcript?: string
    status: string
    type: OrderType
    created_at: string
    special_requests?: string
    estimated_prep_time?: number
    actual_prep_time?: number
    server?: {
      name: string
    }
    table?: {
      id: string
      label: string
    }
    seat?: {
      id: string
      label: string
    }
    resident?: {
      name: string
    }
  }
  station?: KDSStation
}
export type KDSMetric = DatabaseKDSMetric
export type KDSConfiguration = DatabaseKDSConfiguration

// Additional shared types for the KDS modules
export interface RoutingTarget {
  station: KDSStation
  priority: number
  sequence: number
}

export interface RoutingRules {
  [stationType: string]: string[]
}

export interface TableSummary {
  table_id: string
  table_label: string
  active_orders: number
  total_items: number
  avg_wait_time: number
  status: 'waiting' | 'preparing' | 'ready' | 'served'
}

export interface StationPerformance {
  station_id: string
  station_name: string
  avg_prep_time: number
  orders_completed: number
  current_load: number
  efficiency_score: number
}