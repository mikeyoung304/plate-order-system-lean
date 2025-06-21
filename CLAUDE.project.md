# Plate Restaurant System App   |   tier: project   |   parent: ~/.claude/CLAUDE.md

## Dev Commands
```bash
npm run dev:clean    # purge cache → start dev
npm run test:quick   # vitest suite
npm run build        # production bundle
```

## Auth Snippet (Supabase)
```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect('/auth');
```

## Milestones (√ = done, → next)
√ Bundle shrink 289 MB → 15.5 MB
√ Voice + manual ordering
√ Global error handler
□ API: order-create (#server-client.tsx:410)
□ Playwright e2e tests

────────────────────────────────────────────
🔑  GUEST LOGIN (Demo Access)
────────────────────────────────────────────
• **User:** guest@restaurant.plate  
• **Pass:** guest12345

This account has a guest_admin role granting broad read/write
permissions to mock data for demonstration purposes.

<!-- GUEST_BLOCK_MARKER -->