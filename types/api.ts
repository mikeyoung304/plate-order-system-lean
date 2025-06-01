// API and Component Type Definitions
// Comprehensive type safety for the Plater Restaurant System

import { Database, UserRole, OrderStatus, OrderType, TableStatus } from './database'

// =============================================
// API Response Types
// =============================================

export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp?: string
}

export type ApiError = {
  message: string
  code?: string | number
  details?: Record<string, unknown>
  stack?: string
}

export type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export type PaginatedApiResponse<T = unknown> = ApiResponse<T[]> & {
  meta: PaginationMeta
}

// =============================================
// Authentication & Authorization Types
// =============================================

export type AuthUser = {
  id: string
  email?: string
  role?: UserRole
  name?: string
  avatar_url?: string
  last_sign_in_at?: string
  created_at?: string
}

export type AuthSession = {
  access_token: string
  refresh_token?: string
  expires_in?: number
  expires_at?: number
  user: AuthUser
}

export type AuthError = {
  message: string
  status?: number
}

export type LoginCredentials = {
  email: string
  password: string
  remember?: boolean
}

export type SignupData = {
  email: string
  password: string
  name: string
  role?: UserRole
}

// =============================================
// Component Props Types
// =============================================

export type BaseComponentProps = {
  className?: string
  children?: React.ReactNode
  'data-testid'?: string
}

export type LoadingProps = BaseComponentProps & {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  show?: boolean
}

export type ErrorProps = BaseComponentProps & {
  error: Error | string
  retry?: () => void
  showDetails?: boolean
}

export type ModalProps = BaseComponentProps & {
  open: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnOverlayClick?: boolean
}

// =============================================
// Form Types
// =============================================

export type FormField<T = unknown> = {
  value: T
  error?: string
  touched?: boolean
  required?: boolean
  disabled?: boolean
}

export type FormState<T extends Record<string, unknown>> = {
  [K in keyof T]: FormField<T[K]>
} & {
  isValid: boolean
  isSubmitting: boolean
  hasErrors: boolean
  isDirty: boolean
}

export type ValidationRule<T = unknown> = {
  required?: boolean | string
  minLength?: number | { value: number; message: string }
  maxLength?: number | { value: number; message: string }
  pattern?: RegExp | { value: RegExp; message: string }
  custom?: (value: T) => string | boolean
}

export type ValidationSchema<T extends Record<string, unknown>> = {
  [K in keyof T]?: ValidationRule<T[K]>
}

// =============================================
// Voice Recording Types
// =============================================

export type VoiceRecordingState = {
  isRecording: boolean
  isProcessing: boolean
  transcript?: string
  error?: string
  duration: number
  audioUrl?: string
}

export type VoiceRecordingConfig = {
  maxDuration?: number
  sampleRate?: number
  channels?: number
  format?: 'webm' | 'mp3' | 'wav'
}

export type TranscriptionResult = {
  transcript: string
  confidence?: number
  items: string[]
  duration?: number
}

// =============================================
// Floor Plan Types
// =============================================

export type Position = {
  x: number
  y: number
}

export type Dimensions = {
  width: number
  height: number
}

export type FloorPlanElement = {
  id: string
  type: 'table' | 'obstacle' | 'decoration'
  position: Position
  dimensions: Dimensions
  rotation?: number
  color?: string
  label?: string
}

export type FloorPlanConfig = {
  width: number
  height: number
  scale: number
  gridSize: number
  snapToGrid: boolean
  showGrid: boolean
}

export type FloorPlanState = {
  elements: FloorPlanElement[]
  selectedElementId?: string
  config: FloorPlanConfig
  isDirty: boolean
  isEditing: boolean
}

// =============================================
// KDS (Kitchen Display System) Types
// =============================================

export type KDSOrderItem = {
  name: string
  quantity?: number
  modifications?: string[]
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  allergens?: string[]
}

export type KDSOrder = {
  id: string
  orderNumber: string
  table: string
  seat?: number
  items: KDSOrderItem[]
  status: 'pending' | 'in_progress' | 'ready' | 'completed'
  priority: number
  estimatedTime?: number
  actualTime?: number
  startedAt?: string
  completedAt?: string
  notes?: string
  specialRequests?: string[]
}

export type KDSStation = {
  id: string
  name: string
  type: 'grill' | 'fryer' | 'salad' | 'expo' | 'bar' | 'prep' | 'dessert'
  color: string
  position: number
  isActive: boolean
  orders: KDSOrder[]
  settings: Record<string, unknown>
}

export type KDSMetrics = {
  stationId: string
  averagePrepTime: number
  totalOrders: number
  completedOrders: number
  efficiency: number
  busyPeriods: string[]
}

