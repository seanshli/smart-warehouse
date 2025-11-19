// Tuya 配網 API 路由
// 處理 Tuya 設備的配網流程（EZ 模式和 AP 模式）
// Tuya Provisioning API Route - Handles device provisioning flow

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createTuyaProvisioning, type TuyaProvisioningMode } from '@/lib/tuya-provisioning'

export const dynamic = 'force-dynamic'

// POST: 啟動配網流程
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ssid, password, mode = 'auto' } = body

    // 驗證必填欄位
    if (!ssid || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: ssid, password' },
        { status: 400 }
      )
    }

    // 從環境變數獲取 Tuya API 配置
    const accessId = process.env.TUYA_ACCESS_ID
    const accessSecret = process.env.TUYA_ACCESS_SECRET
    const region = process.env.TUYA_REGION || 'cn'

    if (!accessId || !accessSecret) {
      return NextResponse.json(
        { error: 'Tuya API credentials not configured' },
        { status: 500 }
      )
    }

    // 創建配網實例
    const provisioning = createTuyaProvisioning({
      accessId,
      accessSecret,
      region,
      ssid,
      password,
      mode: mode as TuyaProvisioningMode,
    })

    // 獲取配網 Token
    const token = await provisioning.getProvisioningToken()

    // 啟動配網流程
    const result = await provisioning.startProvisioning(
      token,
      ssid,
      password,
      mode as TuyaProvisioningMode
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        token, // 返回 token 供後續查詢使用
        deviceId: result.deviceId,
        deviceName: result.deviceName,
        status: result.status,
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: result.error || 'Provisioning failed',
        status: result.status,
      },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('Tuya provisioning error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to start provisioning',
      },
      { status: 500 }
    )
  }
}

// GET: 查詢配網狀態
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Missing required parameter: token' },
        { status: 400 }
      )
    }

    // 從環境變數獲取 Tuya API 配置
    const accessId = process.env.TUYA_ACCESS_ID
    const accessSecret = process.env.TUYA_ACCESS_SECRET
    const region = process.env.TUYA_REGION || 'cn'

    if (!accessId || !accessSecret) {
      return NextResponse.json(
        { error: 'Tuya API credentials not configured' },
        { status: 500 }
      )
    }

    // 創建配網實例
    const provisioning = createTuyaProvisioning({
      accessId,
      accessSecret,
      region,
      ssid: '', // 查詢狀態時不需要
      password: '', // 查詢狀態時不需要
    })

    // 查詢配網狀態
    const result = await provisioning.queryProvisioningStatus(token)

    return NextResponse.json({
      success: result.success,
      deviceId: result.deviceId,
      deviceName: result.deviceName,
      status: result.status,
      error: result.error,
    })
  } catch (error: any) {
    console.error('Tuya provisioning status query error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to query provisioning status',
      },
      { status: 500 }
    )
  }
}

// DELETE: 停止配網流程
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Missing required parameter: token' },
        { status: 400 }
      )
    }

    // 從環境變數獲取 Tuya API 配置
    const accessId = process.env.TUYA_ACCESS_ID
    const accessSecret = process.env.TUYA_ACCESS_SECRET
    const region = process.env.TUYA_REGION || 'cn'

    if (!accessId || !accessSecret) {
      return NextResponse.json(
        { error: 'Tuya API credentials not configured' },
        { status: 500 }
      )
    }

    // 創建配網實例
    const provisioning = createTuyaProvisioning({
      accessId,
      accessSecret,
      region,
      ssid: '', // 停止配網時不需要
      password: '', // 停止配網時不需要
    })

    // 停止配網流程
    const success = await provisioning.stopProvisioning(token)

    return NextResponse.json({
      success,
      message: success ? 'Provisioning stopped' : 'Failed to stop provisioning',
    })
  } catch (error: any) {
    console.error('Tuya provisioning stop error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to stop provisioning',
      },
      { status: 500 }
    )
  }
}

