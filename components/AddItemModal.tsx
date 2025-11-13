'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useDropzone } from 'react-dropzone'
import { XMarkIcon, CameraIcon, QrCodeIcon, DocumentIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import BarcodeScanner from './BarcodeScanner'
import TaiwanInvoiceUploader from './TaiwanInvoiceUploader'
import { useLanguage } from './LanguageProvider'
import { useHousehold } from './HouseholdProvider'
// AI functions are now called via API route

interface AddItemModalProps {
  onClose: () => void
}

export default function AddItemModal({ onClose }: AddItemModalProps) {
  const { data: session } = useSession()
  const { t, currentLanguage } = useLanguage()
  const { household } = useHousehold()

  // Helper function to call AI recognition API
  const callAIRecognition = async (type: 'image' | 'barcode', data: string) => {
    try {
      console.log('Calling AI recognition:', { type, data: data.substring(0, 50) + '...' })
      
      const requestBody = type === 'barcode' 
        ? { type: 'barcode', barcode: data }
        : { type: 'image', imageBase64: data }

      const response = await fetch('/api/ai/recognize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('AI recognition response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('AI recognition failed:', errorText)
        throw new Error(`AI recognition failed: ${errorText}`)
      }

      const result = await response.json()
      console.log('AI recognition result:', result)
      return result
    } catch (error) {
      console.error('AI recognition error:', error)
      return {
        name: t('unknownItem'),
        description: t('unableToRecognize'),
        category: t('miscellaneous'),
        confidence: 0
      }
    }
  }
  const [step, setStep] = useState<'input' | 'ai-review' | 'details' | 'location'>('input')
  const [inputMethod, setInputMethod] = useState<'photo' | 'camera' | 'barcode' | 'qr' | 'taiwan-invoice' | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [barcodeValue, setBarcodeValue] = useState('')
  const [qrValue, setQrValue] = useState('')
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [showTaiwanInvoiceUploader, setShowTaiwanInvoiceUploader] = useState(false)
  const [aiResult, setAiResult] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('')
  const [selectedLevel3Id, setSelectedLevel3Id] = useState('')
  const [aiReviewSelectedCategoryId, setAiReviewSelectedCategoryId] = useState('')
  const [aiReviewSelectedSubcategoryId, setAiReviewSelectedSubcategoryId] = useState('')
  const [aiReviewSelectedLevel3Id, setAiReviewSelectedLevel3Id] = useState('')

  // Tags
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  // Room and cabinet data
  const [rooms, setRooms] = useState<any[]>([])
  const [cabinets, setCabinets] = useState<any[]>([])
  const [loadingRooms, setLoadingRooms] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: 1,
    minQuantity: 0,
    category: '',
    subcategory: '',
    level3: '',
    tags: [] as string[],
    room: '',
    cabinet: '',
    barcode: '',
    qrCode: '',
    imageUrl: '',
    language: '', // Language override for this item
    // Taiwan invoice fields
    buyDate: '',
    buyCost: 0,
    buyLocation: '',
    invoiceNumber: '',
    sellerName: ''
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        await handleImageUpload(acceptedFiles[0])
      }
    }
  })

  // Fetch categories
  const fetchCategories = async () => {
    if (!household?.id) {
      console.log('AddItemModal: No household ID, skipping categories fetch')
      return
    }
    
    try {
      const response = await fetch(`/api/categories?householdId=${household.id}&language=${currentLanguage}`)
      if (response.ok) {
        const data = await response.json()
        console.log('AddItemModal: Fetched categories for household:', household.id, 'language:', currentLanguage)
        setCategories(data.categories || data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  // Fetch rooms and cabinets
  useEffect(() => {
    const fetchRooms = async () => {
      if (!household?.id) {
        console.log('AddItemModal: No household ID, skipping rooms fetch')
        return
      }
      
      try {
        setLoadingRooms(true)
        const response = await fetch(`/api/rooms?householdId=${household.id}&language=${currentLanguage}`)
        if (response.ok) {
          const roomsData = await response.json()
          console.log('AddItemModal: Fetched rooms for household:', household.id, 'language:', currentLanguage, 'roomsData:', roomsData)
          const roomsArray = roomsData.rooms || roomsData
          console.log('AddItemModal: Setting rooms array:', roomsArray)
          setRooms(roomsArray) // Handle both old and new API response formats
        } else {
          console.error('AddItemModal: Failed to fetch rooms, status:', response.status)
        }
      } catch (error) {
        console.error('Failed to fetch rooms:', error)
      } finally {
        setLoadingRooms(false)
      }
    }

    fetchRooms()
  }, [household?.id, currentLanguage])

  useEffect(() => {
    if (step === 'details' || step === 'ai-review') {
      fetchCategories()
    }
  }, [step, household?.id, currentLanguage])

  // Fetch cabinets when room changes
  useEffect(() => {
    const fetchCabinets = async () => {
      if (!formData.room) {
        console.log('AddItemModal: No room selected, clearing cabinets')
        setCabinets([])
        return
      }

      try {
        const response = await fetch(`/api/cabinets?roomId=${formData.room}`)
        
        if (response.ok) {
          const cabinetsData = await response.json()
          
          // Sort cabinets to put A first, then B, C, D, etc.
          const sortedCabinets = cabinetsData.sort((a: any, b: any) => {
            const aName = a.name.toUpperCase()
            const bName = b.name.toUpperCase()
            if (aName === 'A') return -1
            if (bName === 'A') return 1
            return aName.localeCompare(bName)
          })
          
          setCabinets(sortedCabinets)
          
          // Auto-select cabinet A if available
          const cabinetA = sortedCabinets.find((cabinet: any) => cabinet.name.toUpperCase() === 'A')
          if (cabinetA) {
            setFormData(prev => ({ ...prev, cabinet: cabinetA.id }))
          }
        } else {
          console.error('AddItemModal: Failed to fetch cabinets, status:', response.status)
        }
      } catch (error) {
        console.error('AddItemModal: Failed to fetch cabinets:', error)
      }
    }

    fetchCabinets()
  }, [formData.room, rooms])

  const handleImageUpload = async (file: File) => {
    setIsProcessing(true)
    try {
      console.log('Processing image file:', file.name, file.size, file.type)
      
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string
        const base64Data = base64.split(',')[1]
        
        console.log('Image loaded, base64 length:', base64Data.length)
        setPreview(base64)
        
        // Show AI processing message
        toast.loading('🤖 ChatGPT is analyzing your image...', { id: 'ai-processing' })
        
        // Use AI to recognize the item
        const result = await callAIRecognition('image', base64Data)

        console.log('AI Recognition Result:', result)

        // Store AI result for review
        setAiResult(result)
        setFormData(prev => ({
          ...prev,
          imageUrl: base64
        }))

        // Dismiss loading toast
        toast.dismiss('ai-processing')
        
        // If AI recognition failed (no API key), still allow manual entry
        if (result && result.name === 'Unknown Item' && result.description.includes('AI recognition not available')) {
          toast('AI recognition not available. Please enter item details manually.', { icon: 'ℹ️' })
          setStep('details')
        } else {
          setStep('ai-review')
          toast.success('✅ AI recognition completed! Please review the results.')
        }
      }
      
      reader.onerror = () => {
        console.error('FileReader error')
        toast.error('Failed to read image file')
        setIsProcessing(false)
      }
      
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Image upload error:', error)
      toast.error('Failed to process image')
      setIsProcessing(false)
    }
  }

  const handleBarcodeSubmit = async (skipAI = false) => {
    if (!barcodeValue.trim()) return
    
    // Store barcode in form data first
    setFormData(prev => ({
      ...prev,
      barcode: barcodeValue
    }))

    if (skipAI) {
      // Skip AI recognition and go directly to manual form
      toast.success('Barcode recorded. Please fill in the item details manually.')
      setStep('details')
      return
    }
    
    setIsProcessing(true)
    try {
      // Show AI processing message
      toast.loading('🤖 ChatGPT is analyzing the barcode...', { id: 'ai-processing' })
      
      const result = await callAIRecognition('barcode', barcodeValue)

      // Dismiss loading toast
      toast.dismiss('ai-processing')

      // Store AI result for review
      setAiResult(result)
      setStep('ai-review')
      toast.success('✅ AI recognition completed! Please review the results.')
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss('ai-processing')
      toast.error('Failed to recognize barcode')
      // If AI fails, offer manual input option
      toast('AI recognition failed. You can fill in details manually.', {
        duration: 4000
      })
      // Auto-redirect to manual input after a short delay
      setTimeout(() => {
        setStep('details')
        toast.success('Please fill in the item details manually.')
      }, 2000)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBarcodeScan = (scannedBarcode: string) => {
    setBarcodeValue(scannedBarcode)
    setShowBarcodeScanner(false)
    toast.success(`Barcode scanned: ${scannedBarcode}`)
  }

  const handleQRSubmit = async () => {
    if (!qrValue.trim()) return
    
    // For QR codes, we'll treat them similar to barcodes
    setIsProcessing(true)
    try {
      // Show AI processing message
      toast.loading('🤖 ChatGPT is analyzing the QR code...', { id: 'ai-processing' })
      
      const result = await callAIRecognition('barcode', qrValue)

      // Dismiss loading toast
      toast.dismiss('ai-processing')

      // Store AI result for review
      setAiResult(result)
           setFormData(prev => ({
             ...prev,
             qrCode: qrValue
           }))

           setStep('ai-review')
           toast.success('✅ AI recognition completed! Please review the results.')
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss('ai-processing')
      toast.error('Failed to recognize QR code')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTaiwanInvoiceDecoded = (invoiceData: any) => {
    console.log('Taiwan invoice decoded:', invoiceData)
    setShowTaiwanInvoiceUploader(false)
    
    // Set AI result to show in review with invoice items
    setAiResult({
      name: `台灣發票 - ${invoiceData.invoiceData.sellerName}`,
      description: `發票號碼: ${invoiceData.invoiceData.invoiceNumber}, 日期: ${invoiceData.invoiceData.invoiceDate}, 總金額: $${invoiceData.invoiceData.totalAmount}`,
      category: '台灣進口',
      subcategory: '發票',
      confidence: 95,
      language: 'zh-TW',
      source: 'taiwan_invoice',
      invoiceData: invoiceData,
      invoiceItems: invoiceData.invoiceData.items || [],
      showInvoiceItems: true // Flag to show special invoice item display
    })
    
    // Set form data with Taiwan invoice information
    setFormData(prev => ({
      ...prev,
      name: `台灣發票 - ${invoiceData.invoiceData.sellerName}`,
      description: `發票號碼: ${invoiceData.invoiceData.invoiceNumber}, 日期: ${invoiceData.invoiceData.invoiceDate}, 總金額: $${invoiceData.invoiceData.totalAmount}`,
      category: '台灣進口',
      subcategory: '發票',
      qrCode: `TAIWAN_INVOICE_${invoiceData.invoiceData.invoiceNumber}`,
      buyDate: invoiceData.invoiceData.invoiceDate,
      buyCost: invoiceData.invoiceData.totalAmount,
      buyLocation: invoiceData.invoiceData.sellerName,
      invoiceNumber: invoiceData.invoiceData.invoiceNumber,
      sellerName: invoiceData.invoiceData.sellerName
    }))
    
    toast.success(currentLanguage === 'zh-TW' ? '台灣發票解析成功！' : 'Taiwan invoice decoded successfully!')
    setStep('ai-review')
  }

  // Function to save barcode data to database when user confirms it
  const saveBarcodeData = async () => {
    if (formData.barcode && aiResult) {
      try {
        const response = await fetch('/api/barcodes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            barcode: formData.barcode,
            name: formData.name,
            description: formData.description,
            category: formData.category,
            subcategory: formData.subcategory,
            confidence: aiResult.confidence || 90,
            source: 'user',
            isVerified: true
          })
        })
        
        if (response.ok) {
          console.log('Barcode data saved to database')
        }
      } catch (error) {
        console.error('Failed to save barcode data:', error)
      }
    }
  }

  const handleSubmit = async () => {
    try {
      if (!household?.id) {
        toast.error('No active household selected')
        return
      }
      
      console.log('Submitting item to household:', household.id)
      console.log('Submitting item:', formData)
      
      // Save barcode data to database if available
      await saveBarcodeData()
      
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookies for authentication
        body: JSON.stringify({
          ...formData,
          householdId: household.id,
          tags: tags
        }),
      })

      console.log('Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Item created successfully:', result)
        toast.success('Item added successfully!')
        onClose()
      } else {
        const errorData = await response.json()
        console.error('Failed to add item:', errorData)
        toast.error(`Failed to add item: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error adding item:', error)
      toast.error('An error occurred while adding the item')
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50 mobile-portrait-scroll">
      <div className="relative top-4 sm:top-10 md:top-20 mx-auto p-4 sm:p-5 border w-11/12 md:w-3/4 lg:w-1/2 tablet-10:w-2/3 shadow-lg rounded-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 iphone-modal mobile-portrait-modal tablet-10-modal">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {t('addItem')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {step === 'input' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">
                {t('howWouldYouLikeToAddThisItem')}
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setInputMethod('photo')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <div className="text-center">
                    <div className="mx-auto h-12 w-12 text-gray-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{t('uploadPhoto')}</p>
                  </div>
                </button>

                <button
                  onClick={() => setInputMethod('camera')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <div className="text-center">
                    <CameraIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">{t('takePhoto')}</p>
                  </div>
                </button>

                <button
                  onClick={() => setInputMethod('barcode')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <div className="text-center">
                    <div className="mx-auto h-12 w-12 text-gray-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{t('scanBarcode')}</p>
                  </div>
                </button>

                <button
                  onClick={() => setInputMethod('qr')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <div className="text-center">
                    <QrCodeIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">{t('scanQRCode')}</p>
                  </div>
                </button>

                {(currentLanguage === 'zh-TW' || inputMethod === 'taiwan-invoice') && (
                  <button
                    onClick={() => setInputMethod('taiwan-invoice')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors col-span-2"
                  >
                    <div className="text-center">
                      <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        {currentLanguage === 'zh-TW' ? t('taiwanInvoice') : t('taiwanInvoice')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {currentLanguage === 'zh-TW' ? '台灣電子發票' : 'Taiwan E-Invoice'}
                      </p>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Photo Upload */}
            {inputMethod === 'photo' && (
              <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500">
                <input {...getInputProps()} />
                {isDragActive ? (
                  <p className="text-primary-600">{t('dropImageHere')}</p>
                ) : (
                  <div>
                    <div className="mx-auto h-12 w-12 text-gray-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      {t('dragAndDropImage')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Camera Input */}
            {inputMethod === 'camera' && (
              <div className="text-center">
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleImageUpload(e.target.files[0])
                    }
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <CameraIcon className="h-4 w-4 mr-2" />
                  {t('openCamera')}
                </button>
              </div>
            )}

            {/* Barcode Input */}
            {inputMethod === 'barcode' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Barcode/UPC Code
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={barcodeValue}
                      onChange={(e) => setBarcodeValue(e.target.value)}
                      className="flex-1 mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      placeholder={t('enterOrScanBarcode')}
                    />
                    <button
                      onClick={() => setShowBarcodeScanner(true)}
                      className="mt-1 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      title="Scan with camera"
                    >
                      <CameraIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleBarcodeSubmit(false)}
                    disabled={isProcessing || !barcodeValue.trim()}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                  >
                    {isProcessing ? t('processing') : t('aiRecognize')}
                  </button>
                  <button
                    onClick={() => handleBarcodeSubmit(true)}
                    disabled={isProcessing || !barcodeValue.trim()}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    {t('manualInput')}
                  </button>
                </div>
              </div>
            )}

            {/* QR Code Input */}
            {inputMethod === 'qr' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    QR Code
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={qrValue}
                      onChange={(e) => setQrValue(e.target.value)}
                      className="flex-1 mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="Enter or scan QR code"
                    />
                    <button
                      onClick={() => setShowBarcodeScanner(true)}
                      className="mt-1 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      title="Scan QR code with camera"
                    >
                      <CameraIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleQRSubmit}
                  disabled={isProcessing || !qrValue.trim()}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Recognize Item'}
                </button>
              </div>
            )}

            {/* Taiwan Invoice Upload */}
            {inputMethod === 'taiwan-invoice' && (
              <div className="space-y-4">
                <div className="text-center">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {currentLanguage === 'zh-TW' ? t('scanTaiwanInvoice') : 'Scan Taiwan Invoice'}
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    {currentLanguage === 'zh-TW' 
                      ? '當相機不可用時，請上傳台灣電子發票照片進行識別'
                      : 'When camera is unavailable, please upload Taiwan e-invoice photo for recognition'
                    }
                  </p>
                </div>
                <TaiwanInvoiceUploader 
                  onInvoiceDecoded={handleTaiwanInvoiceDecoded}
                  onClose={() => setInputMethod(null)}
                />
              </div>
            )}
          </div>
        )}

               {step === 'ai-review' && (
                 <div className="space-y-4 max-h-[70vh] overflow-y-auto mobile-portrait-scroll md:max-h-[75vh] tablet-10:max-h-[80vh]">
                   <div className="text-center">
                     <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                       AI Recognition Results
                     </h4>
                     <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                       Please review and edit the AI-recognized information below. This data will be saved to the barcode database for future use.
                     </p>
                     {formData.barcode && (
                       <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                         <div className="flex">
                           <div className="flex-shrink-0">
                             <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                               <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                             </svg>
                           </div>
                           <div className="ml-3">
                             <h3 className="text-sm font-medium text-blue-800">
                               Barcode Learning
                             </h3>
                             <div className="mt-2 text-sm text-blue-700">
                               <p>Barcode: <code className="bg-blue-100 px-1 rounded">{formData.barcode}</code> will be added to the system database for faster recognition next time.</p>
                             </div>
                           </div>
                         </div>
                       </div>
                     )}
                     {aiResult?.confidence && aiResult.confidence < 80 && (
                       <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                         <div className="flex">
                           <div className="flex-shrink-0">
                             <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                               <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                             </svg>
                           </div>
                           <div className="ml-3">
                             <h3 className="text-sm font-medium text-yellow-800">
                               Low AI Confidence
                             </h3>
                             <div className="mt-2 text-sm text-yellow-700">
                               <p>The AI recognition has low confidence ({aiResult.confidence}%). Please verify and correct the information below.</p>
                             </div>
                           </div>
                         </div>
                       </div>
                     )}
                   </div>

                   {preview && (
                     <div className="text-center">
                       <img src={preview} alt="Preview" className="mx-auto h-20 w-20 object-cover rounded-lg" />
                     </div>
                   )}

                   <div className="space-y-3">
                     {/* Taiwan Invoice Items Display */}
                     {aiResult?.showInvoiceItems && aiResult?.invoiceItems && (
                       <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-md p-4 mb-4">
                         <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-3">
                           {currentLanguage === 'zh-TW' ? '發票項目' : 'Invoice Items'}
                         </h3>
                         <div className="space-y-2 max-h-48 overflow-y-auto">
                           {aiResult.invoiceItems.map((item: any, index: number) => (
                             <div key={index} className="bg-white dark:bg-gray-800 p-2 rounded border text-sm">
                               <div className="flex justify-between items-center">
                                 <span className="font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
                                 <span className="text-gray-600 dark:text-gray-400">${item.amount}</span>
                               </div>
                               <div className="text-xs text-gray-500 dark:text-gray-400">
                                 {currentLanguage === 'zh-TW' ? '數量' : 'Qty'}: {item.quantity} | 
                                 {currentLanguage === 'zh-TW' ? '單價' : 'Price'}: ${item.price}
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}

                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                         {t('itemName')}
                       </label>
                       <input
                         type="text"
                         value={aiResult?.name || ''}
                         onChange={(e) => setAiResult((prev: any) => ({ ...prev, name: e.target.value }))}
                         className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                       />
                     </div>

                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                         {t('description')}
                       </label>
                       <textarea
                         value={aiResult?.description || ''}
                         onChange={(e) => setAiResult((prev: any) => ({ ...prev, description: e.target.value }))}
                         rows={3}
                         className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                       />
                     </div>

                     {/* Taiwan Invoice Specific Fields */}
                     {aiResult?.source === 'taiwan_invoice' && (
                       <div className="grid grid-cols-2 gap-4">
                         <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                             {currentLanguage === 'zh-TW' ? '購買日期' : 'Buy Date'}
                           </label>
                           <input
                             type="date"
                             value={formData.buyDate || ''}
                             onChange={(e) => setFormData(prev => ({ ...prev, buyDate: e.target.value }))}
                             className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                           />
                         </div>
                         <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                             {currentLanguage === 'zh-TW' ? '購買金額' : 'Buy Cost'}
                           </label>
                           <input
                             type="number"
                             step="0.01"
                             value={formData.buyCost || ''}
                             onChange={(e) => setFormData(prev => ({ ...prev, buyCost: parseFloat(e.target.value) || 0 }))}
                             className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                           />
                         </div>
                         <div className="col-span-2">
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                             {currentLanguage === 'zh-TW' ? '購買地點' : 'Buy Location'}
                           </label>
                           <input
                             type="text"
                             value={formData.buyLocation || ''}
                             onChange={(e) => setFormData(prev => ({ ...prev, buyLocation: e.target.value }))}
                             className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                           />
                         </div>
                       </div>
                     )}

                     {/* Image Upload */}
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                         {t('uploadPhoto')}
                       </label>
                       <div className="mt-1">
                         <div
                           {...getRootProps()}
                           className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                             isDragActive
                               ? 'border-primary-400 bg-primary-50 dark:bg-primary-900'
                               : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                           }`}
                         >
                           <input {...getInputProps()} />
                           {formData.imageUrl ? (
                             <div className="space-y-2">
                               <img
                                 src={formData.imageUrl}
                                 alt="Item preview"
                                 className="mx-auto h-24 w-24 object-cover rounded-lg"
                               />
                               <p className="text-sm text-gray-600 dark:text-gray-400">
                                 {t('clickToChangePhoto')}
                               </p>
                             </div>
                           ) : (
                             <div className="space-y-2">
                               <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                 <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                               </svg>
                               <p className="text-sm text-gray-600 dark:text-gray-400">
                                 {t('dragAndDropImage')} {t('orClickToSelect')}
                               </p>
                             </div>
                           )}
                         </div>
                       </div>
                     </div>

                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                         {t('category')}
                       </label>
                       <div className="flex gap-2">
                         <select
                           value={aiReviewSelectedCategoryId}
                           onChange={(e) => {
                             const categoryId = e.target.value
                             setAiReviewSelectedCategoryId(categoryId)
                             const selectedCategory = categories.find(cat => cat.id === categoryId)
                             if (selectedCategory) {
                               setAiResult((prev: any) => ({ 
                                 ...prev, 
                                 category: selectedCategory.name,
                                 subcategory: selectedCategory.children?.[0]?.name || ''
                               }))
                             }
                           }}
                           className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                         >
                           <option value="">{t('selectCategory')}</option>
                           {categories.map((category) => (
                             <option key={category.id} value={category.id}>
                               {category.name}
                             </option>
                           ))}
                         </select>
                         <input
                           type="text"
                           placeholder={t('orEnterCustom')}
                           value={aiReviewSelectedCategoryId ? '' : aiResult?.category || ''}
                           onChange={(e) => {
                             if (!aiReviewSelectedCategoryId) {
                               setAiResult((prev: any) => ({ ...prev, category: e.target.value }))
                             }
                           }}
                           className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                         />
                       </div>
                     </div>

                     <div>
                       <label className="block text-sm font-medium text-gray-700">
                         {t('subcategory')}
                       </label>
                       <div className="flex gap-2">
                         <select
                           value={aiReviewSelectedSubcategoryId}
                           onChange={(e) => {
                             const subcategoryId = e.target.value
                             setAiReviewSelectedSubcategoryId(subcategoryId)
                             const selectedSubcategory = categories
                               .find(cat => cat.id === aiReviewSelectedCategoryId)
                               ?.children?.find((child: any) => child.id === subcategoryId)
                             if (selectedSubcategory) {
                               setAiResult((prev: any) => ({ 
                                 ...prev, 
                                 subcategory: selectedSubcategory.name
                               }))
                             }
                           }}
                           className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                           disabled={!aiReviewSelectedCategoryId}
                         >
                           <option value="">{t('selectSubcategory')}</option>
                           {categories
                             .find(cat => cat.id === aiReviewSelectedCategoryId)
                             ?.children?.map((subcategory: any) => (
                               <option key={subcategory.id} value={subcategory.id}>
                                 {subcategory.name}
                               </option>
                             ))}
                         </select>
                         <input
                           type="text"
                           placeholder={t('orEnterCustom')}
                           value={aiReviewSelectedSubcategoryId ? '' : aiResult?.subcategory || ''}
                           onChange={(e) => {
                             if (!aiReviewSelectedSubcategoryId) {
                               setAiResult((prev: any) => ({ ...prev, subcategory: e.target.value }))
                             }
                           }}
                           className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                         />
                       </div>
                     </div>

                     {/* Level 3 Category - Only show if subcategory has children */}
                     {categories
                       .find(cat => cat.id === aiReviewSelectedCategoryId)
                       ?.children?.find((child: any) => child.id === aiReviewSelectedSubcategoryId)
                       ?.children?.length > 0 && (
                       <div>
                         <label className="block text-sm font-medium text-gray-700">
                           Level 3 Category
                         </label>
                         <div className="flex gap-2">
                           <select
                             value={aiReviewSelectedLevel3Id}
                             onChange={(e) => {
                               const level3Id = e.target.value
                               setAiReviewSelectedLevel3Id(level3Id)
                               const selectedLevel3 = categories
                                 .find(cat => cat.id === aiReviewSelectedCategoryId)
                                 ?.children?.find((child: any) => child.id === aiReviewSelectedSubcategoryId)
                                 ?.children?.find((level3: any) => level3.id === level3Id)
                               if (selectedLevel3) {
                                 setAiResult((prev: any) => ({ 
                                   ...prev, 
                                   level3: selectedLevel3.name
                                 }))
                               }
                             }}
                             className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                             disabled={!aiReviewSelectedSubcategoryId}
                           >
                             <option value="">Select Level 3 Category</option>
                             {categories
                               .find(cat => cat.id === aiReviewSelectedCategoryId)
                               ?.children?.find((child: any) => child.id === aiReviewSelectedSubcategoryId)
                               ?.children?.map((level3: any) => (
                                 <option key={level3.id} value={level3.id}>
                                   {level3.name}
                                 </option>
                               ))}
                           </select>
                           <input
                             type="text"
                             placeholder="Or enter custom"
                             value={aiReviewSelectedLevel3Id ? '' : aiResult?.level3 || ''}
                             onChange={(e) => {
                               if (!aiReviewSelectedLevel3Id) {
                                 setAiResult((prev: any) => ({ ...prev, level3: e.target.value }))
                               }
                             }}
                             className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                           />
                         </div>
                       </div>
                     )}

                    <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400 dark:text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700 dark:text-blue-200">
                            {t('aiConfidence')}: {aiResult?.confidence || 0}%
                          </p>
                        </div>
                      </div>
                    </div>
                   </div>

                   <div className="flex justify-between pt-4 border-t border-gray-200 bg-white sticky bottom-0">
                     <button
                       onClick={() => setStep('input')}
                       className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                     >
                       {t('back')}
                     </button>
                     <button
                       onClick={() => {
                         // Apply AI results to form data
                         setFormData(prev => ({
                           ...prev,
                           name: aiResult?.name || '',
                           description: aiResult?.description || '',
                           category: aiResult?.category || '',
                           subcategory: aiResult?.subcategory || '',
                           language: aiResult?.language || ''
                         }))
                         setStep('details')
                       }}
                       className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
                     >
                       {t('continue')}
                     </button>
                   </div>
                 </div>
               )}

               {step === 'details' && (
          <div className="space-y-6">
            {preview && (
              <div className="text-center">
                <img src={preview} alt="Preview" className="mx-auto h-32 w-32 object-cover rounded-lg" />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('itemName')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('quantity')}
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('category')}
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => {
                      const categoryId = e.target.value
                      setSelectedCategoryId(categoryId)
                      const selectedCategory = categories.find(cat => cat.id === categoryId)
                      if (selectedCategory) {
                        setFormData(prev => ({ 
                          ...prev, 
                          category: selectedCategory.name,
                          subcategory: selectedCategory.children?.[0]?.name || ''
                        }))
                      }
                    }}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  >
                    <option value="">{t('selectCategory')}</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder={t('orEnterCustom')}
                    value={selectedCategoryId ? '' : formData.category}
                    onChange={(e) => {
                      if (!selectedCategoryId) {
                        setFormData(prev => ({ ...prev, category: e.target.value }))
                      }
                    }}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('subcategory')}
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedSubcategoryId}
                    onChange={(e) => {
                      const subcategoryId = e.target.value
                      setSelectedSubcategoryId(subcategoryId)
                      const selectedSubcategory = categories
                        .find(cat => cat.id === selectedCategoryId)
                         ?.children?.find((child: any) => child.id === subcategoryId)
                      if (selectedSubcategory) {
                        setFormData(prev => ({ 
                          ...prev, 
                          subcategory: selectedSubcategory.name
                        }))
                      }
                    }}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    disabled={!selectedCategoryId}
                  >
                    <option value="">{t('selectSubcategory')}</option>
                    {categories
                      .find(cat => cat.id === selectedCategoryId)
                       ?.children?.map((subcategory: any) => (
                        <option key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </option>
                      ))}
                  </select>
                  <input
                    type="text"
                    placeholder={t('orEnterCustom')}
                    value={selectedSubcategoryId ? '' : formData.subcategory}
                    onChange={(e) => {
                      if (!selectedSubcategoryId) {
                        setFormData(prev => ({ ...prev, subcategory: e.target.value }))
                      }
                    }}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Level 3 Category - Only show if subcategory has children */}
              {categories
                .find(cat => cat.id === selectedCategoryId)
                ?.children?.find((child: any) => child.id === selectedSubcategoryId)
                ?.children?.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Level 3 Category
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedLevel3Id}
                      onChange={(e) => {
                        const level3Id = e.target.value
                        setSelectedLevel3Id(level3Id)
                        const selectedLevel3 = categories
                          .find(cat => cat.id === selectedCategoryId)
                          ?.children?.find((child: any) => child.id === selectedSubcategoryId)
                          ?.children?.find((level3: any) => level3.id === level3Id)
                        if (selectedLevel3) {
                          setFormData(prev => ({ 
                            ...prev, 
                            level3: selectedLevel3.name
                          }))
                        }
                      }}
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                      disabled={!selectedSubcategoryId}
                    >
                      <option value="">Select Level 3 Category</option>
                      {categories
                        .find(cat => cat.id === selectedCategoryId)
                        ?.children?.find((child: any) => child.id === selectedSubcategoryId)
                        ?.children?.map((level3: any) => (
                          <option key={level3.id} value={level3.id}>
                            {level3.name}
                          </option>
                        ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Or enter custom"
                      value={selectedLevel3Id ? '' : formData.level3}
                      onChange={(e) => {
                        if (!selectedLevel3Id) {
                          setFormData(prev => ({ ...prev, level3: e.target.value }))
                        }
                      }}
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Low Stock Alert
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minQuantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, minQuantity: parseInt(e.target.value) || 0 }))}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tags
              </label>
              <div className="mt-1">
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => setTags(tags.filter((_, i) => i !== index))}
                        className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500"
                      >
                        <span className="sr-only">Remove</span>
                        <svg className="w-2 h-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                          <path strokeLinecap="round" strokeWidth="1.5" d="m1 1 6 6m0-6L1 7" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (newTag.trim() && !tags.includes(newTag.trim())) {
                          setTags([...tags, newTag.trim()])
                          setNewTag('')
                        }
                      }
                    }}
                    placeholder="Add a tag..."
                    className="flex-1 border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newTag.trim() && !tags.includes(newTag.trim())) {
                        setTags([...tags, newTag.trim()])
                        setNewTag('')
                      }
                    }}
                    className="px-3 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('input')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => setStep('location')}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                Next: Location
              </button>
            </div>
          </div>
        )}

        {step === 'location' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">
                {t('whereStored')}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('room')}
                  </label>
                  <select
                    value={formData.room}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, room: e.target.value, cabinet: '' }))
                    }}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    disabled={loadingRooms}
                  >
                    <option value="" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">{t('selectRoom') || 'Select a room'}</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                        {room.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('cabinetShelf')}
                  </label>
                  <select
                    value={formData.cabinet}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, cabinet: e.target.value }))
                    }}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    disabled={!formData.room}
                  >
                    <option value="" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">{t('autoCreateDefaultCabinet') || 'Auto-create default cabinet'}</option>
                    {cabinets.map((cabinet) => (
                      <option key={cabinet.id} value={cabinet.id} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                        {cabinet.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {t('leaveEmptyDefault')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('details')}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                Add Item
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onScan={(code) => {
            // Handle both barcode and QR code inputs
            if (inputMethod === 'qr') {
              setQrValue(code)
            } else {
              handleBarcodeScan(code)
            }
            setShowBarcodeScanner(false)
          }}
          onClose={() => setShowBarcodeScanner(false)}
          userLanguage={currentLanguage}
          onImageAnalysis={(result) => {
            setAiResult(result)
            setFormData(prev => ({
              ...prev,
              barcode: result.barcode || barcodeValue, // Use barcode from vision if available
              imageUrl: result.imageUrl // If vision provides an image URL
            }))
            setStep('ai-review')
            toast.success('AI Vision analysis completed! Please review the results.')
          }}
        />
      )}
    </div>
  )
}

