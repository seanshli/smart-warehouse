// MQTT 適配器統一導出
// 提供所有供應商適配器的統一介面

export { TuyaAdapter, type TuyaDeviceState, type TuyaControlCommand } from './tuya-adapter'
export { ESPAdapter, type ESPDeviceState, type ESPControlCommand } from './esp-adapter'
export { MideaAdapter, type MideaDeviceState, type MideaControlCommand } from './midea-adapter'
export { ShellyAdapter, type ShellyDeviceState, type ShellyControlCommand } from './shelly-adapter'
export { AqaraAdapter, type AqaraDeviceState, type AqaraControlCommand } from './aqara-adapter'
export { PhilipsMQTTAdapter, type PhilipsMQTTDeviceState, type PhilipsMQTTControlCommand } from './philips-mqtt-adapter'
export { PanasonicMQTTAdapter, type PanasonicMQTTDeviceState, type PanasonicMQTTControlCommand } from './panasonic-mqtt-adapter'
export { KNXAdapter, type KNXDeviceState, type KNXControlCommand } from './knx-adapter'

import { DeviceVendor, IoTDevice } from '../mqtt-client'
import { TuyaAdapter } from './tuya-adapter'
import { ESPAdapter } from './esp-adapter'
import { MideaAdapter } from './midea-adapter'
import { ShellyAdapter } from './shelly-adapter'
import { AqaraAdapter } from './aqara-adapter'
import { PhilipsMQTTAdapter } from './philips-mqtt-adapter'
import { PanasonicMQTTAdapter } from './panasonic-mqtt-adapter'
import { KNXAdapter } from './knx-adapter'

/**
 * 適配器工廠
 * 根據供應商類型返回對應的適配器
 */
export class AdapterFactory {
  static getAdapter(vendor: DeviceVendor) {
    switch (vendor) {
      case 'tuya':
        return TuyaAdapter
      case 'esp':
        return ESPAdapter
      case 'midea':
        return MideaAdapter
      case 'shelly':
        return ShellyAdapter
      case 'aqara':
        return AqaraAdapter
      case 'philips':
        return PhilipsMQTTAdapter
      case 'panasonic':
        return PanasonicMQTTAdapter
      default:
        throw new Error(`Unsupported vendor: ${vendor}`)
    }
  }

  // 從主題自動檢測供應商
  static detectVendorFromTopic(topic: string): DeviceVendor | null {
    if (topic.startsWith('tuya/')) {
      return 'tuya'
    } else if (topic.startsWith('esp/')) {
      return 'esp'
    } else if (topic.startsWith('midea/')) {
      return 'midea'
    } else if (topic.startsWith('shellies/') || topic.match(/^[^/]+\/(?:status|command)\/switch:/)) {
      return 'shelly'
    } else if (topic.startsWith('zigbee2mqtt/')) {
      return 'aqara'
    } else if (topic.startsWith('philips/')) {
      return 'philips'
    } else if (topic.startsWith('panasonic/')) {
      return 'panasonic'
    } else if (topic.startsWith('knx/')) {
      return 'knx'
    }
    return null
  }

  // 從主題創建設備
  static createDeviceFromTopic(topic: string, name: string): IoTDevice | null {
    const vendor = this.detectVendorFromTopic(topic)
    if (!vendor) {
      return null
    }

    const Adapter = this.getAdapter(vendor)
    const parseResult = Adapter.parseDeviceId(topic)
    
    // ShellyAdapter returns an object, others return string | null
    if (!parseResult) {
      return null
    }

    if (vendor === 'shelly' && typeof parseResult === 'object' && 'deviceId' in parseResult) {
      // Shelly adapter returns { deviceId, channel, generation }
      const shellyResult = parseResult as { deviceId: string | null; channel?: number; generation?: 'gen1' | 'gen2' }
      if (!shellyResult.deviceId) {
        return null
      }
      return (Adapter as typeof ShellyAdapter).createDevice(shellyResult.deviceId, name, shellyResult.channel, shellyResult.generation)
    } else if (vendor === 'philips' && typeof parseResult === 'object' && 'bridgeId' in parseResult) {
      // Philips adapter returns { bridgeId, lightId, sensorId }
      const philipsResult = parseResult as { bridgeId: string | null; lightId: string | null; sensorId: string | null }
      if (!philipsResult.bridgeId || (!philipsResult.lightId && !philipsResult.sensorId)) {
        return null
      }
      if (philipsResult.lightId) {
        return (Adapter as typeof PhilipsMQTTAdapter).createDevice(philipsResult.bridgeId, philipsResult.lightId, name)
      }
      // For sensors, use bridgeId_sensorId as device ID
      return (Adapter as typeof PhilipsMQTTAdapter).createDevice(philipsResult.bridgeId, philipsResult.sensorId!, name)
    } else if (typeof parseResult === 'string') {
      // Other adapters return string | null
      return (Adapter as any).createDevice(parseResult, name)
    }

    return null
  }
}

