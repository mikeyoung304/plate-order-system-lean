# Plate Restaurant System - Project Overview

## Purpose
Real-time restaurant management platform with voice ordering, kitchen display system (KDS), and server tools designed for high-volume operations.

## Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Supabase (PostgreSQL + Real-time)  
- **Auth**: Server-first with middleware
- **Voice**: OpenAI Whisper API
- **Styling**: Tailwind CSS
- **Testing**: Jest + Playwright + @testing-library

## Key Features
- Real-time Operations - Instant order updates across kitchen and servers
- Voice Ordering - OpenAI-powered voice-to-text for fast order entry  
- Kitchen Display System - Optimized for 100+ concurrent orders
- Floor Plan Management - Interactive table and seat management
- Live Analytics - Real-time performance metrics and insights
- Enterprise Auth - Role-based access with server-first security

## Performance Targets
- Scale: Built for 1000+ concurrent users
- Speed: <500ms response time for order operations
- Real-time: <200ms latency for live updates
- Architecture: Next.js 15 + Supabase + OpenAI

## Architecture Patterns
- Built on Luis Galeana's modular assembly patterns
- Server-first authentication (no client-side auth state)
- Domain-separated database modules  
- Strategic React optimizations (188 implemented)
- Connection pooling for database efficiency