# THE APPRENTICE GUIDE - 10 Commandments of This Codebase

*Written by a veteran who's debugged production at 3 AM too many times*

## THE 10 COMMANDMENTS

### 1. THOU SHALL NOT BREAK WHAT WORKS
The backend integration (`lib/modassembly/`) is sacred. It works. It handles edge cases. It's been battle-tested. If you think you need to "improve" it, you're probably wrong.

**Before touching ANY file in `/lib/modassembly/`:**
- Read the entire file and understand WHY it exists
- Check git history to see what problems it solved
- Write tests for existing behavior FIRST
- Get approval from someone who's shipped production code

### 2. THOU SHALL VALIDATE ALL INPUTS
Never trust data from:
- User input (forms, voice, clicks)
- Database responses (Supabase can fail)
- API calls (networks are unreliable)
- Environment variables (they might not exist)

```typescript
// WRONG - will crash production
const userId = session.user.id
const order = await createOrder(userId, items)

// RIGHT - survives the real world
if (!session?.user?.id) {
  throw new Error('Invalid session')
}
if (!Array.isArray(items) || items.length === 0) {
  throw new Error('Invalid order items')
}
const order = await createOrder(session.user.id, items)
```

### 3. THOU SHALL HANDLE ERRORS LIKE AN ADULT
Every async operation can fail. Plan for it.

```typescript
// WRONG - tomorrow's outage
const data = await fetchData()
setData(data)

// RIGHT - professional software
try {
  const data = await fetchData()
  setData(data)
} catch (error) {
  console.error('Data fetch failed:', error)
  setError('Failed to load data. Please try again.')
  // Optionally: retry with exponential backoff
}
```

### 4. THOU SHALL NOT LEAK MEMORY
Every event listener, subscription, and timer must be cleaned up.

```typescript
// WRONG - memory leak
useEffect(() => {
  const subscription = supabase.channel('orders').subscribe(handleUpdate)
  // Missing cleanup!
}, [])

// RIGHT - responsible resource management
useEffect(() => {
  const subscription = supabase.channel('orders').subscribe(handleUpdate)
  return () => {
    supabase.removeChannel(subscription)
  }
}, [])
```

### 5. THOU SHALL NOT BLOCK THE UI THREAD
Heavy operations go in web workers or get chunked.

```typescript
// WRONG - freezes the UI
const processLargeDataset = (items) => {
  return items.map(item => expensiveOperation(item))
}

// RIGHT - keeps UI responsive
const processLargeDataset = async (items) => {
  const results = []
  const batchSize = 100
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = batch.map(item => expensiveOperation(item))
    results.push(...batchResults)
    
    // Let other tasks run
    await new Promise(resolve => setTimeout(resolve, 0))
  }
  
  return results
}
```

### 6. THOU SHALL LOG USEFUL INFORMATION
Production debugging happens at 3 AM. Be kind to your future self.

```typescript
// WRONG - useless noise
console.log('function called')

// WRONG - missing context
console.error(error)

// RIGHT - actionable information
console.error('Order creation failed', {
  userId: session.user.id,
  tableId,
  items: items.length,
  error: error.message,
  timestamp: new Date().toISOString()
})
```

### 7. THOU SHALL USE TYPESCRIPT PROPERLY
Types aren't suggestions. They're contracts.

```typescript
// WRONG - defeats the purpose
const processOrder = (data: any) => {
  // Hope for the best
}

// RIGHT - self-documenting code
interface OrderData {
  tableId: string
  items: OrderItem[]
  userId: string
  timestamp: Date
}

const processOrder = (data: OrderData): Promise<Order> => {
  // Compiler helps you succeed
}
```

### 8. THOU SHALL NOT OPTIMIZE PREMATURELY
Measure first. Optimize what matters.

```typescript
// WRONG - micro-optimization without measurement
const memoizedComponent = React.memo(MyComponent, (prev, next) => {
  // Complex comparison logic for a component that renders once
})

// RIGHT - optimize based on real performance problems
// Only after measuring that this component causes performance issues
const OptimizedComponent = React.memo(ExpensiveComponent)
```

### 9. THOU SHALL WRITE BORING CODE
Clever code is a liability. Boring code gets maintained.

```typescript
// WRONG - too clever
const getData = (...args) => args.reduce((acc, arg) => ({...acc, ...(arg?.data && {[arg.key]: arg.data})}), {})

// RIGHT - boring but clear
const getData = (userArg, orderArg, tableArg) => {
  const result = {}
  
  if (userArg?.data) {
    result[userArg.key] = userArg.data
  }
  
  if (orderArg?.data) {
    result[orderArg.key] = orderArg.data
  }
  
  if (tableArg?.data) {
    result[tableArg.key] = tableArg.data
  }
  
  return result
}
```

