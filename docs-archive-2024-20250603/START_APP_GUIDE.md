# 🚀 How to Start Your Plater Restaurant App

## Quick Start (Copy & Paste):

```bash
# 1. Open Terminal in the project directory
cd /Users/mike/Plate-Restaurant-System-App

# 2. Start the development server
npm run dev
```

Then open your browser to: **http://localhost:3000**

## Step-by-Step Guide:

### Step 1: Open Terminal

- On Mac: Press `Cmd + Space`, type "Terminal", press Enter
- Navigate to project: `cd /Users/mike/Plate-Restaurant-System-App`

### Step 2: Start the Server

Run this command:

```bash
npm run dev
```

You should see:

```
   ▲ Next.js 15.2.4
   - Local:        http://localhost:3000
   - Network:      http://192.168.0.137:3000
   - Environments: .env

 ✓ Starting...
 ✓ Ready in XXXXms
```

### Step 3: Open in Browser

- Open your web browser (Chrome, Safari, Firefox)
- Go to: **http://localhost:3000**
- You should see the Plate login page!

## Troubleshooting:

### If "npm run dev" fails:

1. **Install dependencies first:**

   ```bash
   npm install
   ```

2. **Clear cache and try again:**
   ```bash
   rm -rf .next
   npm run dev
   ```

### If browser shows "Cannot connect":

1. **Check if server is running**

   - Look at your Terminal
   - Should show "Ready" message
   - No red error messages

2. **Try different browser**

   - Sometimes browser cache causes issues
   - Try Incognito/Private mode

3. **Check port 3000**
   ```bash
   lsof -i :3000
   ```
   If something else is using port 3000, stop it first.

## What You'll See:

1. **Login Page** (http://localhost:3000)

   - Plate logo
   - Email/Password fields
   - Sign In / Sign Up toggle

2. **After Login** (http://localhost:3000/dashboard)
   - Role-based dashboard
   - Server View / Kitchen View cards

## Keeping the Server Running:

- **Leave Terminal open** - closing it stops the server
- **To stop server**: Press `Ctrl + C` in Terminal
- **To restart**: Run `npm run dev` again

## Test Login:

Create a test account:

1. Click "Need an account? Create one"
2. Enter:
   - Name: Test User
   - Email: test@example.com
   - Password: testpassword123
   - Role: Server
3. Click "Create Account"

## Need Help?

If server won't start, share the error message from Terminal!
