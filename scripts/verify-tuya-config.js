#!/usr/bin/env node
/**
 * Tuya Configuration Verification Script
 * 驗證 Tuya API 配置是否正確設置
 */

// Load .env.local if it exists
const fs = require('fs')
const path = require('path')

const envLocalPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      let value = match[2].trim()
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  })
  console.log('📁 Loaded .env.local file\n')
}

console.log('🔍 Verifying Tuya Configuration...\n')

// Check environment variables
const requiredVars = [
  'TUYA_ACCESS_ID',
  'TUYA_ACCESS_SECRET',
  'TUYA_REGION'
]

const optionalVars = [
  'TUYA_ACCESS_ID_US',
  'TUYA_ACCESS_SECRET_US',
  'TUYA_ACCESS_ID_CN',
  'TUYA_ACCESS_SECRET_CN'
]

let allValid = true
const results = {}

// Check required variables
console.log('📋 Required Environment Variables:')
requiredVars.forEach(varName => {
  const value = process.env[varName]
  if (!value || value === '' || value.includes('your-')) {
    console.log(`  ❌ ${varName}: Not set or using placeholder`)
    results[varName] = { valid: false, value: 'NOT SET' }
    allValid = false
  } else {
    // Mask sensitive values
    const masked = varName.includes('SECRET') 
      ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
      : value.length > 20
      ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}`
      : value
    console.log(`  ✅ ${varName}: ${masked}`)
    results[varName] = { valid: true, value: masked }
  }
})

// Check optional variables
console.log('\n📋 Optional Environment Variables (Multi-Region):')
let hasOptional = false
optionalVars.forEach(varName => {
  const value = process.env[varName]
  if (value && value !== '' && !value.includes('your-')) {
    hasOptional = true
    const masked = varName.includes('SECRET') 
      ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
      : value.length > 20
      ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}`
      : value
    console.log(`  ✅ ${varName}: ${masked}`)
    results[varName] = { valid: true, value: masked }
  } else {
    console.log(`  ⚪ ${varName}: Not set (optional)`)
    results[varName] = { valid: false, value: 'NOT SET' }
  }
})

if (!hasOptional) {
  console.log('  (No multi-region configuration detected)')
}

// Validate region value
console.log('\n🌍 Region Validation:')
const region = process.env.TUYA_REGION
const validRegions = ['cn', 'us', 'eu', 'in']
if (region && validRegions.includes(region.toLowerCase())) {
  const regionMap = {
    cn: 'China/Singapore/Asia-Pacific',
    us: 'US/Canada',
    eu: 'Europe',
    in: 'India'
  }
  console.log(`  ✅ TUYA_REGION: "${region}" (${regionMap[region.toLowerCase()]})`)
  results.regionValid = true
} else if (region) {
  console.log(`  ⚠️  TUYA_REGION: "${region}" (Invalid - should be one of: ${validRegions.join(', ')})`)
  console.log(`     Using default: "cn"`)
  results.regionValid = false
  allValid = false
} else {
  console.log(`  ❌ TUYA_REGION: Not set (will default to "cn")`)
  results.regionValid = false
  allValid = false
}

// Check API endpoint
console.log('\n🔗 API Endpoint:')
const regionMap = {
  cn: 'https://openapi.tuyacn.com',
  us: 'https://openapi.tuyaus.com',
  eu: 'https://openapi.tuyaeu.com',
  in: 'https://openapi.tuyain.com',
}
const selectedRegion = (region || 'cn').toLowerCase()
const apiEndpoint = regionMap[selectedRegion] || regionMap.cn
console.log(`  📍 Selected Region: ${selectedRegion}`)
console.log(`  🌐 API Endpoint: ${apiEndpoint}`)

// Summary
console.log('\n' + '='.repeat(50))
if (allValid && results.regionValid) {
  console.log('✅ Tuya Configuration: VALID')
  console.log('\n📝 Configuration Summary:')
  console.log(`   Access ID: ${results.TUYA_ACCESS_ID.value}`)
  console.log(`   Access Secret: ${results.TUYA_ACCESS_SECRET.value}`)
  console.log(`   Region: ${region || 'cn'} (${apiEndpoint})`)
  console.log('\n✨ You can now use Tuya device provisioning!')
} else {
  console.log('❌ Tuya Configuration: INCOMPLETE')
  console.log('\n⚠️  Issues found:')
  if (!results.TUYA_ACCESS_ID?.valid) {
    console.log('   - TUYA_ACCESS_ID is not set or using placeholder')
  }
  if (!results.TUYA_ACCESS_SECRET?.valid) {
    console.log('   - TUYA_ACCESS_SECRET is not set or using placeholder')
  }
  if (!results.regionValid) {
    console.log('   - TUYA_REGION is not set or invalid')
  }
  console.log('\n📖 Next Steps:')
  console.log('   1. Set TUYA_ACCESS_ID in your environment variables')
  console.log('   2. Set TUYA_ACCESS_SECRET in your environment variables')
  console.log('   3. Set TUYA_REGION to one of: cn, us, eu, in')
  console.log('   4. For local development: Add to .env.local')
  console.log('   5. For production: Add to Vercel Environment Variables')
  console.log('\n📚 See docs/TUYA_MULTI_REGION_SETUP.md for details')
}
console.log('='.repeat(50))

// Exit with appropriate code
process.exit(allValid && results.regionValid ? 0 : 1)

