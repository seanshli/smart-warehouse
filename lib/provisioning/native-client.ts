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
        console.log('✅ Tuya SDK already initialized and user logged in')
        return true
      }
    } catch (error) {
      console.warn('Failed to check Tuya login status:', error)
    }
  }

  if (!canUseNativeTuyaProvisioning()) {
    console.warn('⚠️ Native Tuya provisioning not available (not iOS/Android native platform)')
    return false
  }

  try {
    // Fetch SDK credentials from API endpoint
    const { Capacitor } = await import('@capacitor/core')
    const platform = Capacitor.getPlatform()
    const platformParam = platform === 'android' ? '?platform=android' : '?platform=ios'
    
    console.log(`🔍 Fetching Tuya SDK config for ${platform}...`)
    const response = await fetch(`/api/mqtt/tuya/sdk-config${platformParam}`, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(`❌ Failed to fetch Tuya SDK credentials (HTTP ${response.status}):`, errorData)
      return false
    }

    const config = await response.json()
    console.log('📦 Tuya SDK config received:', { 
      hasAppKey: !!config.appKey, 
      hasAppSecret: !!config.appSecret,
      hasSha256: !!config.sha256 
    })

    if (!config.appKey || !config.appSecret) {
      console.error('❌ Tuya SDK credentials incomplete:', {
        appKey: config.appKey ? '✅' : '❌',
        appSecret: config.appSecret ? '✅' : '❌',
      })
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

    console.log('🚀 Initializing Tuya SDK...')
    const result = await TuyaProvisioning.initialize(initOptions)

    if (result.initialized) {
      console.log('✅ Tuya SDK initialized successfully')
      tuyaInitialized = true
      
      // If user is already logged in, return true
      if (result.loggedIn) {
        console.log('✅ User already logged in to Tuya')
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
            console.log('📝 Auto-creating Tuya account...')
            const autoCreateResponse = await fetch('/api/user/tuya-account/auto-create', {
              method: 'POST',
              credentials: 'include',
            })
            
            if (autoCreateResponse.ok) {
              console.log('✅ Tuya account auto-created successfully')
              accountReady = true
              // Account credentials generated, SDK will handle actual registration on first login
            } else {
              console.warn('⚠️ Failed to auto-create Tuya account')
            }
          }
          
          // If account is ready, try to login
          if (accountReady) {
            try {
              const loginResponse = await fetch('/api/mqtt/tuya/login', {
                method: 'POST',
                credentials: 'include',
              })
              
              if (loginResponse.ok) {
                const loginData = await loginResponse.json()
                if (loginData.account && loginData.password) {
                  console.log('🔐 Attempting Tuya login...')
                  const loginResult = await TuyaProvisioning.login({
                    account: loginData.account,
                    password: loginData.password,
                    countryCode: loginData.countryCode || '886',
                  })
                  
                  if (loginResult.success) {
                    console.log('✅ Tuya login successful')
                    return true
                  } else {
                    console.warn('⚠️ Tuya login failed:', loginResult.error)
                  }
                }
              }
            } catch (loginError) {
              console.warn('⚠️ Failed to login to Tuya:', loginError)
            }
          }
          
          // SDK initialized, account ready (login may happen during provisioning)
          return true
        }
      } catch (error) {
        console.warn('⚠️ Failed to auto-create/login Tuya account:', error)
      }
      
      console.log('✅ Tuya SDK initialized (login may be required during provisioning)')
      return true // SDK initialized, but login may be required
    }

    console.error('❌ Tuya SDK initialization failed:', result)
    return false
  } catch (error) {
    console.error('❌ Failed to initialize Tuya SDK:', error)
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
    
    // Get platform-specific error message
    const { Capacitor } = await import('@capacitor/core')
    const platform = Capacitor.getPlatform()
    const platformUpper = platform.toUpperCase()
    
    return {
      success: false,
      status: 'failed',
      error: `Tuya SDK not initialized. Please check environment variables in Vercel: TUYA_${platformUpper}_SDK_APP_KEY and TUYA_${platformUpper}_SDK_APP_SECRET. Also verify that the API endpoint /api/mqtt/tuya/sdk-config is accessible.`,
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


