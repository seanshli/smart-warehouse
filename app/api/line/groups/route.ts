import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserLineGroups } from '@/lib/line'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/line/groups
 * 獲取當前用戶的 LINE 群組列表
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // 獲取用戶的 LINE 群組
    const groups = await getUserLineGroups(userId)

    return NextResponse.json({ 
      success: true,
      groups,
    })
  } catch (error: any) {
    console.error('Error fetching LINE groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch LINE groups', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/line/groups
 * 為 household 創建 LINE 群組關聯
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { householdId, lineGroupId, groupName } = body

    if (!householdId) {
      return NextResponse.json(
        { error: 'householdId is required' },
        { status: 400 }
      )
    }

    // 檢查用戶是否有權限管理此 household
    const membership = await prisma.householdMember.findFirst({
      where: {
        userId,
        householdId,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // 如果提供了 lineGroupId，直接關聯
    if (lineGroupId) {
      const { linkLineGroupToHousehold } = await import('@/lib/line')
      await linkLineGroupToHousehold(householdId, lineGroupId, groupName || 'Household Group')
      
      return NextResponse.json({ 
        success: true,
        message: 'LINE group linked successfully',
      })
    }

    // 否則，返回說明需要手動創建群組
    return NextResponse.json({
      success: true,
      message: 'Please create a LINE group manually and provide the group ID',
      instructions: [
        '1. 在 LINE 中創建一個新群組',
        '2. 邀請所有 household 成員加入',
        '3. 將群組 ID 提供給系統（需要通過 LINE API 獲取）',
      ],
    })
  } catch (error: any) {
    console.error('Error creating LINE group:', error)
    return NextResponse.json(
      { error: 'Failed to create LINE group', details: error.message },
      { status: 500 }
    )
  }
}

