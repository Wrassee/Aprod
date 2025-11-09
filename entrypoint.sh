#!/bin/sh
set -e

echo "================================================"
echo "🚀 OTIS APROD - Production Startup"
echo "================================================"

# ============================================
# ENVIRONMENT ELLENŐRZÉS
# ============================================
echo "📍 Environment: ${NODE_ENV:-production}"
echo "🌐 App URL: ${VITE_APP_URL:-not set}"
echo "🔌 Port: ${PORT:-10000}"

# Kritikus environment variables ellenőrzése
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL is not set!"
  echo "   Please set it in Render Dashboard → Environment"
  exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "⚠️  WARNING: SUPABASE_SERVICE_ROLE_KEY is not set!"
  echo "   Auth middleware will not work properly!"
  # Ne állítsuk le az app-ot, csak figyelmeztetés
fi

echo "✅ Environment variables validated"

# ============================================
# DATABASE MIGRATIONS
# ============================================
echo ""
echo "🔄 Running database migrations..."

# Ellenőrizzük, hogy van-e db:migrate script
if npm run | grep -q "db:migrate"; then
  npm run db:migrate
  echo "✅ Migrations completed successfully"
else
  echo "⚠️  No db:migrate script found in package.json"
  echo "   Skipping migrations..."
fi

# ============================================
# HEALTH CHECK INFO
# ============================================
echo ""
echo "💚 Health check endpoint: /health"
echo "📊 API endpoints: /api/*"

# ============================================
# START APPLICATION
# ============================================
echo ""
echo "🎬 Starting OTIS APROD server..."
echo "================================================"

# Execute CMD from Dockerfile
exec "$@"