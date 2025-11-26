// Midea Cloud API Client
// Implements authentication and API calls to Midea Cloud

interface MideaAPIConfig {
  clientId: string
  clientSecret: string
  serverHost: string
  accessToken?: string
}

interface MideaAPIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  errorCode?: string
}

/**
 * Midea Cloud API Client
 * Handles authentication and API calls to Midea Cloud
 */
export class MideaAPIClient {
  private config: MideaAPIConfig
  private baseUrl: string

  constructor(config: MideaAPIConfig) {
    this.config = config
    this.baseUrl = config.serverHost || 'https://obm.midea.com'
  }

  /**
   * Get access token using client credentials
   */
  async getAccessToken(): Promise<string> {
    try {
      // Midea OAuth2 token endpoint
      const tokenUrl = `${this.baseUrl}/oem/v1/oauth2/token`
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        }),
      })

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.statusText}`)
      }

      const data = await response.json()
      return data.access_token || data.accessToken || ''
    } catch (error: any) {
      console.error('Failed to get Midea access token:', error)
      throw new Error(`Failed to get access token: ${error.message}`)
    }
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest<T>(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<MideaAPIResponse<T>> {
    try {
      // Get or use existing access token
      let accessToken = this.config.accessToken
      if (!accessToken) {
        accessToken = await this.getAccessToken()
      }

      const url = `${this.baseUrl}${endpoint}`
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      }

      const options: RequestInit = {
        method,
        headers,
      }

      if (body && method !== 'GET') {
        options.body = JSON.stringify(body)
      }

      const response = await fetch(url, options)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.message || response.statusText,
          errorCode: errorData.errorCode || String(response.status),
        }
      }

      const data = await response.json()
      return {
        success: true,
        data,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'API request failed',
      }
    }
  }

  /**
   * Get device list from Midea Cloud
   */
  async getDeviceList(): Promise<MideaAPIResponse<any[]>> {
    // Note: Actual endpoint may differ - check Midea API documentation
    return this.makeRequest('/oem/v1/devices', 'GET')
  }

  /**
   * Get device status
   */
  async getDeviceStatus(deviceId: string): Promise<MideaAPIResponse<any>> {
    // Note: Actual endpoint may differ - check Midea API documentation
    return this.makeRequest(`/oem/v1/devices/${deviceId}/status`, 'GET')
  }

  /**
   * Control device
   */
  async controlDevice(deviceId: string, command: any): Promise<MideaAPIResponse<any>> {
    // Note: Actual endpoint and command format may differ - check Midea API documentation
    return this.makeRequest(`/oem/v1/devices/${deviceId}/control`, 'POST', command)
  }

  /**
   * Get device list (alternative format - using protocol 5.0)
   */
  async getDeviceListV5(): Promise<MideaAPIResponse<any[]>> {
    // Using protocol 5.0 format as seen in bridge code
    const url = 'https://mapp.midea.com/mas/v5/app/protocol/json'
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protocol: '5.0',
          iotApp: {
            appId: this.config.clientId,
            appKey: this.config.clientSecret,
          },
          system: {
            appId: this.config.clientId,
            appKey: this.config.clientSecret,
          },
          params: {
            action: 'getDeviceList',
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        success: true,
        data: data.devices || [],
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get device list',
      }
    }
  }

  /**
   * Get device status (alternative format - using protocol 5.0)
   */
  async getDeviceStatusV5(deviceId: string): Promise<MideaAPIResponse<any>> {
    const url = 'https://mapp.midea.com/mas/v5/app/protocol/json'
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protocol: '5.0',
          iotApp: {
            appId: this.config.clientId,
            appKey: this.config.clientSecret,
          },
          system: {
            appId: this.config.clientId,
            appKey: this.config.clientSecret,
          },
          params: {
            action: 'getDeviceStatus',
            deviceId,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        success: true,
        data: data.status || {},
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get device status',
      }
    }
  }

  /**
   * Control device (alternative format - using protocol 5.0)
   */
  async controlDeviceV5(deviceId: string, command: any): Promise<MideaAPIResponse<any>> {
    const url = 'https://mapp.midea.com/mas/v5/app/protocol/json'
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protocol: '5.0',
          iotApp: {
            appId: this.config.clientId,
            appKey: this.config.clientSecret,
          },
          system: {
            appId: this.config.clientId,
            appKey: this.config.clientSecret,
          },
          params: {
            action: 'controlDevice',
            deviceId,
            command,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        success: true,
        data,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to control device',
      }
    }
  }
}

