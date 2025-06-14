# Plate Restaurant System

Real-time restaurant management platform with voice ordering, kitchen display system, and server tools designed for high-volume operations.

## Quick Start
See [docs/QUICK_START.md](docs/QUICK_START.md)

**TL;DR:**
```bash
npm install
cp .env.example .env.local  # Add your API keys
npm run supabase:start && npm run supabase:migrate
npm run dev:clean
```

Visit http://localhost:3000 - login with `guest@restaurant.plate` / `password`

## Key Features

- **🏃‍♂️ Real-time Operations** - Instant order updates across kitchen and servers
- **🎤 Voice Ordering** - OpenAI-powered voice-to-text for fast order entry
- **📺 Kitchen Display System** - Optimized for 100+ concurrent orders
- **🗺️ Floor Plan Management** - Interactive table and seat management
- **📊 Live Analytics** - Real-time performance metrics and insights
- **🔒 Enterprise Auth** - Role-based access with server-first security

## Performance

- **Scale:** Built for 1000+ concurrent users
- **Speed:** <500ms response time for order operations
- **Real-time:** <200ms latency for live updates
- **Architecture:** Next.js 15 + Supabase + OpenAI

## Documentation

- [**Quick Start**](docs/QUICK_START.md) - Get running in 5 minutes
- [**Architecture**](docs/ARCHITECTURE.md) - System design and patterns
- [**API Reference**](docs/API.md) - Complete API documentation
- [**Testing Guide**](docs/TESTING.md) - Testing strategy and commands
- [**Deployment**](docs/DEPLOYMENT.md) - Production deployment guide

## Development

**Essential Commands:**
```bash
npm run dev:clean         # Start fresh development
npm run test:quick        # Unit tests + lint + type-check
npm run analyze          # Bundle size analysis
npm run supabase:migrate # Apply database changes
```

**Architecture:**
- Built on Luis Galeana's modular assembly patterns
- Server-first authentication (no client-side auth state)
- Domain-separated database modules
- Strategic React optimizations (188 implemented)

## Contributing

1. Follow the patterns in `.claude/CLAUDE.md`
2. Run `npm run test:quick` before commits
3. Keep components under 200 lines
4. Use server-first authentication patterns
5. Maintain 80%+ test coverage

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Backend:** Supabase (PostgreSQL + Real-time)
- **Auth:** Server-first with middleware
- **Voice:** OpenAI Whisper API
- **Styling:** Tailwind CSS
- **Testing:** Jest + Playwright + @testing-library

## License

MIT License - see LICENSE file for details