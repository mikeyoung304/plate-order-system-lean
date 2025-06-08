#!/bin/bash

# Intelligent Swarm Orchestrator - Auto-Debug with Agent Coordination
echo "🤖🔥 INTELLIGENT SWARM ORCHESTRATOR ACTIVATED"
echo "=============================================="
echo ""
echo "🎯 MISSION: Comprehensive app debugging using coordinated agent analysis"
echo "🧠 MODE: Autonomous agent selection and orchestration"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Create comprehensive debugging report
DEBUG_REPORT="/tmp/swarm-debug-$(date +%s).md"

echo "# 🤖 Swarm Intelligence Debug Report" > $DEBUG_REPORT
echo "Generated: $(date)" >> $DEBUG_REPORT
echo "Mission: Comprehensive application analysis using coordinated AI agents" >> $DEBUG_REPORT
echo "" >> $DEBUG_REPORT

# Phase 1: System Health Assessment
echo -e "${PURPLE}📊 PHASE 1: SYSTEM HEALTH ASSESSMENT${NC}"
echo "Running comprehensive health checks..."
echo ""

echo "## 🏥 System Health Analysis" >> $DEBUG_REPORT
echo "" >> $DEBUG_REPORT

# TypeScript Health Check
echo -e "${BLUE}🔍 TypeScript Health Check...${NC}"
if npm run type-check >/dev/null 2>&1; then
    echo "✅ TypeScript: Clean" | tee -a $DEBUG_REPORT
    TS_HEALTH="GOOD"
else
    echo "❌ TypeScript: Errors detected" | tee -a $DEBUG_REPORT
    echo "```" >> $DEBUG_REPORT
    npm run type-check 2>&1 | head -20 >> $DEBUG_REPORT
    echo "```" >> $DEBUG_REPORT
    TS_HEALTH="NEEDS_ATTENTION"
fi

# Build Health Check
echo -e "${BLUE}🔍 Build Health Check...${NC}"
if npm run build >/dev/null 2>&1; then
    echo "✅ Build: Successful" | tee -a $DEBUG_REPORT
    BUILD_HEALTH="GOOD"
else
    echo "❌ Build: Failed" | tee -a $DEBUG_REPORT
    echo "```" >> $DEBUG_REPORT
    npm run build 2>&1 | tail -20 >> $DEBUG_REPORT
    echo "```" >> $DEBUG_REPORT
    BUILD_HEALTH="CRITICAL"
fi

# Dependency Health Check
echo -e "${BLUE}🔍 Dependency Health Check...${NC}"
OUTDATED_DEPS=$(npm outdated 2>/dev/null | wc -l)
if [ $OUTDATED_DEPS -gt 1 ]; then
    echo "⚠️ Dependencies: $OUTDATED_DEPS packages outdated" | tee -a $DEBUG_REPORT
    DEP_HEALTH="NEEDS_UPDATE"
else
    echo "✅ Dependencies: Up to date" | tee -a $DEBUG_REPORT
    DEP_HEALTH="GOOD"
fi

echo "" >> $DEBUG_REPORT

# Phase 2: Intelligent Agent Selection
echo -e "${PURPLE}🧠 PHASE 2: INTELLIGENT AGENT SELECTION${NC}"
echo "Analyzing issues and selecting appropriate agents..."
echo ""

echo "## 🤖 Agent Selection Matrix" >> $DEBUG_REPORT
echo "" >> $DEBUG_REPORT

SELECTED_AGENTS=()

# Critical Thinking Agent - Always activated for oversight
SELECTED_AGENTS+=("critical-thinking")
echo "🤖 Critical Thinking Agent: ACTIVATED (Always required for validation)" | tee -a $DEBUG_REPORT

# Data Integrity Guardian - If build issues or critical system
if [[ $BUILD_HEALTH == "CRITICAL" ]] || [[ $TS_HEALTH == "NEEDS_ATTENTION" ]]; then
    SELECTED_AGENTS+=("data-integrity")
    echo "🛡️ Data Integrity Guardian: ACTIVATED (Build/Type issues detected)" | tee -a $DEBUG_REPORT
