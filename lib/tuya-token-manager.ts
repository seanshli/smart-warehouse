// Tuya Token Manager
// 统一管理 Tuya token 的验证、刷新和同步
// Unified management of Tuya token validation, refresh, and synchronization

import { prisma } from './prisma'
import { getUserTuyaCredentials, isTuyaTokenValid, saveTuyaAccessToken } from './tuya-user-manager'
import { getHouseholdTuyaCredentials } from './tuya-household-manager'

/**
 * Token 使用场景
 */
export type TokenUsage = 'provisioning' | 'device_control' | 'home_access'

/**
 * 获取用于特定操作的 Tuya token
 * Get Tuya token for specific operation
 */
export async function getTuyaTokenForOperation(
  userId: string,
  householdId: string,
  usage: TokenUsage
): Promise<{
  token: string | null
  account: string
  countryCode: string
  source: 'member' | 'household'
  needsRefresh: boolean
} | null> {
  try {
    // 1. 检查 Member 的 token
    const memberTokenValid = await isTuyaTokenValid(userId)
    
    if (memberTokenValid) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          tuyaAccessToken: true,
          tuyaAccount: true,
          tuyaCountryCode: true,
        },
      })

      if (user?.tuyaAccessToken) {
        return {
          token: user.tuyaAccessToken,
          account: user.tuyaAccount || '',
          countryCode: user.tuyaCountryCode || '886',
          source: 'member',
          needsRefresh: false,
        }
      }
    }

    // 2. 如果 Member token 无效或不存在，检查是否需要使用 Household token
    // 注意：Household token 目前没有实现，这里返回 null 表示需要重新登录
    if (usage === 'provisioning' || usage === 'home_access') {
      // 对于配网和 Home 访问，优先使用 Member token
      // 如果 Member token 无效，需要重新登录
      return {
        token: null,
        account: '',
        countryCode: '886',
        source: 'member',
        needsRefresh: true,
      }
    }

    // 3. 对于设备控制，如果 Member token 无效，尝试使用 Household token（如果实现）
    // 目前返回 null，表示需要重新登录
    return null
  } catch (error) {
    console.error('Error getting Tuya token for operation:', error)
    return null
  }
}

/**
 * 刷新 Member 的 Tuya token
 * Refresh Member's Tuya token
 */
export async function refreshMemberTuyaToken(userId: string): Promise<{
  success: boolean
  token: string | null
  error?: string
}> {
  try {
    // 获取 Member 的 Tuya 凭证
    const credentials = await getUserTuyaCredentials(userId)
    
    if (!credentials) {
      return {
        success: false,
        token: null,
        error: 'Tuya account not configured',
      }
    }

    // 注意：实际的 token 刷新需要通过 Tuya SDK 进行
    // 这里只是标记需要刷新，实际刷新在客户端（iOS/Android）完成
    // Note: Actual token refresh needs to be done via Tuya SDK
    // This just marks that refresh is needed, actual refresh happens on client

    return {
      success: true,
      token: null, // Token 将在客户端刷新后更新
      error: 'Token refresh required on client side',
    }
  } catch (error: any) {
    console.error('Error refreshing Member Tuya token:', error)
    return {
      success: false,
      token: null,
      error: error.message,
    }
  }
}

/**
 * 验证 Member 是否可以访问 Household 的 Tuya Home
 * Verify if Member can access Household's Tuya Home
 */
export async function verifyMemberAccessToTuyaHome(
  userId: string,
  householdId: string
): Promise<{
  canAccess: boolean
  tuyaHomeId: string | null
  memberTokenValid: boolean
  error?: string
}> {
  try {
    // 1. 检查 Household 是否有 Tuya Home
    const household = await prisma.household.findUnique({
      where: { id: householdId },
      select: {
        tuyaHomeId: true,
        members: {
          where: { userId },
          select: { role: true },
        },
      },
    })

    if (!household) {
      return {
        canAccess: false,
        tuyaHomeId: null,
        memberTokenValid: false,
        error: 'Household not found',
      }
    }

    if (!household.tuyaHomeId) {
      return {
        canAccess: false,
        tuyaHomeId: null,
        memberTokenValid: false,
        error: 'Household does not have a Tuya Home',
      }
    }

    // 2. 检查 Member 是否是 Household 的成员
    if (household.members.length === 0) {
      return {
        canAccess: false,
        tuyaHomeId: household.tuyaHomeId,
        memberTokenValid: false,
        error: 'User is not a member of this household',
      }
    }

    // 3. 检查 Member 的 Tuya token 是否有效
    const memberTokenValid = await isTuyaTokenValid(userId)

    return {
      canAccess: true,
      tuyaHomeId: household.tuyaHomeId,
      memberTokenValid,
      error: memberTokenValid ? undefined : 'Member Tuya token is invalid or expired',
    }
  } catch (error: any) {
    console.error('Error verifying Member access to Tuya Home:', error)
    return {
      canAccess: false,
      tuyaHomeId: null,
      memberTokenValid: false,
      error: error.message,
    }
  }
}

/**
 * 获取用于 MQTT 操作的上下文信息
 * Get context information for MQTT operations
 */
export async function getMQTTOperationContext(
  userId: string,
  householdId: string,
  deviceId: string
): Promise<{
  canControl: boolean
  tuyaHomeId: string | null
  memberTokenValid: boolean
  mqttTopic: string | null
  error?: string
}> {
  try {
    // 1. 验证 Member 可以访问 Household 的 Tuya Home
    const access = await verifyMemberAccessToTuyaHome(userId, householdId)
    
    if (!access.canAccess) {
      return {
        canControl: false,
        tuyaHomeId: null,
        memberTokenValid: false,
        mqttTopic: null,
        error: access.error,
      }
    }

    // 2. 获取设备信息
    const device = await prisma.ioTDevice.findUnique({
      where: { id: deviceId },
      select: {
        vendor: true,
        deviceId: true,
        topic: true,
        commandTopic: true,
        householdId: true,
      },
    })

    if (!device) {
      return {
        canControl: false,
        tuyaHomeId: access.tuyaHomeId,
        memberTokenValid: access.memberTokenValid,
        mqttTopic: null,
        error: 'Device not found',
      }
    }

    // 3. 验证设备属于该 Household
    if (device.householdId !== householdId) {
      return {
        canControl: false,
        tuyaHomeId: access.tuyaHomeId,
        memberTokenValid: access.memberTokenValid,
        mqttTopic: null,
        error: 'Device does not belong to this household',
      }
    }

    // 4. 构建 MQTT 主题
    const mqttTopic = device.commandTopic || device.topic || `${device.vendor}/${device.deviceId}/command`

    return {
      canControl: true,
      tuyaHomeId: access.tuyaHomeId,
      memberTokenValid: access.memberTokenValid,
      mqttTopic,
    }
  } catch (error: any) {
    console.error('Error getting MQTT operation context:', error)
    return {
      canControl: false,
      tuyaHomeId: null,
      memberTokenValid: false,
      mqttTopic: null,
      error: error.message,
    }
  }
}

