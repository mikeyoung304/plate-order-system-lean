# Refactoring Targets for AI Assistants

## High-Priority Refactoring Opportunities in Plate Restaurant System

This document identifies specific components and patterns that need refactoring, with detailed analysis and recommended approaches for AI assistants.

## Critical Refactoring Targets

### 1. Server Page Component (893 lines)

**File**: `app/(auth)/server/page.tsx`
**Priority**: CRITICAL
**Complexity Score**: 9/10

#### Current Issues

- Monolithic component handling 6+ responsibilities
- Complex state management with multiple contexts
- Difficult to test individual features
- Performance issues due to large component tree
- Maintenance nightmare for bug fixes

#### Refactoring Strategy

```typescript
// Current structure (simplified)
export default function ServerPage() {
  // 50+ state variables
  const [selectedTable, setSelectedTable] = useState(null)
  const [selectedSeat, setSelectedSeat] = useState(null)
  const [orderType, setOrderType] = useState(null)
  const [showVoicePanel, setShowVoicePanel] = useState(false)
  const [residents, setResidents] = useState([])
  // ... 45+ more state variables

  // 20+ useEffect hooks
  useEffect(() => { /* table loading */ }, [])
  useEffect(() => { /* seat management */ }, [selectedTable])
  useEffect(() => { /* order tracking */ }, [])
  // ... 17+ more effects

  // 30+ event handlers
  const handleTableSelect = (table) => { /* 50 lines */ }
  const handleSeatSelect = (seat) => { /* 40 lines */ }
  const handleVoiceOrder = (audio) => { /* 80 lines */ }
  // ... 27+ more handlers

  // Massive return statement (300+ lines)
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 300+ lines of JSX */}
    </div>
  )
}
```

#### Target Structure

```typescript
// New structure: 6 focused components

// 1. Main page layout (< 50 lines)
export default function ServerPage() {
  return (
    <ErrorBoundary>
      <OrderFlowProvider>
        <div className="min-h-screen bg-gray-50">
          <ServerPageHeader />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            <FloorPlanSection />
            <OrderProcessingSection />
          </div>
          <OrderFlowModals />
        </div>
      </OrderFlowProvider>
    </ErrorBoundary>
  )
}

// 2. Floor plan section (< 150 lines)
function FloorPlanSection() {
  const { tables, selectedTable, selectTable } = useOrderFlow()
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Floor Plan</h2>
      <FloorPlanCanvas
        tables={tables}
        selectedTable={selectedTable}
        onTableSelect={selectTable}
      />
      <TableStatusLegend />
    </Card>
  )
}

// 3. Order processing section (< 150 lines)
function OrderProcessingSection() {
  const { currentStep, selectedTable, selectedSeat } = useOrderFlow()

  return (
    <Card className="p-6">
      <OrderFlowSteps currentStep={currentStep} />
      {currentStep === 'seatSelection' && (
        <SeatSelector table={selectedTable} />
      )}
      {currentStep === 'orderType' && (
        <OrderTypeSelector />
      )}
      {currentStep === 'voiceOrder' && (
        <VoiceOrderPanel />
      )}
    </Card>
  )
}

// 4. Modals container (< 100 lines)
function OrderFlowModals() {
  const {
    showSeatPicker,
    showResidentSelector,
    showVoicePanel
  } = useOrderFlow()

  return (
    <>
      <SeatPickerModal open={showSeatPicker} />
      <ResidentSelectorModal open={showResidentSelector} />
      <VoiceOrderModal open={showVoicePanel} />
    </>
  )
}
```

#### Step-by-Step Refactoring Plan

1. **Extract State Management** (Day 1)

   ```typescript
   // Create lib/state/order-flow-context.tsx
   // Move all order-related state to context
   // Implement useOrderFlow() hook
   ```

2. **Extract Floor Plan Logic** (Day 2)

   ```typescript
   // Create components/server/FloorPlanSection.tsx
   // Move table selection and display logic
   // Extract canvas interactions
   ```

