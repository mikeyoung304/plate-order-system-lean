# Task Completion Checklist

## Before Completing Any Task

1. **Code Quality**
   - Run `npm run test:quick` (unit tests + lint + type-check)
   - Ensure no TypeScript errors
   - Fix any linting issues
   - Check for console.log statements in production code

2. **Testing**
   - Add/update unit tests for new functionality
   - Run relevant integration tests
   - Verify performance tests pass if applicable
   - Test authentication flows if auth-related

3. **Documentation**
   - Update inline code comments
   - Update function/component documentation
   - Check if API documentation needs updates

4. **Performance**
   - Check bundle size impact with `npm run analyze`
   - Verify no memory leaks in React components
   - Test real-time subscription cleanup
   - Validate database query performance

5. **Security**
   - Review RLS policies if database changes made
   - Verify authentication patterns are server-first
   - Check for any exposed sensitive data
   - Validate input sanitization

6. **Specific Checks for Auth/Database Changes**
   - Test guest account functionality
   - Verify connection pooling works correctly
   - Check refresh token error handling
   - Test session management edge cases

## Pre-Commit Requirements
- All tests passing
- No linting errors
- TypeScript compilation successful
- Bundle size within acceptable limits
- No debug code or console.logs in production files