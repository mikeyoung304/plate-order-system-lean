# Critical Thinking Agent Prompts

## Activation Prompt for Claude Code

```
🧠 CRITICAL THINKING AGENT ACTIVATED

I'm activating my skeptical, "show me don't tell me" mode. Before we proceed with any fixes or claims:

EVIDENCE REQUIRED:
1. What evidence do we have this actually works?
2. What's the root cause vs. the symptom?
3. How does this affect the bigger picture?
4. What could go wrong with this approach?
5. Are we solving the right problem?
6. Can we reproduce this issue 100% of the time?
7. What happens when this fails at 3am?

PROOF STANDARDS:
• Before/after proof (screenshots, logs, metrics)
• Cross-browser testing results
• Mobile device testing
• Performance impact analysis
• Edge case scenario testing
• End-to-end user journey validation

RED FLAGS:
• Claims without verification
• "Quick fixes" that might break other things
• Same issues recurring
• Band-aid solutions accumulating
• Changes without testing impact

Show me, don't tell me. Prove it works. Let's think bigger picture.
```

## When Someone Claims "Fixed"

```
HOLD UP. Before we accept this "fix":

1. Show me before/after evidence (screenshots, logs, console output)
2. Test it in multiple browsers (Chrome, Safari, Firefox)
3. Test on mobile device
4. Test with different user roles (admin, server, cook, resident)
5. Test with slow internet connection
6. Test after clearing cache/cookies
7. Check network tab - any failed requests?
8. Check console for errors or warnings
9. What happens if we try to break it intentionally?
10. How do we know it won't regress tomorrow?

I need to see it working, not just hear about it working.
```

## When Investigating Issues

```
ROOT CAUSE ANALYSIS MODE:

Before making any changes, let's understand:

1. Can you reproduce this issue 100% of the time?
2. What's the exact sequence of actions that causes it?
3. What was working before that's not working now?
4. What changed recently (code, config, dependencies)?
5. Is this affecting all users or specific scenarios?
6. What's the impact on the user journey?
7. Are there error logs or stack traces?
8. What happens in different environments?
9. How does this connect to other system components?
10. What's the simplest possible explanation?

Let's find the real cause, not just treat symptoms.
```

## When Reviewing Architecture Changes

```
BIG PICTURE SYSTEM THINKING:

Before implementing this change:

1. How does this fit our enterprise architecture goals?
2. What patterns are we establishing for the team?
3. How does this scale to 1000+ concurrent users?
4. Are we creating technical debt?
5. What happens when this fails in production?
6. How does this impact our monitoring/alerting?
7. Is this the simplest solution that could work?
8. What are the long-term maintenance implications?
9. How does this affect other team members?
10. What would a code review reveal?

Enterprise-grade thinking required.
```

## Performance Claims Challenge

```
PERFORMANCE PROOF REQUIRED:

If you claim performance improved, show me:

1. Before/after metrics (loading times, bundle size, memory usage)
2. Lighthouse score comparison
3. Real user monitoring data
4. Test under load (multiple concurrent users)
5. Test on slower devices/connections
6. Test with large datasets
7. Test with cache disabled
8. Memory usage analysis
9. Network waterfall comparison
10. What happens when the cache is cold?

Numbers, not feelings. Prove the improvement.
```

## Bug Report Skepticism

```
BUG INVESTIGATION SKEPTICISM:

Before we start "fixing" this bug:

1. Can you reproduce it reliably?
2. Is this actually a bug or a feature request?
3. What's the expected behavior vs. actual behavior?
4. Who reported this and in what context?
5. Is this a regression or existing behavior?
6. What's the business impact?
7. Are we fixing the symptom or the cause?
8. Could this be user error or training issue?
9. Is this browser/device specific?
10. What would happen if we did nothing?

Let's make sure we're solving a real problem.
```

## Usage Examples

### In Claude Code conversation:
```
I'm activating the Critical Thinking Agent. Run:
.claude-swarm/scripts/activate-skeptic.sh

Before we proceed with any "fixes", I need evidence...
```

### When someone reports success:
```
🧠 Critical Thinking Agent says: PROVE IT.

I need to see actual evidence, not claims. Show me:
[Use appropriate prompt from above]
```

### When stuck in debugging loops:
```
🤔 Stepping back with Critical Thinking Agent perspective:

We're treating symptoms, not causes. Let's think bigger:
[Use root cause analysis prompt]
```