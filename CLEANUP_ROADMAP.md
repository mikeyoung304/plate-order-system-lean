# Professional Cleanup Roadmap - Plater Restaurant System

## Mission: From 28,000 Lines of Vibe Code to 10,000 Lines of Quality

This roadmap provides specific, actionable steps to transform this vibe-coded codebase into a maintainable, performant application that actually serves assisted living facilities.

## Pre-Cleanup Checklist

- [ ] Full backup of current codebase
- [ ] Document any undocumented features that work
- [ ] List all environment variables needed
- [ ] Identify the 3-5 most critical user flows
- [ ] Get buy-in from stakeholders on "negative feature development"

## Phase 1: Quick Wins - The Great Purge (1-2 days)

**Goal**: Remove 40% of codebase with ZERO user impact

### Day 1 Morning: Delete Obvious Bloat
```bash
# These can be deleted immediately with no impact
rm components/ai-order-assistant.tsx              # 290 lines of fake AI
rm components/notification-system.tsx             # 515 lines (never imported)
rm components/floor-plan-editor-old.tsx          # Replaced file
rm -rf lib/performance/                          # 1000+ lines of theater
rm lib/dev-experience/                           # Meta-programming nonsense
```

### Day 1 Afternoon: Dependency Massacre
```json
// Remove from package.json:
- "framer-motion"           # For fake audio bars
- "recharts"                # For mock charts
- "date-fns"               # Use Intl.DateTimeFormat
- "embla-carousel-react"    # Never used
- "cmdk"                   # Command palette doesn't exist
- "vaul"                   # Barely used drawer
- "input-otp"              # No OTP feature
- "@emotion/is-prop-valid" # Emotion not used
- 15+ unused Radix packages

// Run:
npm uninstall [all above packages]
npm install
```

### Day 2: Code Cleanup
- [ ] Remove all "OVERNIGHT_SESSION" comments (500+ lines)
- [ ] Delete mock data files in `/mocks/`
- [ ] Remove abandoned test infrastructure
- [ ] Delete guest mode scripts (unused)
- [ ] Remove duplicate route pages (/direct-server, /server-bypass)
- [ ] Delete unused API routes

**Expected Result**: 
- -12,000 lines of code
- -400KB bundle size
- Same exact functionality

## Phase 2: Pattern Consolidation (3-4 days)

**Goal**: One way to do everything

### State Management Consolidation
```typescript
// DECISION: Local state + Supabase realtime only
// DELETE: All custom caching, all global UI state

// Bad (current):
const [isLoading, setIsLoading] = useState(false);
const [loadingText, setLoadingText] = useState('');
const [loadingProgress, setLoadingProgress] = useState(0);

// Good (new):
const [loadingState, setLoadingState] = useState({
  isLoading: false,
  text: '',
  progress: 0
});
```

### Error Handling Consolidation
```typescript
// DECISION: try/catch + single error boundary
// DELETE: Custom error types, multiple patterns

// Single pattern for all async operations:
try {
  const result = await operation();
  return { success: true, data: result };
} catch (error) {
  console.error('Operation failed:', error);
  return { success: false, error: error.message };
}
```

### Data Fetching Consolidation
```typescript
// DECISION: Direct Supabase for all data
// DELETE: API routes that just proxy Supabase, custom wrappers

// Single pattern:
const { data, error } = await supabase
  .from('table')
  .select('*')
  .single();
```

## Phase 3: Component Surgery (1 week)

**Goal**: Simple, focused components

### Week 1: High-Impact Refactors

#### Simplify VoiceOrderPanel (516 → 150 lines)
```typescript
// Remove:
- Fake audio visualizer (40 bars doing nothing)
- Complex retry logic (just try once)
- Multiple loading states
- Theatrical animations

// Keep:
- Record button
- Actual recording logic
- Send to OpenAI
- Display transcription
- Submit order
```

#### Split Kitchen Display Components
```typescript
// Current: Monolithic KDS component
// New structure:
- OrderList.tsx (display orders)
- OrderCard.tsx (single order)
- TableGroupView.tsx (grouped orders)
- KitchenHeader.tsx (filters/controls)
```

#### Replace Security Theater
```typescript
// Delete lib/security/index.ts (350 lines)
// Replace with:
export const sanitizeInput = (input: string) => {
  return DOMPurify.sanitize(input);
};
// That's it. 3 lines.
```

## Phase 4: Feature Reality Check (3-4 days)

**Goal**: Make fake features real or delete them

