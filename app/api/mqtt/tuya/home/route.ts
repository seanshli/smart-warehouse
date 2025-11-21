// Tuya Home Management API
// 管理 Tuya Home 與 Household 的對應關係
// Manage Tuya Home mapping to Household

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createTuyaHome, getTuyaHome } from '@/lib/tuya-home-manager'

export const dynamic = 'force-dynamic'

// GET: 獲取 Household 對應的 Tuya Home ID
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId')

    if (!householdId) {
      return NextResponse.json({ error: 'householdId is required' }, { status: 400 })
    }

    // 驗證用戶是該 Household 的成員
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

    const household = membership.household

    // 如果已經有 Tuya Home ID，直接返回
    if (household.tuyaHomeId) {
      return NextResponse.json({
        success: true,
        householdId: household.id,
        tuyaHomeId: household.tuyaHomeId,
        householdName: household.name,
      })
    }

    // 如果沒有，嘗試創建（這需要通過 Tuya Cloud API）
    // 注意：實際創建需要在客戶端（iOS/Android）進行，因為需要 SDK
    return NextResponse.json({
      success: true,
      householdId: household.id,
      tuyaHomeId: null,
      householdName: household.name,
      needsCreation: true,
      message: 'Tuya Home not yet created. It will be created automatically during provisioning.',
    })
  } catch (error: any) {
    console.error('Error getting Tuya Home:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get Tuya Home' },
      { status: 500 }
    )
  }
}

// POST: 創建或更新 Tuya Home 對應關係
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { householdId, tuyaHomeId } = body

    if (!householdId || !tuyaHomeId) {
      return NextResponse.json(
        { error: 'householdId and tuyaHomeId are required' },
        { status: 400 }
      )
    }

    // 驗證用戶是該 Household 的成員
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

    // 更新 Household 的 Tuya Home ID
    const updated = await prisma.household.update({
      where: { id: householdId },
      data: { tuyaHomeId: tuyaHomeId },
    })

    return NextResponse.json({
      success: true,
      householdId: updated.id,
      tuyaHomeId: updated.tuyaHomeId,
      householdName: updated.name,
    })
  } catch (error: any) {
    console.error('Error updating Tuya Home mapping:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update Tuya Home mapping' },
      { status: 500 }
    )
  }
}

