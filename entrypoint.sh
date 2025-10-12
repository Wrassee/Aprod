#!/bin/sh
set -e

echo "==> 🚀 Executing entrypoint script..."

echo "==> 🧱 Running database migrations..."
# Biztonságos migráció — ha már minden rendben, nem állítja le a konténert
if npm run db:sync; then
  echo "==> ✅ Database successfully synced!"
else
  echo "==> ⚠️ Migration failed or already applied, continuing..."
fi

echo "==> 🟢 Starting server..."
exec "$@"
