#!/bin/bash

# Create desktop shortcut for Plate Restaurant System

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DESKTOP_DIR="$HOME/Desktop"

echo "🔗 Creating desktop shortcut for Plate Restaurant System..."

# Create an AppleScript application for macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # Create AppleScript content
    cat > /tmp/plate_launcher.applescript << EOF
on run
    tell application "Terminal"
        activate
        do script "cd '$PROJECT_DIR' && ./optimal-start.sh"
    end tell
end run
EOF
    
    # Compile AppleScript to application
    osacompile -o "$DESKTOP_DIR/Plate Restaurant.app" /tmp/plate_launcher.applescript
    
    # Clean up
    rm /tmp/plate_launcher.applescript
    
    echo "✅ Desktop app created: Plate Restaurant.app"
    echo "   Double-click to launch the development server!"
    
    # Also create a simple shell script alias
    cat > "$DESKTOP_DIR/plate-start.command" << EOF
#!/bin/bash
cd "$PROJECT_DIR"
./optimal-start.sh
EOF
    
    chmod +x "$DESKTOP_DIR/plate-start.command"
    echo "✅ Alternative launcher created: plate-start.command"
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Create Linux desktop entry
    cat > "$DESKTOP_DIR/plate-restaurant.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Plate Restaurant System
Comment=Launch Plate Restaurant Development Server
Icon=$PROJECT_DIR/public/icon-192.png
Exec=gnome-terminal -- bash -c "cd '$PROJECT_DIR' && ./optimal-start.sh; exec bash"
Terminal=true
Categories=Development;
EOF
    
    chmod +x "$DESKTOP_DIR/plate-restaurant.desktop"
    echo "✅ Desktop shortcut created: plate-restaurant.desktop"
fi

echo ""
echo "📌 You can also create an alias in your shell profile:"
echo "   echo \"alias plate='cd $PROJECT_DIR && ./optimal-start.sh'\" >> ~/.zshrc"
echo "   source ~/.zshrc"
echo "   Then just type 'plate' from anywhere!"