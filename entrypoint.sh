#!/bin/sh
set -e

echo "==> Executing entrypoint script..."

echo "==> Running database migrations (db:push)..."
# Javasolt parancs a Render/Neon környezethez:
npm run db:push

echo "==> Migrations finished. Starting server..."
# Ez indítja el a Dockerfile CMD-jében megadott parancsot (node dist/server/index.js)
exec "$@"