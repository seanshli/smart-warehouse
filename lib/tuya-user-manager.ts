// Tuya User Account Manager
// 管理用户的 Tuya 账户和登录状态
// Manage user's Tuya account and login status

import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

/**
 * 获取用户的 Tuya 账户信息（不包含密码）
 */
export async function getUserTuyaAccount(userId: string): Promise<{
  tuyaAccount: string | null
  tuyaCountryCode: string | null
  hasAccount: boolean
} | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        tuyaAccount: true,
        tuyaCountryCode: true,
      },
    })

    if (!user) {
      return null
    }

    return {
      tuyaAccount: user.tuyaAccount,
      tuyaCountryCode: user.tuyaCountryCode || '1',
      hasAccount: !!user.tuyaAccount,
    }
  } catch (error) {
    console.error('Error getting user Tuya account:', error)
    return null
  }
}

/**
 * 验证用户的 Tuya 密码
 */
export async function verifyTuyaPassword(
  userId: string,
  password: string
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        tuyaPassword: true,
      },
    })

    if (!user || !user.tuyaPassword) {
      return false
    }

    return await bcrypt.compare(password, user.tuyaPassword)
  } catch (error) {
    console.error('Error verifying Tuya password:', error)
    return false
  }
}

/**
 * 获取用户的 Tuya 账户和密码（用于登录）
 * 注意：仅在服务器端使用，不要暴露给客户端
 */
export async function getUserTuyaCredentials(userId: string): Promise<{
  tuyaAccount: string
  tuyaPassword: string
  tuyaCountryCode: string
} | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        tuyaAccount: true,
        tuyaPassword: true,
        tuyaCountryCode: true,
      },
    })

    if (!user || !user.tuyaAccount || !user.tuyaPassword) {
      return null
    }

    // Note: Password is encrypted, but we return it for SDK login
    // The SDK will handle the actual login
    return {
      tuyaAccount: user.tuyaAccount,
      tuyaPassword: user.tuyaPassword, // This is encrypted, SDK may need decryption
      tuyaCountryCode: user.tuyaCountryCode || '1',
    }
  } catch (error) {
    console.error('Error getting user Tuya credentials:', error)
    return null
  }
}

/**
 * 保存 Tuya access token（临时）
 */
export async function saveTuyaAccessToken(
  userId: string,
  accessToken: string,
  expiresAt: Date
): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        tuyaAccessToken: accessToken,
        tuyaTokenExpiresAt: expiresAt,
      },
    })

    return true
  } catch (error) {
    console.error('Error saving Tuya access token:', error)
    return false
  }
}

/**
 * 检查 Tuya token 是否有效
 */
export async function isTuyaTokenValid(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        tuyaAccessToken: true,
        tuyaTokenExpiresAt: true,
      },
    })

    if (!user || !user.tuyaAccessToken || !user.tuyaTokenExpiresAt) {
      return false
    }

    // Check if token is expired
    return new Date(user.tuyaTokenExpiresAt) > new Date()
  } catch (error) {
    console.error('Error checking Tuya token validity:', error)
    return false
  }
}

