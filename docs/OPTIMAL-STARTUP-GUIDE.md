# 🚀 Optimal Startup Guide for Plate Restaurant System

## Overview

The new `optimal-start.sh` script provides a one-click solution to launch your development environment with all the bells and whistles. It replaces the previous `fire-it-up.sh` and `start-dev.sh` scripts with enhanced features and better error handling.

## Features

### 🎯 Core Features
- **Prerequisite Checking**: Validates Node.js, npm, and environment files
- **Smart Port Management**: Automatically frees up port 3000 and related ports
- **Turbo Mode**: Launches Next.js with the `--turbo` flag for faster development
- **Server Health Check**: Waits for the server to be fully ready before proceeding
- **Browser Auto-Launch**: Opens a custom landing page with guest credentials
- **Live Logging**: Shows real-time server logs with colored output
- **Error Recovery**: Graceful handling of common startup issues

### 🎨 Enhanced UI
- Colored terminal output for better readability
- Progress indicators for long-running operations
- Clear status messages at each step
- Helpful tips and quick links

## Quick Start

### Method 1: Terminal
```bash
./optimal-start.sh
```

### Method 2: Desktop Shortcut
- **macOS**: Double-click "Plate Restaurant.app" on your desktop
- **Alternative**: Double-click "plate-start.command"

### Method 3: Shell Alias
Add to your shell profile (~/.zshrc or ~/.bashrc):
```bash
alias plate='cd /Users/mike/Plate-Restaurant-System-App && ./optimal-start.sh'
```
Then use: `plate`

## What Happens When You Run It

1. **Prerequisites Check**
   - Verifies Node.js and npm are installed
   - Checks for .env.local (creates from .env.example if missing)
   - Ensures node_modules are installed

2. **Port Cleanup**
   - Shows what's currently using port 3000
   - Kills any blocking processes
   - Verifies ports are free

3. **Server Launch**
   - Starts Next.js in development mode with Turbo
   - Logs output to `dev.log`
   - Waits up to 30 seconds for server readiness

4. **Browser Experience**
   - Opens a custom landing page
   - Shows guest credentials prominently
   - Provides quick-copy button for credentials
   - Auto-redirects to the main app

5. **Helpful Information**
   - Displays all available routes
   - Shows loaded demo data
   - Provides keyboard shortcuts and tips

## Guest Login Credentials

```
Email: guest@restaurant.plate
Password: guest12345
```

## Available Routes

- **Main App**: http://localhost:3000
- **Server View**: http://localhost:3000/server
- **Kitchen Display**: http://localhost:3000/kitchen/kds
- **Expo Station**: http://localhost:3000/expo
- **Dashboard**: http://localhost:3000/dashboard

## Troubleshooting

### Port Already in Use
The script automatically handles this, but if issues persist:
```bash
# Manual port cleanup
lsof -ti:3000 | xargs kill -9
```

### Environment Variables Missing
Create `.env.local` from the template:
```bash
cp .env.example .env.local
```

### Dependencies Not Installed
```bash
npm install
```

### Server Won't Start
Check the logs:
```bash
tail -f dev.log
```

## Advanced Usage

### Custom Timeout
Edit `STARTUP_TIMEOUT` in the script (default: 30 seconds)

### Different Port
Edit `PORT` variable in the script

### Disable Browser Launch
Comment out the `open_browser_with_credentials` line

## Comparison with Previous Scripts

| Feature | fire-it-up.sh | start-dev.sh | optimal-start.sh |
|---------|---------------|--------------|------------------|
| Prerequisite checks | ❌ | Partial | ✅ Full |
| Auto-install deps | ❌ | ❌ | ✅ |
| Turbo mode | ❌ | ❌ | ✅ |
| Browser auto-open | ❌ | ❌ | ✅ |
| Credential helper | ❌ | ❌ | ✅ |
| Health monitoring | ❌ | ❌ | ✅ |
| Colored output | ❌ | ❌ | ✅ |
| Desktop shortcut | ❌ | ❌ | ✅ |
| Live logging | ❌ | ❌ | ✅ |

## Maintenance

### Updating the Script
The script is designed to be self-contained. To add features:
1. Edit `/optimal-start.sh`
2. Test thoroughly
3. Update this documentation

### Logs
Server logs are saved to `dev.log` and rotated automatically.

### Backups
Previous scripts are archived in `backups/scripts/` with timestamps.

## Tips & Tricks

1. **Quick Restart**: Use Ctrl+C and run `./optimal-start.sh` again
2. **Skip Browser**: Set `SKIP_BROWSER=1 ./optimal-start.sh`
3. **Debug Mode**: Check `dev.log` for detailed server output
4. **Multiple Instances**: The script prevents port conflicts automatically

## Future Enhancements

Potential improvements for future versions:
- [ ] Database health check
- [ ] Automatic demo data refresh
- [ ] Performance metrics display
- [ ] Integration with monitoring tools
- [ ] Custom theme selection
- [ ] Multi-browser support

---

Created with ❤️ for the Plate Restaurant System development team