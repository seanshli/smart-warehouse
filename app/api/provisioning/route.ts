// 統一配網 API 路由
// 處理所有品牌 IoT 設備的配網流程
// Unified Provisioning API Route - Handles provisioning for all IoT device brands

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UnifiedProvisioningFactory } from '@/lib/provisioning'
import type { ProvisioningConfig } from '@/lib/provisioning'

export const dynamic = 'force-dynamic'

// POST: 啟動配網流程
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { vendor, ssid, password, mode, baseUrl, apiKey, accessToken } = body

    // 驗證必填欄位
    if (!vendor) {
      return NextResponse.json(
        { error: 'Missing required field: vendor' },
        { status: 400 }
      )
    }

    // 構建配網配置
    const config: ProvisioningConfig = {
      vendor: vendor as 'tuya' | 'midea' | 'philips' | 'panasonic',
      mode: mode || 'auto',
    }

    // 根據品牌添加特定配置
    if (vendor === 'tuya' || vendor === 'midea') {
      // MQTT 設備需要 Wi-Fi 配置
      if (!ssid || !password) {
        return NextResponse.json(
          { error: 'Wi-Fi SSID and password are required for MQTT devices' },
          { status: 400 }
        )
      }
      config.ssid = ssid
      config.password = password
    } else if (vendor === 'philips' || vendor === 'panasonic') {
      // RESTful 設備需要 API 配置
      if (baseUrl) config.baseUrl = baseUrl
      if (apiKey) config.apiKey = apiKey
      if (accessToken) config.accessToken = accessToken
    }

    // 啟動配網流程
    const result = await UnifiedProvisioningFactory.startProvisioning(config)

    if (result.success) {
      // 生成臨時 token 用於狀態查詢（使用設備 ID 或時間戳）
      const token = result.deviceId || `temp_${Date.now()}`

      return NextResponse.json({
        success: true,
        token,
        deviceId: result.deviceId,
        deviceName: result.deviceName,
        deviceInfo: result.deviceInfo,
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
    console.error('Provisioning error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to start provisioning',
      },
      { status: 500 }
    )
  }
}

// GET: 查詢配網狀態或發現設備
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const vendor = searchParams.get('vendor')
    const token = searchParams.get('token')
    const action = searchParams.get('action') // 'status' 或 'discover'

    if (!vendor) {
      return NextResponse.json(
        { error: 'Missing required parameter: vendor' },
        { status: 400 }
      )
    }

    // 發現設備
    if (action === 'discover') {
      const config: ProvisioningConfig = {
        vendor: vendor as 'tuya' | 'midea' | 'philips' | 'panasonic',
      }

      // 添加品牌特定配置
      if (vendor === 'philips' || vendor === 'panasonic') {
        const baseUrl = searchParams.get('baseUrl')
        const apiKey = searchParams.get('apiKey')
        const accessToken = searchParams.get('accessToken')
        
        if (baseUrl) config.baseUrl = baseUrl
        if (apiKey) config.apiKey = apiKey
        if (accessToken) config.accessToken = accessToken
      }

      const devices = await UnifiedProvisioningFactory.discoverDevices(config)

      return NextResponse.json({
        success: true,
        devices,
      })
    }

    // 查詢配網狀態
    if (!token) {
      return NextResponse.json(
        { error: 'Missing required parameter: token' },
        { status: 400 }
      )
    }

    const result = await UnifiedProvisioningFactory.queryStatus(
      vendor as 'tuya' | 'midea' | 'philips' | 'panasonic',
      token
    )

    return NextResponse.json({
      success: result.success,
      deviceId: result.deviceId,
      deviceName: result.deviceName,
      deviceInfo: result.deviceInfo,
      status: result.status,
      error: result.error,
    })
  } catch (error: any) {
    console.error('Provisioning status query error:', error)
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
    const vendor = searchParams.get('vendor')
    const token = searchParams.get('token')

    if (!vendor || !token) {
      return NextResponse.json(
        { error: 'Missing required parameters: vendor, token' },
        { status: 400 }
      )
    }

    const success = await UnifiedProvisioningFactory.stopProvisioning(
      vendor as 'tuya' | 'midea' | 'philips' | 'panasonic',
      token
    )

    return NextResponse.json({
      success,
      message: success ? 'Provisioning stopped' : 'Failed to stop provisioning',
    })
  } catch (error: any) {
    console.error('Provisioning stop error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to stop provisioning',
      },
      { status: 500 }
    )
  }
}

