#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Smart Warehouse...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), 'env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    console.log('📝 Creating .env.local from env.example...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env.local created! Please edit it with your API keys.\n');
  } else {
    console.log('⚠️  env.example not found. Please create .env.local manually.\n');
  }
} else {
  console.log('✅ .env.local already exists.\n');
}

// Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed!\n');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Generate Prisma client
console.log('🗄️  Generating Prisma client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated!\n');
} catch (error) {
  console.error('❌ Failed to generate Prisma client:', error.message);
  process.exit(1);
}

// Push database schema
console.log('🗄️  Setting up database...');
try {
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('✅ Database schema created!\n');
} catch (error) {
  console.error('❌ Failed to setup database:', error.message);
  process.exit(1);
}

console.log('🎉 Setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Edit .env.local with your API keys (especially OPENAI_API_KEY)');
console.log('2. Run "npm run dev" to start the development server');
console.log('3. Open http://localhost:3000 in your browser');
console.log('\n🔑 Required API keys:');
console.log('- OPENAI_API_KEY: Get from https://platform.openai.com/api-keys');
console.log('- NEXTAUTH_SECRET: Generate a random string');
console.log('- GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET (optional): For Google OAuth');
console.log('\n📚 For more information, see README.md');


