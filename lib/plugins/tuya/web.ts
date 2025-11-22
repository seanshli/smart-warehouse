import { WebPlugin } from '@capacitor/core'

import type {
  TuyaProvisioningPlugin,
  TuyaProvisioningResult,
  TuyaQueryStatusOptions,
  TuyaStartProvisioningOptions,
  TuyaStopProvisioningOptions,
  TuyaLoginOptions,
  TuyaLoginResult,
  TuyaAddMemberToHomeOptions,
} from './index'

export class TuyaProvisioningWeb extends WebPlugin implements TuyaProvisioningPlugin {
  async initialize(): Promise<{ initialized: boolean; loggedIn?: boolean }> {
    // Web fallback 不需要初始化
    return { initialized: true, loggedIn: false }
  }

  async login(options: TuyaLoginOptions): Promise<TuyaLoginResult> {
    // Web fallback: 通过 API 登录
    const response = await fetch('/api/mqtt/tuya/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(options),
    })

    return await response.json()
  }

  async logout(): Promise<{ success: boolean }> {
    const response = await fetch('/api/mqtt/tuya/logout', {
      method: 'POST',
      credentials: 'include',
    })

    return await response.json()
  }

  async isLoggedIn(): Promise<{ loggedIn: boolean }> {
    const response = await fetch('/api/mqtt/tuya/login-status', {
      method: 'GET',
      credentials: 'include',
    })

    return await response.json()
  }

  async startProvisioning(options: TuyaStartProvisioningOptions): Promise<TuyaProvisioningResult> {
    const response = await fetch('/api/mqtt/provisioning', {
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
    const response = await fetch(`/api/mqtt/provisioning?vendor=${options.vendor}&token=${options.token}`, {
      method: 'GET',
      credentials: 'include',
    })

    return await response.json()
  }

  async stopProvisioning(options: TuyaStopProvisioningOptions): Promise<{ success: boolean }> {
    await fetch(`/api/mqtt/provisioning?vendor=${options.vendor}&token=${options.token}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    return { success: true }
  }

  async addMemberToHome(options: TuyaAddMemberToHomeOptions): Promise<{ success: boolean; message?: string }> {
    // Web fallback: 通过 API 添加成员
    // Web fallback: Add member via API
    const response = await fetch(`/api/household/${options.homeId}/tuya-home/add-member`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        targetUserId: options.userTuyaAccount, // 这里需要传递实际的 userId，但 API 会查找对应的 Tuya 账户
        role: options.role, // 传递角色信息
        userTuyaCountryCode: options.userTuyaCountryCode,
      }),
    })

    return await response.json()
  }
}


