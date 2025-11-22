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
    
    // Check if we're on iOS (Android plugin not yet implemented)
    const platform = Capacitor.getPlatform()
    const isIOS = platform === 'ios'
    
    // Also check isNativePlatform for additional verification
    const isNativePlatform = Capacitor?.isNativePlatform?.() ?? false
    
    // Only return true for iOS (Android plugin is not yet implemented)
    return isIOS && isNativePlatform
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
    const response = await fetch('/api/mqtt/tuya/sdk-config', {
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

    const result = await TuyaProvisioning.initialize({
      appKey: config.appKey,
      appSecret: config.appSecret,
    })

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
  // Ensure we're on iOS (Android plugin not yet implemented)
  if (!canUseNativeTuyaProvisioning()) {
    return {
      success: false,
      status: 'failed',
      error: 'Native provisioning is only available on iOS devices. Android support is coming soon.',
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


