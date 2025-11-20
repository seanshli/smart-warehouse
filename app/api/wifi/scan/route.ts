import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

let wifiModule: any = null
let wifiInitialized = false

// 動態載入 node-wifi（避免在 Vercel 等無網卡環境中直接失敗）
async function getWifiModule() {
  if (wifiModule) return wifiModule
  
  try {
    // 只在有網卡環境中載入
    wifiModule = await import('node-wifi')
    return wifiModule.default || wifiModule
  } catch (error) {
    console.error('Failed to load node-wifi:', error)
    return null
  }
}

function mapSecurity(security: string | string[] | undefined) {
  if (!security) return 'none'
  const securityStr = Array.isArray(security) ? security.join(',').toLowerCase() : security.toLowerCase()
  if (securityStr.includes('wpa3')) return 'wpa3'
  if (securityStr.includes('wpa2')) return 'wpa2'
  if (securityStr.includes('wpa')) return 'wpa'
  if (securityStr.includes('wep')) return 'wep'
  return 'none'
}

export async function GET() {
  try {
    // 檢查是否在支援的環境中（非 Vercel）
    const isVercel = process.env.VERCEL === '1'
    if (isVercel) {
      return NextResponse.json(
        {
          success: false,
          error: 'WiFi scanning is not available on Vercel. Please use local environment or mobile app.',
          requiresLocalEnvironment: true,
        },
        { status: 503 }
      )
    }

    const wifi = await getWifiModule()
    if (!wifi) {
      return NextResponse.json(
        {
          success: false,
          error: 'WiFi module not available. Please ensure node-wifi is installed and you have network card access.',
          requiresLocalEnvironment: true,
        },
        { status: 503 }
      )
    }

    if (!wifiInitialized) {
      try {
        // macOS 需要指定介面，嘗試自動偵測
        const platform = process.platform
        if (platform === 'darwin') {
          // macOS: 嘗試使用 en0 或自動偵測
          wifi.init({ iface: null })
        } else {
          wifi.init({ iface: null })
        }
        wifiInitialized = true
      } catch (initError: any) {
        console.error('WiFi init failed:', initError)
        return NextResponse.json(
          {
            success: false,
            error: `Failed to initialize WiFi: ${initError?.message || 'Unknown error'}. On macOS, you may need to grant network permissions.`,
            requiresLocalEnvironment: true,
          },
          { status: 500 }
        )
      }
    }

    const networks = await wifi.scan()

    const result = (networks || [])
      .filter((network: any) => network?.ssid)
      .map((network: any) => ({
        ssid: network.ssid as string,
        bssid: network.bssid,
        signalStrength:
          typeof network.signal_level === 'number'
            ? network.signal_level
            : network.signal_level_dBm ?? undefined,
        frequency: network.frequency,
        security: mapSecurity(network.security),
        channel: network.channel,
      }))

    return NextResponse.json({ success: true, networks: result })
  } catch (error: any) {
    console.error('WiFi scan failed:', error)
    const errorMessage = error?.message || 'Failed to scan WiFi networks'
    
    // 提供更詳細的錯誤訊息
    let userMessage = errorMessage
    if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
      userMessage = 'WiFi scanning requires network permissions. On macOS, please grant network access in System Settings > Privacy & Security.'
    } else if (errorMessage.includes('interface') || errorMessage.includes('iface')) {
      userMessage = 'No WiFi interface found. Please ensure your device has WiFi enabled.'
    }
    
    return NextResponse.json(
      {
        success: false,
        error: userMessage,
        requiresLocalEnvironment: true,
      },
      { status: 500 }
    )
  }
}