### Delete These Fake Features
- [ ] AI Order Assistant (it's just time-based if/else)
- [ ] Weather-based predictions (mentioned but not implemented)
- [ ] Push notifications (can't actually push)
- [ ] Analytics dashboard (100% mock data)

### Make These Real
- [ ] Printer integration (currently returns mock success)
- [ ] Actual prep time tracking (not random numbers)
- [ ] Real order analytics (not hardcoded data)
- [ ] Guest mode (scripts exist, add UI)

### Simplify These
- [ ] Voice order: Remove "confidence" scores
- [ ] Resident selector: Remove "ML" language
- [ ] Performance: Use browser DevTools, not custom

## Phase 5: State Management Surgery (2-3 days)

### Component State Fixes

#### Before: VoiceOrderPanel Chaos
```typescript
// 10 different useStates
```

#### After: Single State Object
```typescript
const [voiceState, dispatch] = useReducer(voiceReducer, {
  recording: false,
  processing: false,
  transcription: '',
  items: [],
  error: null
});
```

### Remove Global State Abuse
- [ ] Theme doesn't need global state (CSS variables)
- [ ] UI state should be local
- [ ] Only auth and user need context

## Phase 6: Dependency Diet (1 day)

### Final Dependency List
```json
{
  "dependencies": {
    // Core (required)
    "next": "15.x",
    "react": "19.x", 
    "react-dom": "19.x",
    "@supabase/supabase-js": "2.x",
    "@supabase/ssr": "0.x",
    
    // Business critical
    "openai": "4.x",              // Voice transcription
    "isomorphic-dompurify": "2.x", // XSS prevention
    
    // UI essentials
    "clsx": "2.x",                // Class names
    "lucide-react": "0.x",        // Icons
    "@radix-ui/react-dialog": "1.x",     // Modals
    "@radix-ui/react-dropdown-menu": "2.x", // Menus
    "@radix-ui/react-select": "1.x",     // Selects
    
    // Forms & validation
    "react-hook-form": "7.x",     // If keeping complex forms
    "zod": "3.x",                 // If keeping validation
    
    // Utilities
    "react-hot-toast": "2.x"      // Notifications
  }
}
```

## Phase 7: Performance Reality (2 days)

### Remove Performance Theater
- [ ] Delete custom monitoring
- [ ] Remove "smart" caching
- [ ] Delete memory optimization
- [ ] Remove custom memoization

### Add Real Performance
- [ ] Proper React.memo usage
- [ ] Actually lazy load routes
- [ ] Real image optimization
- [ ] Actual database indexes

## Phase 8: Testing & Documentation (3-4 days)

### Add Real Tests
```typescript
// Focus on critical paths:
- Order creation flow
- Authentication
- Role-based access
- Kitchen order updates
- Voice transcription parsing
```

### Write Honest Documentation
```markdown
# What This Actually Does
- Simple order management for assisted living
- Voice ordering for accessibility
- Kitchen display system
- Basic table management

# What It Doesn't Do  
- No AI predictions (removed fake ML)
- No complex analytics (basic only)
- No offline mode (requires connection)
```

## Success Metrics

### Quantitative Goals
- [ ] Code: 28,420 → <10,000 lines (-65%)
- [ ] Dependencies: 57 → ~15 (-74%)
- [ ] Bundle: ~800KB → ~200KB (-75%)
- [ ] Build time: <30 seconds
- [ ] Test coverage: >50% (from 0%)

### Qualitative Goals
- [ ] New dev onboarding: <1 day
- [ ] Any component understandable in <5 minutes
- [ ] Clear patterns throughout
- [ ] No fake features
- [ ] Honest about capabilities

## Maintenance Mode

### Weekly Tasks
- Review and reject any "clever" abstractions
- Check for dependency updates (security only)
- Ensure no vibe-coding creep

### Monthly Tasks  
- Bundle size audit
- Performance check
- Remove any unused code
- Simplify any complex code

## The North Star

**Every decision should be guided by:**
1. Does this solve a real user problem?
2. Is this the simplest solution?
3. Will a junior dev understand this?
4. Are we being honest about capabilities?

## Final Note

This cleanup will be painful. You'll delete code that took days to write. You'll remove "impressive" features. The app will look simpler.

**But that's the point.**

The end result will be an app that:
- Actually works reliably
- Serves real users with real needs  
- Can be maintained by any developer
- Builds trust instead of theater

Remember: The best code is boring code. Make this codebase boring, reliable, and honest.

---

*Timeline: 4-5 weeks for complete cleanup*
*Team size: 1-2 developers*
*Commitment required: No new features during cleanup*