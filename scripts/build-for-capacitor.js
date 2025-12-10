#!/usr/bin/env node

/**
 * 为 Capacitor 构建脚本
 * CRITICAL: Always cleans old build files before building
 * 
 * NOTE: With remote server config, this build is mainly for:
 * 1. Verifying the build works
 * 2. Creating static files for development/testing
 * 3. Apps will load from Vercel server (always latest code)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔨 Building for Capacitor...\n');
console.log('📱 NOTE: Apps will load from Vercel server (always latest code)');
console.log('📱 This build creates static files for development/testing only\n');

// 0. CRITICAL: Clean old build files FIRST
console.log('🧹 Step 0: Cleaning old build files...');
const outDir = path.join(process.cwd(), 'out');
const nextDir = path.join(process.cwd(), '.next');

if (fs.existsSync(outDir)) {
  console.log('   Removing old out/ directory...');
  fs.rmSync(outDir, { recursive: true, force: true });
  console.log('   ✅ Old out/ directory removed\n');
} else {
  console.log('   ℹ️  No out/ directory found, skipping cleanup\n');
}

if (fs.existsSync(nextDir)) {
  console.log('   Removing old .next/ directory...');
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log('   ✅ Old .next/ directory removed\n');
} else {
  console.log('   ℹ️  No .next/ directory found, skipping cleanup\n');
}

// 1. Build Next.js app (for Vercel deployment)
console.log('🔨 Step 1: Building Next.js app for Vercel...');
try {
  // Build for Vercel (no standalone mode - Vercel uses serverless)
  execSync('NODE_ENV=production next build', {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: {
      ...process.env,
      // Don't set CAPACITOR_BUILD - let Vercel handle it
    },
  });
  console.log('✅ Build complete\n');
  
  // Verify build succeeded
  const buildIdFile = path.join(process.cwd(), '.next', 'BUILD_ID');
  if (fs.existsSync(buildIdFile)) {
    const buildId = fs.readFileSync(buildIdFile, 'utf8').trim();
    console.log(`✅ Build verified: Build ID ${buildId}\n`);
  }
  
} catch (error) {
  console.error('❌ Build failed');
  process.exit(1);
}

console.log('🎉 Capacitor build complete!');
console.log('📱 Apps will load from: https://smart-warehouse-five.vercel.app');
console.log('📱 Always latest code - no need to rebuild native apps!');
console.log('📱 Just deploy to Vercel and apps get updates automatically');
