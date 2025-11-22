/**
 * 验证 WiFi 和 Tuya 账户连接脚本
 * Verify WiFi and Tuya Account Connection Script
 * 
 * 使用方法:
 * npx tsx scripts/verify-wifi-tuya-connection.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyWiFiConnection() {
  console.log('\n📶 验证 WiFi 连接功能')
  console.log('====================\n')

  try {
    // 检查 WiFi 插件是否可用
    const { Capacitor } = await import('@capacitor/core')
    const platform = Capacitor.getPlatform()
    
    console.log(`平台: ${platform}`)
    
    if (platform === 'web') {
      console.log('⚠️  Web 环境：WiFi 扫描功能受限')
      console.log('   需要服务器端支持或使用移动应用')
    } else {
      console.log('✅ 原生平台：可以使用 WiFi 插件')
      
      // 测试 WiFi 插件
      try {
        const WiFiPlugin = (await import('../lib/plugins/wifi')).default
        
        // 测试获取当前 SSID
        console.log('\n1. 测试获取当前 SSID...')
        const currentSSID = await WiFiPlugin.getCurrentSSID()
        console.log(`   当前 SSID: ${currentSSID.ssid || '未连接'}`)
        
        // 测试权限检查
        console.log('\n2. 测试权限检查...')
        const permission = await WiFiPlugin.checkPermission()
        console.log(`   权限状态: ${permission.granted ? '已授予' : '未授予'}`)
        
        if (!permission.granted) {
          console.log('   请求权限...')
          const requestResult = await WiFiPlugin.requestPermission()
          console.log(`   权限请求结果: ${requestResult.granted ? '已授予' : '被拒绝'}`)
        }
        
        // 测试保存密码
        console.log('\n3. 测试保存 WiFi 密码...')
        const testSSID = 'TestWiFi'
        const testPassword = 'TestPassword123'
        await WiFiPlugin.savePassword({ ssid: testSSID, password: testPassword })
        console.log(`   ✅ 已保存测试密码`)
        
        // 测试获取密码
        console.log('\n4. 测试获取 WiFi 密码...')
        const savedPassword = await WiFiPlugin.getPassword({ ssid: testSSID })
        if (savedPassword.password === testPassword) {
          console.log(`   ✅ 密码验证成功`)
        } else {
          console.log(`   ❌ 密码验证失败`)
        }
        
        // 清理测试数据
        await WiFiPlugin.deletePassword({ ssid: testSSID })
        console.log('   ✅ 已清理测试数据')
        
      } catch (error: any) {
        console.error('   ❌ WiFi 插件测试失败:', error.message)
      }
    }
    
  } catch (error: any) {
    console.error('❌ WiFi 连接验证失败:', error.message)
  }
}

async function verifyTuyaAccount() {
  console.log('\n\n🏠 验证 Tuya 账户功能')
  console.log('====================\n')

  try {
    // 检查环境变量
    console.log('1. 检查环境变量...')
    const requiredVars = [
      'TUYA_IOS_SDK_APP_KEY',
      'TUYA_IOS_SDK_APP_SECRET',
      'TUYA_ANDROID_SDK_APP_KEY',
      'TUYA_ANDROID_SDK_APP_SECRET',
    ]
    
    const missingVars: string[] = []
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missingVars.push(varName)
      }
    }
    
    if (missingVars.length > 0) {
      console.log(`   ⚠️  缺少环境变量: ${missingVars.join(', ')}`)
      console.log('   请在 Vercel 或 .env.local 中设置这些变量')
    } else {
      console.log('   ✅ 所有必需的环境变量已设置')
    }
    
    // 测试 SDK Config API
    console.log('\n2. 测试 SDK Config API...')
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      
      // 测试 iOS 配置
      const iosResponse = await fetch(`${baseUrl}/api/mqtt/tuya/sdk-config?platform=ios`)
      if (iosResponse.ok) {
        const iosConfig = await iosResponse.json()
        console.log('   ✅ iOS SDK 配置可用')
        console.log(`      App Key: ${iosConfig.appKey ? '已设置' : '未设置'}`)
        console.log(`      App Secret: ${iosConfig.appSecret ? '已设置' : '未设置'}`)
      } else {
        console.log('   ❌ iOS SDK 配置不可用')
      }
      
      // 测试 Android 配置
      const androidResponse = await fetch(`${baseUrl}/api/mqtt/tuya/sdk-config?platform=android`)
      if (androidResponse.ok) {
        const androidConfig = await androidResponse.json()
        console.log('   ✅ Android SDK 配置可用')
        console.log(`      App Key: ${androidConfig.appKey ? '已设置' : '未设置'}`)
        console.log(`      App Secret: ${androidConfig.appSecret ? '已设置' : '未设置'}`)
        console.log(`      SHA256: ${androidConfig.sha256 ? '已设置' : '未设置'}`)
      } else {
        console.log('   ❌ Android SDK 配置不可用')
      }
    } catch (error: any) {
      console.error('   ❌ SDK Config API 测试失败:', error.message)
    }
    
    // 检查数据库中的 Tuya 账户字段
    console.log('\n3. 检查数据库结构...')
    try {
      // 检查 users 表是否有 Tuya 账户字段
      const sampleUser = await prisma.user.findFirst({
        select: {
          id: true,
          email: true,
          tuyaAccount: true,
          tuyaPassword: true,
          tuyaCountryCode: true,
          tuyaAccessToken: true,
          tuyaTokenExpiresAt: true,
        },
      })
      
      if (sampleUser) {
        console.log('   ✅ 数据库表结构正确')
        console.log(`   示例用户: ${sampleUser.email}`)
        console.log(`   Tuya 账户: ${sampleUser.tuyaAccount ? '已设置' : '未设置'}`)
        console.log(`   Tuya 密码: ${sampleUser.tuyaPassword ? '已设置' : '未设置'}`)
        console.log(`   访问令牌: ${sampleUser.tuyaAccessToken ? '已设置' : '未设置'}`)
      } else {
        console.log('   ⚠️  数据库中没有用户记录')
      }
    } catch (error: any) {
      if (error.message.includes('Unknown column') || error.message.includes('does not exist')) {
        console.log('   ❌ 数据库表缺少 Tuya 账户字段')
        console.log('   请运行 SQL 迁移脚本: scripts/add-tuya-user-account-fields.sql')
      } else {
        console.error('   ❌ 数据库检查失败:', error.message)
      }
    }
    
    // 测试自动创建账户 API
    console.log('\n4. 测试自动创建账户 API...')
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const testResponse = await fetch(`${baseUrl}/api/user/tuya-account/auto-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // 注意：这需要有效的会话 cookie
        credentials: 'include',
      })
      
      if (testResponse.ok) {
        console.log('   ✅ 自动创建账户 API 可用')
      } else if (testResponse.status === 401) {
        console.log('   ⚠️  需要登录才能测试自动创建账户 API')
      } else {
        const errorData = await testResponse.json()
        console.log(`   ❌ 自动创建账户 API 失败: ${errorData.error || testResponse.statusText}`)
      }
    } catch (error: any) {
      console.error('   ❌ 自动创建账户 API 测试失败:', error.message)
    }
    
    // 测试登录 API
    console.log('\n5. 测试登录 API...')
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const testResponse = await fetch(`${baseUrl}/api/mqtt/tuya/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      
      if (testResponse.ok) {
        console.log('   ✅ 登录 API 可用')
      } else if (testResponse.status === 401) {
        console.log('   ⚠️  需要登录才能测试登录 API')
      } else {
        const errorData = await testResponse.json()
        console.log(`   ❌ 登录 API 失败: ${errorData.error || testResponse.statusText}`)
      }
    } catch (error: any) {
      console.error('   ❌ 登录 API 测试失败:', error.message)
    }
    
  } catch (error: any) {
    console.error('❌ Tuya 账户验证失败:', error.message)
  }
}

async function main() {
  console.log('🔍 WiFi 和 Tuya 连接验证')
  console.log('========================\n')
  
  await verifyWiFiConnection()
  await verifyTuyaAccount()
  
  console.log('\n\n✅ 验证完成')
  console.log('====================')
  console.log('\n下一步:')
  console.log('1. 在移动应用中测试 WiFi 扫描和密码保存')
  console.log('2. 测试 Tuya 账户自动创建和登录')
  console.log('3. 测试 Tuya 配网功能')
  
  await prisma.$disconnect()
}

main().catch((error) => {
  console.error('验证脚本执行失败:', error)
  process.exit(1)
})