3. **Extract Order Processing** (Day 3)

   ```typescript
   // Create components/server/OrderProcessingSection.tsx
   // Move step management and form logic
   // Create individual step components
   ```

4. **Extract Modals** (Day 4)

   ```typescript
   // Create components/server/modals/
   // Move each modal to separate component
   // Implement modal state management
   ```

5. **Update Main Component** (Day 5)
   ```typescript
   // Simplify server/page.tsx to orchestration only
   // Remove direct state management
   // Test integration
   ```

### 2. Floor Plan Reducer (865 lines)

**File**: `hooks/use-floor-plan-reducer.ts`
**Priority**: HIGH
**Complexity Score**: 8/10

#### Current Issues

- Single reducer handling 15+ action types
- Complex state transitions that are hard to debug
- Inconsistent state updates
- Poor separation of concerns

#### Refactoring Strategy

```typescript
// Current: Monolithic reducer
function floorPlanReducer(state: FloorPlanState, action: FloorPlanAction) {
  switch (action.type) {
    case 'SET_TABLES':
    // 50 lines of logic
    case 'UPDATE_TABLE':
    // 40 lines of logic
    case 'ADD_TABLE':
    // 60 lines of logic
    case 'DELETE_TABLE':
    // 30 lines of logic
    case 'SELECT_TABLE':
    // 20 lines of logic
    // ... 10+ more cases with 200+ lines each
  }
}

// Target: Focused sub-reducers
// 1. Table management reducer (< 200 lines)
function tableReducer(state: TableState, action: TableAction) {
  switch (action.type) {
    case 'ADD_TABLE':
      return { ...state, tables: [...state.tables, action.table] }
    case 'UPDATE_TABLE':
      return {
        ...state,
        tables: state.tables.map(table =>
          table.id === action.id ? { ...table, ...action.updates } : table
        ),
      }
    case 'DELETE_TABLE':
      return {
        ...state,
        tables: state.tables.filter(table => table.id !== action.id),
      }
  }
}

// 2. Selection reducer (< 100 lines)
function selectionReducer(state: SelectionState, action: SelectionAction) {
  switch (action.type) {
    case 'SELECT_TABLE':
      return { ...state, selectedTable: action.table, selectedSeat: null }
    case 'SELECT_SEAT':
      return { ...state, selectedSeat: action.seat }
    case 'CLEAR_SELECTION':
      return { ...state, selectedTable: null, selectedSeat: null }
  }
}

// 3. Canvas reducer (< 150 lines)
function canvasReducer(state: CanvasState, action: CanvasAction) {
  switch (action.type) {
    case 'SET_ZOOM':
      return { ...state, zoom: action.zoom }
    case 'SET_PAN':
      return { ...state, pan: action.pan }
    case 'TOGGLE_GRID':
      return { ...state, showGrid: !state.showGrid }
  }
}

// 4. Combined reducer
function floorPlanReducer(
  state: FloorPlanState,
  action: FloorPlanAction
): FloorPlanState {
  return {
    tables: tableReducer(state.tables, action),
    selection: selectionReducer(state.selection, action),
    canvas: canvasReducer(state.canvas, action),
  }
}
```

### 3. KDS Layout Component (792 lines)

**File**: `components/kds/kds-layout.tsx`
**Priority**: HIGH
**Complexity Score**: 7/10

#### Refactoring Strategy

```typescript
// Target structure
function KDSLayout() {
  return (
    <ErrorBoundary>
      <KDSProvider>
        <div className="h-screen flex flex-col">
          <KDSHeader />
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
            <StationColumn stationType="grill" />
            <StationColumn stationType="expo" />
            <StationColumn stationType="bar" />
          </div>
          <KDSFooter />
        </div>
      </KDSProvider>
    </ErrorBoundary>
  )
}

// Extract station column (< 150 lines)
function StationColumn({ stationType }: { stationType: string }) {
  const { orders, updateOrder } = useKDSStation(stationType)

  return (
    <div className="bg-white rounded-lg shadow">
      <StationHeader type={stationType} />
      <OrderQueue
        orders={orders}
        onOrderUpdate={updateOrder}
      />
    </div>
  )
}
```

