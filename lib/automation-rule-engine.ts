/**
 * 跨生态链控制 - 自动化规则引擎
 * Cross-ecosystem Control - Automation Rule Engine
 * 
 * 功能:
 * - 监听 MQTT 消息
 * - 匹配触发条件
 * - 执行跨生态链控制动作
 */

import { prisma } from '@/lib/prisma'
import { getMQTTClient } from '@/lib/mqtt-client'
import { UnifiedAdapterFactory } from '@/lib/iot-adapters'
import type { ExtendedDeviceVendor } from '@/lib/iot-adapters'

interface AutomationRuleCondition {
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'contains' | 'startsWith' | 'endsWith'
  value: any
  unit?: string
}

interface AutomationRule {
  id: string
  name: string
  householdId: string
  enabled: boolean
  sourceType: string
  sourceDeviceId: string | null
  sourceProperty: string | null
  condition: {
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'contains' | 'startsWith' | 'endsWith'
    value: any
    unit?: string
  }
  actions: Array<{
    deviceId: string
    vendor: ExtendedDeviceVendor
    action: string
    value?: any
  }>
  debounceMs?: number
  throttleMs?: number
  executionCount: number
  lastExecutedAt: Date | null
}

interface DeviceState {
  deviceId: string
  vendor: ExtendedDeviceVendor
  property: string
  value: any
  timestamp: Date
}

// 存储每个规则的防抖/节流状态
const ruleThrottleState = new Map<string, {
  lastExecuted: number
  pendingTimeout?: NodeJS.Timeout
}>()

/**
 * 初始化规则引擎
 * 订阅所有相关设备的 MQTT 主题
 */
export async function initializeRuleEngine(householdId: string): Promise<void> {
  try {
    // 获取该家庭的所有启用规则
    const rules = await prisma.automationRule.findMany({
      where: {
        householdId,
        enabled: true,
        sourceType: 'device',
        sourceDeviceId: { not: null },
      },
      include: {
        household: {
          include: {
            iotDevices: {
              where: {
                id: { in: [] }, // Will be populated below
              },
            },
          },
        },
      },
    })

    if (rules.length === 0) {
      console.log(`[Rule Engine] No active rules found for household ${householdId}`)
      return
    }

    // 获取所有源设备
    const sourceDeviceIds = rules
      .map(r => r.sourceDeviceId)
      .filter((id): id is string => id !== null)

    const sourceDevices = await prisma.ioTDevice.findMany({
      where: {
        id: { in: sourceDeviceIds },
        connectionType: 'mqtt',
        statusTopic: { not: null },
      },
    })

    if (sourceDevices.length === 0) {
      console.log(`[Rule Engine] No MQTT source devices found for household ${householdId}`)
      return
    }

    // 连接到 MQTT Broker
    const mqttClient = getMQTTClient()
    if (!mqttClient.isConnected()) {
      await mqttClient.connect()
    }

    // 订阅所有源设备的状态主题
    for (const device of sourceDevices) {
      const statusTopic = device.statusTopic || device.topic
      if (!statusTopic) continue

      try {
        await mqttClient.subscribe(statusTopic, 1)
        console.log(`[Rule Engine] Subscribed to device status topic: ${statusTopic}`)

        // 注册消息处理器
        mqttClient.onMessage(statusTopic, async (message) => {
          await handleDeviceStateUpdate(device.id, device.vendor as ExtendedDeviceVendor, message.payload.toString())
        })
      } catch (error) {
        console.error(`[Rule Engine] Failed to subscribe to ${statusTopic}:`, error)
      }
    }

    console.log(`[Rule Engine] Initialized for household ${householdId} with ${rules.length} rules`)
  } catch (error) {
    console.error('[Rule Engine] Initialization error:', error)
    throw error
  }
}

/**
 * 处理设备状态更新
 */
