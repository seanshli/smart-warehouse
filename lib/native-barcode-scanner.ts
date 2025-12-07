import { registerPlugin } from '@capacitor/core'

export interface NativeBarcodeScannerPlugin {
  /**
   * Check camera permission status
   */
  checkPermission(options?: { force?: boolean }): Promise<{
    granted: boolean
    denied: boolean
    asked: boolean
  }>

  /**
   * Request camera permission
   */
  requestPermission(): Promise<{
    granted: boolean
    denied: boolean
    asked: boolean
  }>

  /**
   * Start scanning for barcodes/QR codes
   * Returns immediately, scanning continues until a barcode is detected
   */
  startScan(): Promise<{
    hasContent: boolean
    content: string
    format: string
  }>

  /**
   * Stop scanning
   */
  stopScan(): Promise<void>

  /**
   * Hide background (for full-screen camera view)
   */
  hideBackground(): Promise<void>

  /**
   * Show background (restore normal view)
   */
  showBackground(): Promise<void>
}

const NativeBarcodeScanner = registerPlugin<NativeBarcodeScannerPlugin>('NativeBarcodeScanner', {
  web: () => import('./native-barcode-scanner.web').then(m => new m.NativeBarcodeScannerWeb()),
})

export { NativeBarcodeScanner }

