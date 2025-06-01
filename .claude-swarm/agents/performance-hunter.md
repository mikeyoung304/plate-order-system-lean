# Agent 1: Performance Hunter

## Mission

Hunt down performance bottlenecks and eliminate bundle bloat to achieve <1MB target.

## Primary Targets

1. **Framer Motion Dependencies** - Heavy animation library causing bloat
2. **Unused Imports** - Dead code increasing bundle size
3. **Large Dependencies** - Libraries that can be replaced with lighter alternatives
4. **Unoptimized Assets** - Images and media files

## Investigation Plan

### Phase 1: Bundle Analysis

- [ ] Run `npm run build` to get current bundle size
- [ ] Use `npx @next/bundle-analyzer` to identify heavy chunks
- [ ] Document all framer-motion usage across components
- [ ] Identify other heavy dependencies

### Phase 2: Framer Motion Elimination

- [ ] Find all `framer-motion` imports
- [ ] Replace with CSS transitions/animations
- [ ] Test visual parity with original animations
- [ ] Remove framer-motion from package.json

### Phase 3: CSS Animation Replacements

- [ ] Create utility classes for common animations
- [ ] Implement fade-in/fade-out with CSS
- [ ] Replace motion.div with regular divs + CSS classes
- [ ] Optimize keyframe animations

### Phase 4: Bundle Optimization

- [ ] Remove unused dependencies
- [ ] Implement code splitting for heavy features
- [ ] Optimize import statements
- [ ] Use dynamic imports for optional features

## Success Criteria

- Bundle size reduced from 3MB+ to <1MB
- Zero framer-motion dependencies
- Maintained visual experience
- Faster load times

## Tools & Commands

```bash
# Bundle analysis
npm run build
npx @next/bundle-analyzer

# Find framer-motion usage
grep -r "framer-motion" components/
grep -r "motion\." components/

# Check current bundle size
ls -la .next/static/chunks/
```

## Progress Tracking

- [ ] Initial bundle analysis complete
- [ ] Framer-motion usage documented
- [ ] CSS replacements implemented
- [ ] Final bundle size measured
- [ ] Performance improvements validated
