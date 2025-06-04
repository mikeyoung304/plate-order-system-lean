# MCP Server Setup Instructions

## What Was Fixed

### Issues Found:
1. **@modelcontextprotocol/server-vercel** - This package doesn't exist
2. **Connection errors** - Both filesystem and vercel MCPs were failing due to incorrect package names and missing tokens
3. **Missing environment variables** - GitHub and Vercel tokens were not set

### Actions Taken:
1. ✅ **Updated MCP Configuration** - Corrected `.mcp.json` with working packages
2. ✅ **Installed MCP Servers** - Installed all required packages globally
3. ✅ **Added Environment Variables** - Updated `.env` with token placeholders
4. ✅ **Removed Vercel MCP** - Since the package doesn't exist, removed from config

## Current MCP Configuration

The `.mcp.json` now includes:
- **filesystem**: ✅ Working - Uses @modelcontextprotocol/server-filesystem
- **github**: ⚠️ Needs token - Uses @modelcontextprotocol/server-github  
- **postgres**: ✅ Working - Uses existing Supabase credentials
- **sequential-thinking**: ✅ Working - No tokens required

## Next Steps Required

### 1. Set Up GitHub Token (Required for GitHub MCP)

**Option A: Using GitHub CLI (Recommended)**
```bash
# Login to GitHub
gh auth login

# Get your token
gh auth token

# Copy the token and add it to .env file
echo "GITHUB_TOKEN=your_token_here" >> .env
```

**Option B: Manual Token Creation**
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `read:org`, `read:user`
4. Copy token and add to `.env` file

### 2. Test MCP Status
```bash
claude mcp  # Check if all servers are now connected
```

### 3. If You Need Vercel Integration
Since `@modelcontextprotocol/server-vercel` doesn't exist, alternatives:
- Use the Vercel CLI directly via filesystem MCP
- Use the GitHub MCP to manage Vercel deployments via Git
- Create custom tools in your application

## Updated Files

- ✅ `.mcp.json` - Corrected MCP server configuration
- ✅ `.env` - Added token placeholders with instructions
- ✅ Installed packages globally

## Verification

After setting up the GitHub token, run:
```bash
claude mcp
```

You should see:
- filesystem: ✅ connected
- github: ✅ connected  
- postgres: ✅ connected
- sequential-thinking: ✅ connected