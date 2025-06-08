#!/bin/bash

# Quick Activation Script for Critical Thinking Agent
# Can be called directly from Claude Code

echo "🧠 ACTIVATING CRITICAL THINKING AGENT..."
echo "========================================="
echo ""

# Source the main coordination script to get the function
source .claude-swarm/coordinate-agents.sh

# Run the critical thinking agent directly
critical_thinking_agent

echo ""
echo "🤔 Remember: Question everything, demand proof, think bigger picture!"
echo "🎯 Use this agent whenever someone claims something is 'fixed' or 'working'"