### 10. THOU SHALL DOCUMENT THE WHY, NOT THE WHAT

```typescript
// WRONG - documents the obvious
// Increment the counter
counter++

// RIGHT - documents the business logic
// Increment retry counter before exponential backoff
// Max retries: 3 (prevents infinite loops on network issues)
retryCount++
```

## COMMON PITFALLS AND HOW TO AVOID THEM

### The useState Explosion
**Symptom**: Component has 10+ useState calls
**Problem**: Re-render cascades, hard to debug state
**Solution**: Use useReducer for related state

```typescript
// WRONG - state management nightmare
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)
const [data, setData] = useState([])
const [retryCount, setRetryCount] = useState(0)
const [lastFetch, setLastFetch] = useState(null)
// ... 10 more useState calls

// RIGHT - manageable state
const [state, dispatch] = useReducer(dataReducer, initialState)
```

### The Async/Await Trap
**Symptom**: Race conditions, memory leaks, inconsistent state
**Problem**: Missing cleanup, no cancellation
**Solution**: Use AbortController and proper cleanup

```typescript
// WRONG - race conditions
useEffect(() => {
  const fetchData = async () => {
    const result = await api.getData()
    setData(result) // Component might be unmounted!
  }
  fetchData()
}, [])

// RIGHT - cancellable operations
useEffect(() => {
  const controller = new AbortController()
  
  const fetchData = async () => {
    try {
      const result = await api.getData({ signal: controller.signal })
      setData(result)
    } catch (error) {
      if (error.name !== 'AbortError') {
        setError(error)
      }
    }
  }
  
  fetchData()
  
  return () => controller.abort()
}, [])
```

### The Premature Abstraction
**Symptom**: Generic components that are hard to use
**Problem**: Solving problems you don't have yet
**Solution**: Wait until you have 3 similar use cases

### The Import Hell
**Symptom**: Bundle size exploding, slow builds
**Problem**: Importing entire libraries for one function
**Solution**: Tree-shaking and targeted imports

```typescript
// WRONG - imports the universe
import * as lodash from 'lodash'
import { motion } from 'framer-motion'

// RIGHT - surgical imports
import { debounce } from 'lodash/debounce'
import { m } from 'framer-motion' // Smaller bundle
```

## "IF YOU'RE THINKING OF DOING X, READ THIS FIRST"

### Adding a New State Management Library
**STOP.** This app already has React Context and useReducer. They handle 99% of use cases. If you think you need Redux/Zustand/Jotai, you probably need to refactor your components instead.

### Adding a New Animation Library
**STOP.** CSS transitions handle 90% of animations and are 10x smaller. Only use JS animations for complex interactions that CSS can't handle.

### Adding a New UI Library
**STOP.** This app already has a consistent UI system. Adding another library fragments the user experience and increases bundle size.

### Refactoring the Database Layer
**STOP.** The Supabase integration works. It handles edge cases. It's been tested. If you think it needs refactoring, you need to understand it better first.

### Adding TypeScript Strict Mode
**DO IT.** But incrementally. Fix one file at a time. Don't break the build.

## PERFORMANCE LESSONS LEARNED THE HARD WAY

### Bundle Size Matters
Every MB of JavaScript costs real money in CDN fees and user abandonment. Measure your bundles. Question every dependency.

### Re-renders Are Expensive
One useState change can trigger hundreds of component updates. Use React DevTools Profiler. Fix the big problems first.

### Database Queries Compound
One N+1 query is barely noticeable. Ten N+1 queries kill performance. Always think about how queries scale.

### Memory Leaks Are Silent Killers
They don't break functionality immediately. They crash browsers after 30 minutes of use. Prevention is easier than debugging.

## WHY WE DO THINGS THE "BORING" WAY

### We Use Standard Patterns
Because the next developer (maybe you in 6 months) will understand them immediately.

### We Avoid Clever Code
Because clever code requires clever debugging. 3 AM debugging is never clever.

### We Document Business Logic
Because the code tells you HOW, but only humans can tell you WHY.

### We Test Edge Cases
Because production users find every edge case you didn't think of.

### We Plan for Failure
Because networks fail, databases go down, and users do unexpected things.

---

*"The best code is the code that doesn't need to be written. The second best code is code that's so boring it never breaks."* - A veteran who's seen too many clever solutions fail in production