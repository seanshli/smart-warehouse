import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/household/[id]/homeassistant
 * 獲取 household 的 Home Assistant 配置
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { id: householdId } = await params

    // 驗證用戶是該 household 的成員
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId,
          householdId,
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // 查找 household 的 HA 配置
    try {
      const haConfig = await prisma.homeAssistantConfig.findUnique({
        where: { householdId },
      })

      return NextResponse.json({
        success: true,
        config: haConfig || null,
      })
    } catch (prismaError: any) {
      // 如果表不存在或其他 Prisma 錯誤，返回 null 配置（使用全局配置）
      if (prismaError.code === 'P2021' || prismaError.code === 'P2022') {
        console.warn('HomeAssistantConfig table may not exist, using global config')
        return NextResponse.json({
          success: true,
          config: null,
        })
      }
      throw prismaError
    }
  } catch (error: any) {
    console.error('Error fetching Home Assistant config:', error)
    // 返回成功但 config 為 null，讓前端使用全局配置
    return NextResponse.json({
      success: true,
      config: null,
    })
  }
}

/**
 * POST /api/household/[id]/homeassistant
 * 鏈接 Home Assistant 服務器到 household
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { id: householdId } = await params
    const body = await request.json()
    const { baseUrl, username, accessToken } = body

    if (!baseUrl || !accessToken) {
      return NextResponse.json(
        { error: 'baseUrl and accessToken are required' },
        { status: 400 }
      )
    }

    // Extract server IP from baseUrl for MQTT integration
    let serverIp: string | null = null
    try {
      const url = new URL(baseUrl)
      serverIp = url.hostname
      // If hostname is a domain, try to resolve it (optional)
      // For now, we'll use hostname as-is
    } catch (error) {
      // If baseUrl is just an IP address
      if (/^\d+\.\d+\.\d+\.\d+/.test(baseUrl)) {
        serverIp = baseUrl.replace(/^https?:\/\//, '').split(':')[0]
      }
    }

    // 驗證用戶是該 household 的成員且有管理權限
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId,
          householdId,
        },
      },
    })

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role || '')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only OWNER or ADMIN can configure Home Assistant.' },
        { status: 403 }
      )
    }

    // 驗證 HA 連接（可選，但建議）
    // 注意：如果連接測試失敗，我們仍然允許保存配置（用戶可能稍後修復）
    try {
      // 確保 baseUrl 格式正確（移除尾部斜杠）
      const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, '')
      const configUrl = `${normalizedBaseUrl}/api/config`
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超時
      
      try {
        const testResponse = await fetch(configUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken.trim()}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!testResponse.ok) {
          const errorText = await testResponse.text().catch(() => '')
          console.warn('HA connection test failed during save, but continuing:', {
            status: testResponse.status,
            statusText: testResponse.statusText,
            error: errorText,
          })
          // 不阻止保存，只記錄警告（用戶已經在 UI 中測試過連接）
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          console.warn('HA connection test timeout during save, but continuing')
        } else {
          console.warn('HA connection test error during save, but continuing:', fetchError.message)
        }
        // 不阻止保存，只記錄警告
      }
    } catch (error: any) {
      console.warn('HA connection test setup error, but continuing:', error.message)
      // 不阻止保存
    }

    // 創建或更新 HA 配置
    const haConfig = await prisma.homeAssistantConfig.upsert({
      where: { householdId },
      update: {
        baseUrl: baseUrl.trim(),
        username: username?.trim() || null,
        accessToken: accessToken.trim(), // 注意：實際應該加密存儲
        serverIp: serverIp || null,
        updatedAt: new Date(),
      },
      create: {
        householdId,
        baseUrl: baseUrl.trim(),
        username: username?.trim() || null,
        accessToken: accessToken.trim(), // 注意：實際應該加密存儲
        serverIp: serverIp || null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Home Assistant linked successfully',
      config: {
        id: haConfig.id,
        householdId: haConfig.householdId,
        baseUrl: haConfig.baseUrl,
        username: haConfig.username,
        serverIp: haConfig.serverIp,
        // 不返回 accessToken 以確保安全
      },
    })
  } catch (error: any) {
    console.error('Error linking Home Assistant:', error)
    return NextResponse.json(
      { error: 'Failed to link Home Assistant', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/household/[id]/homeassistant
 * 取消鏈接 Home Assistant
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { id: householdId } = await params

    // 驗證用戶權限
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId,
          householdId,
        },
      },
    })

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role || '')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // 刪除 HA 配置
    await prisma.homeAssistantConfig.delete({
      where: { householdId },
    }).catch(() => {
      // 如果不存在，忽略錯誤
    })

    return NextResponse.json({
      success: true,
      message: 'Home Assistant unlinked successfully',
    })
  } catch (error: any) {
    console.error('Error unlinking Home Assistant:', error)
    return NextResponse.json(
      { error: 'Failed to unlink Home Assistant', details: error.message },
      { status: 500 }
    )
  }
}

