// IoT Device Data Points (DP) Definitions
// 設備數據點定義 - 定義各品牌設備的 DP 映射
// This module defines standard DP mappings for different IoT vendors

/**
 * Standard property types for normalized device state
 */
export type NormalizedPropertyType = 
  | 'power'           // Boolean - on/off
  | 'mode'            // Enum - device mode
  | 'temperature'     // Number - target temperature
  | 'current_temp'    // Number - current temperature
  | 'humidity'        // Number - humidity percentage
  | 'fan_speed'       // Enum/Number - fan speed level
  | 'swing'           // Boolean/Enum - swing mode
  | 'brightness'      // Number 0-100 - light brightness
  | 'color_temp'      // Number - color temperature in Kelvin
  | 'color'           // Object - HSV or RGB color
  | 'position'        // Number 0-100 - curtain/blind position
  | 'battery'         // Number 0-100 - battery percentage
  | 'motion'          // Boolean - motion detected
  | 'door'            // Boolean - door/window open
  | 'smoke'           // Boolean - smoke detected
  | 'water_leak'      // Boolean - water leak detected
  | 'energy'          // Number - energy consumption (kWh)
  | 'power_consumption' // Number - current power (W)
  | 'voltage'         // Number - voltage (V)
  | 'current'         // Number - current (A)
  | 'lock'            // Boolean - lock state
  | 'custom'          // Any - custom property

/**
 * Data Point definition interface
 */
export interface DPDefinition {
  dpId: number | string      // Vendor-specific DP ID
  name: string               // Human-readable name
  property: NormalizedPropertyType  // Normalized property type
  type: 'boolean' | 'number' | 'string' | 'enum' | 'object'
  range?: {                  // For numbers
    min: number
    max: number
    step?: number
    unit?: string
  }
  enumValues?: string[]      // For enums
  readOnly?: boolean         // True if can't be controlled
  description?: string
}

/**
 * Device category with its standard DPs
 */
export interface DeviceCategoryDPs {
  category: string
  name: string
  dps: DPDefinition[]
}

// ============================================
// TUYA DP DEFINITIONS
// Tuya uses numeric DPs (1, 2, 3, etc.)
// ============================================
export const TUYA_DPS: Record<string, DeviceCategoryDPs> = {
  // Air Conditioner (空調)
  'kt': {
    category: 'kt',
    name: 'Air Conditioner',
    dps: [
      { dpId: 1, name: 'Power', property: 'power', type: 'boolean' },
      { dpId: 2, name: 'Target Temperature', property: 'temperature', type: 'number', range: { min: 16, max: 30, unit: '°C' } },
      { dpId: 3, name: 'Current Temperature', property: 'current_temp', type: 'number', readOnly: true },
      { dpId: 4, name: 'Mode', property: 'mode', type: 'enum', enumValues: ['cold', 'hot', 'wind', 'auto', 'dehumidify'] },
      { dpId: 5, name: 'Fan Speed', property: 'fan_speed', type: 'enum', enumValues: ['auto', 'low', 'middle', 'high'] },
      { dpId: 104, name: 'Swing', property: 'swing', type: 'boolean' },
    ],
  },
  // Switch/Plug (開關/插座)
  'cz': {
    category: 'cz',
    name: 'Switch/Plug',
    dps: [
      { dpId: 1, name: 'Switch 1', property: 'power', type: 'boolean' },
      { dpId: 2, name: 'Switch 2', property: 'power', type: 'boolean' },
      { dpId: 3, name: 'Switch 3', property: 'power', type: 'boolean' },
      { dpId: 9, name: 'Countdown', property: 'custom', type: 'number', range: { min: 0, max: 86400, unit: 's' } },
    ],
  },
  // Light (燈具)
  'dj': {
    category: 'dj',
    name: 'Light',
    dps: [
      { dpId: 20, name: 'Power', property: 'power', type: 'boolean' },
      { dpId: 21, name: 'Mode', property: 'mode', type: 'enum', enumValues: ['white', 'colour', 'scene', 'music'] },
      { dpId: 22, name: 'Brightness', property: 'brightness', type: 'number', range: { min: 10, max: 1000 } },
      { dpId: 23, name: 'Color Temperature', property: 'color_temp', type: 'number', range: { min: 0, max: 1000 } },
      { dpId: 24, name: 'Color', property: 'color', type: 'object' },
    ],
  },
  // Curtain (窗簾)
  'cl': {
    category: 'cl',
    name: 'Curtain',
    dps: [
      { dpId: 1, name: 'Control', property: 'custom', type: 'enum', enumValues: ['open', 'stop', 'close'] },
      { dpId: 2, name: 'Position', property: 'position', type: 'number', range: { min: 0, max: 100, unit: '%' } },
      { dpId: 3, name: 'Current Position', property: 'position', type: 'number', readOnly: true },
    ],
  },
  // Sensor - Temperature & Humidity (溫濕度感應器)
  'wsdcg': {
    category: 'wsdcg',
    name: 'Temperature & Humidity Sensor',
    dps: [
      { dpId: 1, name: 'Temperature', property: 'temperature', type: 'number', readOnly: true, range: { min: -40, max: 80, unit: '°C' } },
      { dpId: 2, name: 'Humidity', property: 'humidity', type: 'number', readOnly: true, range: { min: 0, max: 100, unit: '%' } },
      { dpId: 3, name: 'Battery', property: 'battery', type: 'number', readOnly: true, range: { min: 0, max: 100, unit: '%' } },
    ],
  },
  // Motion Sensor (人體感應器)
  'pir': {
    category: 'pir',
    name: 'Motion Sensor',
    dps: [
      { dpId: 1, name: 'Motion', property: 'motion', type: 'boolean', readOnly: true },
      { dpId: 2, name: 'Battery', property: 'battery', type: 'number', readOnly: true },
    ],
  },
  // Door/Window Sensor (門窗感應器)
  'mcs': {
    category: 'mcs',
    name: 'Door/Window Sensor',
    dps: [
      { dpId: 1, name: 'Open/Close', property: 'door', type: 'boolean', readOnly: true },
      { dpId: 2, name: 'Battery', property: 'battery', type: 'number', readOnly: true },
    ],
  },
  // Smart Lock (智能鎖)
  'ms': {
    category: 'ms',
    name: 'Smart Lock',
    dps: [
      { dpId: 1, name: 'Lock State', property: 'lock', type: 'boolean' },
      { dpId: 2, name: 'Battery', property: 'battery', type: 'number', readOnly: true },
    ],
  },
}

