#!/usr/bin/env node

/**
 * Test Password Verification
 * This script tests if the password hashes work correctly
 */

const bcrypt = require('bcryptjs');

const testCases = [
  { email: 'sean.li@smtengo.com', password: 'Smtengo1324!', hash: '$2a$12$gJazZWyACNpheP989Ngch.FWm1bH40gtC8.PjtsPbMV8CB3zjQShe' },
  { email: 'demo@smartwarehouse.com', password: 'demo123', hash: '$2a$12$sveHtUfw3XxykjAfbQ.2Zunj0ALU5YxOZPtWTsDR3UszYBqhDwo.i' }
];

async function testPasswords() {
  console.log('🔐 Testing Password Verification\n');
  
  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.email}`);
    console.log(`  Password: ${testCase.password}`);
    console.log(`  Hash: ${testCase.hash.substring(0, 30)}...`);
    
    try {
      const isValid = await bcrypt.compare(testCase.password, testCase.hash);
      console.log(`  Result: ${isValid ? '✅ Valid' : '❌ Invalid'}\n`);
    } catch (error) {
      console.log(`  Error: ${error.message}\n`);
    }
  }
  
  // Generate fresh hashes for comparison
  console.log('📝 Generating fresh hashes for comparison:\n');
  for (const testCase of testCases) {
    const freshHash = await bcrypt.hash(testCase.password, 12);
    console.log(`${testCase.email}:`);
    console.log(`  Fresh hash: ${freshHash}`);
    console.log(`  Matches original: ${freshHash === testCase.hash}`);
    console.log(`  Verification with fresh: ${await bcrypt.compare(testCase.password, freshHash)}\n`);
  }
}

testPasswords().catch(console.error);

