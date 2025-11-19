import { NextResponse } from 'next/server'
import wifi from 'node-wifi'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

let wifiInitialized = false

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
    if (!wifiInitialized) {
      wifi.init({ iface: null })
      wifiInitialized = true
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
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to scan WiFi networks',
      },
      { status: 500 }
    )
  }
}

