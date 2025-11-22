import { Capacitor } from '@capacitor/core'

import {
  TuyaProvisioning,
  type TuyaProvisioningResult,
  type TuyaQueryStatusOptions,
  type TuyaStartProvisioningOptions,
  type TuyaStopProvisioningOptions,
} from '@/lib/plugins/tuya'

let tuyaInitialized = false

/**
 * 獲取當前 Household 對應的 Tuya Home ID
 */
async function getHouseholdTuyaHomeId(householdId: string | null): Promise<string | null> {
  if (!householdId) {
    return null
  }

  try {
    const response = await fetch(`/api/mqtt/tuya/home?householdId=${householdId}`, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.tuyaHomeId || null
  } catch (error) {
    console.error('Error fetching Tuya Home ID:', error)
    return null
  }
}

/**
 * 更新 Household 的 Tuya Home ID 對應關係
 */
async function updateHouseholdTuyaHomeMapping(householdId: string, tuyaHomeId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/mqtt/tuya/home', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        householdId,
        tuyaHomeId,
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Error updating Tuya Home mapping:', error)
    return false
  }
}

export const canUseNativeTuyaProvisioning = (): boolean => {
  try {
    if (typeof window === 'undefined') {
      return false // Server-side rendering
    }
    
    // Check if Capacitor is available
    if (!Capacitor) {
      return false
    }
    
    // Check platform
    const platform = Capacitor.getPlatform()
    const isIOS = platform === 'ios'
    const isAndroid = platform === 'android'
    
    // Also check isNativePlatform for additional verification
    const isNativePlatform = Capacitor?.isNativePlatform?.() ?? false
    
    // Return true for iOS and Android native platforms
    // Note: Android implementation is in progress, but framework is ready
    return (isIOS || isAndroid) && isNativePlatform
  } catch (error) {
    console.warn('Error checking native platform:', error)
    return false
  }
}

export const ensureTuyaInitialized = async (): Promise<boolean> => {
  if (tuyaInitialized) {
    return true
  }

  if (!canUseNativeTuyaProvisioning()) {
    return false
  }

  try {
    // Fetch SDK credentials from API endpoint
    // These are safe to expose as they're meant for app embedding
    const { Capacitor } = await import('@capacitor/core')
    const platform = Capacitor.getPlatform()
    const platformParam = platform === 'android' ? '?platform=android' : '?platform=ios'
    
    const response = await fetch(`/api/mqtt/tuya/sdk-config${platformParam}`, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      console.warn('Failed to fetch Tuya SDK credentials. Provisioning may not work.')
      return false
    }

    const config = await response.json()

    if (!config.appKey || !config.appSecret) {
      console.warn('Tuya SDK credentials not found. Provisioning may not work.')
      return false
    }

    const initOptions: any = {
      appKey: config.appKey,
      appSecret: config.appSecret,
    }

    // Android may have SHA256 signature
    if (config.sha256) {
      initOptions.sha256 = config.sha256
    }

    const result = await TuyaProvisioning.initialize(initOptions)

    if (result.initialized) {
      tuyaInitialized = true
      return true
    }

    return false
  } catch (error) {
    console.error('Failed to initialize Tuya SDK:', error)
    return false
  }
}

export const startNativeTuyaProvisioning = async (
  options: TuyaStartProvisioningOptions,
): Promise<TuyaProvisioningResult> => {
  // Check if native provisioning is available
  if (!canUseNativeTuyaProvisioning()) {
    const { Capacitor } = await import('@capacitor/core')
    const platform = Capacitor.getPlatform()
    
    return {
      success: false,
      status: 'failed',
      error: platform === 'android' 
        ? 'Android Tuya provisioning is in progress. SDK integration required.'
        : 'Native provisioning is only available on iOS and Android native platforms.',
    }
  }

  // Ensure SDK is initialized before starting provisioning
  const initialized = await ensureTuyaInitialized()
  if (!initialized) {
    return {
      success: false,
      status: 'failed',
      error: 'Tuya SDK not initialized. Please check environment variables.',
    }
  }

  try {
    return await TuyaProvisioning.startProvisioning(options)
  } catch (error) {
    console.error('Native Tuya provisioning error:', error)
    return {
      success: false,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Native provisioning failed',
    }
  }
}

export const getNativeTuyaProvisioningStatus = async (
  options: TuyaQueryStatusOptions,
): Promise<TuyaProvisioningResult> => {
  return await TuyaProvisioning.getStatus(options)
}

export const stopNativeTuyaProvisioning = async (
  options: TuyaStopProvisioningOptions,
): Promise<{ success: boolean }> => {
  return await TuyaProvisioning.stopProvisioning(options)
}


