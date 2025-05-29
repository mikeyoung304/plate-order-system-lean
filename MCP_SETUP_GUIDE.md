# MCP Servers Setup Guide for Plater Restaurant System

## Overview
This guide will help you set up all Model Context Protocol (MCP) servers for the Plater Restaurant System project.

## Current MCP Server Configuration

After following this guide, you'll have these MCP servers running:
- ✅ **sequential-thinking**: Enhanced reasoning and planning capabilities
- ✅ **supabase**: Direct Supabase database operations  
- ✅ **filesystem**: Enhanced file system operations

## Quick Start

1. **Use the provided startup script:**
   ```bash
   ./start-claude.sh
   ```

   This script automatically:
   - Loads all environment variables from `.env`
   - Exports required variables for MCP servers
   - Starts Claude with MCP debug mode enabled

## Manual Setup Instructions

If you prefer to set things up manually:

### 1. Set Environment Variables

Before starting Claude, export the required environment variables:

```bash
# Load from .env file
set -a
source .env
set +a

# Or manually export
export NEXT_PUBLIC_SUPABASE_URL="https://eiipozoogrrfudhjoqms.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export OPENAI_API_KEY="your-openai-key"
```

### 2. Start Claude with MCP Debug

```bash
claude --mcp-debug
```

## Troubleshooting

### If Supabase MCP fails:
- Ensure `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are exported
- Check that the values match those in your `.env` file
- Verify the Supabase project is active

### If Filesystem MCP fails:
- The server needs an absolute path to monitor
- Current configuration monitors: `/Users/mike/Plate-Restaurant-System-App`
- Ensure the path exists and is accessible

### If Sequential-thinking MCP fails:
- This is usually the most stable server
- Try clearing npm cache: `npm cache clean --force`
- Reinstall: `npx -y @modelcontextprotocol/server-sequential-thinking`

## Verifying MCP Servers

After starting Claude, you should see:
```
MCP Server Status

• filesystem: connected
• sequential-thinking: connected  
• supabase: connected
```

## Adding Git MCP Server (Optional)

The git MCP server is Python-based. To add it:

1. Install Python version:
   ```bash
   pip install mcp-server-git
   ```

2. Update `.mcp.json`:
   ```json
   "git": {
     "command": "python",
     "args": ["-m", "mcp_server_git", "--repository", "."],
     "description": "Git operations"
   }
   ```

## Tips

1. **Always use the startup script** (`./start-claude.sh`) for consistency
2. **Check MCP logs** if servers fail: 
   ```bash
   ls -la ~/Library/Caches/claude-cli-nodejs/-Users-mike-Plate-Restaurant-System-App/
   ```
3. **Environment variables must be exported**, not just set
4. **The .env file must be in the project root**

## Project-Specific MCP Usage

### Supabase MCP
Use for direct database operations:
- Query tables, seats, orders
- Manage user profiles
- Real-time subscriptions

### Filesystem MCP  
Use for file operations:
- Read/write project files
- Navigate directory structure
- Batch file operations

### Sequential-thinking MCP
Use for complex problem solving:
- Multi-step planning
- Algorithm design
- Architecture decisions