### 4. Restaurant State Context (731 lines)

**File**: `lib/state/restaurant-state-context.tsx`
**Priority**: HIGH
**Complexity Score**: 8/10

#### Current Issues

- Over-centralized state causing unnecessary re-renders
- Mixing different domains (tables, orders, UI state)
- Complex state updates
- Performance bottlenecks

#### Refactoring Strategy

```typescript
// Current: Monolithic context
const RestaurantContext = createContext({
  // 20+ properties from different domains
  tables: [],
  orders: [],
  selectedTable: null,
  selectedSeat: null,
  showSeatPicker: false,
  showVoicePanel: false,
  currentUser: null,
  // ... 15+ more properties
})

// Target: Domain-specific contexts

// 1. Table state context (< 150 lines)
function TableStateProvider({ children }) {
  const [state, dispatch] = useReducer(tableReducer, initialTableState)
  return (
    <TableContext.Provider value={{ state, dispatch }}>
      {children}
    </TableContext.Provider>
  )
}

// 2. Order state context (< 150 lines)
function OrderStateProvider({ children }) {
  const [state, dispatch] = useReducer(orderReducer, initialOrderState)
  return (
    <OrderContext.Provider value={{ state, dispatch }}>
      {children}
    </OrderContext.Provider>
  )
}

// 3. UI state context (< 100 lines)
function UIStateProvider({ children }) {
  const [state, dispatch] = useReducer(uiReducer, initialUIState)
  return (
    <UIContext.Provider value={{ state, dispatch }}>
      {children}
    </UIContext.Provider>
  )
}

// 4. Combined provider
function RestaurantProvider({ children }) {
  return (
    <AuthProvider>
      <TableStateProvider>
        <OrderStateProvider>
          <UIStateProvider>
            {children}
          </UIStateProvider>
        </OrderStateProvider>
      </TableStateProvider>
    </AuthProvider>
  )
}
```

## Medium Priority Targets

### 5. Database KDS Module (777 lines)

**File**: `lib/modassembly/supabase/database/kds.ts`
**Priority**: MEDIUM
**Complexity Score**: 6/10

#### Refactoring Strategy

```typescript
// Split into focused modules

// 1. Station management (< 200 lines)
// lib/modassembly/supabase/database/kds-stations.ts
export async function getStations() {
  /* ... */
}
export async function createStation() {
  /* ... */
}
export async function updateStation() {
  /* ... */
}

// 2. Order routing (< 200 lines)
// lib/modassembly/supabase/database/kds-routing.ts
export async function routeOrder() {
  /* ... */
}
export async function updateRouting() {
  /* ... */
}
export async function completeOrder() {
  /* ... */
}

// 3. Metrics and analytics (< 200 lines)
// lib/modassembly/supabase/database/kds-metrics.ts
export async function recordMetric() {
  /* ... */
}
export async function getStationMetrics() {
  /* ... */
}
export async function getPerformanceData() {
  /* ... */
}

// 4. Main KDS module (< 100 lines)
// lib/modassembly/supabase/database/kds.ts
export * from './kds-stations'
export * from './kds-routing'
export * from './kds-metrics'
```

### 6. Use Floor Plan State Hook (512 lines)

**File**: `hooks/use-floor-plan-state.ts`
**Priority**: MEDIUM
**Complexity Score**: 5/10

#### Refactoring Strategy

```typescript
// Split into specialized hooks

// 1. Table management hook (< 200 lines)
function useTableManagement() {
  const [tables, setTables] = useState([])

  const addTable = useCallback(async table => {
    // Implementation
  }, [])

  const updateTable = useCallback(async (id, updates) => {
    // Implementation
  }, [])

  return { tables, addTable, updateTable }
}

// 2. Selection hook (< 100 lines)
function useFloorPlanSelection() {
  const [selectedTable, setSelectedTable] = useState(null)
  const [selectedSeat, setSelectedSeat] = useState(null)

  return {
    selectedTable,
    selectedSeat,
    setSelectedTable,
    setSelectedSeat,
  }
}

// 3. Canvas interaction hook (< 150 lines)
function useCanvasInteractions() {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  return { zoom, pan, setZoom, setPan }
}

// 4. Main composite hook (< 50 lines)
function useFloorPlanState() {
  const tableState = useTableManagement()
  const selectionState = useFloorPlanSelection()
  const canvasState = useCanvasInteractions()

  return {
    ...tableState,
    ...selectionState,
    ...canvasState,
  }
}
```

