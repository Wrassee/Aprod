#!/bin/sh
set -e
echo "==> Executing entrypoint script..."

echo "==> Running database migrations..."
npm run db:migrate

echo "==> Migrations finished. Starting server..."
exec "$@"