async function handleDeviceStateUpdate(
  deviceId: string,
  vendor: ExtendedDeviceVendor,
  payload: string
): Promise<void> {
  try {
    // 解析设备状态
    const adapter = UnifiedAdapterFactory.getAdapter(vendor)
    const state = adapter.parseState({ topic: '', payload })

    if (!state) {
      return
    }

    // 获取所有使用此设备作为源的规则
    const rules = await prisma.automationRule.findMany({
      where: {
        sourceDeviceId: deviceId,
        enabled: true,
        sourceType: 'device',
      },
    })

    if (rules.length === 0) {
      return
    }

      // 检查每个规则的条件
      for (const rule of rules) {
        if (!rule.sourceProperty) {
          continue
        }

        const propertyValue = (state as any)[rule.sourceProperty]
        if (propertyValue === undefined) {
          continue
        }

      // 检查条件是否匹配
      // rule.condition 是 Json 类型，需要转换为正确的类型
      const condition = rule.condition as AutomationRuleCondition | null
      if (condition && typeof condition === 'object' && condition !== null && 'operator' in condition) {
        if (checkCondition(propertyValue, condition as AutomationRuleCondition)) {
          await executeRule(rule as any, {
            deviceId,
            vendor,
            property: rule.sourceProperty,
            value: propertyValue,
            timestamp: new Date(),
          })
        }
      }
      }
  } catch (error) {
    console.error(`[Rule Engine] Error handling device state update for ${deviceId}:`, error)
  }
}

/**
 * 检查条件是否匹配
 */
function checkCondition(value: any, condition: AutomationRuleCondition): boolean {
  const { operator, value: conditionValue, unit } = condition

  // 处理单位转换（如果需要）
  let normalizedValue = value
  if (unit && typeof value === 'number') {
    // 这里可以添加单位转换逻辑
    // 例如：摄氏度转华氏度等
  }

  switch (operator) {
    case '>':
      return normalizedValue > conditionValue
    case '<':
      return normalizedValue < conditionValue
    case '>=':
      return normalizedValue >= conditionValue
    case '<=':
      return normalizedValue <= conditionValue
    case '==':
      return normalizedValue === conditionValue
    case '!=':
      return normalizedValue !== conditionValue
    case 'contains':
      return String(normalizedValue).includes(String(conditionValue))
    case 'startsWith':
      return String(normalizedValue).startsWith(String(conditionValue))
    case 'endsWith':
      return String(normalizedValue).endsWith(String(conditionValue))
    default:
      console.warn(`[Rule Engine] Unknown operator: ${operator}`)
      return false
  }
}

/**
 * 执行规则动作
 */
async function executeRule(rule: AutomationRule | any, triggerState: DeviceState): Promise<void> {
  const ruleId = rule.id

  // 检查防抖/节流
  const throttleState = ruleThrottleState.get(ruleId) || { lastExecuted: 0 }
  const now = Date.now()

  // 防抖检查
  if (rule.debounceMs && throttleState.pendingTimeout) {
    // 已有待执行的定时器，取消它
    clearTimeout(throttleState.pendingTimeout)
  }

  // 节流检查
  if (rule.throttleMs && (now - throttleState.lastExecuted) < rule.throttleMs) {
    console.log(`[Rule Engine] Rule ${ruleId} throttled`)
    return
  }

  // 执行动作（如果有防抖，延迟执行）
  const executeActions = async () => {
    try {
      console.log(`[Rule Engine] Executing rule: ${rule.name}`)

      // 执行所有动作
      // rule.actions 是 Json 类型，需要转换为数组
      const actions = (Array.isArray(rule.actions) ? rule.actions : []) as Array<{
        deviceId: string
        vendor: ExtendedDeviceVendor
        action: string
        value?: any
      }>
      for (const action of actions) {
        await executeAction(action, rule.householdId)
      }

      // 更新执行统计
      await prisma.automationRule.update({
        where: { id: ruleId },
        data: {
          executionCount: { increment: 1 },
          lastExecutedAt: new Date(),
        },
      })

      throttleState.lastExecuted = Date.now()
      ruleThrottleState.set(ruleId, throttleState)
    } catch (error) {
      console.error(`[Rule Engine] Error executing rule ${ruleId}:`, error)
    }
  }

  if (rule.debounceMs) {
    // 防抖：延迟执行
    const timeout = setTimeout(executeActions, rule.debounceMs)
    throttleState.pendingTimeout = timeout
    ruleThrottleState.set(ruleId, throttleState)
  } else {
    // 立即执行
    await executeActions()
  }
}

