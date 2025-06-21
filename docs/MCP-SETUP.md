# MCP (Model Context Protocol) Setup Guide

This document explains how the MCP servers are configured for the Plate Restaurant System and how to troubleshoot common issues.

## Overview

The project uses 4 MCP servers to enhance AI development capabilities:

1. **filesystem**: File system operations within the project directory
2. **github**: GitHub API operations (requires authentication)
3. **postgres**: Direct PostgreSQL database access to Supabase
4. **sequential-thinking**: Complex problem-solving and multi-step planning

## Configuration Files

### `.mcp.json`

Main MCP configuration file that defines which servers to run and their parameters.

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/mike/Plate-Restaurant-System-App"
      ]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "${SUPABASE_DB_URL}"
      ],
      "env": {
        "SUPABASE_DB_URL": "${SUPABASE_DB_URL}"
      }
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

### Environment Variables

Required environment variables in `.env`:

```bash
# Database URL for MCP Server (constructed from Supabase credentials)
SUPABASE_DB_URL=postgresql://postgres.eiipozoogrrfudhjoqms:@Nupples9@db.eiipozoogrrfudhjoqms.supabase.co:5432/postgres

# GitHub token for MCP Server
GITHUB_TOKEN=your_github_token_here
```

## Security Improvements Made

### 1. Removed Hardcoded Database URL

- **Previous**: Connection string was hardcoded in `.mcp.json`
- **Fixed**: Now uses `${SUPABASE_DB_URL}` environment variable
- **Benefit**: Prevents credential exposure in version control

### 2. Proper Environment Variable Usage

- All sensitive credentials are now in environment variables
- MCP servers inherit environment variables through `env` configuration

## Setup Instructions

### 1. Install Prerequisites

```bash
# Install Node.js packages (already in package.json)
npm install

# Install MCP servers globally (optional, npx will handle automatically)
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-github
npm install -g @modelcontextprotocol/server-postgres
npm install -g @modelcontextprotocol/server-sequential-thinking
```

### 2. Configure Environment Variables

Ensure your `.env` file contains all required variables:

```bash
# Copy from .env.example if needed
cp .env.example .env

# Edit .env with your actual credentials
```

### 3. Test Configuration

```bash
# Run the configuration test script
npx ts-node --esm scripts/test-mcp-config.ts
```

### 4. Run Fix Script (if needed)

```bash
# The fix script will setup and test MCP servers
bash scripts/fix-supabase-mcp.sh
```

## Troubleshooting

### MCP Servers Not Connecting

1. **Check if servers are running:**

   ```bash
   ps aux | grep mcp-server
   ```

2. **Check environment variables:**

   ```bash
   source .env && echo $SUPABASE_DB_URL
   source .env && echo $GITHUB_TOKEN
   ```

3. **Test database connection:**
   ```bash
   # If you have psql installed
   psql "$SUPABASE_DB_URL" -c "SELECT 1"
   ```

### Port Conflicts

If you get port allocation errors:

```bash
# Kill processes using common MCP ports
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
```

### Docker Issues (for local Supabase)

If using local Supabase development:

```bash
# Stop conflicting containers
supabase stop --project-id mike

# Start fresh
supabase start
```

## Available MCP Capabilities

### PostgreSQL Server

- Direct database queries and analysis
- Schema inspection and migration support
- Performance monitoring
- RLS (Row Level Security) policy management

### GitHub Server

- Repository operations
- Issue and PR management
- Code search and analysis
- Automated workflows

### Filesystem Server

- Advanced file operations
- Pattern matching and search
- Batch file operations
- Project structure analysis

### Sequential Thinking Server

- Multi-step problem solving
- Complex planning and analysis
- Decision trees and optimization
- Debugging workflows

## Advanced Workflows

See `docs/the-past-as-of-jan-13/ARCHIVED-tainted-docs-2025-01-06/FOR_AI/MCP_WORKFLOWS.md` for detailed examples of:

- Database schema analysis and migration
- Performance optimization workflows
- Security auditing procedures
- Real-time feature development
- Deployment automation

## Files Reference

- **Configuration**: `.mcp.json`
- **Environment**: `.env`, `.env.example`
- **Fix Script**: `scripts/fix-supabase-mcp.sh`
- **Test Script**: `scripts/test-mcp-config.ts`
- **Advanced Workflows**: `docs/the-past-as-of-jan-13/ARCHIVED-tainted-docs-2025-01-06/FOR_AI/MCP_WORKFLOWS.md`

## Monitoring and Maintenance

### Log Files

- MCP server logs: `/tmp/mcp-postgres.log`, `/tmp/mcp.log`
- Application logs: Check console output when running development server

### Health Checks

The fix script includes health checks for MCP server connectivity:

```bash
# Manual health check
curl -s -X POST http://localhost:8000/query -d '{"sql":"SELECT 1"}' | grep -q '"?column?":1'
```

## Security Notes

- Never commit database URLs or tokens to version control
- Regularly rotate GitHub tokens and database passwords
- Use environment variables for all sensitive configuration
- Consider using secrets management for production deployments

---

_Last updated: June 14, 2025_
_Configuration tested and verified working_
