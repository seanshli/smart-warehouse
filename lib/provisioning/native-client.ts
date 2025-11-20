import { Capacitor } from '@capacitor/core'

import {
  TuyaProvisioning,
  type TuyaProvisioningResult,
  type TuyaQueryStatusOptions,
  type TuyaStartProvisioningOptions,
  type TuyaStopProvisioningOptions,
} from '@/lib/plugins/tuya'

export const canUseNativeTuyaProvisioning = (): boolean => {
  try {
    return Capacitor?.isNativePlatform?.() ?? false
  } catch {
    return false
  }
}

export const startNativeTuyaProvisioning = async (
  options: TuyaStartProvisioningOptions,
): Promise<TuyaProvisioningResult> => {
  return await TuyaProvisioning.startProvisioning(options)
}

export const getNativeTuyaProvisioningStatus = async (
  options: TuyaQueryStatusOptions,
): Promise<TuyaProvisioningResult> => {
  return await TuyaProvisioning.getStatus(options)
}

export const stopNativeTuyaProvisioning = async (
  options: TuyaStopProvisioningOptions,
): Promise<{ success: boolean }> => {
  return await TuyaProvisioning.stopProvisioning(options)
}


