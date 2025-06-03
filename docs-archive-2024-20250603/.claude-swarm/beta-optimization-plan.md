# Plate Restaurant Beta Optimization Plan

## Current Problems (from AI scan)

1. Bundle size: 3MB+ (target: <1MB)
2. Duplicate error boundaries: 863 lines
3. FloorPlanEditor: 35+ useState calls
4. Framer-motion everywhere

## Our Agents (Claude wearing different hats)

### Agent 1: Performance Hunter

- Find all framer-motion usage
- Replace with CSS animations
- Measure bundle size improvements

### Agent 2: Duplicate Destroyer

- Find all duplicate implementations
- Keep the best one
- Delete the rest safely

### Agent 3: State Surgeon

- Fix components with too many useState
- Convert to useReducer patterns
- Improve re-render performance

### Agent 4: Beta Experience Designer

- Add welcome screen for testers
- Improve navigation flow
- Make testing fun and easy

## Success Metrics

- Load time: <2 seconds
- Bundle size: <1MB
- Zero duplicate code
- Happy beta testers