// =============================================
// Order Management Types
// =============================================

export type OrderItem = {
  name: string
  quantity?: number
  price?: number
  modifications?: string[]
  allergens?: string[]
  notes?: string
}

export type OrderSuggestion = {
  items: string[]
  frequency: number
  lastOrdered?: string
  resident?: string
}

export type OrderFilters = {
  status?: OrderStatus[]
  type?: OrderType[]
  tableId?: string
  residentId?: string
  serverId?: string
  dateFrom?: Date | string
  dateTo?: Date | string
  searchTerm?: string
}

export type OrderMetrics = {
  totalOrders: number
  averageOrderTime: number
  popularItems: Array<{ item: string; count: number }>
  peakHours: string[]
  completionRate: number
}

// =============================================
// Table Management Types
// =============================================

export type TableLayout = {
  id: string
  shape: 'rectangle' | 'circle' | 'oval'
  seats: number
  position: Position
  dimensions: Dimensions
  rotation: number
  color: string
  status: TableStatus
}

export type SeatLayout = {
  id: string
  tableId: string
  number: number
  position: Position
  isOccupied: boolean
  residentId?: string
  residentName?: string
}

export type FloorPlanLayout = {
  id: string
  name: string
  tables: TableLayout[]
  seats: SeatLayout[]
  config: FloorPlanConfig
  isActive: boolean
}

// =============================================
// Notification Types
// =============================================

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export type Notification = {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
  actions?: Array<{
    label: string
    action: () => void
    variant?: 'primary' | 'secondary'
  }>
  persistent?: boolean
  timestamp: string
}

export type NotificationState = {
  notifications: Notification[]
  maxNotifications: number
  defaultDuration: number
}

// =============================================
// Theme and UI Types
// =============================================

export type ThemeMode = 'light' | 'dark' | 'system'

export type ColorScheme = {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  error: string
  warning: string
  success: string
  info: string
}

export type BreakpointSizes = {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
  '2xl': number
}

// =============================================
// Performance Monitoring Types
// =============================================

export type PerformanceMetric = {
  name: string
  value: number
  unit: 'ms' | 'mb' | 'count' | 'percentage'
  timestamp: string
  category: 'loading' | 'rendering' | 'network' | 'memory'
}

export type PerformanceReport = {
  metrics: PerformanceMetric[]
  summary: {
    averageLoadTime: number
    memoryUsage: number
    errorRate: number
    userSatisfaction: number
  }
  recommendations: string[]
}

// =============================================
// Utility Types
// =============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

export type Nullable<T> = T | null

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type NonEmptyArray<T> = [T, ...T[]]

export type StringKeys<T> = Extract<keyof T, string>

export type FunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never
}[keyof T]

export type NonFunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? never : K
}[keyof T]

// =============================================
// Event Types
// =============================================

export type CustomEvent<T = Record<string, unknown>> = {
  type: string
  data: T
  timestamp: string
  source: string
}

export type OrderEvent = CustomEvent<{
  orderId: string
  status: OrderStatus
  tableId: string
  residentId: string
}>

export type KDSEvent = CustomEvent<{
  stationId: string
  orderId: string
  action: 'start' | 'complete' | 'recall'
  userId: string
}>

export type TableEvent = CustomEvent<{
  tableId: string
  action: 'occupy' | 'clear' | 'reserve'
  userId?: string
}>

// =============================================
// WebSocket Types
// =============================================

export type WebSocketMessage<T = unknown> = {
  type: string
  payload: T
  id?: string
  timestamp: string
}

export type WebSocketState = {
  connected: boolean
  reconnecting: boolean
  lastConnected?: string
  errorCount: number
  messageQueue: WebSocketMessage[]
}

// =============================================
// Search and Filter Types
// =============================================

export type SearchFilters = {
  query?: string
  category?: string
  tags?: string[]
  dateRange?: {
    start: Date | string
    end: Date | string
  }
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export type SearchResult<T = unknown> = {
  items: T[]
  total: number
  facets?: Record<string, Array<{ value: string; count: number }>>
  suggestions?: string[]
  executionTime: number
}

// =============================================
// State Management Types
// =============================================

export type StateAction<T extends string = string, P = unknown> = {
  type: T
  payload?: P
  meta?: Record<string, unknown>
}

export type StateReducer<T, A extends StateAction = StateAction> = (
  state: T,
  action: A
) => T

export type AsyncState<T = unknown> = {
  data?: T
  loading: boolean
  error?: string
  lastUpdated?: string
}

export type CacheState<T = unknown> = {
  data: T
  timestamp: string
  ttl: number
  key: string
}

// =============================================
// Export all types
// =============================================

export type * from './database'