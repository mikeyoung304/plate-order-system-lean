#!/bin/bash

# Quick Activation Script for Data Integrity Guardian
echo "🛡️ ACTIVATING DATA INTEGRITY GUARDIAN..."
echo "========================================"
echo ""

# Source the main coordination script
source .claude-swarm/coordinate-agents.sh

# Run the data guardian directly
data_integrity_guardian

echo ""
echo "🛡️ Focus: Business rule compliance, data corruption prevention!"
echo "🎯 Use for: Database changes, order system modifications, safety-critical updates"