// ============================================
// MIDEA DP DEFINITIONS
// Midea uses string-based properties
// ============================================
export const MIDEA_DPS: Record<string, DeviceCategoryDPs> = {
  // Air Conditioner
  'ac': {
    category: 'ac',
    name: 'Air Conditioner',
    dps: [
      { dpId: 'power', name: 'Power', property: 'power', type: 'boolean' },
      { dpId: 'mode', name: 'Mode', property: 'mode', type: 'enum', enumValues: ['cool', 'heat', 'auto', 'dry', 'fan'] },
      { dpId: 'target_temperature', name: 'Target Temperature', property: 'temperature', type: 'number', range: { min: 16, max: 30, unit: '°C' } },
      { dpId: 'indoor_temperature', name: 'Indoor Temperature', property: 'current_temp', type: 'number', readOnly: true },
      { dpId: 'outdoor_temperature', name: 'Outdoor Temperature', property: 'custom', type: 'number', readOnly: true },
      { dpId: 'fan_speed', name: 'Fan Speed', property: 'fan_speed', type: 'enum', enumValues: ['auto', 'silent', 'low', 'medium', 'high', 'full'] },
      { dpId: 'swing_mode', name: 'Swing Mode', property: 'swing', type: 'enum', enumValues: ['off', 'vertical', 'horizontal', 'both'] },
      { dpId: 'eco_mode', name: 'Eco Mode', property: 'custom', type: 'boolean' },
      { dpId: 'turbo_mode', name: 'Turbo Mode', property: 'custom', type: 'boolean' },
    ],
  },
  // Dehumidifier
  'dehumidifier': {
    category: 'dehumidifier',
    name: 'Dehumidifier',
    dps: [
      { dpId: 'power', name: 'Power', property: 'power', type: 'boolean' },
      { dpId: 'mode', name: 'Mode', property: 'mode', type: 'enum', enumValues: ['set', 'continuous', 'smart', 'dry_clothes'] },
      { dpId: 'target_humidity', name: 'Target Humidity', property: 'humidity', type: 'number', range: { min: 35, max: 85, unit: '%' } },
      { dpId: 'current_humidity', name: 'Current Humidity', property: 'humidity', type: 'number', readOnly: true },
      { dpId: 'fan_speed', name: 'Fan Speed', property: 'fan_speed', type: 'enum', enumValues: ['silent', 'medium', 'high'] },
      { dpId: 'tank_full', name: 'Tank Full', property: 'custom', type: 'boolean', readOnly: true },
    ],
  },
}

