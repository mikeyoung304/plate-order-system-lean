// Database Type Definitions for Plater Restaurant System
// Auto-generated and maintained for type safety

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string | null
          role: 'admin' | 'cook' | 'server' | 'resident'
          email: string | null
          dietary_restrictions: string[] | null
          preferences: Record<string, any> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string | null
          role: 'admin' | 'cook' | 'server' | 'resident'
          email?: string | null
          dietary_restrictions?: string[] | null
          preferences?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          role?: 'admin' | 'cook' | 'server' | 'resident'
          email?: string | null
          dietary_restrictions?: string[] | null
          preferences?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
      }
      tables: {
        Row: {
          id: string
          table_id: string
          label: string
          type: string
          status: 'available' | 'occupied' | 'cleaning' | 'reserved'
          position_x: number | null
          position_y: number | null
          rotation: number | null
          width: number | null
          height: number | null
          shape: 'rectangle' | 'circle' | 'oval' | null
          color: string | null
          floor_plan_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          table_id: string
          label: string
          type?: string
          status?: 'available' | 'occupied' | 'cleaning' | 'reserved'
          position_x?: number | null
          position_y?: number | null
          rotation?: number | null
          width?: number | null
          height?: number | null
          shape?: 'rectangle' | 'circle' | 'oval' | null
          color?: string | null
          floor_plan_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          table_id?: string
          label?: string
          type?: string
          status?: 'available' | 'occupied' | 'cleaning' | 'reserved'
          position_x?: number | null
          position_y?: number | null
          rotation?: number | null
          width?: number | null
          height?: number | null
          shape?: 'rectangle' | 'circle' | 'oval' | null
          color?: string | null
          floor_plan_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      seats: {
        Row: {
          id: string
          seat_id: string
          table_id: string
          label: number
          resident_id: string | null
          position_x: number | null
          position_y: number | null
          is_occupied: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          seat_id: string
          table_id: string
          label: number
          resident_id?: string | null
          position_x?: number | null
          position_y?: number | null
          is_occupied?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          seat_id?: string
          table_id?: string
          label?: number
          resident_id?: string | null
          position_x?: number | null
          position_y?: number | null
          is_occupied?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          table_id: string
          seat_id: string
          resident_id: string
          server_id: string
          items: string[]
          transcript: string | null
          status: 'new' | 'in_progress' | 'ready' | 'delivered' | 'cancelled'
          type: 'food' | 'drink'
          special_requests: string | null
          estimated_time: number | null
          actual_time: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          table_id: string
          seat_id: string
          resident_id: string
          server_id: string
          items: string[]
          transcript?: string | null
          status?: 'new' | 'in_progress' | 'ready' | 'delivered' | 'cancelled'
          type: 'food' | 'drink'
          special_requests?: string | null
          estimated_time?: number | null
          actual_time?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          table_id?: string
          seat_id?: string
          resident_id?: string
          server_id?: string
          items?: string[]
          transcript?: string | null
          status?: 'new' | 'in_progress' | 'ready' | 'delivered' | 'cancelled'
          type?: 'food' | 'drink'
          special_requests?: string | null
          estimated_time?: number | null
          actual_time?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      kds_stations: {
        Row: {
          id: string
          name: string
          type:
            | 'grill'
            | 'fryer'
            | 'salad'
            | 'expo'
            | 'bar'
            | 'prep'
            | 'dessert'
          color: string
          position: number
          is_active: boolean
          settings: Record<string, any> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type:
            | 'grill'
            | 'fryer'
            | 'salad'
            | 'expo'
            | 'bar'
            | 'prep'
            | 'dessert'
          color?: string
          position?: number
          is_active?: boolean
          settings?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?:
            | 'grill'
            | 'fryer'
            | 'salad'
            | 'expo'
            | 'bar'
            | 'prep'
            | 'dessert'
          color?: string
          position?: number
          is_active?: boolean
          settings?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
      }
      kds_order_routing: {
        Row: {
          id: string
          order_id: string
          station_id: string
          sequence: number
          routed_at: string
          started_at: string | null
          completed_at: string | null
          bumped_by: string | null
          bumped_at: string | null
          recalled_at: string | null
          recall_count: number
          estimated_prep_time: number | null
          actual_prep_time: number | null
          notes: string | null
          priority: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          station_id: string
          sequence?: number
          routed_at?: string
          started_at?: string | null
          completed_at?: string | null
          bumped_by?: string | null
          bumped_at?: string | null
          recalled_at?: string | null
          recall_count?: number
          estimated_prep_time?: number | null
          actual_prep_time?: number | null
          notes?: string | null
          priority?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          station_id?: string
          sequence?: number
          routed_at?: string
          started_at?: string | null
          completed_at?: string | null
          bumped_by?: string | null
          bumped_at?: string | null
          recalled_at?: string | null
          recall_count?: number
          estimated_prep_time?: number | null
          actual_prep_time?: number | null
          notes?: string | null
          priority?: number
          created_at?: string
          updated_at?: string
        }
      }
      kds_metrics: {
        Row: {
          id: string
          station_id: string
          metric_type: 'prep_time' | 'throughput' | 'efficiency' | 'errors'
          value_number: number | null
          value_seconds: number | null
          value_text: string | null
          recorded_at: string
          created_at: string
        }
        Insert: {
          id?: string
          station_id: string
          metric_type: 'prep_time' | 'throughput' | 'efficiency' | 'errors'
          value_number?: number | null
          value_seconds?: number | null
          value_text?: string | null
          recorded_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          station_id?: string
          metric_type?: 'prep_time' | 'throughput' | 'efficiency' | 'errors'
          value_number?: number | null
          value_seconds?: number | null
          value_text?: string | null
          recorded_at?: string
          created_at?: string
        }
      }
      kds_configuration: {
        Row: {
          id: string
          key: string
          value: any
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: any
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: any
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      kds_table_summary: {
        Row: {
          table_id: string
          table_label: string
          total_orders: number
          pending_orders: number
          ready_orders: number
          average_prep_time: number | null
          oldest_order_time: string | null
          priority_score: number
        }
      }
    }
    Functions: {
      bulk_bump_table_orders: {
        Args: {
          p_table_id: string
          p_user_id: string
        }
        Returns: number
      }
    }
    Enums: {
      user_role: 'admin' | 'cook' | 'server' | 'resident'
      order_status: 'new' | 'in_progress' | 'ready' | 'delivered' | 'cancelled'
      order_type: 'food' | 'drink'
      table_status: 'available' | 'occupied' | 'cleaning' | 'reserved'
      station_type:
        | 'grill'
        | 'fryer'
        | 'salad'
        | 'expo'
        | 'bar'
        | 'prep'
        | 'dessert'
      metric_type: 'prep_time' | 'throughput' | 'efficiency' | 'errors'
    }
  }
}

// Type helpers for common operations
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Common type aliases
export type Profile = Tables<'profiles'>
export type Table = Tables<'tables'>
export type Seat = Tables<'seats'>
export type Order = Tables<'orders'>
export type KDSStation = Tables<'kds_stations'>
export type KDSOrderRouting = Tables<'kds_order_routing'>
export type KDSMetric = Tables<'kds_metrics'>
export type KDSConfiguration = Tables<'kds_configuration'>

// Insert types
export type ProfileInsert = InsertTables<'profiles'>
export type TableInsert = InsertTables<'tables'>
export type SeatInsert = InsertTables<'seats'>
export type OrderInsert = InsertTables<'orders'>
export type KDSStationInsert = InsertTables<'kds_stations'>
export type KDSOrderRoutingInsert = InsertTables<'kds_order_routing'>

// Update types
export type ProfileUpdate = UpdateTables<'profiles'>
export type TableUpdate = UpdateTables<'tables'>
export type SeatUpdate = UpdateTables<'seats'>
export type OrderUpdate = UpdateTables<'orders'>
export type KDSStationUpdate = UpdateTables<'kds_stations'>
export type KDSOrderRoutingUpdate = UpdateTables<'kds_order_routing'>

// Enum types
export type UserRole = Database['public']['Enums']['user_role']
export type OrderStatus = Database['public']['Enums']['order_status']
export type OrderType = Database['public']['Enums']['order_type']
export type TableStatus = Database['public']['Enums']['table_status']
export type StationType = Database['public']['Enums']['station_type']
export type MetricType = Database['public']['Enums']['metric_type']

// View types
export type KDSTableSummary =
  Database['public']['Views']['kds_table_summary']['Row']

// Composite types for queries with joins
export type OrderWithJoins = Order & {
  tables: Pick<Table, 'label'>
  seats: Pick<Seat, 'label'>
  resident?: Pick<Profile, 'name'>
  server?: Pick<Profile, 'name'>
}

export type KDSOrderWithJoins = KDSOrderRouting & {
  order: OrderWithJoins
  station: KDSStation
}

export type TableWithSeats = Table & {
  seats: Seat[]
}

export type SeatWithResident = Seat & {
  resident?: Pick<Profile, 'name' | 'dietary_restrictions'>
}

// API Response types
export type ApiResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export type PaginatedResponse<T = any> = {
  data: T[]
  count: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// Common query filters
export type OrderFilters = {
  status?: OrderStatus[]
  type?: OrderType[]
  table_id?: string
  resident_id?: string
  server_id?: string
  date_from?: string
  date_to?: string
}

export type KDSFilters = {
  station_id?: string
  status?: ('pending' | 'in_progress' | 'completed')[]
  priority?: number[]
  date_from?: string
  date_to?: string
}

// Real-time subscription types
export type RealtimePayload<T = any> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T | null
  old: T | null
  schema: string
  table: string
  commit_timestamp: string
}

// Error types
export type DatabaseError = {
  message: string
  details: string | null
  hint: string | null
  code: string
}

// Session and auth types
export type UserSession = {
  user: {
    id: string
    email?: string
    role?: UserRole
  }
  profile?: Profile
  expires_at?: number
}

// Form types for UI components
export type OrderForm = {
  table_id: string
  seat_id: string
  resident_id: string
  items: string[]
  transcript?: string
  type: OrderType
  special_requests?: string
}

export type TableForm = {
  label: string
  type: string
  status: TableStatus
  position_x?: number
  position_y?: number
  width?: number
  height?: number
  shape?: 'rectangle' | 'circle' | 'oval'
  color?: string
}

export type ProfileForm = {
  name: string
  role: UserRole
  email?: string
  dietary_restrictions?: string[]
  preferences?: Record<string, any>
}
