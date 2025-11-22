/**
 * 验证 Vercel 中的 Tuya 环境变量
 * Verify Tuya Environment Variables in Vercel
 * 
 * 使用方法:
 * npx tsx scripts/verify-vercel-tuya-env.ts
 */

async function verifyVercelTuyaEnv() {
  console.log('\n🔍 验证 Vercel Tuya 环境变量')
  console.log('====================\n')

  // 必需的 Tuya SDK 环境变量
  const requiredSDKVars = [
    'TUYA_IOS_SDK_APP_KEY',
    'TUYA_IOS_SDK_APP_SECRET',
    'TUYA_ANDROID_SDK_APP_KEY',
    'TUYA_ANDROID_SDK_APP_SECRET',
    'TUYA_ANDROID_SDK_SHA256',
  ]

  // 必需的 Tuya API 环境变量
  const requiredAPIVars = [
    'TUYA_ACCESS_ID',
    'TUYA_ACCESS_SECRET',
    'TUYA_REGION',
  ]

  // 所有必需的变量
  const allRequiredVars = [...requiredSDKVars, ...requiredAPIVars]

  console.log('📋 检查环境变量配置...\n')

  // 检查本地环境变量（如果存在）
  console.log('1. 本地环境变量检查 (.env.local):')
  const localVars: string[] = []
  const missingLocalVars: string[] = []
  
  for (const varName of allRequiredVars) {
    if (process.env[varName]) {
      localVars.push(varName)
      console.log(`   ✅ ${varName}: 已设置`)
    } else {
      missingLocalVars.push(varName)
      console.log(`   ⚠️  ${varName}: 未设置（本地）`)
    }
  }

  if (missingLocalVars.length > 0) {
    console.log(`\n   ⚠️  本地缺少 ${missingLocalVars.length} 个变量`)
    console.log('   提示: 这些变量应该在 Vercel 中设置，本地不需要')
  }

  // 测试 Vercel 部署的 API
  console.log('\n2. 测试 Vercel 部署的 API:')
  const vercelUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : 'https://smart-warehouse-five.vercel.app'
  
  console.log(`   测试 URL: ${vercelUrl}`)

  // 测试 iOS SDK Config API
  console.log('\n   a) 测试 iOS SDK Config API...')
  try {
    const iosResponse = await fetch(`${vercelUrl}/api/mqtt/tuya/sdk-config?platform=ios`)
    
    if (iosResponse.ok) {
      const iosConfig = await iosResponse.json()
      
      if (iosConfig.error) {
        console.log(`      ❌ 错误: ${iosConfig.error}`)
        console.log(`      💡 提示: ${iosConfig.message || '请检查环境变量'}`)
      } else {
        console.log(`      ✅ iOS SDK 配置可用`)
        console.log(`         App Key: ${iosConfig.appKey ? '✅ 已设置' : '❌ 未设置'}`)
        console.log(`         App Secret: ${iosConfig.appSecret ? '✅ 已设置' : '❌ 未设置'}`)
        
        if (!iosConfig.appKey || !iosConfig.appSecret) {
          console.log(`      ⚠️  缺少 iOS SDK 凭证`)
        }
      }
    } else {
      const errorData = await iosResponse.json().catch(() => ({ error: iosResponse.statusText }))
      console.log(`      ❌ API 请求失败: ${errorData.error || iosResponse.statusText}`)
    }
  } catch (error: any) {
    console.log(`      ❌ 连接失败: ${error.message}`)
    console.log(`      💡 提示: 检查网络连接或 Vercel 部署状态`)
  }

  // 测试 Android SDK Config API
  console.log('\n   b) 测试 Android SDK Config API...')
  try {
    const androidResponse = await fetch(`${vercelUrl}/api/mqtt/tuya/sdk-config?platform=android`)
    
    if (androidResponse.ok) {
      const androidConfig = await androidResponse.json()
      
      if (androidConfig.error) {
        console.log(`      ❌ 错误: ${androidConfig.error}`)
        console.log(`      💡 提示: ${androidConfig.message || '请检查环境变量'}`)
      } else {
        console.log(`      ✅ Android SDK 配置可用`)
        console.log(`         App Key: ${androidConfig.appKey ? '✅ 已设置' : '❌ 未设置'}`)
        console.log(`         App Secret: ${androidConfig.appSecret ? '✅ 已设置' : '❌ 未设置'}`)
        console.log(`         SHA256: ${androidConfig.sha256 ? '✅ 已设置' : '⚠️  未设置（可选）'}`)
        
        if (!androidConfig.appKey || !androidConfig.appSecret) {
          console.log(`      ⚠️  缺少 Android SDK 凭证`)
        }
      }
    } else {
      const errorData = await androidResponse.json().catch(() => ({ error: androidResponse.statusText }))
      console.log(`      ❌ API 请求失败: ${errorData.error || androidResponse.statusText}`)
    }
  } catch (error: any) {
    console.log(`      ❌ 连接失败: ${error.message}`)
    console.log(`      💡 提示: 检查网络连接或 Vercel 部署状态`)
  }

  // 验证变量列表
  console.log('\n3. 环境变量清单:')
  console.log('\n   📱 Tuya SDK 变量（移动应用）:')
  for (const varName of requiredSDKVars) {
    console.log(`      - ${varName}`)
  }

  console.log('\n   🌐 Tuya API 变量（服务器端）:')
  for (const varName of requiredAPIVars) {
    console.log(`      - ${varName}`)
  }

  // 检查 CODE 变量（如果存在）
  if (process.env.CODE) {
    console.log('\n   ℹ️  其他变量:')
    console.log(`      - CODE: 已设置（可能是项目代码）`)
  }

  // 总结
  console.log('\n\n✅ 验证完成')
  console.log('====================')
  console.log('\n📝 总结:')
  console.log('  - 环境变量应该在 Vercel Dashboard 中设置')
  console.log('  - 所有变量应设置为 "All Environments"')
  console.log('  - SDK Config API 会返回配置给移动应用')
  console.log('\n💡 如果 API 测试失败:')
  console.log('  1. 检查 Vercel 部署是否成功')
  console.log('  2. 确认环境变量已保存并重新部署')
  console.log('  3. 检查变量名称是否正确')
  console.log('  4. 确认变量值不为空')
}

async function main() {
  await verifyVercelTuyaEnv()
}

main().catch((error) => {
  console.error('验证脚本执行失败:', error)
  process.exit(1)
})

