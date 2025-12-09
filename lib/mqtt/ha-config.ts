/**
 * MQTT Home Assistant Configuration Helper
 * Provides HA server configuration for MQTT integration per household
 */

import { prisma } from './prisma'

export interface HAConfigForMQTT {
  householdId: string
  baseUrl: string
  username: string | null
  accessToken: string
  serverIp: string | null
}

/**
 * Get Home Assistant configuration for a specific household
 * Used by MQTT system to connect to the household's HA server
 */
export async function getHAConfigForMQTT(householdId: string): Promise<HAConfigForMQTT | null> {
  try {
    const config = await prisma.homeAssistantConfig.findUnique({
      where: { householdId },
      select: {
        householdId: true,
        baseUrl: true,
        username: true,
        accessToken: true,
        serverIp: true,
      },
    })

    if (!config) {
      return null
    }

    return {
      householdId: config.householdId,
      baseUrl: config.baseUrl,
      username: config.username,
      accessToken: config.accessToken,
      serverIp: config.serverIp,
    }
  } catch (error) {
    console.error('Error fetching HA config for MQTT:', error)
    return null
  }
}

/**
 * Get all Home Assistant configurations for MQTT
 * Returns all household HA configs that MQTT system needs
 */
export async function getAllHAConfigsForMQTT(): Promise<HAConfigForMQTT[]> {
  try {
    const configs = await prisma.homeAssistantConfig.findMany({
      select: {
        householdId: true,
        baseUrl: true,
        username: true,
        accessToken: true,
        serverIp: true,
      },
    })

    return configs.map(config => ({
      householdId: config.householdId,
      baseUrl: config.baseUrl,
      username: config.username,
      accessToken: config.accessToken,
      serverIp: config.serverIp,
    }))
  } catch (error) {
    console.error('Error fetching all HA configs for MQTT:', error)
    return []
  }
}

/**
 * Get HA server IP for a household (for MQTT device discovery)
 */
export async function getHAServerIP(householdId: string): Promise<string | null> {
  const config = await getHAConfigForMQTT(householdId)
  return config?.serverIp || null
}

