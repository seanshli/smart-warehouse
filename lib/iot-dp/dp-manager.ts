// IoT Device Data Points (DP) Manager
// 設備數據點管理器 - 處理 DP 發現、映射和緩存
// This module handles DP discovery, mapping, and caching for IoT devices

import { 
  DPDefinition, 
  DeviceCategoryDPs, 
  VENDOR_DPS,
  NormalizedPropertyType 
} from './dp-definitions'

/**
 * Device capabilities interface
 */
export interface DeviceCapabilities {
  deviceId: string
  vendor: string
  category: string
  categoryName: string
  dps: DPDefinition[]
  discoveredAt: Date
  source: 'predefined' | 'cloud_api' | 'device_announcement' | 'manual'
}

/**
 * Normalized device state
 */
export interface NormalizedDeviceState {
  deviceId: string
  vendor: string
  online: boolean
  lastUpdate: Date
  properties: Record<NormalizedPropertyType | string, any>
  rawState: Record<string, any>
}

/**
 * DP Manager class
 * Handles device capability discovery and state normalization
 */
class DPManager {
  private deviceCapabilities: Map<string, DeviceCapabilities> = new Map()
  private deviceStates: Map<string, NormalizedDeviceState> = new Map()
  
  /**
   * Get predefined DPs for a device category
   */
  getPredefinedDPs(vendor: string, category: string): DeviceCategoryDPs | null {
    const vendorDPs = VENDOR_DPS[vendor.toLowerCase()]
    if (!vendorDPs) return null
    
    return vendorDPs[category] || null
  }
  
  /**
   * Register device capabilities from predefined definitions
   */
  registerFromPredefined(deviceId: string, vendor: string, category: string): DeviceCapabilities | null {
    const predefined = this.getPredefinedDPs(vendor, category)
    if (!predefined) return null
    
    const capabilities: DeviceCapabilities = {
      deviceId,
      vendor,
      category: predefined.category,
      categoryName: predefined.name,
      dps: [...predefined.dps],
      discoveredAt: new Date(),
      source: 'predefined',
    }
    
    this.deviceCapabilities.set(deviceId, capabilities)
    return capabilities
  }
  
  /**
   * Register device capabilities from device announcement (MQTT)
   * This is called when a device announces itself with its capabilities
   */
  registerFromAnnouncement(
    deviceId: string, 
    vendor: string, 
    announcement: {
      category?: string
      model?: string
      dps?: Array<{
        dpId: number | string
        name?: string
        type?: string
        range?: { min?: number; max?: number }
        values?: string[]
      }>
    }
  ): DeviceCapabilities {
    // Try to get predefined DPs first
    const predefined = announcement.category 
      ? this.getPredefinedDPs(vendor, announcement.category) 
      : null
    
    let dps: DPDefinition[] = []
    
    if (announcement.dps && announcement.dps.length > 0) {
      // Use announced DPs
      dps = announcement.dps.map(dp => ({
        dpId: dp.dpId,
        name: dp.name || `DP ${dp.dpId}`,
        property: this.inferPropertyType(dp.name, dp.type) as NormalizedPropertyType,
        type: (dp.type as any) || 'string',
        range: dp.range ? { min: dp.range.min || 0, max: dp.range.max || 100 } : undefined,
        enumValues: dp.values,
      }))
    } else if (predefined) {
      // Fall back to predefined
      dps = [...predefined.dps]
    }
    
    const capabilities: DeviceCapabilities = {
      deviceId,
      vendor,
      category: announcement.category || 'generic',
      categoryName: predefined?.name || announcement.model || 'Unknown Device',
      dps,
      discoveredAt: new Date(),
      source: 'device_announcement',
    }
    
    this.deviceCapabilities.set(deviceId, capabilities)
    return capabilities
  }
  
