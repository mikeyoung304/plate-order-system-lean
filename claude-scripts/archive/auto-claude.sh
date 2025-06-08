#!/bin/bash
# Auto-responder for Claude Code - Always chooses option 1 (proceed)

# Install expect if not present
if ! command -v expect &> /dev/null; then
    echo "Installing expect..."
    brew install expect
fi

# Create expect script
expect << 'EOF'
set timeout -1
spawn claude code
expect {
    "1)" { send "1\r"; exp_continue }
    "2)" { send "1\r"; exp_continue }
    "3)" { send "1\r"; exp_continue }
    "Do you want to proceed" { send "1\r"; exp_continue }
    "Continue?" { send "y\r"; exp_continue }
    "Press" { send "1\r"; exp_continue }
    eof
}
EOF