#!/bin/sh
set -e
echo "==> Executing entrypoint script..."

# Az egyszeri javításhoz használjuk a 'db:sync'-et
# A 'yes |' rész automatikusan igennel válaszol a kérdésre
echo "==> Forcing database schema synchronization..."
yes | npm run db:sync

echo "==> Synchronization finished. Starting server..."
exec "$@"