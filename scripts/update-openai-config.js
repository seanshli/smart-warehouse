#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 OpenAI Configuration Updater\n');

const envPath = path.join(process.cwd(), '.env.local');

// Check if .env.local exists
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found. Please run "npm run setup" first.');
  process.exit(1);
}

// Read current .env.local
let envContent = fs.readFileSync(envPath, 'utf8');

// Check if OpenAI configuration needs updating
const needsUpdate = !envContent.includes('OPENAI_VISION_MODEL') || 
                   !envContent.includes('OPENAI_TEXT_MODEL');

if (!needsUpdate) {
  console.log('✅ OpenAI configuration is already up to date!');
  process.exit(0);
}

console.log('📝 Updating OpenAI configuration...');

// Add new OpenAI configuration if not present
if (!envContent.includes('OPENAI_VISION_MODEL')) {
  envContent = envContent.replace(
    /OPENAI_API_KEY="[^"]*"/,
    `OPENAI_API_KEY="your-openai-api-key"
OPENAI_VISION_MODEL="gpt-4o"
OPENAI_TEXT_MODEL="gpt-4o-mini"
OPENAI_MAX_TOKENS="500"
OPENAI_TEMPERATURE="0.3"`
  );
}

// Write updated .env.local
fs.writeFileSync(envPath, envContent);

console.log('✅ OpenAI configuration updated successfully!');
console.log('\n📋 New configuration:');
console.log('  - Vision Model: gpt-4o (latest)');
console.log('  - Text Model: gpt-4o-mini (latest)');
console.log('  - Max Tokens: 500');
console.log('  - Temperature: 0.3');
console.log('\n💡 Don\'t forget to:');
console.log('  1. Add your actual OpenAI API key');
console.log('  2. Restart the development server');
console.log('\n🔗 Get your API key at: https://platform.openai.com/api-keys');

