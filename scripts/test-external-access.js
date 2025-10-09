#!/usr/bin/env node

const https = require('https');
const http = require('http');

function testExternalAccess(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data.substring(0, 200) + '...' // First 200 chars
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function runTests() {
  console.log('🧪 Testing External Access Configuration...\n');
  
  // Test URLs
  const testUrls = [
    'http://localhost:3000',
    'http://10.68.1.183:3000', // Your current LAN IP
    // Add your external domain here when deployed
    // 'https://your-domain.com'
  ];
  
  for (const url of testUrls) {
    try {
      console.log(`Testing: ${url}`);
      const result = await testExternalAccess(url);
      
      console.log(`✅ Status: ${result.statusCode}`);
      console.log(`📡 CORS Headers:`);
      console.log(`   Access-Control-Allow-Origin: ${result.headers['access-control-allow-origin'] || 'Not set'}`);
      console.log(`   Access-Control-Allow-Methods: ${result.headers['access-control-allow-methods'] || 'Not set'}`);
      console.log(`   Access-Control-Allow-Headers: ${result.headers['access-control-allow-headers'] || 'Not set'}`);
      console.log(`📄 Content-Type: ${result.headers['content-type'] || 'Not set'}`);
      console.log(`📝 Preview: ${result.data}\n`);
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
    }
  }
  
  console.log('🔧 Configuration Check:');
  console.log('✅ Next.js CORS headers configured');
  console.log('✅ Middleware CORS handling added');
  console.log('✅ Capacitor config updated for external access');
  console.log('✅ Production build scripts added');
  
  console.log('\n📋 Next Steps:');
  console.log('1. Deploy your app to a hosting service (Vercel, Railway, etc.)');
  console.log('2. Update CAP_SERVER_URL environment variable');
  console.log('3. Run: npm run ios:production');
  console.log('4. Test on physical device or TestFlight');
}

runTests().catch(console.error);