  /**
   * Register device capabilities from Cloud API (Tuya, Midea, etc.)
   */
  async registerFromCloudAPI(
    deviceId: string,
    vendor: string,
    apiResponse: {
      category?: string
      product_id?: string
      model?: string
      functions?: Array<{
        code: string
        name?: string
        type: string
        values?: string
      }>
      status?: Array<{
        code: string
        name?: string
        type: string
        value?: any
      }>
    }
  ): Promise<DeviceCapabilities> {
    const predefined = apiResponse.category 
      ? this.getPredefinedDPs(vendor, apiResponse.category) 
      : null
    
    let dps: DPDefinition[] = []
    
    // Parse functions (controllable DPs)
    if (apiResponse.functions && apiResponse.functions.length > 0) {
      for (const func of apiResponse.functions) {
        const dp = this.parseCloudAPIDP(func, vendor, false)
        if (dp) dps.push(dp)
      }
    }
    
    // Parse status (read-only DPs)
    if (apiResponse.status && apiResponse.status.length > 0) {
      for (const stat of apiResponse.status) {
        // Check if already added as function
        const exists = dps.find(d => d.dpId === stat.code)
        if (!exists) {
          const dp = this.parseCloudAPIDP(stat, vendor, true)
          if (dp) dps.push(dp)
        }
      }
    }
    
    // If no DPs from API, use predefined
    if (dps.length === 0 && predefined) {
      dps = [...predefined.dps]
    }
    
    const capabilities: DeviceCapabilities = {
      deviceId,
      vendor,
      category: apiResponse.category || 'generic',
      categoryName: predefined?.name || apiResponse.model || 'Unknown Device',
      dps,
      discoveredAt: new Date(),
      source: 'cloud_api',
    }
    
    this.deviceCapabilities.set(deviceId, capabilities)
    return capabilities
  }
  
  /**
   * Parse Cloud API DP response
   */
  private parseCloudAPIDP(
    dp: { code: string; name?: string; type: string; values?: string },
    vendor: string,
    readOnly: boolean
  ): DPDefinition | null {
    try {
      let range: DPDefinition['range']
      let enumValues: string[] | undefined
      
      // Parse values field (Tuya format: JSON string)
      if (dp.values) {
        try {
          const values = JSON.parse(dp.values)
          if (values.range) {
            range = {
              min: values.range[0] || values.min,
              max: values.range[1] || values.max,
              step: values.step,
              unit: values.unit,
            }
          } else if (Array.isArray(values)) {
            enumValues = values
          }
        } catch {
          // Not JSON, might be enum string
          if (dp.values.includes(',')) {
            enumValues = dp.values.split(',').map(v => v.trim())
          }
        }
      }
      
      return {
        dpId: dp.code,
        name: dp.name || this.humanizeDPCode(dp.code),
        property: this.inferPropertyType(dp.code, dp.type),
        type: this.normalizeType(dp.type),
        range,
        enumValues,
        readOnly,
      }
    } catch (error) {
      console.error('Failed to parse Cloud API DP:', error)
      return null
    }
  }
  
  /**
   * Infer normalized property type from DP name/code
   */
  private inferPropertyType(nameOrCode: string | undefined, type?: string): NormalizedPropertyType {
    const name = (nameOrCode || '').toLowerCase()
    
    // Power related
    if (name.includes('power') || name.includes('switch') || name === 'on' || name === 'state') {
      return 'power'
    }
    // Temperature related
    if (name.includes('temp') && !name.includes('color')) {
      if (name.includes('current') || name.includes('indoor') || name.includes('inside')) {
        return 'current_temp'
      }
      return 'temperature'
    }
    // Humidity
    if (name.includes('humid')) {
      return 'humidity'
    }
    // Mode
    if (name.includes('mode') && !name.includes('swing')) {
      return 'mode'
    }
    // Fan speed
    if (name.includes('fan') || name.includes('speed')) {
      return 'fan_speed'
    }
    // Swing
    if (name.includes('swing')) {
      return 'swing'
    }
    // Brightness
    if (name.includes('bright') || name === 'bri') {
      return 'brightness'
    }
    // Color temperature
    if (name.includes('color') && name.includes('temp') || name === 'ct') {
      return 'color_temp'
    }
    // Color
    if (name.includes('color') || name.includes('hue') || name.includes('sat') || name === 'xy') {
      return 'color'
    }
    // Position
    if (name.includes('position') || name.includes('percent')) {
      return 'position'
    }
    // Battery
    if (name.includes('battery')) {
      return 'battery'
    }
    // Motion
    if (name.includes('motion') || name.includes('occupancy') || name.includes('presence')) {
      return 'motion'
    }
    // Door/Window
    if (name.includes('door') || name.includes('window') || name.includes('contact')) {
      return 'door'
    }
    // Energy
    if (name.includes('energy')) {
      return 'energy'
    }
    // Power consumption
    if (name === 'power' && type === 'number') {
      return 'power_consumption'
    }
    // Voltage
    if (name.includes('voltage')) {
      return 'voltage'
    }
    // Current
    if (name.includes('current') && !name.includes('temp')) {
      return 'current'
    }
    // Lock
    if (name.includes('lock')) {
      return 'lock'
    }
    
    return 'custom'
  }
  