// ============================================
// PHILIPS HUE DP DEFINITIONS
// Philips uses REST API properties
// ============================================
export const PHILIPS_DPS: Record<string, DeviceCategoryDPs> = {
  // Light
  'light': {
    category: 'light',
    name: 'Light',
    dps: [
      { dpId: 'on', name: 'Power', property: 'power', type: 'boolean' },
      { dpId: 'bri', name: 'Brightness', property: 'brightness', type: 'number', range: { min: 1, max: 254 } },
      { dpId: 'ct', name: 'Color Temperature', property: 'color_temp', type: 'number', range: { min: 153, max: 500 } },
      { dpId: 'hue', name: 'Hue', property: 'color', type: 'number', range: { min: 0, max: 65535 } },
      { dpId: 'sat', name: 'Saturation', property: 'color', type: 'number', range: { min: 0, max: 254 } },
      { dpId: 'xy', name: 'XY Color', property: 'color', type: 'object' },
      { dpId: 'effect', name: 'Effect', property: 'custom', type: 'enum', enumValues: ['none', 'colorloop'] },
      { dpId: 'alert', name: 'Alert', property: 'custom', type: 'enum', enumValues: ['none', 'select', 'lselect'] },
      { dpId: 'reachable', name: 'Reachable', property: 'custom', type: 'boolean', readOnly: true },
    ],
  },
  // Motion Sensor
  'sensor_motion': {
    category: 'sensor_motion',
    name: 'Motion Sensor',
    dps: [
      { dpId: 'presence', name: 'Presence', property: 'motion', type: 'boolean', readOnly: true },
      { dpId: 'battery', name: 'Battery', property: 'battery', type: 'number', readOnly: true },
      { dpId: 'temperature', name: 'Temperature', property: 'temperature', type: 'number', readOnly: true },
      { dpId: 'lightlevel', name: 'Light Level', property: 'custom', type: 'number', readOnly: true },
    ],
  },
}

// ============================================
// PANASONIC DP DEFINITIONS
// Panasonic uses REST API properties
// ============================================
export const PANASONIC_DPS: Record<string, DeviceCategoryDPs> = {
  // Air Conditioner
  'ac': {
    category: 'ac',
    name: 'Air Conditioner',
    dps: [
      { dpId: 'operate', name: 'Power', property: 'power', type: 'boolean' },
      { dpId: 'operationMode', name: 'Mode', property: 'mode', type: 'enum', enumValues: ['Auto', 'Dry', 'Cool', 'Heat', 'Fan'] },
      { dpId: 'temperatureSet', name: 'Target Temperature', property: 'temperature', type: 'number', range: { min: 16, max: 30, unit: '°C' } },
      { dpId: 'insideTemperature', name: 'Inside Temperature', property: 'current_temp', type: 'number', readOnly: true },
      { dpId: 'outsideTemperature', name: 'Outside Temperature', property: 'custom', type: 'number', readOnly: true },
      { dpId: 'fanSpeed', name: 'Fan Speed', property: 'fan_speed', type: 'enum', enumValues: ['Auto', 'Low', 'LowMid', 'Mid', 'HighMid', 'High'] },
      { dpId: 'airSwingLR', name: 'Horizontal Swing', property: 'swing', type: 'enum', enumValues: ['Auto', 'Left', 'LeftMid', 'Mid', 'RightMid', 'Right'] },
      { dpId: 'airSwingUD', name: 'Vertical Swing', property: 'swing', type: 'enum', enumValues: ['Auto', 'Up', 'UpMid', 'Mid', 'DownMid', 'Down'] },
      { dpId: 'ecoMode', name: 'Eco Mode', property: 'custom', type: 'enum', enumValues: ['Auto', 'Powerful', 'Quiet'] },
      { dpId: 'nanoe', name: 'Nanoe', property: 'custom', type: 'enum', enumValues: ['Unavailable', 'Off', 'On', 'ModeG', 'All'] },
    ],
  },
}

