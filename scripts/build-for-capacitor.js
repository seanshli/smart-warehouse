#!/usr/bin/env node

/**
 * 为 Capacitor 构建脚本
 * 构建静态导出，然后移除 API routes（因为它们不会在静态导出中工作）
 * CRITICAL: Always cleans old build files before building
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔨 Building for Capacitor...\n');

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

// 1. 临时移动 API routes 目录（Next.js 静态导出不支持 API routes）
console.log('📝 Step 1: Temporarily moving API routes...');
const apiRoutesDir = path.join(process.cwd(), 'app/api');
const tempApiDir = path.join(process.cwd(), '.temp-api');

// 如果临时目录已存在，先恢复
if (fs.existsSync(tempApiDir)) {
  console.log('⚠️  Found existing temp API directory, restoring...');
  if (fs.existsSync(apiRoutesDir)) {
    fs.rmSync(apiRoutesDir, { recursive: true, force: true });
  }
  fs.renameSync(tempApiDir, apiRoutesDir);
}

// 移动 API routes 到临时目录
if (fs.existsSync(apiRoutesDir)) {
  fs.renameSync(apiRoutesDir, tempApiDir);
  console.log('✅ API routes moved to temp directory\n');
} else {
  console.log('⚠️  API routes directory not found, skipping...\n');
}

// 2. 构建
console.log('🔨 Step 2: Building Next.js app...');
try {
  // 使用 standalone 模式而不是 export，因为动态路由需要客户端渲染
  // Use standalone mode instead of export, as dynamic routes need client-side rendering
  execSync('NODE_ENV=production next build', {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: {
      ...process.env,
      CAPACITOR_BUILD: 'true',
    },
  });
  console.log('✅ Build complete\n');
  
  // Verify out directory was created
  if (!fs.existsSync(outDir)) {
    console.error('❌ ERROR: out/ directory was not created after build!');
    restoreApiRoutes();
    process.exit(1);
  }
  
  // Verify out/index.html exists
  const indexHtml = path.join(outDir, 'index.html');
  if (!fs.existsSync(indexHtml)) {
    console.error('❌ ERROR: out/index.html was not created after build!');
    restoreApiRoutes();
    process.exit(1);
  }
  
  // Log build timestamp
  const stats = fs.statSync(indexHtml);
  console.log(`✅ Build verified: out/index.html created at ${stats.mtime}\n`);
  
} catch (error) {
  console.error('❌ Build failed');
  // 恢复 API routes
  restoreApiRoutes();
  process.exit(1);
}

// 3. 恢复 API routes
console.log('📝 Step 3: Restoring API routes...');
restoreApiRoutes();
console.log('✅ API routes restored\n');

function restoreApiRoutes() {
  // 恢复 API routes 目录
  if (fs.existsSync(tempApiDir)) {
    if (fs.existsSync(apiRoutesDir)) {
      fs.rmSync(apiRoutesDir, { recursive: true, force: true });
    }
    fs.renameSync(tempApiDir, apiRoutesDir);
    console.log('✅ API routes restored');
  }
}

console.log('🎉 Capacitor build complete!');
console.log('📱 Next: Run "npx cap sync ios" or "npx cap sync android"');
