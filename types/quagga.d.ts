declare module 'quagga' {
  interface QuaggaConfig {
    inputStream: {
      name: string
      type: string
      target: HTMLElement | null
      constraints: {
        width: number
        height: number
        facingMode: string
      }
    }
    locator: {
      patchSize: string
      halfSample: boolean
    }
    numOfWorkers: number
    frequency: number
    decoder: {
      readers: string[]
    }
    locate: boolean
  }

  interface QuaggaResult {
    codeResult: {
      code: string
      format: string
      start: number
      end: number
      codeset: number
      startInfo: any
      decodedCodes: any[]
    }
  }

  interface QuaggaJS {
    init(config: QuaggaConfig, callback: (err: any) => void): void
    start(): void
    stop(): void
    onDetected(callback: (result: QuaggaResult) => void): void
    decodeSingle(config: any, callback: (result: QuaggaResult | null) => void): void
  }

  const Quagga: QuaggaJS
  export default Quagga
}
