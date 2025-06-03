# Framer Motion → CSS Animation Replacement Plan

## Current Impact Analysis

- **Bundle Impact**: ~150KB from framer-motion
- **Usage Count**: 107 motion instances across 8+ files
- **Heaviest Routes**: /server (389KB), /kitchen (377KB), /expo (368KB)
- **Main Culprit**: loading-states.tsx (50+ motion components)

## Replacement Strategy

### Phase 1: CSS Animation Utilities (PRIORITY)

Create lightweight CSS classes in globals.css:

```css
/* Fade animations */
.fade-in {
  opacity: 0;
  animation: fadeIn 0.5s ease-out forwards;
}
.fade-out {
  animation: fadeOut 0.3s ease-out forwards;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  to {
    opacity: 0;
  }
}

/* Scale animations */
.scale-in {
  transform: scale(0.9);
  animation: scaleIn 0.5s ease-out forwards;
}
.pulse {
  animation: pulse 2s infinite;
}

@keyframes scaleIn {
  to {
    transform: scale(1);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* Slide animations */
.slide-up {
  transform: translateY(20px);
  animation: slideUp 0.5s ease-out forwards;
}

@keyframes slideUp {
  to {
    transform: translateY(0);
  }
}

/* Loading spinner */
.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

### Phase 2: Replace Heavy Components

#### 1. LoadingSpinner (lines 31-40)

```tsx
// Before: motion.div with rotate animation
// After:
<div
  className={cn(
    'border-2 border-primary border-t-transparent rounded-full spin',
    sizeClasses[size],
    className
  )}
/>
```

#### 2. VoiceProcessingLoader (lines 139-157)

```tsx
// Before: motion.div with scale/opacity animations
// After:
<div className={cn(
  "mx-auto w-16 h-16 rounded-full flex items-center justify-center pulse",
  config.bgColor
)}>
```

#### 3. Audio Visualization Bars (lines 177-192)

```tsx
// Before: Complex motion.div with height animations
// After: CSS-only bars with staggered delays
{
  Array.from({ length: 5 }).map((_, i) => (
    <div
      key={i}
      className='w-1 bg-blue-500 rounded-full audio-bar'
      style={{ animationDelay: `${i * 0.1}s` }}
    />
  ))
}
```

### Phase 3: Component Priority Order

1. **loading-states.tsx** (50+ instances) - HIGHEST IMPACT
2. **floor-plan-view.tsx** (table animations)
3. **shell.tsx** (page transitions)
4. **error-boundaries.tsx** (error animations)
5. **voice-order-panel.tsx** (UI feedback)

### Expected Results

- **Bundle size reduction**: 120-150KB (40-50% of framer-motion)
- **Load time improvement**: 0.5-1s faster initial load
- **Animation performance**: Better on mobile devices
- **Zero breaking changes**: Same visual experience

### Implementation Notes

- Use `animation-fill-mode: forwards` to maintain end states
- Add `prefers-reduced-motion` support
- Test on mobile devices for performance
- Maintain accessibility with focus indicators
