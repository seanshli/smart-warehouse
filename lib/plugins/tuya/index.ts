import { registerPlugin } from '@capacitor/core'

import type { TuyaProvisioningWeb } from './web'

export type SupportedTuyaMode =
  | 'wifi'
  | 'ez'
  | 'hotspot'
  | 'ap'
  | 'wifi/bt'
  | 'zigbee'
  | 'bt'
  | 'manual'
  | 'auto'

export interface TuyaInitializeOptions {
  appKey?: string
  appSecret?: string
}

export interface TuyaStartProvisioningOptions {
  vendor: 'tuya'
  ssid?: string
  password?: string
  mode?: SupportedTuyaMode
  baseUrl?: string
  apiKey?: string
  accessToken?: string
  deviceId?: string
  zigbeeGatewayId?: string
  bluetoothMac?: string
}

export interface TuyaQueryStatusOptions {
  vendor: 'tuya'
  token: string
}

export interface TuyaStopProvisioningOptions {
  vendor: 'tuya'
  token: string
}

export interface TuyaProvisioningResult {
  success: boolean
  token?: string
  deviceId?: string
  deviceName?: string
  deviceInfo?: any
  status?: string
  error?: string
}

export interface TuyaProvisioningPlugin {
  initialize(options?: TuyaInitializeOptions): Promise<{ initialized: boolean }>
  startProvisioning(options: TuyaStartProvisioningOptions): Promise<TuyaProvisioningResult>
  getStatus(options: TuyaQueryStatusOptions): Promise<TuyaProvisioningResult>
  stopProvisioning(options: TuyaStopProvisioningOptions): Promise<{ success: boolean }>
}

export const TuyaProvisioning = registerPlugin<TuyaProvisioningPlugin>('TuyaProvisioning', {
  web: () => import('./web').then((m) => new m.TuyaProvisioningWeb()),
})

export type { TuyaProvisioningWeb }


