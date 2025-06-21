# Essential Development Commands

## Development
```bash
npm run dev:clean         # Start fresh development (kills port 3000 first)
npm run dev:raw           # Raw Next.js dev without cleanup
npm run dev:https         # HTTPS development mode
npm run kill-port         # Kill process on port 3000
```

## Testing
```bash
npm run test:quick        # Unit tests + lint + type-check (fast)
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests
npm run test:e2e          # End-to-end tests  
npm run test:performance  # Performance tests
npm run test:voice        # Voice ordering tests
npm run test:all          # Complete test suite
```

## Code Quality
```bash
npm run lint              # ESLint with auto-fix
npm run format            # Prettier formatting
npm run type-check        # TypeScript type checking
```

## Build & Deploy
```bash
npm run build             # Production build
npm run analyze           # Bundle size analysis
npm run bundle:analyze    # Detailed bundle analysis
npm run start             # Start production server
```

## Database & Supabase
```bash
npm run supabase:start    # Start local Supabase
npm run supabase:migrate  # Apply database migrations
npm run supabase:stop     # Stop local Supabase
npm run demo:setup        # Setup demo data and guest account
```

## Performance Monitoring
```bash
npm run perf:analyze      # Analyze KDS performance
npm run monitor:health    # Health monitoring
npm run validate:production # Production readiness check
```