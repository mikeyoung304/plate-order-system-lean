# 🚀 ONE SIMPLE COMMAND TO START YOUR RESTAURANT SYSTEM

## The ONLY Command You Need:

```bash
npm run dev
```

or 

```bash
./dev-start.sh
```

**That's it!** No need to remember anything else.

## What It Does Automatically:

1. ✅ Kills any processes on port 3000
2. ✅ Checks your environment (Node.js, npm, dependencies)
3. ✅ Starts the Next.js development server
4. ✅ Shows you all the important URLs and login credentials

## After Starting:

- 🌐 **Main App**: http://localhost:3000
- 👨‍💼 **Server View**: http://localhost:3000/server  
- 👨‍🍳 **Kitchen KDS**: http://localhost:3000/kitchen/kds
- 📊 **Dashboard**: http://localhost:3000/dashboard

## Demo Login:
- 📧 **Email**: guest@restaurant.plate
- 🔒 **Password**: guest12345

## If Something Goes Wrong:

The script handles most issues automatically, but if you need help:

1. **Port 3000 in use**: The script kills it automatically, but if it fails:
   ```bash
   lsof -i :3000
   kill -9 <PID>
   ```

2. **Dependencies missing**: Run `npm install`

3. **Environment variables missing**: Make sure `.env.local` exists

## That's It!

No more confusion with multiple scripts. Just remember: `npm run dev`

---

*Old startup scripts have been archived to `archive/old-startup-scripts/` to reduce confusion.*