  /**
   * Normalize type string from different vendors
   */
  private normalizeType(type: string): DPDefinition['type'] {
    const t = type.toLowerCase()
    if (t === 'bool' || t === 'boolean') return 'boolean'
    if (t === 'value' || t === 'integer' || t === 'float' || t === 'number') return 'number'
    if (t === 'enum') return 'enum'
    if (t === 'raw' || t === 'json' || t === 'object') return 'object'
    return 'string'
  }
  
  /**
   * Convert DP code to human-readable name
   */
  private humanizeDPCode(code: string): string {
    return code
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }
  
  /**
   * Get device capabilities
   */
  getCapabilities(deviceId: string): DeviceCapabilities | null {
    return this.deviceCapabilities.get(deviceId) || null
  }
  
  /**
   * Get all registered device capabilities
   */
  getAllCapabilities(): DeviceCapabilities[] {
    return Array.from(this.deviceCapabilities.values())
  }
  
  /**
   * Normalize raw device state to standard format
   */
  normalizeState(
    deviceId: string,
    vendor: string,
    rawState: Record<string, any>
  ): NormalizedDeviceState {
    const capabilities = this.deviceCapabilities.get(deviceId)
    const properties: Record<string, any> = {}
    
    if (capabilities) {
      // Map raw values to normalized properties
      for (const dp of capabilities.dps) {
        const rawKey = String(dp.dpId)
        if (rawState[rawKey] !== undefined) {
          properties[dp.property] = this.convertValue(rawState[rawKey], dp)
        } else if (rawState[dp.dpId] !== undefined) {
          properties[dp.property] = this.convertValue(rawState[dp.dpId], dp)
        }
      }
    } else {
      // No capabilities registered, pass through raw state
      Object.assign(properties, rawState)
    }
    
    const state: NormalizedDeviceState = {
      deviceId,
      vendor,
      online: true,
      lastUpdate: new Date(),
      properties,
      rawState,
    }
    
    this.deviceStates.set(deviceId, state)
    return state
  }
  
  /**
   * Convert raw value based on DP definition
   */
  private convertValue(value: any, dp: DPDefinition): any {
    switch (dp.type) {
      case 'boolean':
        if (typeof value === 'boolean') return value
        if (typeof value === 'number') return value !== 0
        if (typeof value === 'string') return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'on'
        return Boolean(value)
        
      case 'number':
        const num = Number(value)
        if (isNaN(num)) return value
        // Apply range normalization if needed (e.g., Philips Hue brightness 1-254 to 0-100)
        if (dp.range && dp.property === 'brightness') {
          if (dp.range.max === 254) {
            return Math.round((num / 254) * 100)
          }
          if (dp.range.max === 1000) {
            return Math.round((num / 1000) * 100)
          }
        }
        return num
        
      case 'enum':
        return String(value)
        
      default:
        return value
    }
  }
  
  /**
   * Get current device state
   */
  getState(deviceId: string): NormalizedDeviceState | null {
    return this.deviceStates.get(deviceId) || null
  }
  
  /**
   * Create command payload from normalized property
   */
  createCommand(
    deviceId: string,
    property: NormalizedPropertyType | string,
    value: any
  ): Record<string, any> | null {
    const capabilities = this.deviceCapabilities.get(deviceId)
    if (!capabilities) return null
    
    // Find the DP for this property
    const dp = capabilities.dps.find(d => d.property === property && !d.readOnly)
    if (!dp) return null
    
    // Convert normalized value to vendor-specific format
    let convertedValue = value
    
    if (dp.type === 'number' && dp.range && property === 'brightness') {
      // Convert 0-100 to vendor-specific range
      if (dp.range.max === 254) {
        convertedValue = Math.round((value / 100) * 254)
      } else if (dp.range.max === 1000) {
        convertedValue = Math.round((value / 100) * 1000)
      }
    }
    
    // Return in vendor-specific format
    if (capabilities.vendor === 'tuya') {
      return { dps: { [dp.dpId]: convertedValue } }
    }
    
    return { [dp.dpId]: convertedValue }
  }
  
  /**
   * Clear all cached data
   */
  clear(): void {
    this.deviceCapabilities.clear()
    this.deviceStates.clear()
  }
}

// Singleton instance
const dpManager = new DPManager()

export { dpManager, DPManager }
export default dpManager
