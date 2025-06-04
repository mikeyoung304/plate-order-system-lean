# Testing Framework Documentation

This document provides comprehensive documentation for the enterprise-grade testing framework implemented for the Plate Restaurant System.

## Overview

Our testing framework is designed to ensure enterprise-grade reliability for 1000+ concurrent users. It includes multiple test types, comprehensive coverage reporting, and CI/CD integration.

## Test Structure

```
__tests__/
├── setup/                    # Test configuration and setup
│   ├── env-setup.js         # Environment variables and globals
│   └── global-setup.js      # Global test utilities and cleanup
├── mocks/                    # Mock implementations
│   └── file-mock.js         # Static asset mocks
├── utils/                    # Testing utilities
│   └── test-utils.tsx       # Reusable test helpers and components
├── unit/                     # Unit tests
│   ├── components/          # Component tests
│   ├── hooks/               # Custom hook tests
│   └── lib/                 # Utility function tests
├── integration/              # Integration tests
│   ├── api/                 # API route tests
│   └── database/            # Database operation tests
├── e2e/                      # End-to-end tests
│   └── *.test.ts           # Critical user journey tests
└── performance/              # Performance tests
    └── *.test.ts           # Rendering and optimization tests
```

## Test Types

### 1. Unit Tests (`__tests__/unit/`)

Tests individual components, hooks, and utility functions in isolation.

**Coverage Requirements:**
- Global: 80% (branches, functions, lines, statements)
- KDS Components: 90%
- Core Libraries: 85%

**Example:**
```typescript
import { renderWithProviders, mockData } from '@/__tests__/utils/test-utils'
import { KDSLayout } from '@/components/kds/kds-layout'

describe('KDSLayout', () => {
  it('renders successfully with default props', () => {
    renderWithProviders(<KDSLayout stationId="kitchen" />)
    expect(screen.getByText('Station kitchen')).toBeInTheDocument()
  })
})
```

### 2. Integration Tests (`__tests__/integration/`)

Tests API routes, database operations, and service integrations.

**Features:**
- Database connection testing
- API endpoint validation
- External service mocking
- Error handling verification

**Example:**
```typescript
import { GET } from '@/app/api/auth-check/route'
import { createMockSupabaseClient } from '@/__tests__/utils/test-utils'

describe('/api/auth-check', () => {
  it('returns user data when authenticated', async () => {
    // Test implementation
  })
})
```

### 3. End-to-End Tests (`__tests__/e2e/`)

Tests complete user workflows from start to finish.

**Critical Flows Tested:**
- Order creation workflow
- Kitchen order processing
- Voice ordering system
- Real-time updates
- Error recovery

**Example:**
```typescript
describe('Order Flow E2E Tests', () => {
  it('completes full order creation workflow', async () => {
    // Simulate complete user journey
  })
})
```

### 4. Performance Tests (`__tests__/performance/`)

Tests rendering performance and optimization under various load conditions.

**Performance Thresholds:**
- Empty layout: <10ms average render time
- 10 orders: <50ms average render time
- 100 orders: <500ms average render time
- Memory increase: <20% over baseline

**Example:**
```typescript
import { performanceUtils } from '@/__tests__/utils/test-utils'

describe('KDS Rendering Performance', () => {
  it('renders 100 orders within performance threshold', async () => {
    const result = await performanceUtils.measureRenderTime(
      () => render(<KDSLayout orders={orders} />),
      5
    )
    expect(result.average).toBeLessThan(500)
  })
})
```

## Test Utilities

### `test-utils.tsx`

Provides comprehensive testing utilities:

**Rendering Utilities:**
- `renderWithProviders()` - Renders components with all providers
- `renderComponent()` - Simple component rendering

**Mock Data Generators:**
- `mockData.user()` - Generate mock user data
- `mockData.order()` - Generate mock order data
- `mockData.kdsOrder()` - Generate mock KDS order data

**Performance Testing:**
- `performanceUtils.measureRenderTime()` - Measure rendering performance
- `performanceUtils.measureAsyncOperation()` - Measure async operations

**Accessibility Testing:**
- `a11yUtils.checkKeyboardNavigation()` - Test keyboard navigation
- `a11yUtils.checkAriaLabels()` - Validate ARIA labels

## Running Tests

### Local Development

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:performance

# Watch mode for development
npm run test:watch
npm run test:unit:watch

# Coverage reporting
npm run test:coverage
npm run test:coverage:open

# Debug tests
npm run test:debug
```

### Using the Test Runner

Our custom test runner provides orchestrated execution:

```bash
# Run complete test suite
node scripts/test-runner.js