// ============================================
// ESP DP DEFINITIONS
// ESP devices can have custom DPs
// ============================================
export const ESP_DPS: Record<string, DeviceCategoryDPs> = {
  // Generic ESP Device
  'generic': {
    category: 'generic',
    name: 'Generic ESP Device',
    dps: [
      { dpId: 'power', name: 'Power', property: 'power', type: 'boolean' },
      { dpId: 'state', name: 'State', property: 'custom', type: 'string' },
    ],
  },
  // ESP Relay
  'relay': {
    category: 'relay',
    name: 'ESP Relay',
    dps: [
      { dpId: 'relay1', name: 'Relay 1', property: 'power', type: 'boolean' },
      { dpId: 'relay2', name: 'Relay 2', property: 'power', type: 'boolean' },
      { dpId: 'relay3', name: 'Relay 3', property: 'power', type: 'boolean' },
      { dpId: 'relay4', name: 'Relay 4', property: 'power', type: 'boolean' },
    ],
  },
  // ESP Sensor
  'sensor': {
    category: 'sensor',
    name: 'ESP Sensor',
    dps: [
      { dpId: 'temperature', name: 'Temperature', property: 'temperature', type: 'number', readOnly: true },
      { dpId: 'humidity', name: 'Humidity', property: 'humidity', type: 'number', readOnly: true },
      { dpId: 'pressure', name: 'Pressure', property: 'custom', type: 'number', readOnly: true },
      { dpId: 'light', name: 'Light Level', property: 'custom', type: 'number', readOnly: true },
    ],
  },
}

// ============================================
// SHELLY DP DEFINITIONS
// Shelly uses channel-based properties
// ============================================
export const SHELLY_DPS: Record<string, DeviceCategoryDPs> = {
  // Shelly Relay (Gen1 & Gen2)
  'relay': {
    category: 'relay',
    name: 'Shelly Relay',
    dps: [
      { dpId: 'output', name: 'Output', property: 'power', type: 'boolean' },
      { dpId: 'power', name: 'Power Consumption', property: 'power_consumption', type: 'number', readOnly: true, range: { unit: 'W' } },
      { dpId: 'energy', name: 'Energy', property: 'energy', type: 'number', readOnly: true, range: { unit: 'kWh' } },
      { dpId: 'voltage', name: 'Voltage', property: 'voltage', type: 'number', readOnly: true, range: { unit: 'V' } },
      { dpId: 'current', name: 'Current', property: 'current', type: 'number', readOnly: true, range: { unit: 'A' } },
      { dpId: 'temperature', name: 'Temperature', property: 'temperature', type: 'number', readOnly: true },
      { dpId: 'overtemperature', name: 'Overtemperature', property: 'custom', type: 'boolean', readOnly: true },
    ],
  },
  // Shelly Dimmer
  'dimmer': {
    category: 'dimmer',
    name: 'Shelly Dimmer',
    dps: [
      { dpId: 'output', name: 'Output', property: 'power', type: 'boolean' },
      { dpId: 'brightness', name: 'Brightness', property: 'brightness', type: 'number', range: { min: 0, max: 100, unit: '%' } },
    ],
  },
  // Shelly RGBW
  'rgbw': {
    category: 'rgbw',
    name: 'Shelly RGBW',
    dps: [
      { dpId: 'output', name: 'Output', property: 'power', type: 'boolean' },
      { dpId: 'brightness', name: 'Brightness', property: 'brightness', type: 'number', range: { min: 0, max: 100, unit: '%' } },
      { dpId: 'red', name: 'Red', property: 'color', type: 'number', range: { min: 0, max: 255 } },
      { dpId: 'green', name: 'Green', property: 'color', type: 'number', range: { min: 0, max: 255 } },
      { dpId: 'blue', name: 'Blue', property: 'color', type: 'number', range: { min: 0, max: 255 } },
      { dpId: 'white', name: 'White', property: 'color', type: 'number', range: { min: 0, max: 255 } },
    ],
  },
}

