# Quick Start Guide

## What This Project Does
Real-time restaurant management platform with voice ordering, kitchen display system, and server tools for high-volume operations.

## Get Running in 5 Minutes

1. **Clone and install**
   ```bash
   git clone [repo-url]
   cd Plate-Restaurant-System-App
   npm install
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env.local
   # Add your Supabase and OpenAI API keys to .env.local
   ```

3. **Database setup**
   ```bash
   npm run supabase:start
   npm run supabase:migrate
   ```

4. **Demo data (optional)**
   ```bash
   npm run demo:setup
   ```

5. **Start developing**
   ```bash
   npm run dev:clean
   ```

Visit http://localhost:3000 - login with `guest@restaurant.plate` / `password` for demo

## Key Commands

**Development:**
- `npm run dev:clean` - Start fresh development (kills port first)
- `npm run test:quick` - Run unit tests + lint + type-check
- `npm run analyze` - Bundle size analysis

**Database:**
- `npm run supabase:start` - Start local Supabase
- `npm run supabase:migrate` - Apply database migrations
- `npm run demo:setup` - Setup demo environment

**Production:**
- `npm run build` - Production build
- `npm run start` - Start production server

## Where Things Are

**Core Architecture:**
- `/app` - Next.js 15 app router pages
- `/components` - React components organized by feature
- `/lib/modassembly/supabase` - Luis's modular assembly backend
- `/hooks` - Custom React hooks

**Key Features:**
- `/components/kds` - Kitchen Display System
- `/components/server` - Server management tools
- `/lib/modassembly/openai` - Voice ordering system
- `/lib/modassembly/supabase/database` - Domain-separated data modules

## Need More?

- **Architecture details:** See `.claude/CLAUDE.md`
- **Testing:** See `__tests__/README.md`
- **Historical context:** `docs/the-past-as-of-jan-13/`

## Performance Targets

- **Bundle size:** <100MB (current: 289MB - optimization needed)
- **Page load:** <2 seconds first contentful paint
- **KDS performance:** <500ms for 100 concurrent orders