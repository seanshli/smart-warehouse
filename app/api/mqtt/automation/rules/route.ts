// 跨生态链控制 - 自动化规则 API
// Cross-ecosystem Control - Automation Rules API

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { initializeRuleEngine, reloadRules } from '@/lib/automation-rule-engine'

export const dynamic = 'force-dynamic'

// GET: 获取所有自动化规则
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId')

    // 获取用户的家庭
    let household
    if (householdId) {
      household = await prisma.household.findFirst({
        where: {
          id: householdId,
          members: {
            some: {
              userId: userId
            }
          }
        }
      })
    } else {
      household = await prisma.household.findFirst({
        where: {
          members: {
            some: {
              userId: userId
            }
          }
        }
      })
    }

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    // 获取规则列表
    const rules = await prisma.automationRule.findMany({
      where: {
        householdId: household.id
      },
      include: {
        household: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ rules })
  } catch (error) {
    console.error('Error fetching automation rules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch automation rules' },
      { status: 500 }
    )
  }
}

// POST: 创建新的自动化规则
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const {
      name,
      description,
      householdId,
      enabled = true,
      sourceType,
      sourceDeviceId,
      sourceProperty,
      condition,
      actions,
      debounceMs = 1000,
      throttleMs
    } = body

    // 验证必填字段
    if (!name || !householdId || !sourceType || !condition || !actions) {
      return NextResponse.json(
        { error: 'Missing required fields: name, householdId, sourceType, condition, actions' },
        { status: 400 }
      )
    }

    // 验证用户有权限访问此家庭
    const household = await prisma.household.findFirst({
      where: {
        id: householdId,
        members: {
          some: {
            userId: userId
          }
        }
      }
    })

    if (!household) {
      return NextResponse.json({ error: 'Household not found or access denied' }, { status: 403 })
    }

    // 验证源设备（如果是设备触发）
    if (sourceType === 'device' && sourceDeviceId) {
      const sourceDevice = await prisma.ioTDevice.findFirst({
        where: {
          id: sourceDeviceId,
          householdId: householdId
        }
      })

      if (!sourceDevice) {
        return NextResponse.json({ error: 'Source device not found' }, { status: 404 })
      }
    }

    // 验证目标设备（在 actions 中）
    if (Array.isArray(actions)) {
      for (const action of actions) {
        if (action.deviceId) {
          const targetDevice = await prisma.ioTDevice.findFirst({
            where: {
              id: action.deviceId,
              householdId: householdId
            }
          })

          if (!targetDevice) {
            return NextResponse.json(
              { error: `Target device not found: ${action.deviceId}` },
              { status: 404 }
            )
          }
        }
      }
    }

    // 创建规则
    const rule = await prisma.automationRule.create({
      data: {
        name,
        description,
        householdId,
        enabled,
        sourceType,
        sourceDeviceId: sourceDeviceId || null,
        sourceProperty: sourceProperty || null,
        condition: condition as any,
        actions: actions as any,
        debounceMs: debounceMs || null,
        throttleMs: throttleMs || null,
      },
      include: {
        household: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // 如果规则已启用，重新加载规则引擎
    if (enabled && sourceType === 'device') {
      try {
        await reloadRules(householdId)
      } catch (error) {
        console.error('Failed to reload rules engine:', error)
        // 不阻止规则创建
      }
    }

    return NextResponse.json({ rule })
  } catch (error: any) {
    console.error('Error creating automation rule:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Rule with this name already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create automation rule' },
      { status: 500 }
    )
  }
}

