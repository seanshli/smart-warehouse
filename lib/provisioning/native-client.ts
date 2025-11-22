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

/**
 * 确保 Tuya SDK 已初始化并用户已登录
 */
export const ensureTuyaInitialized = async (): Promise<boolean> => {
  if (tuyaInitialized) {
    // Check if user is logged in
    try {
      const loginStatus = await TuyaProvisioning.isLoggedIn()
      if (loginStatus.loggedIn) {
        return true
      }
    } catch (error) {
      console.warn('Failed to check Tuya login status:', error)
    }
  }

  if (!canUseNativeTuyaProvisioning()) {
    return false
  }

  try {
    // Fetch SDK credentials from API endpoint
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
      
      // If user is already logged in, return true
      if (result.loggedIn) {
        return true
      }
      
      // Try to auto-create Tuya account if not exists, then login
      try {
        // First, check if user has Tuya account
        const userAccountResponse = await fetch('/api/user/tuya-account', {
          method: 'GET',
          credentials: 'include',
        })
        
        if (userAccountResponse.ok) {
          const userAccount = await userAccountResponse.json()
          
          let accountReady = userAccount.hasTuyaAccount
          
          // If no Tuya account, auto-create one
          if (!userAccount.hasTuyaAccount) {
            const autoCreateResponse = await fetch('/api/user/tuya-account/auto-create', {
              method: 'POST',
              credentials: 'include',
            })
            
            if (autoCreateResponse.ok) {
              console.log('✅ Tuya account auto-created successfully')
              accountReady = true
              // Account credentials generated, SDK will handle actual registration on first login
            }
          }
          
          // If account is ready, SDK will handle login/registration
          if (accountReady) {
            // Note: Actual Tuya account registration needs to be done via SDK
            // The auto-create just generates credentials and saves them
            // SDK's loginOrRegister() will handle the actual account creation on first login
            return true // SDK initialized, account ready
          }
        }
      } catch (error) {
        console.warn('Failed to auto-create/login Tuya account:', error)
      }
      
      return true // SDK initialized, but login may be required
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
    // Try to get more details about why initialization failed
    try {
      const { Capacitor } = await import('@capacitor/core')
      const platform = Capacitor.getPlatform()
      const platformParam = platform === 'android' ? '?platform=android' : '?platform=ios'
      
      const response = await fetch(`/api/mqtt/tuya/sdk-config${platformParam}`, {
        method: 'GET',
        credentials: 'include',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          status: 'failed',
          error: errorData.message || `Failed to fetch Tuya SDK config (HTTP ${response.status}). Please check environment variables: TUYA_${platform.toUpperCase()}_SDK_APP_KEY and TUYA_${platform.toUpperCase()}_SDK_APP_SECRET`,
        }
      }
      
      const config = await response.json()
      if (!config.appKey || !config.appSecret) {
        return {
          success: false,
          status: 'failed',
          error: `Tuya SDK credentials incomplete. Please set TUYA_${platform.toUpperCase()}_SDK_APP_KEY and TUYA_${platform.toUpperCase()}_SDK_APP_SECRET environment variables in Vercel.`,
        }
      }
    } catch (fetchError) {
      console.error('Error checking SDK config:', fetchError)
    }
    
    return {
      success: false,
      status: 'failed',
      error: 'Tuya SDK not initialized. Please check environment variables in Vercel: TUYA_IOS_SDK_APP_KEY and TUYA_IOS_SDK_APP_SECRET',
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


