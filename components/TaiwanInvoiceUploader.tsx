'use client'

import { useState, useRef } from 'react'
import { XMarkIcon, PhotoIcon, DocumentIcon } from '@heroicons/react/24/outline'
import { useLanguage } from './LanguageProvider'

interface TaiwanInvoiceUploaderProps {
  onClose: () => void
  onInvoiceDecoded: (invoiceData: any) => void
}

export default function TaiwanInvoiceUploader({ onClose, onInvoiceDecoded }: TaiwanInvoiceUploaderProps) {
  const { t, currentLanguage } = useLanguage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const [qrCodeData, setQrCodeData] = useState('')

  const handleFileUpload = async (file: File) => {
    if (!file) return

    setIsProcessing(true)
    setError(null)

    try {
      // Convert image to base64
      const base64 = await fileToBase64(file)
      
      // Send to Taiwan e-invoice decoder API with multiple QR code support
      const response = await fetch('/api/test/taiwan-einvoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          imageBase64: base64,
          analyzeMultipleCodes: true, // Flag to analyze multiple QR codes and barcodes
          receiptAnalysis: true // Flag for Taiwan receipt analysis
        })
      })

      const result = await response.json()

      if (response.ok && result.isValid) {
        onInvoiceDecoded(result)
      } else {
        // Check if the error is about QR code extraction not being implemented
        if (result.error && (result.error.includes('QR code extraction not yet implemented') || 
                           result.error.includes('No QR codes found in the uploaded image'))) {
          setShowManualInput(true)
          setError(currentLanguage === 'zh-TW' ? 
            '圖片QR碼自動識別尚未實現，請手動輸入QR碼內容' : 
            'Automatic QR code recognition not yet implemented. Please enter QR code data manually.')
        } else {
          // Provide more helpful error messages
          let errorMessage = result.error || 'Failed to decode Taiwan receipt'
          
          if (currentLanguage === 'zh-TW') {
            if (errorMessage.includes('Invalid Taiwan e-invoice format')) {
              errorMessage = '無法識別台灣發票格式，請確保照片清晰且包含完整的QR碼'
            } else if (errorMessage.includes('No valid QR codes found')) {
              errorMessage = '未找到有效的QR碼，請檢查照片是否清晰'
            } else {
              errorMessage = '台灣發票解析失敗，請重試或聯繫客服'
            }
          } else {
            if (errorMessage.includes('Invalid Taiwan e-invoice format')) {
              errorMessage = 'Cannot recognize Taiwan invoice format. Please ensure the photo is clear and contains complete QR codes'
            } else if (errorMessage.includes('No valid QR codes found')) {
              errorMessage = 'No valid QR codes found. Please check if the photo is clear'
            }
          }
          
          setError(errorMessage)
        }
      }
    } catch (error) {
      console.error('Error processing Taiwan receipt:', error)
      setError(currentLanguage === 'zh-TW' ? '處理台灣發票照片時發生錯誤' : 'Error processing Taiwan receipt photo')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleManualSubmit = async () => {
    if (!qrCodeData.trim()) {
      setError(currentLanguage === 'zh-TW' ? '請輸入QR碼內容' : 'Please enter QR code data')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/test/taiwan-einvoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          qrData: qrCodeData.trim()
        })
      })

      const result = await response.json()

      if (response.ok && result.isValid) {
        onInvoiceDecoded(result)
      } else {
        let errorMessage = result.error || 'Failed to decode Taiwan invoice'
        
        if (currentLanguage === 'zh-TW') {
          if (errorMessage.includes('Invalid Taiwan e-invoice format')) {
            errorMessage = '無法識別台灣發票格式，請檢查QR碼內容是否正確'
          } else {
            errorMessage = '台灣發票解析失敗，請檢查QR碼內容'
          }
        } else {
          if (errorMessage.includes('Invalid Taiwan e-invoice format')) {
            errorMessage = 'Cannot recognize Taiwan invoice format. Please check if the QR code data is correct'
          }
        }
        
        setError(errorMessage)
      }
    } catch (error) {
      console.error('Error processing manual QR code:', error)
      setError(currentLanguage === 'zh-TW' ? '處理QR碼時發生錯誤' : 'Error processing QR code')
    } finally {
      setIsProcessing(false)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        // Remove data URL prefix
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = error => reject(error)
    })
  }

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {currentLanguage === 'zh-TW' ? '上傳台灣發票照片' : 'Upload Taiwan Invoice Photo'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Camera Not Available Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <PhotoIcon className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  {currentLanguage === 'zh-TW' 
                    ? '相機不可用，請上傳台灣發票照片進行識別' 
                    : 'Camera not available, please upload Taiwan invoice photo for recognition'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <DocumentIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              {currentLanguage === 'zh-TW' ? '拖放台灣發票照片到這裡' : 'Drag Taiwan invoice photo here'}
            </p>
            <p className="text-gray-500 mb-4">
              {currentLanguage === 'zh-TW' ? '或點擊選擇檔案' : 'or click to select file'}
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <PhotoIcon className="h-4 w-4 mr-2" />
              {currentLanguage === 'zh-TW' ? '選擇照片' : 'Select Photo'}
            </button>
          </div>

          {/* Processing Status */}
          {isProcessing && (
            <div className="text-center">
              <div className="inline-flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm text-gray-600">
                  {currentLanguage === 'zh-TW' ? '正在處理台灣發票...' : 'Processing Taiwan invoice...'}
                </span>
              </div>
            </div>
          )}

          {/* Manual QR Code Input */}
          {showManualInput && (
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  {currentLanguage === 'zh-TW' ? '手動輸入QR碼內容' : 'Manual QR Code Input'}
                </h4>
                <textarea
                  value={qrCodeData}
                  onChange={(e) => setQrCodeData(e.target.value)}
                  placeholder={currentLanguage === 'zh-TW' 
                    ? '請輸入台灣發票QR碼的內容...' 
                    : 'Enter Taiwan invoice QR code content...'
                  }
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    onClick={() => setShowManualInput(false)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    {currentLanguage === 'zh-TW' ? '取消' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleManualSubmit}
                    disabled={isProcessing || !qrCodeData.trim()}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {currentLanguage === 'zh-TW' ? '解析' : 'Parse'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <XMarkIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              {currentLanguage === 'zh-TW' ? '使用說明：' : 'Instructions:'}
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {currentLanguage === 'zh-TW' ? (
                <>
                  <li>• 上傳包含台灣發票 QR 碼的照片</li>
                  <li>• 確保 QR 碼清晰可見</li>
                  <li>• 系統將自動解析發票資訊</li>
                  <li>• 支援常見圖片格式 (JPG, PNG, etc.)</li>
                </>
              ) : (
                <>
                  <li>• Upload photo containing Taiwan invoice QR code</li>
                  <li>• Ensure QR code is clearly visible</li>
                  <li>• System will automatically parse invoice information</li>
                  <li>• Supports common image formats (JPG, PNG, etc.)</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
