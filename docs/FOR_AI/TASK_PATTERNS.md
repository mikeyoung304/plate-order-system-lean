# Task Patterns for AI Assistants

## Common Development Patterns for Plate Restaurant System

This document provides standardized patterns for AI assistants working on the Plate Restaurant System. These patterns ensure consistency, safety, and efficiency in code modifications.

## Component Development Patterns

### Creating New Components

#### Standard Component Structure
```typescript
// components/example/ExampleComponent.tsx
import { FC, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ExampleComponentProps {
  /** Unique identifier for the component */
  id: string
  /** Display title */
  title: string
  /** Optional CSS classes */
  className?: string
  /** Event handlers */
  onAction?: (data: any) => void
}

export const ExampleComponent: FC<ExampleComponentProps> = ({
  id,
  title,
  className,
  onAction
}) => {
  // State declarations
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)

  // Effects
  useEffect(() => {
    // Effect logic
  }, [])

  // Event handlers
  const handleAction = async () => {
    setLoading(true)
    try {
      // Action logic
      onAction?.(data)
    } catch (error) {
      console.error('Action failed:', error)
    } finally {
      setLoading(false)
    }
  }

  // Render
  return (
    <Card className={cn('p-4', className)}>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <Button onClick={handleAction}>
          Perform Action
        </Button>
      )}
    </Card>
  )
}
```

#### Component File Organization
```
components/
├── example/
│   ├── ExampleComponent.tsx      # Main component
│   ├── ExampleCard.tsx          # Sub-components
│   ├── ExampleList.tsx
│   ├── hooks/
│   │   └── use-example-data.ts  # Component-specific hooks
│   └── types.ts                 # Component-specific types
```

### Modifying Large Components

#### When Component > 200 Lines: Split Pattern
```typescript
// Before: server/page.tsx (893 lines)
// After: Split into focused components

// server/page.tsx (< 100 lines)
export default function ServerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Server Station" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        <FloorPlanSection />
        <OrderFlowSection />
      </div>
      <SeatNavigationModal />
    </div>
  )
}

// components/server/FloorPlanSection.tsx (< 150 lines)
// components/server/OrderFlowSection.tsx (< 150 lines)
// components/server/SeatNavigationModal.tsx (< 100 lines)
```

#### Refactoring Checklist
- [ ] Extract sub-components under 150 lines each
- [ ] Move shared logic to custom hooks
- [ ] Extract types to separate files
- [ ] Maintain existing functionality
- [ ] Update imports and exports
- [ ] Test all interactions

## Database Query Patterns

### Standard Supabase Query Pattern
```typescript
// lib/modassembly/supabase/database/[entity].ts
import { createClient } from '@/lib/modassembly/supabase/client'
import type { Database } from '@/types/database'

type Order = Database['public']['Tables']['orders']['Row']
type CreateOrder = Database['public']['Tables']['orders']['Insert']

export async function getOrdersWithRelations(filters?: {
  tableId?: string
  status?: string
  limit?: number
}) {
  const supabase = createClient()
  
  let query = supabase
    .from('orders')
    .select(`
      *,
      table:tables(id, label, type),
      seat:seats(id, label),
      resident:profiles!resident_id(name),
      server:profiles!server_id(name)
    `)

  // Apply filters
  if (filters?.tableId) {
    query = query.eq('table_id', filters.tableId)
  }
  
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(filters?.limit || 50)

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`)
  }

  return data
}

