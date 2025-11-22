/**
 * 验证 Tuya Token 和账户功能
 * Verify Tuya Token and Account Functionality
 * 
 * 使用方法:
 * npx tsx scripts/verify-tuya-token.ts
 */

import { PrismaClient } from '@prisma/client'
import { getUserTuyaAccount, getUserTuyaCredentials, isTuyaTokenValid, saveTuyaAccessToken } from '../lib/tuya-user-manager'

// Only initialize Prisma if DATABASE_URL is available
let prisma: PrismaClient | null = null
try {
  if (process.env.DATABASE_URL) {
    prisma = new PrismaClient()
  }
} catch (error) {
  console.warn('⚠️  DATABASE_URL not found, skipping database checks')
}

async function verifyTuyaTokenSystem() {
  console.log('\n🔐 验证 Tuya Token 系统')
  console.log('====================\n')

  try {
    // 1. 检查数据库结构
    console.log('1. 检查数据库结构...')
    if (!prisma) {
      console.log('   ⚠️  DATABASE_URL 未设置，跳过数据库检查')
      console.log('   提示: 创建 .env.local 文件并添加 DATABASE_URL')
    } else {
      try {
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
        console.log(`   国家代码: ${sampleUser.tuyaCountryCode || '未设置'}`)
        console.log(`   访问令牌: ${sampleUser.tuyaAccessToken ? '已设置' : '未设置'}`)
        console.log(`   令牌过期时间: ${sampleUser.tuyaTokenExpiresAt ? new Date(sampleUser.tuyaTokenExpiresAt).toLocaleString() : '未设置'}`)
        
        // 检查 token 是否有效
        if (sampleUser.tuyaAccessToken && sampleUser.tuyaTokenExpiresAt) {
          const isValid = await isTuyaTokenValid(sampleUser.id)
          console.log(`   Token 有效性: ${isValid ? '✅ 有效' : '❌ 已过期'}`)
        }
      } else {
        console.log('   ⚠️  数据库中没有用户记录')
      }
    } catch (error: any) {
      if (error.message.includes('Unknown column') || error.message.includes('does not exist')) {
        console.log('   ❌ 数据库表缺少 Tuya 字段')
        console.log('   请运行 SQL 迁移脚本: scripts/add-tuya-user-account-fields.sql')
      } else {
        console.error('   ❌ 数据库检查失败:', error.message)
      }
      }
    }

    // 2. 测试 Token 管理函数
    console.log('\n2. 测试 Token 管理函数...')
    if (!prisma) {
      console.log('   ⚠️  DATABASE_URL 未设置，跳过 Token 管理函数测试')
    } else {
      try {
        const testUser = await prisma.user.findFirst()
      if (testUser) {
        // 测试保存 token
        const testToken = 'test_token_' + Date.now()
        const expiresAt = new Date(Date.now() + 3600000) // 1小时后过期
        
        const saved = await saveTuyaAccessToken(testUser.id, testToken, expiresAt)
        if (saved) {
          console.log('   ✅ saveTuyaAccessToken() 函数正常')
        } else {
          console.log('   ❌ saveTuyaAccessToken() 函数失败')
        }

        // 测试 token 有效性检查
        const isValid = await isTuyaTokenValid(testUser.id)
        console.log(`   ✅ isTuyaTokenValid() 函数正常: ${isValid ? 'Token 有效' : 'Token 无效'}`)

        // 测试获取账户信息
        const account = await getUserTuyaAccount(testUser.id)
        if (account) {
          console.log('   ✅ getUserTuyaAccount() 函数正常')
          console.log(`      账户: ${account.tuyaAccount || '未设置'}`)
          console.log(`      国家代码: ${account.tuyaCountryCode || '未设置'}`)
          console.log(`      有账户: ${account.hasAccount}`)
        } else {
          console.log('   ⚠️  getUserTuyaAccount() 返回 null（用户可能没有 Tuya 账户）')
        }

        // 测试获取凭证
        const credentials = await getUserTuyaCredentials(testUser.id)
        if (credentials) {
          console.log('   ✅ getUserTuyaCredentials() 函数正常')
          console.log(`      账户: ${credentials.tuyaAccount}`)
          console.log(`      密码: ${credentials.tuyaPassword ? '已设置（加密）' : '未设置'}`)
          console.log(`      国家代码: ${credentials.tuyaCountryCode}`)
        } else {
          console.log('   ⚠️  getUserTuyaCredentials() 返回 null（用户可能没有 Tuya 账户）')
        }
      } else {
        console.log('   ⚠️  没有用户可用于测试')
      }
    } catch (error: any) {
      console.error('   ❌ Token 管理函数测试失败:', error.message)
      }
    }

    // 3. 测试 API 端点
    console.log('\n3. 测试 API 端点...')
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
    
    console.log(`   测试服务器: ${baseUrl}`)
    console.log('   ⚠️  注意: 如果服务器未运行，API 测试会失败')
    console.log('   提示: 运行 "npm run dev" 启动开发服务器')
    
    // 测试获取 Tuya 账户 API
    try {
      console.log('   测试 GET /api/user/tuya-account...')
      const accountResponse = await fetch(`${baseUrl}/api/user/tuya-account`, {
        method: 'GET',
        credentials: 'include',
      })
      
      if (accountResponse.ok) {
        const accountData = await accountResponse.json()
        console.log('   ✅ GET /api/user/tuya-account 可用')
        console.log(`      有账户: ${accountData.hasTuyaAccount ? '是' : '否'}`)
        if (accountData.hasTuyaAccount) {
          console.log(`      账户: ${accountData.tuyaAccount ? '已设置（已掩码）' : '未设置'}`)
          console.log(`      国家代码: ${accountData.tuyaCountryCode || '未设置'}`)
        }
      } else if (accountResponse.status === 401) {
        console.log('   ⚠️  需要登录才能测试 GET /api/user/tuya-account')
      } else {
        const errorData = await accountResponse.json()
        console.log(`   ❌ GET /api/user/tuya-account 失败: ${errorData.error || accountResponse.statusText}`)
      }
    } catch (error: any) {
      console.error('   ❌ GET /api/user/tuya-account 测试失败:', error.message)
    }

    // 测试自动创建账户 API
    try {
      console.log('\n   测试 POST /api/user/tuya-account/auto-create...')
      const autoCreateResponse = await fetch(`${baseUrl}/api/user/tuya-account/auto-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      
      if (autoCreateResponse.ok) {
        const autoCreateData = await autoCreateResponse.json()
        console.log('   ✅ POST /api/user/tuya-account/auto-create 可用')
        console.log(`      已存在: ${autoCreateData.alreadyExists ? '是' : '否'}`)
        if (!autoCreateData.alreadyExists) {
          console.log('      ✅ 账户已自动创建')
        }
      } else if (autoCreateResponse.status === 401) {
        console.log('   ⚠️  需要登录才能测试 POST /api/user/tuya-account/auto-create')
      } else {
        const errorData = await autoCreateResponse.json()
        console.log(`   ❌ POST /api/user/tuya-account/auto-create 失败: ${errorData.error || autoCreateResponse.statusText}`)
      }
    } catch (error: any) {
      console.error('   ❌ POST /api/user/tuya-account/auto-create 测试失败:', error.message)
    }

    // 测试登录 API
    try {
      console.log('\n   测试 POST /api/mqtt/tuya/login...')
      const loginResponse = await fetch(`${baseUrl}/api/mqtt/tuya/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json()
        console.log('   ✅ POST /api/mqtt/tuya/login 可用')
        console.log(`      成功: ${loginData.success ? '是' : '否'}`)
        if (loginData.success) {
          console.log(`      账户: ${loginData.account ? '已设置' : '未设置'}`)
          console.log(`      国家代码: ${loginData.countryCode || '未设置'}`)
          console.log(`      有密码: ${loginData.hasPassword ? '是' : '否'}`)
        }
      } else if (loginResponse.status === 401) {
        console.log('   ⚠️  需要登录才能测试 POST /api/mqtt/tuya/login')
      } else {
        const errorData = await loginResponse.json()
        console.log(`   ❌ POST /api/mqtt/tuya/login 失败: ${errorData.error || loginResponse.statusText}`)
      }
    } catch (error: any) {
      console.error('   ❌ POST /api/mqtt/tuya/login 测试失败:', error.message)
    }

    // 测试登录状态 API
    try {
      console.log('\n   测试 GET /api/mqtt/tuya/login-status...')
      const statusResponse = await fetch(`${baseUrl}/api/mqtt/tuya/login-status`, {
        method: 'GET',
        credentials: 'include',
      })
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        console.log('   ✅ GET /api/mqtt/tuya/login-status 可用')
        console.log(`      已登录: ${statusData.loggedIn ? '是' : '否'}`)
      } else if (statusResponse.status === 401) {
        console.log('   ⚠️  需要登录才能测试 GET /api/mqtt/tuya/login-status')
      } else {
        const errorData = await statusResponse.json()
        console.log(`   ❌ GET /api/mqtt/tuya/login-status 失败: ${errorData.error || statusResponse.statusText}`)
      }
    } catch (error: any) {
      console.error('   ❌ GET /api/mqtt/tuya/login-status 测试失败:', error.message)
    }

    // 4. 检查环境变量
    console.log('\n4. 检查环境变量...')
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

    // 5. 测试 SDK Config API
    console.log('\n5. 测试 SDK Config API...')
    try {
      // 测试 iOS 配置
      const iosResponse = await fetch(`${baseUrl}/api/mqtt/tuya/sdk-config?platform=ios`)
      if (iosResponse.ok) {
        const iosConfig = await iosResponse.json()
        console.log('   ✅ iOS SDK 配置可用')
        console.log(`      App Key: ${iosConfig.appKey ? '已设置' : '未设置'}`)
        console.log(`      App Secret: ${iosConfig.appSecret ? '已设置' : '未设置'}`)
      } else {
        const errorData = await iosResponse.json()
        console.log(`   ❌ iOS SDK 配置不可用: ${errorData.error || iosResponse.statusText}`)
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
        const errorData = await androidResponse.json()
        console.log(`   ❌ Android SDK 配置不可用: ${errorData.error || errorData.message || androidResponse.statusText}`)
      }
    } catch (error: any) {
      console.error('   ❌ SDK Config API 测试失败:', error.message)
    }

  } catch (error: any) {
    console.error('❌ Tuya Token 系统验证失败:', error.message)
  }
}

async function main() {
  console.log('🔍 Tuya Token 和账户验证')
  console.log('========================\n')
  
  await verifyTuyaTokenSystem()
  
  console.log('\n\n✅ 验证完成')
  console.log('====================')
  console.log('\n下一步:')
  console.log('1. 在移动应用中测试 Tuya 账户自动创建')
  console.log('2. 测试 Tuya 登录和 token 保存')
  console.log('3. 测试 token 过期检查')
  console.log('4. 测试配网功能')
  
  if (prisma) {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('验证脚本执行失败:', error)
  process.exit(1)
})

