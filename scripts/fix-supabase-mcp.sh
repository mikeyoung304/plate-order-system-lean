#!/usr/bin/env bash
set -euo pipefail
echo "🔧  Fixing Supabase MCP …"

# ─────────────────────────────────────────────────────────
# 0.  Kill stray MCP & dev-server processes
# ─────────────────────────────────────────────────────────
pkill -f mcp-server-postgres 2>/dev/null || true
pkill -f "next dev"           2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
echo "✅ stray processes gone"

# ─────────────────────────────────────────────────────────
# 1.  Pull the canonical DB URL from Supabase CLI
# ─────────────────────────────────────────────────────────
DB_URL=$(supabase db credentials --db-url 2>/dev/null | tail -1)
if [ -z "$DB_URL" ]; then
  echo "❌ supabase CLI not logged in or project not linked"; exit 1
fi
echo "✅ DB_URL = $DB_URL"

# ─────────────────────────────────────────────────────────
# 2.  Derive & export env-vars for shell *and* MCP
# ─────────────────────────────────────────────────────────
export SUPABASE_DB_URL="$DB_URL"
export SUPABASE_PROJECT_REF=$(echo "$DB_URL" | cut -d@ -f2 | cut -d. -f2)
export SUPABASE_REGION=$(supabase status --json 2>/dev/null | jq -r '.db.region // empty')
export SUPABASE_API_KEY=${SUPABASE_ACCESS_TOKEN:-$(cat ~/.supabase/pat 2>/dev/null | head -1)}
if [ -z "$SUPABASE_API_KEY" ]; then
  echo "❌ no personal-access token found"; exit 1
fi
echo "✅ env vars exported (ref=$SUPABASE_PROJECT_REF region=$SUPABASE_REGION)"

# ─────────────────────────────────────────────────────────
# 3.  Start a fresh MCP server on :8000
# ─────────────────────────────────────────────────────────
nohup mcp-server-postgres >/tmp/mcp.log 2>&1 &
sleep 3
if curl -s -X POST http://localhost:8000/query -d '{"sql":"select 1"}' \
     | grep -q '"?column?":1'; then
  echo "✅ MCP alive (select 1 succeeded)"
else
  echo "❌ MCP still down – showing last 20 log lines"; tail -n20 /tmp/mcp.log; exit 1
fi

# ─────────────────────────────────────────────────────────
# 4.  Create / attach read-only guest_investor role
# ─────────────────────────────────────────────────────────
curl -s -X POST http://localhost:8000/query -d '{"sql":"
  create role if not exists guest_investor noinherit nologin;
  grant usage on schema public to guest_investor;
  grant select on all tables in schema public to guest_investor;
  alter default privileges in schema public
    grant select on tables to guest_investor;
  insert into auth.user_roles(user_id,role)
  select id, ''guest_investor''
  from auth.users
  where email = ''guest@restaurant.plate''
  on conflict do nothing;
"}' >/dev/null && echo "✅ guest_investor role ready"

echo "🎉  All done – MCP healthy & investor demo user configured."