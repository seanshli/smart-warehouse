// Add User to Tuya Home API
// 将用户添加到 Household 的 Tuya Home
// Add user to Household's Tuya Home

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOrCreateHouseholdTuyaAccount } from '@/lib/tuya-household-manager'

export const dynamic = 'force-dynamic'

// POST: 将用户添加到 Tuya Home
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
    const body = await request.json()
    const { targetUserId } = body

    // 验证用户是该 Household 的成员
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: userId,
          householdId: householdId,
        },
      },
      include: {
        household: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Household not found or access denied' }, { status: 403 })
    }

    // 验证目标用户是该 Household 的成员
    const targetMembership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: targetUserId || userId,
          householdId: householdId,
        },
      },
      include: {
        user: true,
      },
    })

    if (!targetMembership) {
      return NextResponse.json({ error: 'Target user is not a member of this household' }, { status: 403 })
    }

    // 确保 Household 有 Tuya Home
    if (!membership.household.tuyaHomeId) {
      return NextResponse.json({
        error: 'Household does not have a Tuya Home yet. Please create one first.',
        needsHomeCreation: true,
      }, { status: 400 })
    }

    // 获取目标用户的 Tuya 账户信息
    const targetUser = targetMembership.user
    if (!targetUser.tuyaAccount) {
      return NextResponse.json({
        error: 'Target user does not have a Tuya account. Please create one first.',
        needsTuyaAccount: true,
      }, { status: 400 })
    }

    // 返回信息，实际添加操作需要在客户端（iOS/Android）使用 Tuya SDK 进行
    // Return information, actual addition needs to be done on client (iOS/Android) using Tuya SDK
    return NextResponse.json({
      success: true,
      message: 'User should be added to Tuya Home via native SDK',
      householdId: householdId,
      tuyaHomeId: membership.household.tuyaHomeId,
      targetUserId: targetUser.id,
      targetUserTuyaAccount: targetUser.tuyaAccount,
      // 注意：实际添加需要在客户端调用 Tuya SDK 的 addMemberToHome 方法
      // Note: Actual addition needs to call Tuya SDK's addMemberToHome method on client
    })
  } catch (error: any) {
    console.error('Error adding user to Tuya Home:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add user to Tuya Home' },
      { status: 500 }
    )
  }
}

