// Web fallback for Midea Provisioning Plugin

import { 
  MideaProvisioningPlugin, 
  MideaInitializeOptions, 
  MideaStartProvisioningOptions,
  MideaProvisioningResult,
  MideaStatusResult
} from './index'

export class MideaProvisioning implements MideaProvisioningPlugin {
  async initialize(options: MideaInitializeOptions) {
    // Web fallback: use API endpoint
    const response = await fetch('/api/mqtt/midea/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    })

    if (!response.ok) {
      throw new Error('Failed to initialize Midea SDK')
    }

    return await response.json()
  }

  async startProvisioning(options: MideaStartProvisioningOptions): Promise<MideaProvisioningResult> {
    // Web fallback: use API endpoint
    const response = await fetch('/api/mqtt/provisioning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendor: 'midea',
        mode: options.mode,
        ssid: options.ssid,
        password: options.password,
        deviceSsid: options.deviceSsid,
        routerSecurityParams: options.routerSecurityParams,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        status: 'failed',
        error: error.message || 'Failed to start provisioning',
      }
    }

    return await response.json()
  }

  async getStatus(options: { token?: string }): Promise<MideaStatusResult> {
    const response = await fetch(`/api/mqtt/provisioning?token=${options.token || ''}`, {
      method: 'GET',
    })

    if (!response.ok) {
      return {
        success: false,
        status: 'failed',
      }
    }

    return await response.json()
  }

  async stopProvisioning() {
    const response = await fetch('/api/mqtt/provisioning', {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to stop provisioning')
    }

    return await response.json()
  }

  async resumeProvisioning() {
    // Web fallback: not supported
    return {
      success: false,
      message: 'Resume provisioning not supported on web platform',
    }
  }
}