## Low Priority Targets

### 7. Use KDS Orders Hook (445 lines)

**File**: `hooks/use-kds-orders.ts`
**Priority**: LOW
**Complexity Score**: 4/10

### 8. Voice Order Panel (389 lines)

**File**: `components/voice-order-panel.tsx`
**Priority**: LOW
**Complexity Score**: 4/10

## Refactoring Guidelines

### Safe Refactoring Steps

1. **Prepare Phase**

   - Create comprehensive tests for existing functionality
   - Document current behavior
   - Identify all dependencies and imports

2. **Extract Phase**

   - Create new files with focused responsibilities
   - Move code in small, testable chunks
   - Maintain existing interfaces initially

3. **Replace Phase**

   - Update imports one file at a time
   - Test after each change
   - Maintain backwards compatibility

4. **Cleanup Phase**
   - Remove old files
   - Update documentation
   - Remove unused imports and dependencies

### Testing Strategy

```typescript
// Before refactoring: Integration test
describe('Server Page Integration', () => {
  it('completes full order flow', () => {
    render(<ServerPage />)
    // Test full user journey
  })
})

// During refactoring: Component tests
describe('FloorPlanSection', () => {
  it('handles table selection', () => {
    render(<FloorPlanSection />)
    // Test specific functionality
  })
})

// After refactoring: Unit tests
describe('useOrderFlow', () => {
  it('manages order state correctly', () => {
    const { result } = renderHook(() => useOrderFlow())
    // Test hook behavior
  })
})
```

### Performance Impact Assessment

| Component                    | Before (lines) | After (est. lines)   | Perf Impact              |
| ---------------------------- | -------------- | -------------------- | ------------------------ |
| server/page.tsx              | 893            | 6 files × 150 avg    | +40% faster rendering    |
| use-floor-plan-reducer.ts    | 865            | 4 files × 150 avg    | +60% state updates       |
| kds-layout.tsx               | 792            | 5 files × 150 avg    | +50% rendering           |
| restaurant-state-context.tsx | 731            | 4 contexts × 150 avg | +70% re-render reduction |

### Risk Assessment

#### High Risk

- **State management refactoring**: Could break existing functionality
- **Component splitting**: May introduce prop drilling

#### Medium Risk

- **Hook extraction**: Could affect performance if not memoized correctly
- **Database module splitting**: May create circular dependencies

#### Low Risk

- **UI component extraction**: Isolated changes with clear boundaries
- **Utility function extraction**: Pure functions with no side effects

### Rollback Strategy

1. **Git branching**: Each refactoring in separate feature branch
2. **Feature flags**: Gradual rollout of refactored components
3. **A/B testing**: Compare performance before/after
4. **Monitoring**: Track error rates and performance metrics

## Automation Opportunities

### Code Generation Templates

```bash
# Component template generator
npx create-component FloorPlanSection --type=server --features=state,hooks

# Hook template generator
npx create-hook useOrderFlow --type=context --features=reducer,realtime

# Context template generator
npx create-context OrderFlow --features=reducer,persistence
```

### Refactoring Scripts

```typescript
// scripts/refactor-component.ts
// Automated component splitting script
export function splitComponent(
  filePath: string,
  splitConfig: ComponentSplitConfig
) {
  // Parse AST
  // Extract components based on config
  // Generate new files
  // Update imports
}
```

These refactoring targets provide a systematic approach to improving code quality, maintainability, and performance while reducing technical debt in the Plate Restaurant System.