fi

# Performance Analysis - Always run for restaurant system
SELECTED_AGENTS+=("performance")
echo "🚀 Performance Hunter: ACTIVATED (Restaurant system requires optimization)" | tee -a $DEBUG_REPORT

# Real-time Systems - Critical for restaurant operations
SELECTED_AGENTS+=("realtime")
echo "⚡ Real-time Systems Specialist: ACTIVATED (WebSocket and order flow critical)" | tee -a $DEBUG_REPORT

# Human Factors - Always consider for restaurant UI
SELECTED_AGENTS+=("human-factors")
echo "🧑‍🤝‍🧑 Human Factor Analyst: ACTIVATED (Staff usability critical)" | tee -a $DEBUG_REPORT

# Context Bridge - For comprehensive analysis
SELECTED_AGENTS+=("context-bridge")
echo "🌉 Context Bridge Specialist: ACTIVATED (Maintain analysis continuity)" | tee -a $DEBUG_REPORT

echo "" >> $DEBUG_REPORT

# Phase 3: Coordinated Analysis Execution
echo -e "${PURPLE}🔥 PHASE 3: COORDINATED AGENT ANALYSIS${NC}"
echo "Executing comprehensive analysis with selected agents..."
echo ""

echo "## 🔍 Comprehensive Analysis Results" >> $DEBUG_REPORT
echo "" >> $DEBUG_REPORT

# Critical Code Pattern Detection
echo -e "${YELLOW}🔍 CRITICAL THINKING AGENT: Code Pattern Analysis${NC}"
echo "### 🤖 Critical Thinking Agent Analysis" >> $DEBUG_REPORT
echo "" >> $DEBUG_REPORT

# Check for common React antipatterns
UNSAFE_PATTERNS=$(find . -name "*.tsx" -not -path "./node_modules/*" -exec grep -l "useEffect.*\[\]" {} \; 2>/dev/null | wc -l)
echo "- Potential useEffect antipatterns: $UNSAFE_PATTERNS files" | tee -a $DEBUG_REPORT

# Check for undefined access
UNDEFINED_ACCESS=$(find . -name "*.tsx" -not -path "./node_modules/*" -exec grep -l "\\.map\|\\filter\|\\find" {} \; 2>/dev/null | xargs grep -L "\\?" | wc -l)
echo "- Potential undefined access patterns: $UNDEFINED_ACCESS files" | tee -a $DEBUG_REPORT

# Memory leak detection
EVENT_LISTENERS=$(find . -name "*.tsx" -not -path "./node_modules/*" -exec grep -l "addEventListener\|setInterval" {} \; 2>/dev/null | wc -l)
CLEANUP_CALLS=$(find . -name "*.tsx" -not -path "./node_modules/*" -exec grep -l "removeEventListener\|clearInterval" {} \; 2>/dev/null | wc -l)
echo "- Event listeners added: $EVENT_LISTENERS vs cleanup calls: $CLEANUP_CALLS" | tee -a $DEBUG_REPORT

echo "" >> $DEBUG_REPORT

# Performance Analysis
echo -e "${YELLOW}🚀 PERFORMANCE HUNTER: Bundle & Speed Analysis${NC}"
echo "### 🚀 Performance Hunter Analysis" >> $DEBUG_REPORT
echo "" >> $DEBUG_REPORT

if [ -d ".next" ]; then
    BUNDLE_SIZE=$(du -sh .next 2>/dev/null | cut -f1)
    echo "- Current bundle size: $BUNDLE_SIZE" | tee -a $DEBUG_REPORT
    
    LARGEST_BUNDLES=$(find .next -name "*.js" -type f -exec du -h {} + 2>/dev/null | sort -hr | head -5)
    echo "- Largest bundle files:" | tee -a $DEBUG_REPORT
    echo "$LARGEST_BUNDLES" | sed 's/^/  /' >> $DEBUG_REPORT
