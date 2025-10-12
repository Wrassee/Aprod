#!/bin/sh
set -e
echo "==> Executing entrypoint script..."

echo "==> Forcing database schema synchronization..."
yes | npm run db:sync

echo "==> Synchronization finished. Starting server..."
exec "$@"