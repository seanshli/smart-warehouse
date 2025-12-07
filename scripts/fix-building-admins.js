#!/usr/bin/env node

/**
 * Script to fix building admins and working team members
 * Run this from the project root: node scripts/fix-building-admins.js
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

console.log(`🔧 Fixing building admins and working team members...`);
console.log(`📍 Target URL: ${BASE_URL}/api/admin/fix-building-admins`);

const url = new URL(`${BASE_URL}/api/admin/fix-building-admins`);
const client = url.protocol === 'https:' ? https : http;

const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

const req = client.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('\n✅ 修復成功！');
        console.log(`📊 摘要:`);
        console.log(`   - 總數: ${result.summary.total}`);
        console.log(`   - 已修復: ${result.summary.fixed}`);
        console.log(`   - 跳過: ${result.summary.skipped}`);
        console.log(`   - 錯誤: ${result.summary.errors}`);
        console.log(`\n💬 消息: ${result.message}`);
        
        if (result.results && result.results.length > 0) {
          console.log(`\n📋 詳細結果 (前10個):`);
          result.results.slice(0, 10).forEach((r, i) => {
            console.log(`   ${i + 1}. ${r.userEmail} - ${r.status}${r.reason ? ` (${r.reason})` : ''}`);
          });
          if (result.results.length > 10) {
            console.log(`   ... 還有 ${result.results.length - 10} 個結果`);
          }
        }
      } else {
        console.error('\n❌ 修復失敗！');
        console.error(`狀態碼: ${res.statusCode}`);
        console.error(`錯誤: ${result.error || data}`);
        if (result.details) {
          console.error(`詳情: ${result.details}`);
        }
        process.exit(1);
      }
    } catch (e) {
      console.error('\n❌ 解析響應失敗:', e.message);
      console.error('原始響應:', data);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error(`\n❌ 請求失敗: ${e.message}`);
  console.error('\n💡 提示:');
  console.error('   1. 確保應用正在運行');
  console.error('   2. 如果使用 Vercel，請設置 VERCEL_URL 環境變量');
  console.error('   3. 或者使用瀏覽器控制台方法（推薦）');
  process.exit(1);
});

req.end();