else
    echo "- Bundle analysis: Run 'npm run build' first" | tee -a $DEBUG_REPORT
fi

echo "" >> $DEBUG_REPORT

# Real-time Systems Analysis
echo -e "${YELLOW}⚡ REAL-TIME SYSTEMS: Connection & Performance Analysis${NC}"
echo "### ⚡ Real-time Systems Analysis" >> $DEBUG_REPORT
echo "" >> $DEBUG_REPORT

# WebSocket implementation check
WS_IMPLEMENTATIONS=$(find . -name "*.tsx" -not -path "./node_modules/*" -exec grep -l "WebSocket\|socket\|realtime" {} \; 2>/dev/null | wc -l)
echo "- WebSocket implementations found: $WS_IMPLEMENTATIONS files" | tee -a $DEBUG_REPORT

# Real-time context usage
REALTIME_CONTEXTS=$(find . -name "*realtime*" -o -name "*connection*" | grep -v node_modules | wc -l)
echo "- Real-time context files: $REALTIME_CONTEXTS" | tee -a $DEBUG_REPORT

echo "" >> $DEBUG_REPORT

# Human Factors Analysis
echo -e "${YELLOW}🧑‍🤝‍🧑 HUMAN FACTORS: Usability & Accessibility Analysis${NC}"
echo "### 🧑‍🤝‍🧑 Human Factor Analysis" >> $DEBUG_REPORT
echo "" >> $DEBUG_REPORT

# Accessibility checks
ARIA_LABELS=$(find . -name "*.tsx" -not -path "./node_modules/*" -exec grep -l "aria-label\|aria-" {} \; 2>/dev/null | wc -l)
echo "- Components with accessibility features: $ARIA_LABELS" | tee -a $DEBUG_REPORT

# Form complexity
FORM_COMPONENTS=$(find . -name "*.tsx" -not -path "./node_modules/*" -exec grep -l "form\|input\|button" {} \; 2>/dev/null | wc -l)
echo "- Form/input components: $FORM_COMPONENTS (complexity check needed)" | tee -a $DEBUG_REPORT

echo "" >> $DEBUG_REPORT

# Phase 4: Coordinated Recommendations
echo -e "${PURPLE}📋 PHASE 4: COORDINATED RECOMMENDATIONS${NC}"
echo "Generating intelligent recommendations from agent coordination..."
echo ""

echo "## 🎯 Coordinated Action Plan" >> $DEBUG_REPORT
echo "" >> $DEBUG_REPORT

# Priority recommendations based on findings
echo "### 🚨 Immediate Actions (Critical)" >> $DEBUG_REPORT
if [[ $BUILD_HEALTH == "CRITICAL" ]]; then
    echo "1. **FIX BUILD ERRORS** - Data Integrity Guardian flagged critical build failure" >> $DEBUG_REPORT
fi
if [[ $TS_HEALTH == "NEEDS_ATTENTION" ]]; then
    echo "2. **RESOLVE TYPESCRIPT ERRORS** - Critical Thinking Agent identified type safety issues" >> $DEBUG_REPORT
fi

echo "" >> $DEBUG_REPORT
echo "### ⚡ Performance Optimizations (High Priority)" >> $DEBUG_REPORT
echo "1. **Bundle Size Analysis** - Performance Hunter recommends route-by-route optimization" >> $DEBUG_REPORT
echo "2. **Real-time Optimization** - Real-time Systems Specialist suggests WebSocket connection tuning" >> $DEBUG_REPORT

echo "" >> $DEBUG_REPORT
echo "### 🧑‍🤝‍🧑 Usability Improvements (Medium Priority)" >> $DEBUG_REPORT
echo "1. **Accessibility Audit** - Human Factor Analyst recommends WCAG compliance review" >> $DEBUG_REPORT
echo "2. **Staff Workflow Validation** - Test interfaces under restaurant stress conditions" >> $DEBUG_REPORT

