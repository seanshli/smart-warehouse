// MQTT 適配器統一導出
// 提供所有供應商適配器的統一介面

export { TuyaAdapter, type TuyaDeviceState, type TuyaControlCommand } from './tuya-adapter'
export { ESPAdapter, type ESPDeviceState, type ESPControlCommand } from './esp-adapter'
export { MideaAdapter, type MideaDeviceState, type MideaControlCommand } from './midea-adapter'
export { ShellyAdapter, type ShellyDeviceState, type ShellyControlCommand } from './shelly-adapter'
export { AqaraAdapter, type AqaraDeviceState, type AqaraControlCommand } from './aqara-adapter'

import { DeviceVendor, IoTDevice } from '../mqtt-client'
import { TuyaAdapter } from './tuya-adapter'
import { ESPAdapter } from './esp-adapter'
import { MideaAdapter } from './midea-adapter'
import { ShellyAdapter } from './shelly-adapter'
import { AqaraAdapter } from './aqara-adapter'

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

    if (vendor === 'shelly' && typeof parseResult === 'object') {
      // Shelly adapter returns { deviceId, channel, generation }
      const { deviceId, channel, generation } = parseResult
      if (!deviceId) {
        return null
      }
      return (Adapter as typeof ShellyAdapter).createDevice(deviceId, name, channel, generation)
    } else if (typeof parseResult === 'string') {
      // Other adapters return string | null
      return Adapter.createDevice(parseResult, name)
    }

    return null
  }
}

