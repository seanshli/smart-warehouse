// Home Assistant 設備適配器
// 支援通過 Home Assistant RESTful API 控制設備

import { BaseAdapter, ConnectionType, DeviceState, ControlCommand, AdapterConfig } from './base-adapter'
import { IoTDevice } from '../mqtt-client'
import { getHomeAssistantStates, callHomeAssistantService, type HomeAssistantState } from '../homeassistant'

export class HomeAssistantAdapter extends BaseAdapter {
  readonly connectionType: ConnectionType = 'restful'
  readonly vendor: string = 'homeassistant'

  /**
   * 創建 Home Assistant 設備
   * @param deviceId Home Assistant 實體 ID (例如: light.living_room)
   * @param name 設備名稱
   * @param config 配置（包含 baseUrl 和 accessToken，但通常從環境變數讀取）
   */
  createDevice(deviceId: string, name: string, config?: AdapterConfig): IoTDevice {
    return {
      id: deviceId,
      name,
      vendor: 'homeassistant' as any,
      topic: `homeassistant/${deviceId}`, // Restful 設備使用虛擬主題方便追蹤
      status: 'offline',
      metadata: {
        connectionType: 'restful',
        entityId: deviceId, // Home Assistant 實體 ID
        baseUrl: config?.baseUrl || process.env.HOME_ASSISTANT_BASE_URL,
        accessToken: config?.accessToken || process.env.HOME_ASSISTANT_ACCESS_TOKEN,
        ...config,
      },
    }
  }

  /**
   * 解析 Home Assistant 實體狀態
   * @param data Home Assistant 狀態對象
   */
  parseState(data: any): DeviceState | null {
    if (!data || typeof data !== 'object') {
      return null
    }

    // 如果是 Home Assistant 狀態格式
    if (data.entity_id && data.state !== undefined) {
      const state: DeviceState = {
        power: this.parsePowerState(data.state, data.attributes),
        state: data.state,
        attributes: data.attributes || {},
        lastChanged: data.last_changed,
        lastUpdated: data.last_updated,
      }

      // 根據實體類型解析特定屬性
      if (data.entity_id.startsWith('light.')) {
        state.brightness = data.attributes?.brightness
        state.colorTemp = data.attributes?.color_temp
        state.rgbColor = data.attributes?.rgb_color
        state.effect = data.attributes?.effect
      } else if (data.entity_id.startsWith('climate.')) {
        state.temperature = data.attributes?.temperature
        state.targetTemperature = data.attributes?.temperature
        state.humidity = data.attributes?.current_humidity
        state.mode = data.attributes?.hvac_mode
        state.fanMode = data.attributes?.fan_mode
      } else if (data.entity_id.startsWith('fan.')) {
        state.percentage = data.attributes?.percentage
        state.presetMode = data.attributes?.preset_mode
        state.oscillating = data.attributes?.oscillating
      } else if (data.entity_id.startsWith('switch.') || data.entity_id.startsWith('input_boolean.')) {
        // Switch 和 Input Boolean 只有開關狀態
        state.power = data.state === 'on'
      }

      return state
    }

    return null
  }

  /**
   * 解析電源狀態
   */
  private parsePowerState(state: string, attributes?: any): boolean {
    if (state === 'on' || state === 'open' || state === 'active') {
      return true
    }
    if (state === 'off' || state === 'closed' || state === 'inactive' || state === 'unavailable') {
      return false
    }
    // 對於數字狀態，檢查是否有可用屬性
    return attributes?.available !== false
  }

  /**
   * 生成控制命令
   * @param action 操作類型 (turn_on, turn_off, set_temperature, set_brightness, etc.)
   * @param value 值
   */
  createCommand(action: string, value?: any): ControlCommand {
    return {
      action,
      value,
    }
  }

  /**
   * 獲取設備狀態
   * @param deviceId Home Assistant 實體 ID
   * @param config 配置
   */
  async getDeviceState(deviceId: string, config: AdapterConfig): Promise<DeviceState | null> {
    try {
      const states = await getHomeAssistantStates([deviceId])
      if (states.length > 0) {
        return this.parseState(states[0])
      }
      return null
    } catch (error) {
      console.error('Failed to get Home Assistant device state:', error)
      return null
    }
  }

  /**
   * 發送控制命令
   * @param deviceId Home Assistant 實體 ID
   * @param command 控制命令
   * @param config 配置
   */
  async sendCommand(deviceId: string, command: ControlCommand, config: AdapterConfig): Promise<boolean> {
    try {
      // 解析實體 ID 獲取 domain (例如: light.living_room -> light)
      const [domain] = deviceId.split('.')
      if (!domain) {
        throw new Error(`Invalid entity ID: ${deviceId}`)
      }

      // 構建服務調用載荷
      const payload: any = {
        entity_id: deviceId,
      }

      // 根據操作類型添加參數
      switch (command.action) {
        case 'turn_on':
          if (command.value?.brightness !== undefined) {
            payload.brightness = command.value.brightness
          }
          if (command.value?.color_temp !== undefined) {
            payload.color_temp = command.value.color_temp
          }
          if (command.value?.rgb_color) {
            payload.rgb_color = command.value.rgb_color
          }
          if (command.value?.temperature !== undefined) {
            payload.temperature = command.value.temperature
          }
          if (command.value?.percentage !== undefined) {
            payload.percentage = command.value.percentage
          }
          break
        case 'turn_off':
          // 不需要額外參數
          break
        case 'set_temperature':
          payload.temperature = command.value
          break
        case 'set_brightness':
          payload.brightness = command.value
          break
        case 'set_percentage':
          payload.percentage = command.value
          break
        case 'set_preset_mode':
          payload.preset_mode = command.value
          break
        case 'set_fan_mode':
          payload.fan_mode = command.value
          break
        case 'set_hvac_mode':
          payload.hvac_mode = command.value
          break
        default:
          // 對於其他操作，直接使用 value 作為載荷
          if (command.value) {
            Object.assign(payload, command.value)
          }
      }

      // 調用 Home Assistant 服務
      await callHomeAssistantService(domain, command.action, payload)
      return true
    } catch (error) {
      console.error('Failed to send Home Assistant command:', error)
      return false
    }
  }
}

