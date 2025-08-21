// Custom Vercel build script that bypasses package.json build command
// This ensures we use the minimal production server and avoid Vite dependency issues

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔧 Starting custom Vercel build...');

try {
  // Set production environment
  process.env.NODE_ENV = 'production';
  
  // Build frontend
  console.log('📦 Building frontend...');
  execSync('npx vite build', { stdio: 'inherit' });
  
  // Create dist directory
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
  }
  
  // Build backend using minimal production server
  console.log('⚙️ Building backend with minimal production server...');
  execSync(`npx esbuild server/minimal-production.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js --minify --target=node18 --define:process.env.NODE_ENV='"production"'`, { stdio: 'inherit' });
  
  // Verify build
  const bundleContent = fs.readFileSync('dist/index.js', 'utf8');
  if (bundleContent.includes('createServer') && bundleContent.includes('vite')) {
    throw new Error('Build still contains Vite dependencies!');
  }
  
  console.log('✅ Build completed successfully!');
  console.log('✅ Bundle verification: Clean (no Vite dependencies)');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}