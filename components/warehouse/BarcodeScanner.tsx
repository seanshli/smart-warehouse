'use client'
// 條碼掃描器組件
// 支援原生掃描（iOS/Android）和網頁掃描（QuaggaJS）兩種模式

import { useEffect, useRef, useState } from 'react'
import { XMarkIcon, PencilIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { Capacitor } from '@capacitor/core'
import { NativeBarcodeScanner } from '@/lib/native-barcode-scanner'
import { Camera } from '@capacitor/camera'

// 條碼掃描器屬性介面
interface BarcodeScannerProps {
  onScan: (barcode: string) => void // 掃描成功回調
  onClose: () => void // 關閉回調
  onImageAnalysis?: (result: any) => void // 圖像分析回調（用於視覺識別）
  userLanguage?: string // 用戶語言（用於台灣電子發票檢測）
}

export default function BarcodeScanner({ onScan, onClose, onImageAnalysis, userLanguage = 'en' }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null) // 掃描器容器引用
  const fileInputRef = useRef<HTMLInputElement>(null) // 檔案輸入引用
  const [isScanning, setIsScanning] = useState(false) // 是否正在掃描
  const [error, setError] = useState<string | null>(null) // 錯誤訊息
  const [showManualInput, setShowManualInput] = useState(false) // 顯示手動輸入
  const [manualBarcode, setManualBarcode] = useState('') // 手動輸入的條碼
  const [isDragOver, setIsDragOver] = useState(false) // 拖放狀態
  const [isProcessingImage, setIsProcessingImage] = useState(false) // 處理圖像中
  const [isNative, setIsNative] = useState(false) // 是否使用原生掃描

  // 檢查原生掃描是否可用並檢查權限
  // 注意：Capacitor.isNativePlatform() 在 iOS/Android 的手機和平板上都返回 true
  // 這確保平板也使用原生條碼掃描以獲得更好的性能
  useEffect(() => {
    const checkNative = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // 檢查相機權限（先不強制，僅檢查）
          // 適用於手機和平板（iOS/Android）
          const permission = await NativeBarcodeScanner.checkPermission({ force: false })
          if (permission.granted) {
            setIsNative(true) // 已授權，使用原生掃描
          } else if (permission.asked) {
            // 已詢問但被拒絕 - 仍嘗試原生，會再次請求
            setIsNative(true)
          } else {
            // 尚未詢問 - 嘗試原生，會請求權限
            setIsNative(true)
          }
        } catch (err) {
          console.log('Native barcode scanner not available, using web fallback:', err)
          setIsNative(false) // 原生掃描不可用，使用網頁備援
        }
      } else {
        setIsNative(false) // 非原生平台，使用網頁掃描
      }
    }
    checkNative()
  }, [])

  // Native barcode scanning - iOS/Android full-screen camera
  useEffect(() => {
    if (!isNative) return

    let isActive = true
    let scanPromise: Promise<any> | null = null

    const startNativeScanning = async () => {
      try {
        setIsScanning(true)
        setError(null)

        // Check permission first
        const permission = await NativeBarcodeScanner.checkPermission({ force: true })
        if (!permission.granted) {
          // Request permission if not granted
          const requested = await NativeBarcodeScanner.requestPermission()
          if (!requested.granted) {
            setError('Camera permission denied. Please allow camera access in settings.')
            setIsScanning(false)
            setIsNative(false)
            return
          }
        }

        // Prepare the scanner (hide background, show camera)
        await NativeBarcodeScanner.hideBackground()

        // Start scanning - iOS shows full-screen camera, resolves when barcode detected or cancelled
        // The iOS implementation shows a full-screen camera overlay
        // startScan() will NOT resolve immediately - it waits for barcode detection or cancellation
        scanPromise = NativeBarcodeScanner.startScan()
        const result = await scanPromise

        if (isActive) {
          if (result.hasContent && result.content) {
            console.log('Native barcode detected:', result.content, 'Format:', result.format)
            onScan(result.content)
            
            // Clean up after successful scan
            try {
              await NativeBarcodeScanner.stopScan()
              await NativeBarcodeScanner.showBackground()
            } catch (cleanupErr) {
              console.warn('Cleanup error:', cleanupErr)
            }
          } else if (result.cancelled) {
            // User cancelled - close the modal
            try {
              await NativeBarcodeScanner.stopScan()
              await NativeBarcodeScanner.showBackground()
            } catch (cleanupErr) {
              console.warn('Cleanup error:', cleanupErr)
            }
            onClose()
          } else {
            // No content - close
            try {
              await NativeBarcodeScanner.stopScan()
              await NativeBarcodeScanner.showBackground()
            } catch (cleanupErr) {
              console.warn('Cleanup error:', cleanupErr)
            }
            onClose()
          }
        }
      } catch (err: any) {
        if (isActive) {
          console.error('Native barcode scan error:', err)
          console.error('Error details:', {
            message: err.message,
            code: err.code,
            name: err.name,
            stack: err.stack,
          })
          
          // Handle permission errors
          if (err.message?.includes('permission') || err.message?.includes('Permission') || err.message?.includes('denied')) {
            setError('Camera permission denied. Please allow camera access in settings.')
          } else if (err.message?.includes('cancel') || err.message?.includes('Cancel') || err.message?.includes('User')) {
            // User cancelled, just close
            onClose()
          } else if (
            err.message?.includes('not implemented') || 
            err.message?.includes('plugin is not implemented') ||
            err.message?.includes('not registered') ||
            err.code === 'UNIMPLEMENTED'
          ) {
            setError('Barcode scanner plugin is not properly registered. Please rebuild the native app in Xcode.')
            setIsNative(false) // Fall back to web scanner
          } else if (err.message?.includes('No camera available') || err.message?.includes('camera')) {
            setError('No camera available or camera is in use by another app.')
            setIsNative(false) // Fall back to web scanner
          } else {
            setError(`Failed to start native barcode scanner: ${err.message || 'Unknown error'}. Falling back to web scanner.`)
            setIsNative(false) // Fall back to web scanner
          }
          setIsScanning(false)
          
          // Clean up
          try {
            await NativeBarcodeScanner.stopScan()
            await NativeBarcodeScanner.showBackground()
          } catch (cleanupErr) {
            // Ignore cleanup errors
          }
        }
      } finally {
        if (isActive) {
          setIsScanning(false)
        }
      }
    }

    // Only start if component is mounted and native is enabled
    startNativeScanning()

    return () => {
      isActive = false
      // Cleanup native scanner
      if (scanPromise) {
        NativeBarcodeScanner.stopScan().catch(() => {})
        NativeBarcodeScanner.showBackground().catch(() => {})
      }
    }
  }, [isNative, onScan, onClose])

  // Web-based scanning (QuaggaJS) - fallback for web or if native fails
  useEffect(() => {
    if (isNative) return // Skip web scanner if native is available

    let quagga: any = null

    const startScanning = async () => {
      try {
        // Dynamically import QuaggaJS to avoid SSR issues
        const Quagga = (await import('quagga')).default

        setIsScanning(true)
        setError(null)

        Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: scannerRef.current,
            constraints: {
              width: 640,
              height: 480,
              facingMode: "environment", // Use back camera
            },
          },
          locator: {
            patchSize: "medium",
            halfSample: true,
          },
          numOfWorkers: 1, // Reduced workers for better compatibility
          frequency: 10,
          decoder: {
            readers: [
              "ean_reader", // Prioritize EAN reader for 13-digit barcodes
              "ean_8_reader",
              "upc_reader",
              "upc_e_reader",
              "code_128_reader",
              "code_39_reader",
              "code_39_vin_reader",
              "codabar_reader",
              "i2of5_reader"
            ],
          },
          locate: true,
        }, (err: any) => {
          if (err) {
            console.error('Quagga initialization error:', err)
            
            // Provide more specific error messages
            let errorMessage = 'Failed to initialize camera. '
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
              errorMessage += 'Camera access denied. Please allow camera permissions and try again.'
            } else if (err.name === 'NotFoundError') {
              errorMessage += 'No camera found. Please ensure your device has a camera.'
            } else if (err.name === 'NotSupportedError') {
              errorMessage += 'Camera not supported. Please try a different browser or device.'
            } else if (err.name === 'NotReadableError') {
              errorMessage += 'Camera is already in use by another application.'
            } else {
              errorMessage += 'Please check camera permissions and try again.'
            }
            
            setError(errorMessage)
            setIsScanning(false)
            return
          }
          console.log("Quagga initialization finished. Ready to start")
          Quagga.start()
          quagga = Quagga
        })

        // Handle successful barcode detection
        Quagga.onDetected((result: any) => {
          const code = result.codeResult.code
          console.log('Barcode detected:', code)
          onScan(code)
          Quagga.stop()
        })

      } catch (err) {
        console.error('Error starting camera scanner:', err)
        setError('Failed to start camera scanner. Please try again.')
        setIsScanning(false)
      }
    }

    // Start scanning when component mounts
    startScanning()

    // Cleanup function
    return () => {
      if (quagga) {
        try {
          quagga.stop()
        } catch (err) {
          console.error('Error stopping Quagga:', err)
        }
      }
    }
  }, [isNative, onScan])

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.')
      return
    }

    console.log('Processing file:', file.name, 'Type:', file.type, 'Size:', file.size)
    setIsProcessingImage(true)
    setError(null)

    try {
      // Use QuaggaJS to decode from static image
      const Quagga = (await import('quagga')).default
      
      const img = new Image()
      
      img.onload = () => {
        // Create a canvas and draw the image
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // Resize image if too large (max 800px width/height)
        let { width, height } = img
        const maxSize = 800
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height)
          width *= ratio
          height *= ratio
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw the resized image
        ctx?.drawImage(img, 0, 0, width, height)
        
        // Convert canvas to data URL
        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        
        console.log('Processing image with dimensions:', width, 'x', height)
        
        // Use Quagga to decode the image
        try {
          Quagga.decodeSingle({
          src: imageData,
          numOfWorkers: 0, // Disable workers for static image
          decoder: {
            readers: [
              "code_128_reader",
              "ean_reader",
              "ean_8_reader",
              "code_39_reader",
              "code_39_vin_reader",
              "codabar_reader",
              "upc_reader",
              "upc_e_reader",
              "i2of5_reader"
            ]
          },
          locate: true,
          locator: {
            patchSize: "medium",
            halfSample: true,
          }
        }, (result: any) => {
          console.log('Quagga decode result:', result)
          setIsProcessingImage(false)
          
          if (result && result.codeResult && result.codeResult.code) {
            console.log('Barcode detected in image:', result.codeResult.code)
            onScan(result.codeResult.code)
          } else {
            // Try alternative approach - use the image data directly
            console.log('No barcode found with Quagga, trying alternative method...')
            tryAlternativeDecode(imageData)
          }
        })
        } catch (quaggaError) {
          console.error('Quagga decode error:', quaggaError)
          setIsProcessingImage(false)
          setError('Failed to process the image. Please try manual input or a different image.')
        }
      }
      
      img.onerror = () => {
        setIsProcessingImage(false)
        setError('Failed to load the image. Please try a different file.')
      }
      
      img.src = URL.createObjectURL(file)
    } catch (err) {
      console.error('Error processing image:', err)
      setIsProcessingImage(false)
      setError('Failed to process the uploaded image. Please try again.')
    }
  }

  const tryAlternativeDecode = async (imageData: string) => {
    try {
      // Try with different Quagga settings
      const Quagga = (await import('quagga')).default
      
      Quagga.decodeSingle({
        src: imageData,
        numOfWorkers: 0,
        decoder: {
          readers: [
            "ean_reader",
            "ean_8_reader", 
            "upc_reader",
            "upc_e_reader",
            "code_128_reader",
            "code_39_reader",
            "code_39_vin_reader",
            "i2of5_reader"
          ]
        },
        locate: true,
        locator: {
          patchSize: "large", // Try larger patch size
          halfSample: false, // Try without half sampling
        }
      }, (result: any) => {
        console.log('Alternative decode result:', result)
        
        if (result && result.codeResult && result.codeResult.code) {
          console.log('Barcode detected with alternative method:', result.codeResult.code)
          onScan(result.codeResult.code)
        } else {
          // Try a third time with different settings for regional barcodes
          console.log('No result with alternative method, trying regional barcode settings...')
          tryRegionalDecode(imageData)
        }
      })
    } catch (err) {
      console.error('Alternative decode error:', err)
      setError('Failed to process the image. Please try a different file or use manual input.')
    }
  }

  const tryRegionalDecode = async (imageData: string) => {
    try {
      const Quagga = (await import('quagga')).default
      
      // Try with all possible readers and different settings
      Quagga.decodeSingle({
        src: imageData,
        numOfWorkers: 0,
        decoder: {
          readers: [
            "code_128_reader",
            "ean_reader",
            "ean_8_reader",
            "code_39_reader",
            "code_39_vin_reader",
            "codabar_reader",
            "upc_reader",
            "upc_e_reader",
            "i2of5_reader"
          ]
        },
        locate: true,
        locator: {
          patchSize: "small", // Try smaller patch size
          halfSample: true,   // Try with half sampling
        }
      }, (result: any) => {
        console.log('Regional decode result:', result)
        
        if (result && result.codeResult && result.codeResult.code) {
          console.log('Barcode detected with regional settings:', result.codeResult.code)
          onScan(result.codeResult.code)
        } else {
          // Final attempt - try with minimal settings
          console.log('Trying final attempt with minimal settings...')
          tryMinimalDecode(imageData)
        }
      })
    } catch (err) {
      console.error('Regional decode error:', err)
      setError('Failed to process the image. Please try manual input or a different image.')
    }
  }

  const tryMinimalDecode = async (imageData: string) => {
    try {
      const Quagga = (await import('quagga')).default
      
      // Final attempt with minimal settings
      Quagga.decodeSingle({
        src: imageData,
        numOfWorkers: 0,
        decoder: {
          readers: ["code_128_reader", "ean_reader", "code_39_reader"]
        },
        locate: false, // Disable locate for final attempt
      }, (result: any) => {
        console.log('Minimal decode result:', result)
        
        if (result && result.codeResult && result.codeResult.code) {
          console.log('Barcode detected with minimal settings:', result.codeResult.code)
          onScan(result.codeResult.code)
        } else {
          // Try one more time with Taiwan-specific settings
          console.log('Trying Taiwan-specific barcode detection...')
          tryTaiwanSpecificDecode(imageData)
        }
      })
    } catch (err) {
      console.error('Minimal decode error:', err)
      setError('Failed to process the image. Please use manual input for Taiwan 1D barcodes.')
    }
  }

  const tryTaiwanSpecificDecode = async (imageData: string) => {
    try {
      const Quagga = (await import('quagga')).default
      
      // Taiwan-specific attempt with Code 39 focus
      Quagga.decodeSingle({
        src: imageData,
        numOfWorkers: 0,
        decoder: {
          readers: ["code_39_reader", "code_39_vin_reader"] // Focus on Code 39 variants
        },
        locate: true,
        locator: {
          patchSize: "x-large", // Use largest patch size
          halfSample: false,    // No half sampling
        }
      }, (result: any) => {
        console.log('Taiwan-specific decode result:', result)
        
        if (result && result.codeResult && result.codeResult.code) {
          console.log('Barcode detected with Taiwan-specific settings:', result.codeResult.code)
          onScan(result.codeResult.code)
        } else {
          setError('No barcode found in the image. Taiwan 1D barcodes may need manual input. Please try typing the barcode manually or use a clearer image.')
        }
      })
    } catch (err) {
      console.error('Taiwan-specific decode error:', err)
      setError('Failed to process the image. Please use manual input for Taiwan 1D barcodes.')
    }
  }

  const handleVisionAnalysis = async (file: File | null) => {
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.')
      return
    }

    setIsProcessingImage(true)
    setError(null)

    try {
      // Convert file to base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string
        const base64Data = base64.split(',')[1]
        
        // Call the vision-based recognition API
        const response = await fetch('/api/ai/recognize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'barcode-image',
            imageBase64: base64Data
          })
        })

        if (response.ok) {
          const result = await response.json()
          console.log('Vision analysis result:', result)
          
          // If we have a barcode from the analysis, use it
          if (result.barcode) {
            onScan(result.barcode)
          } else {
            // Otherwise, pass the full result for manual review
            if (onImageAnalysis) {
              onImageAnalysis(result)
            }
          }
        } else {
          setError('Failed to analyze image with AI vision.')
        }
      }
      
      reader.readAsDataURL(file)
    } catch (err) {
      console.error('Error in vision analysis:', err)
      setIsProcessingImage(false)
      setError('Failed to process the image with AI vision.')
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const restartCamera = async () => {
    setError(null)
    setIsScanning(false)
    
    // Wait a moment then restart
    setTimeout(async () => {
      try {
        const Quagga = (await import('quagga')).default
        
        // Clean up any existing instance
        try {
          Quagga.stop()
        } catch (e) {
          // Ignore cleanup errors
        }
        
        setIsScanning(true)
        setError(null)

        Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: scannerRef.current,
            constraints: {
              width: 640,
              height: 480,
              facingMode: "environment",
            },
          },
          locator: {
            patchSize: "medium",
            halfSample: true,
          },
          numOfWorkers: 1,
          frequency: 10,
          decoder: {
            readers: [
              "ean_reader", // Prioritize EAN reader for 13-digit barcodes
              "ean_8_reader",
              "upc_reader",
              "upc_e_reader",
              "code_128_reader",
              "code_39_reader",
              "code_39_vin_reader",
              "codabar_reader",
              "i2of5_reader"
            ],
          },
          locate: true,
        }, (err: any) => {
          if (err) {
            console.error('Quagga restart error:', err)
            let errorMessage = 'Failed to restart camera. '
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
              errorMessage += 'Camera access denied. Please allow camera permissions.'
            } else if (err.name === 'NotFoundError') {
              errorMessage += 'No camera found.'
            } else if (err.name === 'NotSupportedError') {
              errorMessage += 'Camera not supported.'
            } else if (err.name === 'NotReadableError') {
              errorMessage += 'Camera is already in use.'
            } else {
              errorMessage += 'Please check camera permissions.'
            }
            setError(errorMessage)
            setIsScanning(false)
            return
          }
          console.log("Quagga restart successful")
          Quagga.start()
        })

        // Handle successful barcode detection
        Quagga.onDetected((result: any) => {
          const code = result.codeResult.code
          console.log('Barcode detected:', code)
          onScan(code)
          Quagga.stop()
        })

      } catch (err) {
        console.error('Error restarting scanner:', err)
        setError('Failed to restart camera scanner.')
        setIsScanning(false)
      }
    }, 500) // Wait 500ms before restarting
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-2 sm:p-4">
      <div className="relative top-4 sm:top-10 mx-auto p-4 sm:p-5 border w-full max-w-lg shadow-lg rounded-md bg-white max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg sm:text-xl font-medium text-gray-900">
            Scan Barcode
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <p className="text-xs sm:text-sm text-gray-600 px-1">
            Position the barcode within the camera view to scan, or upload an image.
          </p>

          {/* Drag and Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              Drag and drop an image here, or{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                browse files
              </button>
            </p>
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              {/* Photo Library Button - Native on iOS/Android */}
              {Capacitor.isNativePlatform() && (
                <button
                  onClick={async () => {
                    try {
                      setIsProcessingImage(true)
                      setError(null)
                      
                      const image = await Camera.pickImages({
                        quality: 90,
                        limit: 1,
                      })
                      
                      if (image.photos && image.photos.length > 0) {
                        const photo = image.photos[0]
                        // Convert webPath to File for processing
                        const response = await fetch(photo.webPath!)
                        const blob = await response.blob()
                        const file = new File([blob], 'photo.jpg', { type: blob.type })
                        await handleFileUpload(file)
                      }
                    } catch (err: any) {
                      console.error('Photo library error:', err)
                      if (err.message?.includes('cancel') || err.message?.includes('Cancel')) {
                        // User cancelled - no error needed
                      } else {
                        setError('Failed to access photo library. Please try again.')
                      }
                    } finally {
                      setIsProcessingImage(false)
                    }
                  }}
                  disabled={isProcessingImage}
                  className="flex-1 px-3 py-2 text-xs sm:text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  <PhotoIcon className="h-4 w-4" />
                  <span>Photo Library</span>
                </button>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 px-3 py-2 text-xs sm:text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center justify-center gap-1"
              >
                <PhotoIcon className="h-4 w-4" />
                <span>{Capacitor.isNativePlatform() ? 'Browse Files' : 'Browse Files'}</span>
              </button>
              <button
                onClick={() => {
                  const file = fileInputRef.current?.files?.[0]
                  if (file) handleFileUpload(file)
                }}
                disabled={!fileInputRef.current?.files?.[0] || isProcessingImage}
                className="flex-1 px-3 py-2 text-xs sm:text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <PhotoIcon className="h-4 w-4" />
                <span>Scan Barcode</span>
              </button>
              <button
                onClick={() => {
                  const file = fileInputRef.current?.files?.[0]
                  if (file) handleVisionAnalysis(file)
                }}
                disabled={!fileInputRef.current?.files?.[0] || isProcessingImage}
                className="flex-1 px-3 py-2 text-xs sm:text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <PhotoIcon className="h-4 w-4" />
                <span>AI Vision</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Supports JPG, PNG, GIF images with barcodes
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Tip: Use clear, well-lit images with visible barcodes
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* Camera View - Only show for web/fallback, native shows full-screen */}
          {!showManualInput && !isNative && (
            <div className="relative">
              <div
                ref={scannerRef}
                className={`w-full h-64 bg-gray-200 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center ${
                  isDragOver ? 'border-blue-500' : ''
                }`}
              >
                {isProcessingImage ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Processing image...</p>
                  </div>
                ) : isScanning ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Starting camera...</p>
                  </div>
                ) : error ? (
                  <div className="text-center text-red-600 p-4">
                    <p className="text-sm">{error}</p>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 p-4">
                    <p className="text-sm">Camera view will appear here</p>
                    <p className="text-xs mt-1">Or use Photo Library / Browse Files above</p>
                  </div>
                )}
              </div>
              
              <div className="mt-2 text-xs text-gray-500 text-center px-2">
                Supported formats: EAN-13, EAN-8, UPC, Code 128, Code 39, Codabar, I2of5 (Taiwan 1D compatible)
              </div>
            </div>
          )}
          
          {/* Native Scanner Status */}
          {isNative && isScanning && (
            <div className="relative">
              <div className="w-full h-64 bg-black rounded-lg flex items-center justify-center">
                <div className="text-center text-white p-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-sm font-medium">Native Camera Scanner Active</p>
                  <p className="text-xs mt-2 opacity-75">Point camera at barcode to scan</p>
                  <p className="text-xs mt-1 opacity-50">Tap Cancel button on camera view to close</p>
                </div>
              </div>
            </div>
          )}

          {/* Manual Input */}
          {showManualInput ? (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Enter Barcode Manually
                </label>
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Type or paste barcode here"
                  autoFocus
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-between">
                <button
                  onClick={() => setShowManualInput(false)}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back to Camera
                </button>
                <button
                  onClick={() => {
                    if (manualBarcode.trim()) {
                      onScan(manualBarcode.trim())
                    }
                  }}
                  disabled={!manualBarcode.trim()}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Use This Barcode
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 justify-between">
              <button
                onClick={onClose}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowManualInput(true)}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-blue-600 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center space-x-1"
              >
                <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Enter Manually</span>
              </button>
            </div>
          )}
          
          {error && !showManualInput && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={restartCamera}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}