/**
 * Web implementation of NativeBarcodeScanner
 * Falls back to QuaggaJS for web browsers
 */
import { WebPlugin } from '@capacitor/core'
import type { NativeBarcodeScannerPlugin } from './native-barcode-scanner'

export class NativeBarcodeScannerWeb extends WebPlugin implements NativeBarcodeScannerPlugin {
  async checkPermission(): Promise<{ granted: boolean; denied: boolean; asked: boolean }> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop())
      return { granted: true, denied: false, asked: true }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        return { granted: false, denied: true, asked: true }
      }
      return { granted: false, denied: false, asked: false }
    }
  }

  async requestPermission(): Promise<{ granted: boolean; denied: boolean; asked: boolean }> {
    return this.checkPermission()
  }

  async startScan(): Promise<{ hasContent: boolean; content: string; format: string }> {
    throw new Error('NativeBarcodeScanner: startScan is not implemented on web. Use QuaggaJS fallback.')
  }

  async stopScan(): Promise<void> {
    // No-op on web
  }

  async hideBackground(): Promise<void> {
    // No-op on web
  }

  async showBackground(): Promise<void> {
    // No-op on web
  }
}

