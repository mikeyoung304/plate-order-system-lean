# 🔧 UI Debug Guide for Plater Restaurant System

## ✅ Fixed Issues:

1. **Missing CSS Classes** - Added font families and gradient classes
2. **Server Running** - No TypeScript or build errors

## 🔍 Common UI Issues & Solutions:

### 1. Blank/White Screen

**Possible Causes:**

- JavaScript errors
- Failed API calls
- Missing environment variables

**Debug Steps:**

```bash
# Check browser console
1. Open: http://localhost:3000
2. Press F12 (Developer Tools)
3. Check Console tab for red errors
4. Check Network tab for failed requests (red)
```

### 2. Authentication Issues

**Test Login:**

1. Go to http://localhost:3000
2. Try these test credentials:
   - Email: test@example.com
   - Password: testpassword123

**If login fails:**

- Check Supabase dashboard for user
- Verify email confirmation is disabled for testing
- Check browser console for auth errors

### 3. Missing Components/Styles

**Verify all dependencies:**

```bash
npm list framer-motion lucide-react @supabase/supabase-js
```

### 4. Database Connection Issues

**Check Supabase:**

1. Visit: https://supabase.com/dashboard/project/eiipozoogrrfudhjoqms
2. Check if project is paused
3. Verify tables exist (tables, seats, orders, profiles)

## 🚀 Quick Debug Commands:

```bash
# 1. Clear Next.js cache
rm -rf .next
npm run dev

# 2. Check for missing dependencies
npm install

# 3. Verify environment variables
cat .env | grep SUPABASE

# 4. Test database connection
curl https://eiipozoogrrfudhjoqms.supabase.co/rest/v1/tables \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## 📱 Specific Page Issues:

### Landing Page (/)

- Should show Plate logo
- Login form with email/password
- Toggle for Sign In/Sign Up

### Dashboard (/dashboard)

- Requires authentication
- Shows role-based cards (Server/Kitchen/Admin)
- Animated entrance effects

### Server Page (/server)

- Floor plan view
- Table selection
- Voice ordering panel

## 🎯 Most Common Fixes:

1. **Hydration Errors:**

   - Remove `suppressHydrationWarning` temporarily
   - Check for client/server mismatches

2. **Missing Animations:**

   - Ensure framer-motion is installed
   - Check for animation conflicts

3. **Auth Redirect Loop:**

   - Clear cookies
   - Check middleware.ts configuration

4. **Dark Mode Issues:**
   - Verify ThemeProvider is wrapping app
   - Check dark mode class on html element

## 💡 Browser-Specific Debugging:

Open browser console and run:

```javascript
// Check Supabase client
console.log(window.supabase)

// Check authentication state
const {
  data: { session },
} = await window.supabase.auth.getSession()
console.log('Session:', session)

// Check theme
console.log(document.documentElement.classList)
```

## 🆘 Need More Help?

1. Share browser console errors
2. Share Network tab failed requests
3. Take screenshot of the issue
4. Check `npm run dev` terminal for server errors

The app should work if:

- ✅ Environment variables are set
- ✅ Supabase project is active
- ✅ Dependencies are installed
- ✅ No JavaScript errors in console
