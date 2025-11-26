// Midea Native Provisioning Client
// Abstracts native plugin calls and provides web fallbacks

import { Capacitor } from '@capacitor/core'
import { MideaProvisioning } from '../plugins/midea/web'
import type {
  MideaInitializeOptions,
  MideaStartProvisioningOptions,
  MideaProvisioningResult,
} from '../plugins/midea'

/**
 * Check if native Midea provisioning is available
 */
export function canUseNativeMideaProvisioning(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() !== 'web'
}

/**
 * Ensure Midea SDK is initialized
 */
export async function ensureMideaInitialized(): Promise<boolean> {
  if (!canUseNativeMideaProvisioning()) {
    console.warn('Native Midea provisioning not available, using web fallback')
    return false
  }

  try {
    // Get credentials from API
    const response = await fetch('/api/mqtt/midea/sdk-config')
    if (!response.ok) {
      throw new Error('Failed to fetch Midea SDK credentials')
    }

    const config = await response.json()
    
    // Initialize SDK
    const { Plugins } = await import('@capacitor/core')
    const mideaPlugin = Plugins.MideaProvisioning as any

    if (!mideaPlugin) {
      throw new Error('MideaProvisioning plugin not found')
    }

    const initOptions: MideaInitializeOptions = {
      clientId: config.clientId || process.env.MIDEA_CLIENT_ID || '',
      clientSecret: config.clientSecret || process.env.MIDEA_CLIENT_SECRET || '',
      serverHost: config.serverHost || process.env.MIDEA_SERVER_HOST || 'https://obm.midea.com',
      clientSrc: config.clientSrc || process.env.MIDEA_CLIENT_SRC || '',
      accessToken: config.accessToken || '', // Should be obtained from user login
    }

    if (!initOptions.clientId || !initOptions.clientSecret || !initOptions.accessToken) {
      throw new Error('Midea SDK credentials not configured. Please check environment variables: MIDEA_CLIENT_ID, MIDEA_CLIENT_SECRET, MIDEA_SERVER_HOST')
    }

    const result = await mideaPlugin.initialize(initOptions)
    
    if (!result.initialized) {
      throw new Error('Failed to initialize Midea SDK')
    }

    return true
  } catch (error: any) {
    console.error('Failed to initialize Midea SDK:', error)
    throw new Error(`Midea SDK initialization failed: ${error.message}. Please check environment variables in Vercel: MIDEA_CLIENT_ID, MIDEA_CLIENT_SECRET, MIDEA_SERVER_HOST`)
  }
}

/**
 * Start Midea provisioning using native SDK
 */
export async function startNativeMideaProvisioning(
  options: MideaStartProvisioningOptions
): Promise<MideaProvisioningResult> {
  if (!canUseNativeMideaProvisioning()) {
    // Fallback to web API
    return MideaProvisioning.startProvisioning(options)
  }

  try {
    // Ensure SDK is initialized
    await ensureMideaInitialized()

    const { Plugins } = await import('@capacitor/core')
    const mideaPlugin = Plugins.MideaProvisioning as any

    if (!mideaPlugin) {
      throw new Error('MideaProvisioning plugin not found')
    }

    return await mideaPlugin.startProvisioning(options)
  } catch (error: any) {
    console.error('Native Midea provisioning failed:', error)
    
    // Fallback to web API
    console.log('Falling back to web API')
    return MideaProvisioning.startProvisioning(options)
  }
}

/**
 * Get provisioning status
 */
export async function getMideaProvisioningStatus(token?: string): Promise<any> {
  if (!canUseNativeMideaProvisioning()) {
    return MideaProvisioning.getStatus({ token })
  }

  try {
    const { Plugins } = await import('@capacitor/core')
    const mideaPlugin = Plugins.MideaProvisioning as any

    if (!mideaPlugin) {
      return MideaProvisioning.getStatus({ token })
    }

    return await mideaPlugin.getStatus({ token })
  } catch (error) {
    console.error('Failed to get Midea provisioning status:', error)
    return MideaProvisioning.getStatus({ token })
  }
}

/**
 * Stop provisioning
 */
export async function stopMideaProvisioning(): Promise<void> {
  if (!canUseNativeMideaProvisioning()) {
    await MideaProvisioning.stopProvisioning()
    return
  }

  try {
    const { Plugins } = await import('@capacitor/core')
    const mideaPlugin = Plugins.MideaProvisioning as any

    if (mideaPlugin) {
      await mideaPlugin.stopProvisioning()
    } else {
      await MideaProvisioning.stopProvisioning()
    }
  } catch (error) {
    console.error('Failed to stop Midea provisioning:', error)
    await MideaProvisioning.stopProvisioning()
  }
}

