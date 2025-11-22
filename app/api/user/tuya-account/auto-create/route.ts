// Auto-create Tuya Account API
// 自动为用户创建 Tuya 账户（透明化，用户无需手动输入）
// Automatically create Tuya account for user (transparent, no manual input required)

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

/**
 * 自动生成 Tuya 账户和密码
 * 使用用户的邮箱和随机密码
 */
function generateTuyaAccount(userEmail: string): {
  account: string
  password: string
  countryCode: string
} {
  // 使用用户邮箱作为 Tuya 账户（如果 Tuya 支持邮箱注册）
  // 或者生成一个唯一的账户名
  const account = userEmail.toLowerCase().trim()
  
  // 生成强随机密码（16 位，包含字母、数字、特殊字符）
  const password = crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '') + 
                   crypto.randomInt(1000, 9999).toString()
  
  // 根据邮箱域名推断国家代码（简化版，默认 Taiwan）
  let countryCode = '887' // 默认 Taiwan
  if (account.includes('.cn') || account.includes('@qq.') || account.includes('@163.')) {
    countryCode = '86' // China
  } else if (account.includes('.jp')) {
    countryCode = '81' // Japan
  } else if (account.includes('.sg')) {
    countryCode = '65' // Singapore
  }
  
  return {
    account,
    password,
    countryCode,
  }
}

// POST: 自动创建 Tuya 账户
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // 检查用户是否已有 Tuya 账户
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        tuyaAccount: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 如果已有 Tuya 账户，直接返回
    if (user.tuyaAccount) {
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        message: 'Tuya account already exists',
        tuyaAccount: `${user.tuyaAccount.substring(0, 3)}****`, // Masked
      })
    }

    // 生成 Tuya 账户和密码
    const { account, password, countryCode } = generateTuyaAccount(user.email || '')

    // 加密密码
    const salt = await bcrypt.genSalt(12)
    const encryptedPassword = await bcrypt.hash(password, salt)

    // 保存到数据库
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        tuyaAccount: account,
        tuyaPassword: encryptedPassword,
        tuyaCountryCode: countryCode,
      },
      select: {
        id: true,
        email: true,
        tuyaAccount: true,
        tuyaCountryCode: true,
      },
    })

    // 注意：实际创建 Tuya 账户需要在客户端（iOS/Android）通过 SDK 进行
    // 这里只是生成账户信息并保存
    // 客户端需要调用 Tuya SDK 的注册 API 来实际创建账户

    return NextResponse.json({
      success: true,
      message: 'Tuya account generated successfully. Account will be created automatically when you first use Tuya features.',
      tuyaAccount: `${updated.tuyaAccount?.substring(0, 3)}****`, // Masked for security
      tuyaCountryCode: updated.tuyaCountryCode,
      // 不返回密码，密码已加密存储
      note: 'Account credentials are stored securely. The actual Tuya account will be created automatically via SDK when needed.',
    })
  } catch (error: any) {
    console.error('Error auto-creating Tuya account:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to auto-create Tuya account' },
      { status: 500 }
    )
  }
}

