// Tuya Household Manager
// 管理 Household 的 Tuya 账户和 Home
// Manage Tuya account and Home for Household

import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

/**
 * 生成 Household 的 Tuya 账户信息
 * Generate Tuya account information for a Household
 */
export function generateHouseholdTuyaAccount(householdName: string, householdId: string): {
  account: string
  password: string
  countryCode: string
} {
  // 使用 Household ID 和名称生成唯一的账户名
  // Use Household ID and name to generate unique account
  const sanitizedName = householdName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20)
  
  const account = `household_${sanitizedName}_${householdId.substring(0, 8)}@smartwarehouse.local`
  
  // 生成强密码
  // Generate strong password
  const password = `HW${householdId.substring(0, 8)}${Math.random().toString(36).substring(2, 10).toUpperCase()}`
  
  // 默认使用台湾国家代码
  // Default to Taiwan country code
  const countryCode = '886'
  
  return { account, password, countryCode }
}

/**
 * 获取或创建 Household 的 Tuya 账户
 * Get or create Tuya account for a Household
 */
export async function getOrCreateHouseholdTuyaAccount(householdId: string): Promise<{
  account: string
  password: string
  countryCode: string
  hasPassword: boolean
} | null> {
  try {
    const household = await prisma.household.findUnique({
      where: { id: householdId },
      select: {
        id: true,
        name: true,
        tuyaAccount: true,
        tuyaPassword: true,
        tuyaCountryCode: true,
      },
    })

    if (!household) {
      throw new Error('Household not found')
    }

    // 如果已经有账户，返回（密码已加密）
    // If account exists, return (password is encrypted)
    if (household.tuyaAccount) {
      return {
        account: household.tuyaAccount,
        password: household.tuyaPassword || '',
        countryCode: household.tuyaCountryCode || '886',
        hasPassword: !!household.tuyaPassword,
      }
    }

    // 生成新账户
    // Generate new account
    const { account, password, countryCode } = generateHouseholdTuyaAccount(
      household.name,
      household.id
    )

    // 加密密码
    // Encrypt password
    const hashedPassword = await bcrypt.hash(password, 10)

    // 保存到数据库
    // Save to database
    await prisma.household.update({
      where: { id: householdId },
      data: {
        tuyaAccount: account,
        tuyaPassword: hashedPassword,
        tuyaCountryCode: countryCode,
      },
    })

    return {
      account,
      password, // 返回明文密码（仅用于首次创建时的登录）
      countryCode,
      hasPassword: true,
    }
  } catch (error) {
    console.error('Error getting/creating Household Tuya account:', error)
    return null
  }
}

/**
 * 验证 Household 的 Tuya 密码
 * Verify Household Tuya password
 */
export async function verifyHouseholdTuyaPassword(
  householdId: string,
  password: string
): Promise<boolean> {
  try {
    const household = await prisma.household.findUnique({
      where: { id: householdId },
      select: { tuyaPassword: true },
    })

    if (!household || !household.tuyaPassword) {
      return false
    }

    return await bcrypt.compare(password, household.tuyaPassword)
  } catch (error) {
    console.error('Error verifying Household Tuya password:', error)
    return false
  }
}

/**
 * 获取 Household 的 Tuya 账户信息（用于登录）
 * Get Household Tuya account information (for login)
 */
export async function getHouseholdTuyaCredentials(householdId: string): Promise<{
  account: string
  password: string
  countryCode: string
} | null> {
  try {
    const household = await prisma.household.findUnique({
      where: { id: householdId },
      select: {
        tuyaAccount: true,
        tuyaPassword: true,
        tuyaCountryCode: true,
      },
    })

    if (!household || !household.tuyaAccount || !household.tuyaPassword) {
      return null
    }

    // 注意：这里返回的是加密后的密码，实际使用时需要从数据库获取明文密码
    // Note: This returns encrypted password, actual use needs plaintext from database
    // 对于首次创建，应该使用 getOrCreateHouseholdTuyaAccount 获取明文密码
    // For first-time creation, use getOrCreateHouseholdTuyaAccount to get plaintext password

    return {
      account: household.tuyaAccount,
      password: household.tuyaPassword, // 这是加密后的密码
      countryCode: household.tuyaCountryCode || '886',
    }
  } catch (error) {
    console.error('Error getting Household Tuya credentials:', error)
    return null
  }
}

