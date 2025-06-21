# Slash Commands for 10x Productivity
# Revolutionary Workflow Automation Commands

## 🚀 TIER 1: CRITICAL WORKFLOW COMMANDS

### /fix:auth-patterns
**Migrate components to Luis's server-first authentication**

**What it does:**
1. Scans for broken auth imports (`useAuth`, `useUser`, `ProtectedRoute`)
2. Updates components to use `createClient()` from server
3. Replaces client-side auth with server-side patterns
4. Tests authentication flow end-to-end

**Files typically affected:** 14 components identified with broken imports
**Usage:** Run when authentication errors occur or after Luis pattern updates

### /security:cleanup
**Eliminate security vulnerabilities and exposed secrets**

**What it does:**
1. Extracts hardcoded secrets from `.claude/settings.local.json`
2. Creates `.env.local` with proper environment variables
3. Consolidates 100+ micro-permissions into logical groups
4. Removes dangerous wildcard permissions (`rm:*`, `chmod:*`)
5. Rotates any exposed Supabase keys

**Critical for:** Immediate security compliance
**Usage:** Run before any deployment or git commit

### /debloat:components
**Break down oversized components and eliminate duplicates**

**What it does:**
1. Identifies components >200 lines (current: 4 violations)
2. Breaks down monster components:
   - `server-client.tsx` (1,134 lines) → 5-7 focused components
   - `ui/sidebar.tsx` (761 lines) → composable parts
3. Eliminates duplicate components (6 identified)
4. Updates all imports to use consolidated versions

**Performance impact:** Significantly improves maintainability and bundle size

## 🎯 TIER 2: DEVELOPMENT ACCELERATION COMMANDS

### /optimize:performance
**Comprehensive performance optimization**

**What it does:**
1. Analyzes current build size (289MB) and identifies bloat
2. Implements code splitting for admin/KDS features
3. Adds React.memo to unmemoized components
4. Optimizes useEffect dependency arrays
5. Compresses and optimizes assets
6. Runs bundle analyzer and provides optimization report

**Target:** Reduce build from 289MB to <100MB (65% reduction)

### /standardize:naming
**Enforce consistent naming conventions across codebase**

**What it does:**
1. Renames 15+ components from kebab-case to PascalCase
2. Ensures consistent import patterns (absolute vs relative)
3. Updates file structure to follow standards
4. Creates index.ts files for better organization
5. Validates naming compliance across entire codebase

**Example transformations:**
- `table-list.tsx` → `TableList.tsx`
- `voice-order-panel.tsx` → `VoiceOrderPanel.tsx`

### /test:comprehensive
**Generate and run comprehensive test suite**

**What it does:**
1. Identifies components without tests
2. Generates test boilerplate for authentication flows
3. Creates integration tests for KDS real-time functionality
4. Adds end-to-end tests for critical user journeys
5. Runs coverage analysis and identifies gaps

**Coverage target:** >90% for critical authentication and order flows

### /realtime:optimize
**Optimize Supabase real-time performance**

**What it does:**
1. Audits current subscriptions for efficiency
2. Implements connection pooling and management
3. Adds intelligent reconnection logic
4. Optimizes subscription filters to reduce data transfer
5. Adds real-time performance monitoring

**Current usage:** 65 useEffect hooks, optimize for better performance

## ⚡ TIER 3: ADVANCED AUTOMATION COMMANDS

### /architecture:align
**Align all features with Luis's modular assembly patterns**

**What it does:**
1. Reviews KDS system for Luis pattern compliance
2. Updates voice ordering to use server-first architecture
3. Aligns analytics with clean domain separation
4. Ensures new features follow modular assembly structure
5. Validates domain boundaries and dependencies

**Pattern compliance:** Ensure all 254 TypeScript files follow Luis's architecture

### /deploy:production
**Complete production deployment preparation**

**What it does:**
1. Runs full test suite: `npm run test:all`
2. Validates TypeScript: `npm run type-check`
3. Lints and formats: `npm run lint && npm run format`
4. Security scan: Validates no exposed secrets or vulnerabilities
5. Performance check: Builds with analysis `ANALYZE=true npm run build`
6. Environment validation: Checks all required env vars
7. Database migration check: Ensures Supabase is up to date

**Pre-deployment checklist:** All quality gates must pass

### /monitor:health
**Set up comprehensive system monitoring**

**What it does:**
1. Implements performance monitoring for all major flows
2. Sets up error tracking and alerting
3. Monitors real-time subscription health
4. Tracks bundle size regression
5. Monitors authentication success rates
6. Sets up database query performance tracking

