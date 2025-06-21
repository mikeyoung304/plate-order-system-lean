#!/bin/bash
# EXPORT LEGACY DOCUMENTATION TO SEPARATE REPOSITORY
# Created by Claude Code Document Cleanup Specialist

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
EXPORT_DIR="../plate-restaurant-legacy-docs-${TIMESTAMP}"
CURRENT_DIR=$(pwd)

echo "🚀 EXPORTING LEGACY DOCUMENTATION..."
echo "Export Directory: $EXPORT_DIR"
echo "Current Project: $(basename $CURRENT_DIR)"

# Create export directory
mkdir -p "$EXPORT_DIR"

# Copy archive folder with git history preservation
echo "📂 Copying archive folder..."
cp -R archive/ "$EXPORT_DIR/"

# Create README for legacy repo
cat > "$EXPORT_DIR/README.md" << EOF
# Plate Restaurant System - Legacy Documentation

This repository contains archived documentation and analysis reports from the Plate Restaurant System project.

## Archive Structure

- **analysis_reports/**: System analysis, security reports, performance studies
- **old_guides/**: Legacy guides, setup instructions, optimization reports  
- **temp_notes/**: Temporary work notes, investigation logs, development journals
- **legacy_docs/**: VIBE_U folders and other legacy documentation
- **cleanup_logs/**: Documentation of cleanup process

## Original Project

Main project repository: [Plate-Restaurant-System-App](../Plate-Restaurant-System-App)

## Archive Date

Created: $(date)
From commit: $(cd "$CURRENT_DIR" && git rev-parse HEAD)

## Contents Summary

$(find "$EXPORT_DIR" -name "*.md" | wc -l) markdown files archived
$(du -sh "$EXPORT_DIR" | cut -f1) total size

EOF

# Create export summary
echo "📊 EXPORT SUMMARY" > "$EXPORT_DIR/EXPORT_SUMMARY.md"
echo "=================" >> "$EXPORT_DIR/EXPORT_SUMMARY.md"
echo "" >> "$EXPORT_DIR/EXPORT_SUMMARY.md"
echo "**Export Date**: $(date)" >> "$EXPORT_DIR/EXPORT_SUMMARY.md"
echo "**Original Project**: $(basename $CURRENT_DIR)" >> "$EXPORT_DIR/EXPORT_SUMMARY.md"
echo "**Git Commit**: $(cd "$CURRENT_DIR" && git rev-parse HEAD)" >> "$EXPORT_DIR/EXPORT_SUMMARY.md"
echo "" >> "$EXPORT_DIR/EXPORT_SUMMARY.md"
echo "**Files Exported**:" >> "$EXPORT_DIR/EXPORT_SUMMARY.md"
find "$EXPORT_DIR" -name "*.md" | sed "s|$EXPORT_DIR/||" | sort >> "$EXPORT_DIR/EXPORT_SUMMARY.md"

# Initialize git repo in export directory
cd "$EXPORT_DIR"
git init
git add .
git commit -m "Initial commit: Legacy documentation archive from Plate Restaurant System

Exported from main project on $(date)
Original commit: $(cd "$CURRENT_DIR" && git rev-parse HEAD)

Archive contains:
- Analysis reports and security documentation  
- Legacy guides and setup instructions
- Development notes and investigation logs
- VIBE_U documentation folders

Total: $(find . -name "*.md" | wc -l) markdown files archived"

cd "$CURRENT_DIR"

echo "✅ EXPORT COMPLETE!"
echo "📍 Legacy docs exported to: $EXPORT_DIR"
echo "🔗 Legacy repo initialized with git history"
echo ""
echo "Next steps:"
echo "1. cd $EXPORT_DIR"
echo "2. git remote add origin <your-legacy-repo-url>"
echo "3. git push -u origin main"
echo ""
echo "To remove archive from main project after export:"
echo "rm -rf archive/"