export async function createOrderWithValidation(orderData: CreateOrder) {
  const supabase = createClient()

  // Validation
  if (!orderData.table_id || !orderData.seat_id) {
    throw new Error('Table and seat are required')
  }

  const { data, error } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create order: ${error.message}`)
  }

  return data
}
```

### Real-time Subscription Pattern
```typescript
// hooks/use-realtime-[entity].ts
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/modassembly/supabase/client'

export function useRealtimeOrders(tableId?: string) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Initial fetch
    async function fetchInitialData() {
      const { data } = await getOrdersWithRelations({ tableId })
      setOrders(data || [])
      setLoading(false)
    }

    fetchInitialData()

    // Real-time subscription
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: tableId ? `table_id=eq.${tableId}` : undefined
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders(prev => [payload.new as Order, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(order => 
              order.id === payload.new.id ? payload.new as Order : order
            ))
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(order => order.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tableId])

  return { orders, loading }
}
```

## State Management Patterns

### Context Pattern for Domain State
```typescript
// lib/state/[domain]-context.tsx
import { createContext, useContext, useReducer, ReactNode } from 'react'

// Types
interface OrderState {
  selectedTable: Table | null
  selectedSeat: Seat | null
  orderType: 'food' | 'beverage' | null
  currentStep: OrderFlowStep
}

type OrderAction = 
  | { type: 'SELECT_TABLE'; table: Table }
  | { type: 'SELECT_SEAT'; seat: Seat }
  | { type: 'SET_ORDER_TYPE'; orderType: 'food' | 'beverage' }
  | { type: 'NEXT_STEP' }
  | { type: 'RESET' }

// Reducer
function orderReducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case 'SELECT_TABLE':
      return { ...state, selectedTable: action.table }
    case 'SELECT_SEAT':
      return { ...state, selectedSeat: action.seat }
    case 'SET_ORDER_TYPE':
      return { ...state, orderType: action.orderType }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

// Context
const OrderContext = createContext<{
  state: OrderState
  dispatch: React.Dispatch<OrderAction>
} | null>(null)

// Provider
export function OrderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(orderReducer, initialState)

  return (
    <OrderContext.Provider value={{ state, dispatch }}>
      {children}
    </OrderContext.Provider>
  )
}

// Hook
export function useOrderState() {
  const context = useContext(OrderContext)
  if (!context) {
    throw new Error('useOrderState must be used within OrderProvider')
  }
  return context
}
```

### Custom Hook Pattern for Business Logic
```typescript
// hooks/use-[feature]-logic.ts
import { useState, useCallback } from 'react'
import { toast } from 'sonner'

export function useOrderFlow() {
  const [loading, setLoading] = useState(false)
  const { state, dispatch } = useOrderState()

  const createOrder = useCallback(async (orderData: CreateOrderRequest) => {
    setLoading(true)
    try {
      const order = await createOrderWithValidation(orderData)
      toast.success('Order created successfully')
      dispatch({ type: 'RESET' })
      return order
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create order')
      throw error
    } finally {
      setLoading(false)
    }
  }, [dispatch])

  const selectTable = useCallback((table: Table) => {
    dispatch({ type: 'SELECT_TABLE', table })
  }, [dispatch])

  const selectSeat = useCallback((seat: Seat) => {
    dispatch({ type: 'SELECT_SEAT', seat })
  }, [dispatch])

  return {
    // State
    ...state,
    loading,
    
    // Actions
    createOrder,
    selectTable,
    selectSeat
  }
}
```

## Error Handling Patterns

### API Error Handling
```typescript
// lib/error-handling.ts
export class APIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export async function handleSupabaseError<T>(
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  const { data, error } = await operation()
  
  if (error) {
    // Map Supabase errors to user-friendly messages
    const message = getErrorMessage(error)
    throw new APIError(message, error.code, error.status)
  }
  
  if (!data) {
    throw new APIError('No data returned', 'NO_DATA')
  }
  
  return data
}

function getErrorMessage(error: any): string {
  if (error.code === 'PGRST116') {
    return 'Record not found'
  }
  if (error.code === '23505') {
    return 'This record already exists'
  }
  if (error.message?.includes('permission denied')) {
    return 'You do not have permission to perform this action'
  }
  return error.message || 'An unexpected error occurred'
}
```

### Component Error Boundaries
```typescript
// components/error-boundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // logErrorToService(error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Alert variant="destructive" className="m-4">
          <AlertDescription>
            Something went wrong. Please refresh the page or try again.
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2"
              onClick={() => this.setState({ hasError: false })}
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )
    }

    return this.props.children
  }
}
```

## Performance Optimization Patterns

### Memoization Pattern
```typescript
// Use React.memo for expensive components
export const ExpensiveComponent = React.memo<Props>(({ data, onAction }) => {
  // Expensive rendering logic
  return <div>{/* Complex rendering */}</div>
}, (prevProps, nextProps) => {
  // Custom comparison for when to re-render
  return prevProps.data.id === nextProps.data.id
})

// Use useMemo for expensive calculations
function DataVisualization({ orders }: { orders: Order[] }) {
  const chartData = useMemo(() => {
    return orders.reduce((acc, order) => {
      // Expensive calculation
      return processOrderData(acc, order)
    }, [])
  }, [orders])

  return <Chart data={chartData} />
}

// Use useCallback for stable function references
function ParentComponent() {
  const [data, setData] = useState([])

  const handleUpdate = useCallback((id: string, updates: any) => {
    setData(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ))
  }, [])

  return (
    <div>
      {data.map(item => (
        <ChildComponent 
          key={item.id} 
          item={item} 
          onUpdate={handleUpdate} 
        />
      ))}
    </div>
  )
}
```

### Code Splitting Pattern
```typescript
// Lazy load heavy components
const KDSLayout = lazy(() => import('@/components/kds/kds-layout'))
const FloorPlanEditor = lazy(() => import('@/components/floor-plan-editor'))

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/kds" element={<KDSLayout />} />
        <Route path="/admin" element={<FloorPlanEditor />} />
      </Routes>
    </Suspense>
  )
}
```

## Testing Patterns

### Unit Test Pattern
```typescript
// __tests__/components/ExampleComponent.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ExampleComponent } from '@/components/ExampleComponent'

// Mock dependencies
jest.mock('@/lib/modassembly/supabase/client')

describe('ExampleComponent', () => {
  const defaultProps = {
    id: 'test-id',
    title: 'Test Title',
    onAction: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    render(<ExampleComponent {...defaultProps} />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('calls onAction when button is clicked', async () => {
    render(<ExampleComponent {...defaultProps} />)
    
    fireEvent.click(screen.getByText('Perform Action'))
    
    await waitFor(() => {
      expect(defaultProps.onAction).toHaveBeenCalledTimes(1)
    })
  })

  it('shows loading state', () => {
    render(<ExampleComponent {...defaultProps} />)
    
    fireEvent.click(screen.getByText('Perform Action'))
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})
```

### Integration Test Pattern
```typescript
// __tests__/integration/order-flow.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { OrderFlowProvider } from '@/lib/state/order-context'
import { ServerPage } from '@/app/(auth)/server/page'

describe('Order Flow Integration', () => {
  const renderWithProviders = (component: ReactNode) => {
    return render(
      <OrderFlowProvider>
        {component}
      </OrderFlowProvider>
    )
  }

  it('completes full order flow', async () => {
    renderWithProviders(<ServerPage />)
    
    // Select table
    fireEvent.click(screen.getByText('Table 1'))
    
    // Select seat
    fireEvent.click(screen.getByText('Seat 1'))
    
    // Select order type
    fireEvent.click(screen.getByText('Food'))
    
    // Create order
    fireEvent.click(screen.getByText('Create Order'))
    
    await waitFor(() => {
      expect(screen.getByText('Order created successfully')).toBeInTheDocument()
    })
  })
})
```

## Safe Modification Guidelines

### Component Size Limits
- **Maximum 200 lines per component**
- **Maximum 5 props per component**
- **Split into sub-components when exceeded**

### Function Complexity Limits
- **Maximum 20 lines per function**
- **Maximum 3 parameters per function**
- **Single responsibility principle**

### State Management Rules
- **Use context for domain state only**
- **Keep component state local when possible**
- **Avoid prop drilling beyond 2 levels**

### Database Query Rules
- **Always use TypeScript types**
- **Include error handling**
- **Limit query results (default 50)**
- **Use select() to specify needed fields**

## Common Refactoring Patterns

### Extract Custom Hook
```typescript
// Before: Logic in component
function OrderCard({ order }: { order: Order }) {
  const [updating, setUpdating] = useState(false)
  
  const updateStatus = async (newStatus: string) => {
    setUpdating(true)
    try {
      await updateOrderStatus(order.id, newStatus)
      toast.success('Status updated')
    } catch (error) {
      toast.error('Update failed')
    } finally {
      setUpdating(false)
    }
  }
  
  return <div>{/* render */}</div>
}

// After: Logic in custom hook
function useOrderActions(orderId: string) {
  const [updating, setUpdating] = useState(false)
  
  const updateStatus = useCallback(async (newStatus: string) => {
    setUpdating(true)
    try {
      await updateOrderStatus(orderId, newStatus)
      toast.success('Status updated')
    } catch (error) {
      toast.error('Update failed')
    } finally {
      setUpdating(false)
    }
  }, [orderId])
  
  return { updating, updateStatus }
}

function OrderCard({ order }: { order: Order }) {
  const { updating, updateStatus } = useOrderActions(order.id)
  return <div>{/* render */}</div>
}
```

### Extract Sub-Components
```typescript
// Before: Large component
function LargeOrderDisplay({ orders }: { orders: Order[] }) {
  return (
    <div className="space-y-4">
      {orders.map(order => (
        <div key={order.id} className="border rounded p-4">
          <div className="flex justify-between items-center">
            <h3>Order #{order.id.slice(-6)}</h3>
            <span className={getStatusColor(order.status)}>
              {order.status}
            </span>
          </div>
          <div className="mt-2">
            <p>Table: {order.table?.label}</p>
            <p>Seat: {order.seat?.label}</p>
          </div>
          <div className="mt-2">
            {order.items.map((item, index) => (
              <div key={index} className="text-sm">
                {item}
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => updateStatus(order.id, 'preparing')}>
              Start Preparing
            </button>
            <button onClick={() => updateStatus(order.id, 'ready')}>
              Mark Ready
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// After: Extracted sub-components
function OrderCard({ order }: { order: Order }) {
  const { updating, updateStatus } = useOrderActions(order.id)
  
  return (
    <div className="border rounded p-4">
      <OrderHeader order={order} />
      <OrderDetails order={order} />
      <OrderItems items={order.items} />
      <OrderActions 
        order={order} 
        onUpdateStatus={updateStatus}
        loading={updating}
      />
    </div>
  )
}

function OrderList({ orders }: { orders: Order[] }) {
  return (
    <div className="space-y-4">
      {orders.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  )
}
```

## Security Patterns

### Input Sanitization
```typescript
// lib/validation.ts
export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[^\w\s,.-]/g, '') // Allow only safe characters
    .trim()
    .slice(0, 500) // Limit length
}

export function validateOrderInput(data: any): CreateOrderRequest {
  return {
    table_id: validateUUID(data.table_id),
    seat_id: validateUUID(data.seat_id),
    items: Array.isArray(data.items) 
      ? data.items.slice(0, 10).map(sanitizeInput)
      : [],
    transcript: typeof data.transcript === 'string' 
      ? sanitizeInput(data.transcript)
      : undefined
  }
}
```

### Permission Checking
```typescript
// lib/permissions.ts
export function canUserPerformAction(
  userRole: string, 
  action: string, 
  resource?: any
): boolean {
  const permissions = {
    admin: ['*'],
    server: ['create_order', 'view_orders', 'update_order'],
    cook: ['view_orders', 'update_order_status'],
    resident: ['view_own_orders']
  }
  
  const userPermissions = permissions[userRole as keyof typeof permissions] || []
  
  return userPermissions.includes('*') || userPermissions.includes(action)
}

// Usage in components
function OrderActions({ order }: { order: Order }) {
  const { user } = useAuth()
  
  if (!canUserPerformAction(user.role, 'update_order_status')) {
    return null
  }
  
  return <div>{/* Action buttons */}</div>
}
```

These patterns provide a comprehensive framework for consistent, safe, and efficient development on the Plate Restaurant System.