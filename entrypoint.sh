#!/bin/sh

# Megállítjuk a végrehajtást, ha bármelyik parancs hibára fut
set -e

# 1. LÉPÉS: Adatbázis migráció futtatása
echo "🚀 Running database migrations..."
npm run db:migrate

# 2. LÉPÉS: A szerver indítása
# Az `exec "$@"` lecseréli a shell processzt a szerver processzre,
# ami a helyes módja a konténerekben futó alkalmazások indításának.
echo "✅ Migrations finished. Starting server..."
exec "$@"