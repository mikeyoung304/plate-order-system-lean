# Testing Guide

## Quick Testing Commands

```bash
# Essential testing commands
npm run test:quick       # Unit tests + lint + type-check (fastest)
npm run test:coverage    # Generate coverage report  
npm run test:unit        # Unit tests only
npm run test:integration # API and database tests
npm run test:e2e         # End-to-end user workflows
```

## Testing Strategy

### Coverage Targets
- **Overall:** 80% minimum
- **Critical components:** 90% (KDS, auth, orders)
- **Core libraries:** 85%

### Test Types

**Unit Tests** (`__tests__/unit/`)
- Individual components and functions
- Fast execution, good for TDD
- Mock external dependencies

**Integration Tests** (`__tests__/integration/`)
- API endpoints and database operations
- Multi-component workflows
- Real Supabase connections (test database)

**E2E Tests** (`__tests__/e2e/`)
- Complete user journeys
- Browser automation with Playwright
- Critical business flows only

**Performance Tests** (`__tests__/performance/`)
- Rendering performance under load
- Real-time update efficiency
- Memory usage validation

## Test Framework

**Tech Stack:**
- **Jest** - Test runner and framework
- **@testing-library/react** - Component testing utilities
- **Playwright** - E2E browser automation
- **Custom utilities** - Restaurant-specific test helpers

**Configuration:**
```bash
# Test projects defined in jest.config.js
unit         # Fast component and function tests
integration  # API and database integration
e2e          # End-to-end browser tests  
performance  # Load and rendering performance
```

## Quick Start Testing

### 1. Run Basic Tests
```bash
npm run test:quick  # 3-minute essential test suite
```

### 2. Check Coverage
```bash
npm run test:coverage        # Generate report
npm run test:coverage:open   # Open HTML report
```

### 3. Debug Failing Tests
```bash
npm run test:debug           # Run with debugger
npm run test:unit:watch      # Watch mode for development
```

## Writing Tests

### Component Test Example
```typescript
import { renderWithProviders } from '@/__tests__/utils/test-utils'
import { OrderCard } from '@/components/kds/order-card'

describe('OrderCard', () => {
  it('displays order information correctly', () => {
    const order = mockData.order({ status: 'new' })
    renderWithProviders(<OrderCard order={order} onBump={jest.fn()} />)
    
    expect(screen.getByText(order.items[0])).toBeInTheDocument()
    expect(screen.getByText('NEW')).toBeInTheDocument()
  })
})
```

### API Test Example  
```typescript
import { GET } from '@/app/api/auth-check/route'
import { createMockRequest } from '@/__tests__/utils/test-utils'

describe('/api/auth-check', () => {
  it('returns user data when authenticated', async () => {
    const request = createMockRequest({ authenticated: true })
    const response = await GET(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.user).toBeDefined()
  })
})
```

## Performance Testing

### KDS Performance Benchmarks
```bash
# Test KDS rendering performance
npm run test:performance

# Targets:
# - 10 orders: <50ms render time
# - 100 orders: <500ms render time
# - Memory increase: <20% over baseline
```

### Real-Time Performance
```typescript
// Test subscription efficiency
describe('Real-time Order Updates', () => {
  it('handles 100 concurrent order updates efficiently', async () => {
    const updates = generateOrderUpdates(100)
    const startTime = performance.now()
    
    await simulateRealtimeUpdates(updates)
    
    const duration = performance.now() - startTime
    expect(duration).toBeLessThan(500) // <500ms for 100 updates
  })
})
```

## Test Utilities

### Mock Data Generators
```typescript
import { mockData } from '@/__tests__/utils/test-utils'

// Generate realistic test data
const user = mockData.user({ role: 'server' })
const order = mockData.order({ status: 'new', items: ['Pizza', 'Soda'] })
const kdsOrder = mockData.kdsOrder({ station: 'grill' })
```

### Supabase Mocking
```typescript
import { createMockSupabaseClient } from '@/__tests__/utils/test-utils'

// Mock Supabase operations
const mockSupabase = createMockSupabaseClient()
mockSupabase.from('orders').select().mockResolvedValue({
  data: [mockData.order()],
  error: null
})
```

### Performance Utilities
```typescript
import { performanceUtils } from '@/__tests__/utils/test-utils'

// Measure component render time
const renderTime = await performanceUtils.measureRenderTime(
  () => render(<KDSLayout orders={orders} />),
  5 // 5 iterations for average
)
```

## Test Maintenance

### Running Full Test Suite
```bash
npm run test:all     # Complete test suite (5-10 minutes)
npm run test:ci      # CI-optimized test run
```

### Updating Tests
```bash
npm run test:update-snapshots  # Update Jest snapshots
npm run test:clear-cache       # Clear Jest cache
```

### Test Data Management
```bash
# Clean test database
npm run cleanup-database

# Reset test environment  
npm run test:reset-env
```

## Comprehensive Documentation

For detailed testing framework documentation including:
- Advanced testing patterns
- Mock strategies
- Debugging techniques
- CI/CD integration
- Enterprise-grade testing practices

**See:** `__tests__/README.md` (372 lines of comprehensive testing documentation)

## Continuous Integration

### GitHub Actions
```yml
# Runs on push/PR
- Unit tests (parallel)
- Integration tests
- E2E tests (critical flows only)
- Performance benchmarks
- Coverage reporting
```

### Quality Gates
- All tests must pass
- Coverage must be ≥80%
- No ESLint errors
- TypeScript compilation successful
- Performance thresholds met

## Troubleshooting

### Common Issues
```bash
# Tests hanging
npm run test:debug  # Check for unresolved promises

# Performance test failures  
npm run monitor:health  # Check system performance

# Mock configuration issues
npm run test:clear-cache  # Reset Jest cache
```

### Getting Help
1. Check test output for specific errors
2. Review similar tests for patterns
3. Use `--verbose` flag for detailed output
4. See comprehensive documentation in `__tests__/README.md`