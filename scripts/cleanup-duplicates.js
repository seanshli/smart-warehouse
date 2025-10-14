#!/usr/bin/env node

/**
 * Manual Duplicate Cleanup Script
 * 
 * This script helps manually trigger duplicate cleanup and cache clearing
 */

const https = require('https');

// Configuration
const BASE_URL = 'https://smart-warehouse-five.vercel.app';
const ENDPOINTS = {
  cleanupPanasonic: '/api/cleanup-panasonic-duplicates',
  clearCache: '/api/cache/stats',
  duplicates: '/api/items/duplicates'
};

function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'smart-warehouse-five.vercel.app',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (method === 'POST') {
      req.write('{}');
    }
    
    req.end();
  });
}

async function checkDuplicates() {
  console.log('🔍 Checking for duplicates...');
  try {
    const response = await makeRequest(ENDPOINTS.duplicates);
    console.log('Duplicates check result:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Error checking duplicates:', error.message);
    return null;
  }
}

async function cleanupPanasonic() {
  console.log('🧹 Cleaning up Panasonic duplicates...');
  try {
    const response = await makeRequest(ENDPOINTS.cleanupPanasonic, 'POST');
    console.log('Cleanup result:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Error cleaning up duplicates:', error.message);
    return null;
  }
}

async function clearCache() {
  console.log('🗑️ Clearing cache...');
  try {
    const response = await makeRequest(ENDPOINTS.clearCache, 'DELETE');
    console.log('Cache clear result:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Error clearing cache:', error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting duplicate cleanup process...\n');
  
  // Step 1: Check for duplicates
  const duplicates = await checkDuplicates();
  
  if (duplicates && duplicates.length > 0) {
    console.log(`\n📊 Found ${duplicates.length} duplicate groups`);
    
    // Step 2: Clean up Panasonic duplicates
    const cleanupResult = await cleanupPanasonic();
    
    if (cleanupResult && cleanupResult.message) {
      console.log(`\n✅ ${cleanupResult.message}`);
      console.log(`📈 Kept item: ${cleanupResult.keptItem.name} (qty: ${cleanupResult.keptItem.quantity})`);
      console.log(`🗑️ Deleted ${cleanupResult.deletedCount} duplicates`);
      
      // Step 3: Clear cache
      await clearCache();
      
      console.log('\n🎉 Cleanup completed successfully!');
      console.log('💡 Please refresh your dashboard to see the changes.');
    } else {
      console.log('\n❌ Cleanup failed or no Panasonic duplicates found');
    }
  } else {
    console.log('\n✅ No duplicates found');
  }
}

// Run the script
main().catch(console.error);
