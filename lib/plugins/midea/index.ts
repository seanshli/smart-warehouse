// Midea Provisioning Capacitor Plugin Interface

export interface MideaInitializeOptions {
  clientId: string
  clientSecret: string
  serverHost: string
  clientSrc?: string
  accessToken: string
}

export interface MideaStartProvisioningOptions {
  mode: 'ap' | 'ez' | 'bluetooth'
  deviceSsid?: string // Device's AP SSID (for AP mode)
  ssid: string // Router SSID
  password: string // Router password
  routerSecurityParams?: string // Default: "[WPA2-PSK-CCMP][RSN-PSK-CCMP][ESS]"
}

export interface MideaProvisioningResult {
  success: boolean
  deviceId?: string
  deviceName?: string
  status: 'provisioning' | 'success' | 'failed'
  token?: string
  error?: string
  errorCode?: string
  subErrorCode?: string
  message?: string
  mode?: string
  deviceInfo?: {
    deviceId: string
    deviceName: string
    deviceType?: string
  }
}

export interface MideaStatusResult {
  success: boolean
  status: 'provisioning' | 'idle' | 'success' | 'failed'
  token?: string
}

export interface MideaPlugin {
  initialize(options: MideaInitializeOptions): Promise<{ initialized: boolean; native: boolean; message: string }>
  startProvisioning(options: MideaStartProvisioningOptions): Promise<MideaProvisioningResult>
  getStatus(options: { token?: string }): Promise<MideaStatusResult>
  stopProvisioning(): Promise<{ success: boolean; message: string }>
  resumeProvisioning(): Promise<{ success: boolean; message: string }>
}

declare global {
  interface PluginRegistry {
    MideaProvisioning?: MideaPlugin
  }
}

