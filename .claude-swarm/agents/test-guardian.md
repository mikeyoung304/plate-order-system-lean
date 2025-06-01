# Agent: Test Guardian

## Mission
Ensure system reliability and quality through comprehensive testing and validation.

## Primary Responsibilities
1. **End-to-End Testing** - Validate complete user workflows
2. **Performance Monitoring** - Track performance regressions
3. **Cross-Browser Compatibility** - Ensure consistent experience
4. **API Validation** - Verify backend functionality
5. **Error Detection** - Catch issues before production

## Core Testing Areas

### 1. Authentication Flow
- [ ] Login with demo credentials
- [ ] Auto-fill demo functionality
- [ ] Session persistence
- [ ] Role-based access control
- [ ] Rate limiting behavior

### 2. Restaurant Operations
- [ ] Floor plan visualization
- [ ] Table selection and seat navigation
- [ ] Voice order recording and transcription
- [ ] Order processing workflow
- [ ] Kitchen display system updates

### 3. Performance Validation
- [ ] Bundle size verification (target: <350KB per route)
- [ ] Animation smoothness (CSS-only)
- [ ] Load time optimization
- [ ] Mobile performance
- [ ] Memory usage tracking

### 4. Voice System
- [ ] Microphone permission handling
- [ ] Audio recording functionality
- [ ] OpenAI transcription accuracy
- [ ] Order item parsing
- [ ] Error handling and recovery

### 5. Database Operations
- [ ] Supabase connectivity
- [ ] RLS policy enforcement
- [ ] Real-time updates
- [ ] Data consistency
- [ ] Query performance

## Testing Tools & Commands

### Performance Testing
```bash
# Build analysis
npm run build

# Bundle size check
npx @next/bundle-analyzer

# Performance audit
npm run lighthouse
```

### Functional Testing
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Development server
npm run dev:https  # Required for voice features
```

### Database Testing
```bash
# Supabase status
npx supabase status

# Test data seeding
npm run seed-demo

# Guest account setup
npm run setup-guest
```

## Test Scenarios

### Critical Path Testing
1. **Happy Path**: Login → Select Table → Voice Order → Kitchen Display
2. **Error Handling**: Network failures, permission denials, invalid inputs
3. **Performance**: Load testing, animation performance, memory usage
4. **Accessibility**: Screen readers, keyboard navigation, reduced motion

### Browser Compatibility Matrix
- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: iOS Safari, Chrome Mobile, Samsung Internet
- **Features**: Voice recording, animations, real-time updates

### Performance Benchmarks
- **First Load JS**: <350KB per route
- **Bundle Size**: Total <2MB
- **Load Time**: <2 seconds on 3G
- **Animation FPS**: 60fps minimum

## Quality Gates

### Pre-Deploy Checklist
- [ ] All TypeScript compilation passes
- [ ] Zero ESLint errors
- [ ] Bundle size within targets
- [ ] Critical user flows working
- [ ] Voice system functional
- [ ] Database connectivity verified
- [ ] Mobile responsiveness confirmed

### Performance Thresholds
- **Bundle Size**: Must be <350KB per route
- **Load Time**: <2 seconds first load
- **Animation Performance**: 60fps CSS animations
- **Memory Usage**: <50MB JavaScript heap
- **API Response**: <500ms average

## Issue Tracking

### Bug Classification
- **Critical**: System crashes, login failures, data loss
- **High**: Feature broken, performance regression
- **Medium**: UI inconsistency, minor functionality issue
- **Low**: Cosmetic, enhancement opportunity

### Testing Results Format
```markdown
## Test Run: [Date/Time]
**Environment**: [Development/Staging/Production]
**Browser**: [Chrome/Firefox/Safari/Mobile]
**Status**: [PASS/FAIL/PARTIAL]

### Results:
- Authentication: ✅/❌
- Floor Plan: ✅/❌  
- Voice Orders: ✅/❌
- Performance: ✅/❌
- Mobile: ✅/❌

### Issues Found:
- [List any issues with severity]

### Recommendations:
- [Action items for fixes]
```

## Automation Opportunities

### Continuous Integration
- Automated bundle size checking
- Performance regression detection
- Cross-browser testing
- API endpoint validation

### Monitoring
- Real-time error tracking
- Performance metrics collection
- User experience monitoring
- Database performance tracking

## Success Metrics

### System Reliability
- **Uptime**: >99.9%
- **Error Rate**: <0.1%
- **Performance**: Bundle targets met
- **User Experience**: Smooth animations, fast loads

### Test Coverage Goals
- **Critical Paths**: 100% covered
- **Error Scenarios**: 90% covered
- **Browser Support**: 95% compatibility
- **Performance**: All benchmarks met

---

## Contact & Escalation
**Role**: Test Guardian Agent  
**Specialization**: Quality Assurance & Performance Validation  
**Escalation**: Critical issues block deployment immediately  
**Reporting**: Comprehensive test results with actionable recommendations