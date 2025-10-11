#!/bin'sh
set -e

echo "🚀 Forcing database schema synchronization..."
yes | npm run db:sync

echo "✅ Schema synchronized. Starting server..."
exec "$@"