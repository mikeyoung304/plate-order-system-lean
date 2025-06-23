/**
 * Comprehensive type definitions for the Plate Restaurant System
 * Replaces all 'any' types with proper TypeScript interfaces
 */

// Order-related types
export interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  modifiers?: OrderModifier[]
  notes?: string
  category?: string
  station?: KitchenStation
}

export interface OrderModifier {
  id: string
  name: string
  price: number
}

export interface Order {
  id: string
  table_id?: string
  seat_id?: string
  resident_user_id?: string
  server_user_id?: string
  items: OrderItem[]
  status: OrderStatus
  type: OrderType
  notes?: string
  created_at: string
  updated_at: string
  total_amount: number
  voice_transcript?: string
}

export type OrderStatus = 'new' | 'in_progress' | 'ready' | 'delivered' | 'cancelled'
export type OrderType = 'dine_in' | 'takeout' | 'delivery'
export type KitchenStation = 'grill' | 'fryer' | 'salad' | 'expo' | 'bar'

// Table and Seat types
export interface Table {
  id: string
  label: string
  position_x: number
  position_y: number
  type: TableType
  status: TableStatus
  created_at: string
  updated_at: string
}

export type TableType = 'table' | 'counter' | 'private' | 'bar'
export type TableStatus = 'available' | 'occupied' | 'reserved' | 'maintenance'

export interface Seat {
  id: string
  table_id: string
  seat_number: number
  is_occupied: boolean
  resident_id?: string
  created_at: string
  updated_at: string
}

// KDS-specific types
export interface KDSOrderRouting {
  id: string
  order_id: string
  station_id: string
  priority: number
  status: KDSOrderStatus
  routed_at: string
  started_at?: string
  completed_at?: string
  cook_id?: string
  estimated_time?: number
}

export type KDSOrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export interface KDSStation {
  id: string
  name: string
  type: KitchenStation
  display_color: string
  is_active: boolean
  display_order: number
  settings: KDSStationSettings
}

export interface KDSStationSettings {
  alertThreshold?: number
  autoAdvance?: boolean
  soundEnabled?: boolean
  displayMode?: 'cards' | 'list'
}

// User and Profile types
export interface UserProfile {
  id: string
  user_id: string
  email: string
  display_name?: string
  first_name?: string
  last_name?: string
  role: UserRole
  created_at: string
  updated_at: string
}

export type UserRole = 'admin' | 'server' | 'cook' | 'resident' | 'guest'

// Real-time and WebSocket types
export interface RealtimePayload<T = unknown> {
  new: T
  old?: T
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  schema: string
  commit_timestamp: string
}

export interface WebSocketMessage {
  type: string
  payload: unknown
  timestamp: string
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: ApiError
  count?: number
}

export interface ApiError {
  message: string
  code?: string
  details?: unknown
}

// Performance monitoring types
export interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
  success: boolean
  metadata?: Record<string, unknown>
}

// Voice command types
export interface VoiceCommand {
  type: 'add_order' | 'modify_order' | 'cancel_order' | 'status_check' | 'help' | 'unknown'
  confidence: number
  parameters?: Record<string, unknown>
  transcript: string
}

// Event handler types
export type ClickHandler = (event: React.MouseEvent<HTMLElement>) => void
export type ChangeHandler<T = HTMLInputElement> = (event: React.ChangeEvent<T>) => void
export type SubmitHandler = (event: React.FormEvent<HTMLFormElement>) => void
export type KeyboardHandler = (event: React.KeyboardEvent<HTMLElement>) => void

// Component prop types
export interface WithChildren {
  children: React.ReactNode
}

export interface WithClassName {
  className?: string
}

export interface WithStyle {
  style?: React.CSSProperties
}

// Utility types
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type AsyncFunction<T = void> = () => Promise<T>
export type VoidFunction = () => void

// Database query types
export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
  filters?: Record<string, unknown>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Cache types
export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

// Error boundary types
export interface ErrorInfo {
  componentStack: string
  digest?: string
}