# Options
node scripts/test-runner.js --verbose    # Detailed output
node scripts/test-runner.js --fail-fast  # Stop on first failure
node scripts/test-runner.js --skip-slow  # Skip E2E and performance tests
```

### CI/CD Pipeline

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests
- Manual workflow dispatch

Pipeline includes:
- Parallel test execution
- Coverage reporting
- Performance monitoring
- Build verification

## Mocking Strategy

### Supabase Mocking

```typescript
// Complete Supabase client mock
const mockSupabase = createMockSupabaseClient()

// Chainable query methods
mockSupabase.from().select().eq().single.mockResolvedValue({
  data: mockData.user(),
  error: null,
})
```

### External Services

- **OpenAI API**: Mocked transcription responses
- **Web Audio API**: Complete audio recording simulation
- **Browser APIs**: ResizeObserver, IntersectionObserver, etc.

### Real-time Subscriptions

```typescript
// Mock real-time updates
mockSupabase.channel().on.mockImplementation((event, filter, callback) => {
  setTimeout(() => {
    callback({
      eventType: 'UPDATE',
      new: updatedOrder,
      old: originalOrder,
    })
  }, 50)
})
```

## Best Practices

### Test Organization

1. **Descriptive Test Names**: Use clear, specific test descriptions
2. **Arrange-Act-Assert**: Structure tests with clear phases
3. **Single Responsibility**: Each test should verify one behavior
4. **Test Isolation**: Tests should not depend on each other

### Performance Considerations

1. **Cleanup**: Always clean up after tests
2. **Memory Management**: Monitor memory usage in long-running tests
3. **Async Handling**: Properly handle async operations
4. **Mock Efficiency**: Use lightweight mocks

### Coverage Guidelines

1. **Critical Paths**: 90%+ coverage for critical components
2. **Edge Cases**: Test error conditions and edge cases
3. **User Interactions**: Test all user-facing functionality
4. **Integration Points**: Test service boundaries

## Debugging Tests

### Common Issues

1. **Async Timing**: Use `waitFor` for async operations
2. **State Cleanup**: Ensure proper test isolation
3. **Mock Configuration**: Verify mock implementations
4. **Environment Variables**: Check test environment setup

### Debug Tools

```bash
# Run tests with debugger
npm run test:debug

# Update snapshots
npm run test:update-snapshots

# Clear Jest cache
npm run test:clear-cache

# Verbose output
VERBOSE_TESTS=true npm test
```

### VS Code Configuration

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Jest Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Contributing

### Adding New Tests

1. Follow the established directory structure
2. Use the provided test utilities
3. Include both positive and negative test cases
4. Add performance tests for new components
5. Update this documentation

### Test Standards

1. **Minimum Coverage**: Meet or exceed coverage thresholds
2. **Performance**: New tests should complete within reasonable time
3. **Reliability**: Tests should be deterministic and stable
4. **Maintainability**: Write clear, readable test code

## Monitoring and Reporting

### Coverage Reports

- **HTML Report**: `coverage/lcov-report/index.html`
- **JSON Summary**: `coverage/coverage-summary.json`
- **LCOV Format**: `coverage/lcov.info`

### Performance Metrics

- **Render Times**: Tracked per component and order count
- **Memory Usage**: Monitored for memory leaks
- **Build Size**: Tracked over time

### CI/CD Integration

- **Codecov**: Automatic coverage uploads
- **GitHub Actions**: Automated test execution
- **Artifact Storage**: Test results preserved for analysis

## Troubleshooting

### Common Problems

1. **Tests Hanging**: Check for unresolved promises
2. **Memory Leaks**: Verify cleanup in `afterEach`
3. **Flaky Tests**: Add proper waits for async operations
4. **Mock Issues**: Ensure mocks are reset between tests

### Getting Help

1. Check the test output for specific error messages
2. Review similar existing tests for patterns
3. Use `--verbose` flag for detailed output
4. Check Jest documentation for advanced features

## Enterprise Considerations

### Scalability

- Tests are designed to handle 1000+ concurrent users
- Performance thresholds ensure UI responsiveness
- Memory management prevents leaks under load

### Reliability

- Comprehensive error handling testing
- Network failure simulation
- Database connection resilience

### Security

- Authentication flow testing
- Authorization verification
- Input validation testing
- XSS prevention validation

This testing framework ensures the Plate Restaurant System meets enterprise-grade reliability standards while maintaining development velocity and code quality.