#!/bin/bash
# Simple yes-script for Claude Code
# Continuously sends "1" responses

echo "🚀 Starting Claude Code with auto-yes responses..."
echo "⏹️  Press Ctrl+C to stop"

# Create a named pipe for responses
mkfifo /tmp/claude_responses 2>/dev/null || true

# Start a background process that continuously feeds "1" responses
(
    while true; do
        echo "1"
        sleep 1
    done
) > /tmp/claude_responses &

FEEDER_PID=$!

# Start Claude Code with input from our response pipe
claude code < /tmp/claude_responses

# Cleanup
kill $FEEDER_PID 2>/dev/null
rm -f /tmp/claude_responses