// ============================================
// AQARA/ZIGBEE DP DEFINITIONS
// Aqara uses Zigbee cluster-based properties
// ============================================
export const AQARA_DPS: Record<string, DeviceCategoryDPs> = {
  // Temperature & Humidity Sensor
  'sensor_ht': {
    category: 'sensor_ht',
    name: 'Temperature & Humidity Sensor',
    dps: [
      { dpId: 'temperature', name: 'Temperature', property: 'temperature', type: 'number', readOnly: true },
      { dpId: 'humidity', name: 'Humidity', property: 'humidity', type: 'number', readOnly: true },
      { dpId: 'pressure', name: 'Pressure', property: 'custom', type: 'number', readOnly: true },
      { dpId: 'battery', name: 'Battery', property: 'battery', type: 'number', readOnly: true },
      { dpId: 'voltage', name: 'Voltage', property: 'voltage', type: 'number', readOnly: true },
    ],
  },
  // Motion Sensor
  'sensor_motion': {
    category: 'sensor_motion',
    name: 'Motion Sensor',
    dps: [
      { dpId: 'occupancy', name: 'Occupancy', property: 'motion', type: 'boolean', readOnly: true },
      { dpId: 'illuminance', name: 'Illuminance', property: 'custom', type: 'number', readOnly: true },
      { dpId: 'illuminance_lux', name: 'Illuminance Lux', property: 'custom', type: 'number', readOnly: true },
      { dpId: 'battery', name: 'Battery', property: 'battery', type: 'number', readOnly: true },
    ],
  },
  // Door/Window Sensor
  'sensor_magnet': {
    category: 'sensor_magnet',
    name: 'Door/Window Sensor',
    dps: [
      { dpId: 'contact', name: 'Contact', property: 'door', type: 'boolean', readOnly: true },
      { dpId: 'battery', name: 'Battery', property: 'battery', type: 'number', readOnly: true },
    ],
  },
  // Water Leak Sensor
  'sensor_wleak': {
    category: 'sensor_wleak',
    name: 'Water Leak Sensor',
    dps: [
      { dpId: 'water_leak', name: 'Water Leak', property: 'water_leak', type: 'boolean', readOnly: true },
      { dpId: 'battery', name: 'Battery', property: 'battery', type: 'number', readOnly: true },
    ],
  },
  // Smart Plug
  'plug': {
    category: 'plug',
    name: 'Smart Plug',
    dps: [
      { dpId: 'state', name: 'State', property: 'power', type: 'boolean' },
      { dpId: 'power', name: 'Power', property: 'power_consumption', type: 'number', readOnly: true },
      { dpId: 'energy', name: 'Energy', property: 'energy', type: 'number', readOnly: true },
      { dpId: 'voltage', name: 'Voltage', property: 'voltage', type: 'number', readOnly: true },
      { dpId: 'current', name: 'Current', property: 'current', type: 'number', readOnly: true },
    ],
  },
}

// ============================================
// KNX DP DEFINITIONS (Data Point Types)
// KNX uses standardized DPTs
// ============================================
export const KNX_DPS: Record<string, DeviceCategoryDPs> = {
  // Switch Actuator
  'switch': {
    category: 'switch',
    name: 'Switch Actuator',
    dps: [
      { dpId: 'DPT_1.001', name: 'Switch', property: 'power', type: 'boolean', description: 'On/Off' },
    ],
  },
  // Dimmer
  'dimmer': {
    category: 'dimmer',
    name: 'Dimmer',
    dps: [
      { dpId: 'DPT_1.001', name: 'Switch', property: 'power', type: 'boolean' },
      { dpId: 'DPT_5.001', name: 'Brightness', property: 'brightness', type: 'number', range: { min: 0, max: 100, unit: '%' } },
    ],
  },
  // Blinds/Shutter
  'blinds': {
    category: 'blinds',
    name: 'Blinds/Shutter',
    dps: [
      { dpId: 'DPT_1.008', name: 'Up/Down', property: 'custom', type: 'boolean', description: 'Up=0, Down=1' },
      { dpId: 'DPT_1.007', name: 'Step/Stop', property: 'custom', type: 'boolean' },
      { dpId: 'DPT_5.001', name: 'Position', property: 'position', type: 'number', range: { min: 0, max: 100, unit: '%' } },
    ],
  },
  // HVAC
  'hvac': {
    category: 'hvac',
    name: 'HVAC Controller',
    dps: [
      { dpId: 'DPT_1.001', name: 'Enable', property: 'power', type: 'boolean' },
      { dpId: 'DPT_9.001', name: 'Temperature', property: 'temperature', type: 'number', range: { min: -273, max: 670760, unit: '°C' } },
      { dpId: 'DPT_9.001', name: 'Setpoint', property: 'temperature', type: 'number', range: { min: 0, max: 40, unit: '°C' } },
      { dpId: 'DPT_20.102', name: 'HVAC Mode', property: 'mode', type: 'enum', enumValues: ['Auto', 'Comfort', 'Standby', 'Economy', 'Building Protection'] },
    ],
  },
  // Temperature Sensor
  'sensor_temp': {
    category: 'sensor_temp',
    name: 'Temperature Sensor',
    dps: [
      { dpId: 'DPT_9.001', name: 'Temperature', property: 'temperature', type: 'number', readOnly: true, range: { unit: '°C' } },
    ],
  },
}

// ============================================
// ALL VENDOR DPS REGISTRY
// ============================================
export const VENDOR_DPS: Record<string, Record<string, DeviceCategoryDPs>> = {
  tuya: TUYA_DPS,
  midea: MIDEA_DPS,
  philips: PHILIPS_DPS,
  panasonic: PANASONIC_DPS,
  esp: ESP_DPS,
  shelly: SHELLY_DPS,
  aqara: AQARA_DPS,
  knx: KNX_DPS,
}
