# Deploy Plate Order System to Vercel

## Prerequisites

- Vercel account (free at vercel.com)
- Your Supabase project credentials
- OpenAI API key for voice transcription

## Step 1: Prepare Environment Variables

You'll need these environment variables from your `.env` file:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
```

## Step 2: Install Vercel CLI (Optional but Recommended)

```bash
npm i -g vercel
```

## Step 3: Deploy via CLI

### Option A: Quick Deploy (Recommended)

```bash
vercel
```

Follow the prompts:

1. Set up and deploy? `Y`
2. Which scope? Select your account
3. Link to existing project? `N` (first time) or `Y` (updates)
4. Project name? `plate-order-system` (or your choice)
5. Directory? `./` (current directory)
6. Build settings? Accept defaults (auto-detected)

### Option B: Deploy via GitHub Integration

1. Push your code to GitHub (already done!)
2. Go to vercel.com/new
3. Import your GitHub repository
4. Configure project:
   - Framework: Next.js (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

## Step 4: Configure Environment Variables in Vercel

### Via Dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`

### Via CLI:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add OPENAI_API_KEY
```

## Step 5: Configure Supabase for Production

1. **Update Supabase Auth URLs:**

   - Go to Supabase Dashboard > Authentication > URL Configuration
   - Add your Vercel URL to:
     - Site URL: `https://your-app.vercel.app`
     - Redirect URLs: `https://your-app.vercel.app/**`

2. **Enable RLS Policies:**
   - Ensure all Row Level Security policies are enabled
   - Run any pending migrations

## Step 6: Post-Deployment Setup

### Create Guest Account:

```bash
# SSH into Vercel function or run locally with production env
npm run setup-guest
```

### Seed Demo Data (Optional):

```bash
npm run seed-demo
```

## Step 7: Custom Domain (Optional)

1. In Vercel Dashboard > Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update Supabase redirect URLs

## Deployment Checklist

- [ ] Environment variables set in Vercel
- [ ] Supabase redirect URLs updated
- [ ] Database migrations run
- [ ] Guest account created
- [ ] SSL certificate active (automatic)
- [ ] Demo tested with Guest/Temp1

## Troubleshooting

### Build Errors:

- Check all environment variables are set
- Ensure no TypeScript errors: `npm run type-check`
- Check build logs in Vercel dashboard

### Auth Issues:

- Verify Supabase redirect URLs include Vercel domain
- Check NEXT_PUBLIC variables are accessible client-side
- Ensure cookies are enabled for auth

### API Issues:

- Verify SUPABASE_SERVICE_ROLE_KEY is set (server-side only)
- Check Vercel function logs for errors
- Ensure API routes don't exceed timeout (10s on free plan)

### Voice Recording:

- HTTPS is required (Vercel provides this)
- Microphone permissions must be granted by user
- Check browser console for Web Audio API errors

## Performance Tips

1. **Edge Functions:** Consider moving auth checks to middleware
2. **Image Optimization:** Use next/image for all images
3. **Database Indexes:** Ensure Supabase tables have proper indexes
4. **Caching:** Implement ISR for semi-static pages

## Monitor Your Deployment

- Vercel Dashboard: Real-time logs and analytics
- Supabase Dashboard: Database metrics and logs
- Set up alerts for errors or high usage

## Demo Links

Once deployed, share these:

- Main App: `https://your-app.vercel.app`
- Guest Login: Username `Guest`, Password `Temp1`
- Admin: `lisa@platestaff.com` / `demo123!`

---

🎉 Your Plate Order System is now live on Vercel!
Professional demos ready for investors and clients.
