'use client'

import { useEffect, useRef, useState } from 'react'
import { XMarkIcon, PencilIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { Capacitor } from '@capacitor/core'
import { BarcodeScanner } from '@capacitor-community/barcode-scanner'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
  onImageAnalysis?: (result: any) => void // New prop for vision-based analysis
  userLanguage?: string // User's language for Taiwan e-invoice detection
}

export default function BarcodeScanner({ onScan, onClose, onImageAnalysis, userLanguage = 'en' }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualBarcode, setManualBarcode] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const [isNative, setIsNative] = useState(false)

  // Check if native scanning is available and check permissions
  // Note: Capacitor.isNativePlatform() returns true for both phones and tablets on iOS/Android
  // This ensures tablets also use native barcode scanning for better performance
  useEffect(() => {
    const checkNative = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // Check camera permission
          // Works for both phones and tablets (iOS/Android)
          const permission = await BarcodeScanner.checkPermission({ force: false })
          if (permission.granted) {
            setIsNative(true)
          } else {
            console.log('Camera permission not granted, using web fallback')
            setIsNative(false)
          }
        } catch (err) {
          console.log('Native barcode scanner not available, using web fallback:', err)
          setIsNative(false)
        }
      } else {
        setIsNative(false)
      }
    }
    checkNative()
  }, [])

  // Native barcode scanning
  useEffect(() => {
    if (!isNative) return

    let isActive = true

    const startNativeScanning = async () => {
      try {
        setIsScanning(true)
        setError(null)

        // Check permission first
        const permission = await BarcodeScanner.checkPermission({ force: true })
        if (!permission.granted) {
          setError('Camera permission denied. Please allow camera access in settings.')
          setIsScanning(false)
          setIsNative(false)
          return
        }

        // Prepare the scanner (hide background, show camera)
        await BarcodeScanner.prepare()
        await BarcodeScanner.hideBackground()

        // Start scanning - this will resolve when a barcode is detected
        const result = await BarcodeScanner.startScan()

        if (isActive && result.hasContent && result.content) {
          console.log('Native barcode detected:', result.content, 'Format:', result.format)
          onScan(result.content)
          
          // Clean up
          await BarcodeScanner.stopScan()
          await BarcodeScanner.showBackground()
        } else if (isActive) {
          // User cancelled or no content
          await BarcodeScanner.stopScan()
          await BarcodeScanner.showBackground()
          onClose()
        }
      } catch (err: any) {
        if (isActive) {
          console.error('Native barcode scan error:', err)
          
          // Handle permission errors
          if (err.message?.includes('permission') || err.message?.includes('Permission') || err.message?.includes('denied')) {
            setError('Camera permission denied. Please allow camera access in settings.')
          } else if (err.message?.includes('cancel') || err.message?.includes('Cancel') || err.message?.includes('User')) {
            // User cancelled, just close
            onClose()
          } else {
            setError('Failed to start native barcode scanner. Falling back to web scanner.')
            setIsNative(false) // Fall back to web scanner
          }
          setIsScanning(false)
          
          // Clean up
          try {
            await BarcodeScanner.stopScan()
            await BarcodeScanner.showBackground()
          } catch (cleanupErr) {
            // Ignore cleanup errors
          }
        }
      }
    }

    startNativeScanning()

    return () => {
      isActive = false
      // Cleanup native scanner
      BarcodeScanner.stopScan().catch(() => {})
      BarcodeScanner.showBackground().catch(() => {})
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Scan Barcode
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
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
            <div className="mt-3 flex space-x-2">
              <button
                onClick={() => {
                  const file = fileInputRef.current?.files?.[0]
                  if (file) handleFileUpload(file)
                }}
                disabled={!fileInputRef.current?.files?.[0]}
                className="flex-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
              >
                Scan Barcode
              </button>
              <button
                onClick={() => {
                  const file = fileInputRef.current?.files?.[0]
                  if (file) handleVisionAnalysis(file)
                }}
                disabled={!fileInputRef.current?.files?.[0]}
                className="flex-1 px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
              >
                AI Vision Analysis
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

          {/* Camera View */}
          {!showManualInput && (
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
                  <div className="text-center text-red-600">
                    <p className="text-sm">{error}</p>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <p className="text-sm">Camera view will appear here</p>
                  </div>
                )}
              </div>
              
              <div className="mt-2 text-xs text-gray-500 text-center">
                Supported formats: EAN-13, EAN-8, UPC, Code 128, Code 39, Codabar, I2of5 (Taiwan 1D compatible)
              </div>
            </div>
          )}

          {/* Manual Input */}
          {showManualInput ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Barcode Manually
                </label>
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Type or paste barcode here"
                  autoFocus
                />
              </div>
              <div className="flex justify-between">
                <button
                  onClick={() => setShowManualInput(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Use This Barcode
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowManualInput(true)}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center space-x-1"
              >
                <PencilIcon className="h-4 w-4" />
                <span>Enter Manually</span>
              </button>
            </div>
          )}
          
          {error && !showManualInput && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={restartCamera}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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