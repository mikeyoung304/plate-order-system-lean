# Multi-Agent Configuration

## Agent Roles

**Main Agent (Orchestration):**
- Architecture decisions and planning
- Code reviews and quality assurance
- Inter-agent coordination
- Context budget: 50%

**Feature Agent (Implementation):**
- Component development
- UI/UX implementation
- Business logic coding
- Context budget: 30%

**Test Agent (Quality Assurance):**
- Test generation and execution
- Performance testing
- Bug identification and fixes
- Context budget: 20%

**Deploy Agent (Production Readiness):**
- Build optimization
- Security audits
- Environment configuration
- Context budget: 20%

## Coordination Strategy

**Git Worktrees:**
- `main/` - Main agent workspace
- `feature/` - Feature development
- `test/` - Test implementation
- `deploy/` - Production preparation

**Shared Memory:**
- `.claude/memory/shared.md` - Cross-agent state
- `.claude/memory/decisions.md` - Architecture decisions
- `.claude/memory/blockers.md` - Current issues

**Sync Schedule:**
- Every 30 minutes: Quick status sync
- Every 2 hours: Full context alignment
- Before handoffs: Complete state transfer

## Context Management

**Allocation:**
- Main: Strategic decisions, architecture
- Feature: Implementation details, components
- Test: Test cases, coverage reports
- Deploy: Build configs, optimizations

**Handoff Protocol:**
1. Update shared memory
2. Summarize current state
3. List next actions
4. Transfer ownership