/**
 * 执行单个动作
 */
async function executeAction(
  action: AutomationRule['actions'][0],
  householdId: string
): Promise<void> {
  try {
    // 获取目标设备
    const device = await prisma.ioTDevice.findFirst({
      where: {
        id: action.deviceId,
        householdId,
      },
    })

    if (!device) {
      console.error(`[Rule Engine] Target device not found: ${action.deviceId}`)
      return
    }

    // 使用内部 API 调用（不通过 HTTP）
    // 这样可以避免循环依赖和性能问题
    const { getMQTTClient } = await import('@/lib/mqtt-client')
    const { UnifiedAdapterFactory } = await import('@/lib/iot-adapters')
    
    const adapter = UnifiedAdapterFactory.getAdapter(device.vendor as any)
    
    if (device.connectionType === 'mqtt') {
      // MQTT 设备：通过 MQTT 发送命令
      const mqttClient = getMQTTClient()
      if (!mqttClient.isConnected()) {
        await mqttClient.connect()
      }

      const { AdapterFactory, TuyaAdapter, ESPAdapter, MideaAdapter } = await import('@/lib/mqtt-adapters')
      const mqttAdapter = AdapterFactory.getAdapter(device.vendor as any)
      
      let commandMessage
      if (action.action === 'power_on') {
        commandMessage = mqttAdapter.commands.powerOn(device.deviceId)
      } else if (action.action === 'power_off') {
        commandMessage = mqttAdapter.commands.powerOff(device.deviceId)
      } else if (action.action === 'set_temperature' && action.value !== undefined) {
        // setTemperature is only available on Tuya, ESP, and Midea adapters
        if (device.vendor === 'tuya') {
          commandMessage = TuyaAdapter.commands.setTemperature(device.deviceId, action.value)
        } else if (device.vendor === 'esp') {
          commandMessage = ESPAdapter.commands.setTemperature(device.deviceId, action.value)
        } else if (device.vendor === 'midea') {
          commandMessage = MideaAdapter.commands.setTemperature(device.deviceId, action.value)
        } else {
          throw new Error(`set_temperature not supported for vendor: ${device.vendor}`)
        }
      } else {
        commandMessage = mqttAdapter.createCommandMessage(device.deviceId, {
          action: action.action,
          value: action.value
        } as any)
      }

      await mqttClient.publish(commandMessage)
      console.log(`[Rule Engine] Successfully executed action ${action.action} on device ${device.id} via MQTT`)
    } else if (device.connectionType === 'restful') {
      // RESTful 设备：通过 HTTP API 发送命令
      if (!adapter.sendCommand) {
        console.error(`[Rule Engine] RESTful command not supported for device ${device.id}`)
        return
      }

      const command = adapter.createCommand(action.action, action.value)
      const config = {
        baseUrl: device.baseUrl || '',
        apiKey: device.apiKey || '',
        accessToken: device.accessToken || '',
        ...(device.metadata as any || {})
      }

      const success = await adapter.sendCommand(device.deviceId, command, config)
      if (success) {
        console.log(`[Rule Engine] Successfully executed action ${action.action} on device ${device.id} via RESTful API`)
      } else {
        console.error(`[Rule Engine] Failed to execute action on device ${device.id} via RESTful API`)
      }
    }
  } catch (error) {
    console.error(`[Rule Engine] Error executing action:`, error)
  }
}

/**
 * 重新加载规则（当规则被创建/更新/删除时调用）
 */
export async function reloadRules(householdId: string): Promise<void> {
  // 清理旧的订阅
  // TODO: 实现取消订阅逻辑
  
  // 重新初始化
  await initializeRuleEngine(householdId)
}

