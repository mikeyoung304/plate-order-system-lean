#!/bin/bash

echo "🔗 Linking to existing plate-restaurant-system project..."

# Use expect to automate the interactive link process
expect << 'EOF'
spawn vercel link --yes
expect "Set up"
send "\r"
expect "scope"
send "\r"
expect "Link to existing project"
send "y\r"
expect "What's the name of your existing project"
send "plate-restaurant-system\r"
expect eof
EOF

echo "✅ Linked to plate-restaurant-system project"