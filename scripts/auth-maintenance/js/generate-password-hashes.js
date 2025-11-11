#!/usr/bin/env node

/**
 * Generate bcrypt password hashes for users
 * Run this to get the correct hashes for the SQL script
 */

const bcrypt = require('bcryptjs');

async function generateHashes() {
  console.log('🔐 Generating password hashes...\n');
  
  const seanPassword = 'Smtengo1324!';
  const demoPassword = 'demo123';
  
  const seanHash = await bcrypt.hash(seanPassword, 12);
  const demoHash = await bcrypt.hash(demoPassword, 12);
  
  console.log('✅ Password hashes generated:\n');
  console.log('sean.li@smtengo.com:');
  console.log(`  Hash: ${seanHash}`);
  console.log(`  Password: ${seanPassword}\n`);
  
  console.log('demo@smartwarehouse.com:');
  console.log(`  Hash: ${demoHash}`);
  console.log(`  Password: ${demoPassword}\n`);
  
  console.log('📋 SQL Update Statements:');
  console.log('-- Copy these into fix-users-in-production.sql\n');
  console.log(`-- sean.li@smtengo.com hash:`);
  console.log(`'${seanHash}'`);
  console.log(`\n-- demo@smartwarehouse.com hash:`);
  console.log(`'${demoHash}'`);
}

generateHashes().catch(console.error);

