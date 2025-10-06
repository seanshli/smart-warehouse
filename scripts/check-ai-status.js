#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🤖 AI Configuration Status Check\n');

const envPath = path.join(process.cwd(), '.env.local');

// Check if .env.local exists
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found');
  console.log('💡 Run: npm run setup');
  process.exit(1);
}

// Read environment variables
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/"/g, '');
  }
});

console.log('📋 Configuration Status:');
console.log('');

// Check OpenAI API Key
const apiKey = envVars.OPENAI_API_KEY;
if (!apiKey || apiKey === 'your-openai-api-key') {
  console.log('❌ OPENAI_API_KEY: Not configured');
  console.log('   💡 Get your key at: https://platform.openai.com/api-keys');
} else if (apiKey.startsWith('sk-')) {
  console.log('✅ OPENAI_API_KEY: Configured');
} else {
  console.log('⚠️  OPENAI_API_KEY: Invalid format (should start with sk-)');
}

// Check Vision Model
const visionModel = envVars.OPENAI_VISION_MODEL || 'gpt-4o';
console.log(`✅ OPENAI_VISION_MODEL: ${visionModel}`);

// Check Text Model
const textModel = envVars.OPENAI_TEXT_MODEL || 'gpt-4o-mini';
console.log(`✅ OPENAI_TEXT_MODEL: ${textModel}`);

// Check Max Tokens
const maxTokens = envVars.OPENAI_MAX_TOKENS || '500';
console.log(`✅ OPENAI_MAX_TOKENS: ${maxTokens}`);

// Check Temperature
const temperature = envVars.OPENAI_TEMPERATURE || '0.3';
console.log(`✅ OPENAI_TEMPERATURE: ${temperature}`);

console.log('');

// Overall status
const isConfigured = apiKey && apiKey !== 'your-openai-api-key' && apiKey.startsWith('sk-');

if (isConfigured) {
  console.log('🎉 AI Configuration: READY');
  console.log('');
  console.log('🚀 You can now:');
  console.log('   • Upload photos for AI recognition');
  console.log('   • Scan barcodes for product identification');
  console.log('   • Get automatic category suggestions');
  console.log('');
  console.log('💡 Test it out:');
  console.log('   1. Go to http://localhost:3000');
  console.log('   2. Sign in with demo@smartwarehouse.com / demo123');
  console.log('   3. Click "Add Item" and try uploading a photo');
} else {
  console.log('⚠️  AI Configuration: INCOMPLETE');
  console.log('');
  console.log('🔧 To complete setup:');
  console.log('   1. Get your OpenAI API key: https://platform.openai.com/api-keys');
  console.log('   2. Edit .env.local and add your key');
  console.log('   3. Restart the development server');
  console.log('');
  console.log('📖 For detailed instructions, see: AI_SETUP.md');
}

console.log('');
console.log('📊 Model Information:');
console.log(`   Vision Model: ${visionModel} (for photos)`);
console.log(`   Text Model: ${textModel} (for barcodes)`);
console.log(`   Max Response Length: ${maxTokens} tokens`);
console.log(`   Creativity Level: ${temperature} (0-1 scale)`);

