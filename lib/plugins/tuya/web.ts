import { WebPlugin } from '@capacitor/core'

import type {
  TuyaProvisioningPlugin,
  TuyaProvisioningResult,
  TuyaQueryStatusOptions,
  TuyaStartProvisioningOptions,
  TuyaStopProvisioningOptions,
} from './index'

export class TuyaProvisioningWeb extends WebPlugin implements TuyaProvisioningPlugin {
  async initialize(): Promise<{ initialized: boolean }> {
    // Web fallback 不需要初始化
    return { initialized: true }
  }

  async startProvisioning(options: TuyaStartProvisioningOptions): Promise<TuyaProvisioningResult> {
    const response = await fetch('/api/provisioning', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        ...options,
        mode: options.mode,
      }),
    })

    return await response.json()
  }

  async getStatus(options: TuyaQueryStatusOptions): Promise<TuyaProvisioningResult> {
    const response = await fetch(`/api/provisioning?vendor=${options.vendor}&token=${options.token}`, {
      method: 'GET',
      credentials: 'include',
    })

    return await response.json()
  }

  async stopProvisioning(options: TuyaStopProvisioningOptions): Promise<{ success: boolean }> {
    await fetch(`/api/provisioning?vendor=${options.vendor}&token=${options.token}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    return { success: true }
  }
}