echo "" >> $DEBUG_REPORT
echo "### 🔄 Continuous Monitoring (Ongoing)" >> $DEBUG_REPORT
echo "1. **Context Bridge** - Maintain architectural decisions and performance insights" >> $DEBUG_REPORT
echo "2. **Data Integrity** - Monitor business rule compliance and data corruption prevention" >> $DEBUG_REPORT

echo "" >> $DEBUG_REPORT

# Phase 5: Next Steps for Claude Code
echo -e "${PURPLE}🤖 PHASE 5: CLAUDE CODE COORDINATION${NC}"
echo "Preparing intelligent prompts for Claude Code execution..."
echo ""

echo "## 🤖 Claude Code Integration Prompts" >> $DEBUG_REPORT
echo "" >> $DEBUG_REPORT

echo "### For Immediate Issues:" >> $DEBUG_REPORT
echo '```' >> $DEBUG_REPORT
echo "I need you to act as the Critical Thinking Agent and Data Integrity Guardian." >> $DEBUG_REPORT
echo "Priority 1: Fix the build errors and TypeScript issues identified in the analysis." >> $DEBUG_REPORT
echo "Priority 2: Review the undefined access patterns and potential memory leaks." >> $DEBUG_REPORT
echo "Demand proof that fixes work - show before/after evidence." >> $DEBUG_REPORT
echo '```' >> $DEBUG_REPORT

echo "" >> $DEBUG_REPORT
echo "### For Performance Optimization:" >> $DEBUG_REPORT
echo '```' >> $DEBUG_REPORT
echo "Act as the Performance Hunter and Real-time Systems Specialist." >> $DEBUG_REPORT
echo "Analyze bundle sizes and optimize for <1MB per route." >> $DEBUG_REPORT
echo "Focus on WebSocket optimization for <50ms order creation latency." >> $DEBUG_REPORT
echo "Show measurable performance improvements." >> $DEBUG_REPORT
echo '```' >> $DEBUG_REPORT

echo "" >> $DEBUG_REPORT
echo "### For Human-Centered Design:" >> $DEBUG_REPORT
echo '```' >> $DEBUG_REPORT
echo "Take on the Human Factor Analyst role." >> $DEBUG_REPORT
echo "Review interfaces for stressed restaurant staff usability." >> $DEBUG_REPORT
echo "Ensure accessibility compliance and cognitive load optimization." >> $DEBUG_REPORT
echo "Test scenarios: peak meal rush, new staff, emergency situations." >> $DEBUG_REPORT
echo '```' >> $DEBUG_REPORT

echo "" >> $DEBUG_REPORT

# Final Output
echo -e "${GREEN}✅ SWARM INTELLIGENCE ANALYSIS COMPLETE${NC}"
echo ""
echo -e "${CYAN}📊 Debug Report Generated: $DEBUG_REPORT${NC}"
echo -e "${CYAN}📋 Ready for Claude Code coordination with intelligent agent prompts${NC}"
echo ""

# Display summary
echo -e "${YELLOW}📋 ANALYSIS SUMMARY:${NC}"
echo "- System Health: Build=$BUILD_HEALTH, TypeScript=$TS_HEALTH, Dependencies=$DEP_HEALTH"
echo "- Agents Activated: ${#SELECTED_AGENTS[@]} specialized agents"
echo "- Critical Issues: $(grep -c "CRITICAL\|❌" $DEBUG_REPORT) found"
echo "- Performance Areas: Bundle optimization, Real-time tuning, Accessibility"
echo ""

# Offer to open report
read -p "📖 Open full debug report? (y/n): " open_report
if [[ $open_report == "y" || $open_report == "Y" ]]; then
    if command -v code >/dev/null 2>&1; then
        code $DEBUG_REPORT
    elif command -v open >/dev/null 2>&1; then
        open $DEBUG_REPORT
    else
        echo "Report location: $DEBUG_REPORT"
    fi
fi

echo ""
echo -e "${GREEN}🤖 Use the Claude Code prompts in the report to execute coordinated debugging!${NC}"