/**
 * 重置用户密码
 * Reset User Password
 * 
 * 使用方法:
 * npx tsx scripts/reset-user-password.ts <email> <new-password>
 * 
 * 示例:
 * npx tsx scripts/reset-user-password.ts sean.li@smtengo.com NewPassword123!
 */

// Load environment variables from .env.local
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })
// Also try .env file as fallback
config({ path: resolve(process.cwd(), '.env') })

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetUserPassword(email: string, newPassword: string) {
  console.log(`\n🔐 重置用户密码`)
  console.log('====================\n')
  console.log(`邮箱: ${email}`)
  console.log(`新密码: ${'*'.repeat(newPassword.length)}\n`)

  try {
    // 1. 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { credentials: true },
    })

    if (!user) {
      console.log('❌ 用户不存在')
      console.log(`   邮箱: ${email}`)
      return
    }

    console.log('✅ 用户存在')
    console.log(`   ID: ${user.id}`)
    console.log(`   名称: ${user.name || '未设置'}\n`)

    // 2. 验证密码长度
    if (newPassword.length < 6) {
      console.log('❌ 密码长度不足')
      console.log('   密码必须至少 6 个字符')
      return
    }

    // 3. 生成密码哈希
    console.log('🔐 生成密码哈希...')
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)
    console.log('✅ 密码哈希已生成\n')

    // 4. 更新或创建 UserCredentials
    console.log('📝 更新 UserCredentials...')
    
    if (user.credentials) {
      // 更新现有凭证
      await prisma.userCredentials.update({
        where: { userId: user.id },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      })
      console.log('✅ 已更新现有凭证')
    } else {
      // 创建新凭证
      await prisma.userCredentials.create({
        data: {
          userId: user.id,
          password: hashedPassword,
        },
      })
      console.log('✅ 已创建新凭证')
    }

    console.log('\n✅ 密码重置成功！')
    console.log('====================')
    console.log(`用户: ${email}`)
    console.log(`新密码: ${'*'.repeat(newPassword.length)}`)
    console.log('\n💡 现在可以使用新密码登录了')

  } catch (error: any) {
    console.error('❌ 重置失败:', error.message)
    if (error.message.includes('DATABASE_URL')) {
      console.log('   💡 提示: 需要设置 DATABASE_URL 环境变量')
    }
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  const email = process.argv[2]
  const newPassword = process.argv[3]

  if (!email || !newPassword) {
    console.log('❌ 使用方法错误')
    console.log('')
    console.log('使用方法:')
    console.log('  npx tsx scripts/reset-user-password.ts <email> <new-password>')
    console.log('')
    console.log('示例:')
    console.log('  npx tsx scripts/reset-user-password.ts sean.li@smtengo.com NewPassword123!')
    console.log('')
    process.exit(1)
  }

  await resetUserPassword(email, newPassword)
}

main().catch((error) => {
  console.error('脚本执行失败:', error)
  process.exit(1)
})

