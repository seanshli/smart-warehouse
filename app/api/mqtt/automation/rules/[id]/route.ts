// 跨生态链控制 - 自动化规则详情 API
// Cross-ecosystem Control - Automation Rule Detail API

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { reloadRules } from '@/lib/automation-rule-engine'

export const dynamic = 'force-dynamic'

// GET: 获取单个规则
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const ruleId = params.id

    // 获取规则
    const rule = await prisma.automationRule.findUnique({
      where: { id: ruleId },
      include: {
        household: {
          include: {
            members: {
              where: {
                userId: userId
              }
            }
          }
        }
      }
    })

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    // 验证用户有权限访问
    if (rule.household.members.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ rule })
  } catch (error) {
    console.error('Error fetching automation rule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch automation rule' },
      { status: 500 }
    )
  }
}

// PUT: 更新规则
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const ruleId = params.id
    const body = await request.json()

    // 获取现有规则
    const existingRule = await prisma.automationRule.findUnique({
      where: { id: ruleId },
      include: {
        household: {
          include: {
            members: {
              where: {
                userId: userId
              }
            }
          }
        }
      }
    })

    if (!existingRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    if (existingRule.household.members.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // 更新规则
    const updatedRule = await prisma.automationRule.update({
      where: { id: ruleId },
      data: {
        name: body.name,
        description: body.description,
        enabled: body.enabled,
        sourceType: body.sourceType,
        sourceDeviceId: body.sourceDeviceId,
        sourceProperty: body.sourceProperty,
        condition: body.condition,
        actions: body.actions,
        debounceMs: body.debounceMs,
        throttleMs: body.throttleMs,
      }
    })

    // 如果规则已启用，重新加载规则引擎
    if (updatedRule.enabled && updatedRule.sourceType === 'device') {
      try {
        await reloadRules(existingRule.householdId)
      } catch (error) {
        console.error('Failed to reload rules engine:', error)
      }
    }

    return NextResponse.json({ rule: updatedRule })
  } catch (error) {
    console.error('Error updating automation rule:', error)
    return NextResponse.json(
      { error: 'Failed to update automation rule' },
      { status: 500 }
    )
  }
}

// DELETE: 删除规则
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const ruleId = params.id

    // 获取规则
    const rule = await prisma.automationRule.findUnique({
      where: { id: ruleId },
      include: {
        household: {
          include: {
            members: {
              where: {
                userId: userId
              }
            }
          }
        }
      }
    })

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    if (rule.household.members.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const householdId = rule.householdId

    // 删除规则
    await prisma.automationRule.delete({
      where: { id: ruleId }
    })

    // 重新加载规则引擎
    try {
      await reloadRules(householdId)
    } catch (error) {
      console.error('Failed to reload rules engine:', error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting automation rule:', error)
    return NextResponse.json(
      { error: 'Failed to delete automation rule' },
      { status: 500 }
    )
  }
}

