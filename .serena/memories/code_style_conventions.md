# Code Style & Conventions

## General Guidelines
- Follow patterns in `.claude/CLAUDE.md`
- Keep components under 200 lines
- Maintain 80%+ test coverage
- Use server-first authentication patterns

## TypeScript
- Strict type checking enabled
- Avoid `any` type usage (replaced with proper types in optimization)
- Use proper interface definitions
- Import types with `import type { }`

## Code Organization
- Domain-separated modules in `lib/modassembly/`
- Authentication in `lib/modassembly/supabase/auth/`
- Database operations in `lib/modassembly/supabase/database/`
- Hooks in `hooks/` directory
- Components organized by feature/domain

## File Naming
- Use kebab-case for files: `voice-command-panel.tsx`
- Use PascalCase for React components
- Use camelCase for functions and variables

## Authentication Patterns
- Server-first authentication (no client-side auth state)
- Use `createServerClient` for server-side operations
- Use `createClient` for browser-side operations  
- Handle refresh token errors gracefully
- Always cleanup auth subscriptions

## Database Patterns
- Use connection pooling via `database-connection-pool.ts`
- Specific clients: `getKDSClient()`, `getAuthClient()`, etc.
- Handle connection errors with retries
- Implement proper RLS (Row Level Security) policies

## Testing Patterns
- Unit tests in `__tests__/unit/`
- Integration tests in `__tests__/integration/`
- E2E tests in `__tests__/e2e/`
- Performance tests in `__tests__/performance/`
- Use proper mocking for Supabase clients