**Monitoring scope:** Complete system health visibility

## 🔧 TIER 4: SPECIALIZED DOMAIN COMMANDS

### /kds:enhance
**Kitchen Display System optimization**

**What it does:**
1. Optimizes real-time order routing (`intelligentOrderRouting`)
2. Implements order batching for better performance
3. Adds predictive loading for upcoming orders
4. Optimizes KDS component rendering (11 components)
5. Integrates with voice ordering for seamless workflow

**Current KDS usage:** 11 components, optimize for high-frequency updates

### /voice:upgrade
**Voice ordering system enhancement**

**What it does:**
1. Optimizes OpenAI transcription batching
2. Improves voice command recognition accuracy
3. Adds voice feedback and confirmation system
4. Integrates voice orders with KDS real-time updates
5. Implements cost optimization for OpenAI usage

**Integration points:** Voice → Orders → KDS workflow optimization

### /analytics:realtime
**Real-time analytics and reporting system**

**What it does:**
1. Implements real-time metrics dashboard
2. Tracks order flow performance
3. Monitors voice ordering success rates
4. Adds user behavior analytics
5. Creates automated reporting for restaurant operations

**Data sources:** Orders, tables, seats, voice transcriptions

### /admin:dashboard
**Administrative interface optimization**

**What it does:**
1. Creates role-based admin interface
2. Implements user management with proper RLS
3. Adds system configuration management
4. Creates audit logging for admin actions
5. Optimizes admin component performance

**Security focus:** Proper role validation and action auditing

## 🎯 TIER 5: MAINTENANCE & QUALITY COMMANDS

### /audit:complete
**Comprehensive codebase audit**

**What it does:**
1. Scans for new component duplicates
2. Identifies performance regressions
3. Validates security configuration compliance
4. Checks for new tech debt accumulation
5. Analyzes bundle size trends
6. Reviews architecture pattern compliance

**Frequency:** Monthly comprehensive system review

### /dependencies:optimize
**Dependency management and optimization**

**What it does:**
1. Audits for unused dependencies
2. Updates to latest secure versions
3. Identifies bundle size opportunities
4. Resolves dependency conflicts
5. Optimizes import strategies

**Current package.json:** Comprehensive analysis of 50+ dependencies

### /documentation:generate
**Automated documentation generation**

**What it does:**
1. Generates API documentation from TypeScript types
2. Creates component prop documentation
3. Updates architecture decision records
4. Generates setup guide for new developers
5. Creates troubleshooting documentation

**Coverage:** All public APIs and component interfaces

## 📊 COMMAND SUCCESS METRICS

### Performance Impact Tracking
```bash
Before Command Execution:
- Build size: 289MB
- Component violations: 4 files >500 lines
- Duplicate components: 6 identified
- Security issues: Exposed secrets in config

After Command Execution:
- Build size: <100MB (target)
- Component violations: 0 files >200 lines
- Duplicate components: 0 remaining
- Security issues: 0 (clean audit)
```

### Quality Gate Validation
Each command includes automatic validation:
- TypeScript compilation success
- ESLint compliance
- Test coverage maintenance
- Security scan clean
- Performance regression check

### Usage Analytics
Track command effectiveness:
- Execution time and success rate
- Performance improvements achieved
- Issues resolved per command
- Developer productivity metrics

## 🚀 REVOLUTIONARY COMMAND COMBINATIONS

### Full System Refresh
```bash
/security:cleanup && /debloat:components && /optimize:performance
# Complete system cleanup and optimization
```

### Pre-Deployment Pipeline
```bash
/test:comprehensive && /deploy:production && /monitor:health
# Full deployment readiness validation
```

### Architecture Alignment
```bash
/fix:auth-patterns && /architecture:align && /audit:complete
# Ensure complete Luis pattern compliance
```

### Performance Revolution
```bash
/optimize:performance && /realtime:optimize && /kds:enhance
# Maximum performance optimization across all systems
```

---

## 🎯 COMMAND IMPLEMENTATION STRATEGY

### Integration with Development Workflow
1. **Pre-commit hooks:** Run relevant commands automatically
2. **CI/CD integration:** Validate command compliance in pipeline
3. **IDE integration:** Quick access to commands during development
4. **Monitoring integration:** Trigger commands based on system metrics

### Command Evolution
- Track command usage and effectiveness
- Continuously improve based on developer feedback
- Add new commands for emerging patterns
- Deprecate commands that become obsolete

*These commands represent the evolution from manual maintenance to automated excellence*
*Each command is designed to dramatically improve developer velocity while maintaining quality*