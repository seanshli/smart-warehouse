// Household Tuya Account Management API
// 管理 Household 的 Tuya 账户
// Manage Tuya account for Household

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOrCreateHouseholdTuyaAccount, getHouseholdTuyaCredentials } from '@/lib/tuya-household-manager'

export const dynamic = 'force-dynamic'

// GET: 获取 Household 的 Tuya 账户信息
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const householdId = params.id

    // 验证用户是该 Household 的成员
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: userId,
          householdId: householdId,
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Household not found or access denied' }, { status: 403 })
    }

    // 获取或创建 Tuya 账户
    const accountInfo = await getOrCreateHouseholdTuyaAccount(householdId)

    if (!accountInfo) {
      return NextResponse.json({ error: 'Failed to get/create Tuya account' }, { status: 500 })
    }

    // 返回账户信息（不返回密码）
    return NextResponse.json({
      success: true,
      account: accountInfo.account,
      countryCode: accountInfo.countryCode,
      hasPassword: accountInfo.hasPassword,
      // 仅在首次创建时返回明文密码（用于登录）
      // Only return plaintext password on first creation (for login)
      password: accountInfo.hasPassword && accountInfo.password !== '' ? undefined : accountInfo.password,
    })
  } catch (error: any) {
    console.error('Error getting Household Tuya account:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get Tuya account' },
      { status: 500 }
    )
  }
}

// POST: 自动创建 Household 的 Tuya 账户
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const householdId = params.id

    // 验证用户是该 Household 的成员
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: userId,
          householdId: householdId,
        },
      },
      include: {
        household: true,
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Household not found or access denied' }, { status: 403 })
    }

    // 检查是否已有账户
    if (membership.household.tuyaAccount) {
      return NextResponse.json({
        success: true,
        account: membership.household.tuyaAccount,
        countryCode: membership.household.tuyaCountryCode || '886',
        message: 'Tuya account already exists',
      })
    }

    // 创建新账户
    const accountInfo = await getOrCreateHouseholdTuyaAccount(householdId)

    if (!accountInfo) {
      return NextResponse.json({ error: 'Failed to create Tuya account' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      account: accountInfo.account,
      password: accountInfo.password, // 返回明文密码（仅用于首次登录）
      countryCode: accountInfo.countryCode,
      message: 'Tuya account created successfully',
    })
  } catch (error: any) {
    console.error('Error creating Household Tuya account:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create Tuya account' },
      { status: 500 }
    )
  }
}

