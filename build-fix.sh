#!/bin/bash
set -e

echo "🔧 Applying deployment fix..."

# Build frontend
echo "📦 Building frontend..."
NODE_ENV=production npx vite build

# Build backend with proper exclusions
echo "⚙️ Building backend..."
mkdir -p dist

# Use esbuild with explicit exclusions for Vite and development files
npx esbuild server/index.ts \
  --platform=node \
  --packages=external \
  --bundle \
  --format=esm \
  --outdir=dist \
  --external:vite \
  --external:@replit/vite-plugin-cartographer \
  --external:@replit/vite-plugin-runtime-error-modal \
  --external:@vitejs/plugin-react \
  --external:./vite-dev \
  --external:../vite.config \
  --minify \
  --target=node18 \
  --define:process.env.NODE_ENV='"production"'

echo "✅ Build completed successfully!"
echo "🚀 Ready for deployment"