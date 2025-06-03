# .claude/commands/plater-commands.md

## /project:add-supabase-table

Create a new Supabase table with proper RLS policies:

1. Navigate to /supabase/migrations
2. Create a new migration file with timestamp
3. Add CREATE TABLE statement with proper fields
4. Add RLS policies based on user roles
5. Update TypeScript types in /types/supabase.ts
6. Create corresponding data access functions in /lib/modassembly/supabase/database/
7. Run migration locally and test

## /project:add-voice-command

Add a new voice command to the ordering system:

1. Update voice command parser in /lib/modassembly/openai/
2. Add command to the transcription prompt
3. Update order parsing logic
4. Add tests for the new command
5. Update documentation

## /project:add-realtime-feature

Implement a new real-time feature:

1. Identify the table(s) to watch
2. Create subscription in relevant component/hook
3. Handle state updates optimistically
4. Add error handling and reconnection logic
5. Clean up subscriptions on unmount
6. Test with multiple concurrent users

## /project:add-admin-feature

Add a new admin dashboard feature:

1. Create new route under app/(auth)/admin/
2. Verify admin role in middleware
3. Create UI components following existing patterns
4. Add necessary API routes
5. Update navigation menu
6. Add feature flag if needed

## /project:optimize-query

Optimize a slow database query:

1. Identify the slow query using Supabase logs
2. Analyze query plan
3. Add appropriate indexes
4. Consider creating a database view
5. Implement caching if appropriate
6. Add query performance monitoring

## /project:add-test

Add tests for a feature:

1. Create test file following naming convention
2. Mock Supabase client and external services
3. Test happy path and error cases
4. Test authorization logic
5. Run tests and ensure coverage

## /project:debug-auth

Debug authentication issues:

1. Check browser cookies for session
2. Verify Supabase Auth settings
3. Check RLS policies on affected tables
4. Test with different user roles
5. Check middleware authentication logic
6. Review auth callback configuration

## /project:deploy-check

Pre-deployment checklist:

1. Run TypeScript type checking
2. Run linter and fix issues
3. Run all tests
4. Check environment variables
5. Verify database migrations are up to date
6. Test critical user flows manually
7. Check for console errors
8. Verify real-time features work
