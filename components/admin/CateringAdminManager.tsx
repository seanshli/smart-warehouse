'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  XMarkIcon,
  PhotoIcon,
  ClockIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useLanguage } from '@/components/LanguageProvider'

interface CateringService {
  id: string
  buildingId?: string
  communityId?: string
  isActive: boolean
}

interface CateringCategory {
  id: string
  name: string
  description?: string
  displayOrder: number
  isActive: boolean
}

interface CateringMenuItem {
  id: string
  name: string
  description?: string
  imageUrl?: string
  cost: number | string
  quantityAvailable: number
  isActive: boolean
  availableAllDay: boolean
  category?: { id: string; name: string }
  timeSlots?: Array<{
    id: string
    dayOfWeek: number
    startTime: string
    endTime: string
  }>
}

interface CateringAdminManagerProps {
  buildingId?: string
  communityId?: string
}

export default function CateringAdminManager({ buildingId, communityId }: CateringAdminManagerProps) {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [service, setService] = useState<CateringService | null>(null)
  const [categories, setCategories] = useState<CateringCategory[]>([])
  const [menuItems, setMenuItems] = useState<CateringMenuItem[]>([])
  const [activeTab, setActiveTab] = useState<'categories' | 'items' | 'orders'>('categories')
  const [orders, setOrders] = useState<any[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  
  // Category management
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CateringCategory | null>(null)
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', displayOrder: 0 })
  
  // Menu item management
  const [showItemForm, setShowItemForm] = useState(false)
  const [editingItem, setEditingItem] = useState<CateringMenuItem | null>(null)
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    imageUrl: '',
    imageFile: null as File | null,
    cost: '',
    quantityAvailable: 0,
    categoryId: '',
    isActive: true,
    availableAllDay: true,
    timeSlots: [] as Array<{ dayOfWeek: number; startTime: string; endTime: string }>
  })
  
  // Batch upload
  const [showBatchUpload, setShowBatchUpload] = useState(false)
  const [batchItems, setBatchItems] = useState<Array<{
    name: string
    description: string
    imageFile: File | null
    imageUrl: string
    cost: string
    quantityAvailable: number
    categoryId: string
    isActive: boolean
  }>>([{
    name: '',
    description: '',
    imageFile: null,
    imageUrl: '',
    cost: '',
    quantityAvailable: 0,
    categoryId: '',
    isActive: true,
  }])

  useEffect(() => {
    loadData()
  }, [buildingId, communityId])

  const loadOrders = async () => {
    try {
      setOrdersLoading(true)
      const params = new URLSearchParams()
      params.append('admin', 'true')
      if (buildingId) params.append('buildingId', buildingId)
      if (communityId) params.append('communityId', communityId)

      const response = await fetch(`/api/catering/orders?${params.toString()}`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to load orders')
      }
    } catch (error) {
      console.error('Error loading orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setOrdersLoading(false)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (buildingId) params.append('buildingId', buildingId)
      if (communityId) params.append('communityId', communityId)

      const [menuRes, serviceRes] = await Promise.all([
        fetch(`/api/catering/menu?${params.toString()}`, { credentials: 'include' }),
        fetch(`/api/catering/service?${params.toString()}`, { credentials: 'include' }),
      ])

      if (menuRes.ok) {
        const menuData = await menuRes.json()
        setCategories(menuData.categories || [])
        setMenuItems(menuData.menuItems || [])
      }

      if (serviceRes.ok) {
        const serviceData = await serviceRes.json()
        setService(serviceData.service)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Category CRUD
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!service?.id || !categoryForm.name.trim()) {
      toast.error('Category name is required')
      return
    }

    try {
      const response = await fetch('/api/catering/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          serviceId: service.id,
          name: categoryForm.name,
          description: categoryForm.description || undefined,
          displayOrder: parseInt(categoryForm.displayOrder.toString()) || 0,
        }),
      })

      if (response.ok) {
        toast.success('Category created')
        setShowCategoryForm(false)
        setCategoryForm({ name: '', description: '', displayOrder: 0 })
        loadData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create category')
      }
    } catch (error) {
      console.error('Error creating category:', error)
      toast.error('Failed to create category')
    }
  }

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory || !categoryForm.name.trim()) {
      return
    }

    try {
      const response = await fetch(`/api/catering/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: categoryForm.name,
          description: categoryForm.description || undefined,
          displayOrder: parseInt(categoryForm.displayOrder.toString()) || 0,
        }),
      })

      if (response.ok) {
        toast.success('Category updated')
        setEditingCategory(null)
        setShowCategoryForm(false)
        setCategoryForm({ name: '', description: '', displayOrder: 0 })
        loadData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update category')
      }
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('Failed to update category')
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? Menu items in this category will be unassigned.')) {
      return
    }

    try {
      const response = await fetch(`/api/catering/categories/${categoryId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        toast.success('Category deleted')
        loadData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Failed to delete category')
    }
  }

  const startEditCategory = (category: CateringCategory) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      displayOrder: category.displayOrder || 0,
    })
    setShowCategoryForm(true)
  }

  // Menu Item CRUD
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!service?.id || !itemForm.name.trim() || !itemForm.cost) {
      toast.error('Name and cost are required')
      return
    }

    try {
      const response = await fetch('/api/catering/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          serviceId: service.id,
          categoryId: itemForm.categoryId || undefined,
          name: itemForm.name,
          description: itemForm.description || undefined,
          imageUrl: itemForm.imageUrl || undefined,
          cost: parseFloat(itemForm.cost),
          quantityAvailable: parseInt(itemForm.quantityAvailable.toString()) || 0,
          isActive: itemForm.isActive,
          availableAllDay: itemForm.availableAllDay,
          timeSlots: itemForm.availableAllDay ? [] : itemForm.timeSlots,
        }),
      })

      if (response.ok) {
        toast.success('Menu item created')
        setShowItemForm(false)
        resetItemForm()
        loadData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create menu item')
      }
    } catch (error) {
      console.error('Error creating menu item:', error)
      toast.error('Failed to create menu item')
    }
  }

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem || !itemForm.name.trim() || !itemForm.cost) {
      return
    }

    try {
      const response = await fetch(`/api/catering/menu/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          categoryId: itemForm.categoryId || null,
          name: itemForm.name,
          description: itemForm.description || undefined,
          imageUrl: itemForm.imageUrl || undefined,
          cost: parseFloat(itemForm.cost),
          quantityAvailable: parseInt(itemForm.quantityAvailable.toString()) || 0,
          isActive: itemForm.isActive,
          availableAllDay: itemForm.availableAllDay,
          timeSlots: itemForm.availableAllDay ? [] : itemForm.timeSlots,
        }),
      })

      if (response.ok) {
        toast.success('Menu item updated')
        setEditingItem(null)
        setShowItemForm(false)
        resetItemForm()
        loadData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update menu item')
      }
    } catch (error) {
      console.error('Error updating menu item:', error)
      toast.error('Failed to update menu item')
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) {
      return
    }

    try {
      const response = await fetch(`/api/catering/menu/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        toast.success('Menu item deleted')
        loadData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete menu item')
      }
    } catch (error) {
      console.error('Error deleting menu item:', error)
      toast.error('Failed to delete menu item')
    }
  }

  const startEditItem = (item: CateringMenuItem) => {
    setEditingItem(item)
    setItemForm({
      name: item.name,
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      imageFile: null,
      cost: item.cost.toString(),
      quantityAvailable: item.quantityAvailable || 0,
      categoryId: item.category?.id || '',
      isActive: item.isActive,
      availableAllDay: item.availableAllDay,
      timeSlots: item.timeSlots?.map(ts => ({
        dayOfWeek: ts.dayOfWeek,
        startTime: ts.startTime,
        endTime: ts.endTime,
      })) || [],
    })
    setShowItemForm(true)
  }

  const resetItemForm = () => {
    setItemForm({
      name: '',
      description: '',
      imageUrl: '',
      imageFile: null,
      cost: '',
      quantityAvailable: 0,
      categoryId: '',
      isActive: true,
      availableAllDay: true,
      timeSlots: [],
    })
  }

  // Auto-scale image function
  const scaleImage = (file: File, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height
              height = maxHeight
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob'))
                return
              }
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result as string)
              reader.onerror = () => reject(new Error('Failed to read scaled image'))
              reader.readAsDataURL(blob)
            },
            file.type,
            quality
          )
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isBatch = false, batchIndex?: number) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Accept JPG/JPEG and PNG formats
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
    const validExtensions = ['.jpg', '.jpeg', '.png']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      toast.error('請選擇 JPG 或 PNG 格式的圖片檔案')
      return
    }

    // Check original file size (before scaling)
    if (file.size > 10 * 1024 * 1024) { // 10MB limit for original
      toast.error('圖片大小不能超過 10MB')
      return
    }

    try {
      // Auto-scale image to max 800x800 with quality 0.8
      const scaledBase64 = await scaleImage(file, 800, 800, 0.8)
      
      if (isBatch && batchIndex !== undefined) {
        const newBatch = [...batchItems]
        newBatch[batchIndex] = {
          ...newBatch[batchIndex],
          imageFile: file,
          imageUrl: scaledBase64,
        }
        setBatchItems(newBatch)
      } else {
        setItemForm({
          ...itemForm,
          imageFile: file,
          imageUrl: scaledBase64,
        })
      }
    } catch (error) {
      console.error('Error scaling image:', error)
      toast.error('圖片處理失敗')
    }
  }

  const addBatchItem = () => {
    setBatchItems([...batchItems, {
      name: '',
      description: '',
      imageFile: null,
      imageUrl: '',
      cost: '',
      quantityAvailable: 0,
      categoryId: '',
      isActive: true,
    }])
  }

  const handleDownloadBatchTemplate = () => {
    // Create CSV template
    const headers = ['項目名稱', '分類', '描述', '售價 (台幣)', '可用數量', '狀態']
    const csv = [headers.join(',')].join('\n')
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `catering-batch-template-${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    toast.success('模板已下載')
  }

  const handleUploadBatchCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      toast.error('請選擇 CSV 檔案')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          toast.error('CSV 檔案格式錯誤：至少需要標題列和一行資料')
          return
        }

        // Skip header row
        const dataLines = lines.slice(1)
        const items: Array<{
          name: string
          description: string
          imageFile: File | null
          imageUrl: string
          cost: string
          quantityAvailable: number
          categoryId: string
          isActive: boolean
        }> = []

        for (const line of dataLines) {
          // Handle CSV with potential commas in quoted fields
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
          
          if (values.length >= 4 && values[0]) {
            const categoryName = values[1] || ''
            const category = categories.find(c => c.name === categoryName)
            
            items.push({
              name: values[0] || '',
              categoryId: category?.id || '',
              description: values[2] || '',
              cost: values[3] || '0',
              quantityAvailable: parseInt(values[4] || '0') || 0,
              isActive: values[5]?.toLowerCase() === '啟用' || values[5]?.toLowerCase() === 'true' || values[5] === '1',
              imageFile: null,
              imageUrl: '',
            })
          }
        }

        if (items.length > 0) {
          setBatchItems(items)
          toast.success(`已載入 ${items.length} 個項目`)
        } else {
          toast.error('CSV 檔案中沒有有效的資料')
        }
      } catch (error) {
        console.error('Error parsing CSV:', error)
        toast.error('CSV 檔案解析失敗')
      }
    }
    reader.onerror = () => {
      toast.error('讀取檔案失敗')
    }
    reader.readAsText(file, 'UTF-8')
  }

  const handleDownloadBatchCSV = () => {
    if (batchItems.length === 0) {
      toast.error('沒有項目可下載')
      return
    }

    const headers = ['項目名稱', '分類', '描述', '售價 (台幣)', '可用數量', '狀態']
    const rows = batchItems.map(item => {
      const categoryName = categories.find(c => c.id === item.categoryId)?.name || ''
      return [
        `"${item.name}"`,
        `"${categoryName}"`,
        `"${item.description || ''}"`,
        item.cost,
        item.quantityAvailable.toString(),
        item.isActive ? '啟用' : '停用'
      ].join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `catering-batch-items-${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    toast.success('批次項目已下載')
  }

  const removeBatchItem = (index: number) => {
    if (batchItems.length > 1) {
      setBatchItems(batchItems.filter((_, i) => i !== index))
    }
  }

  const handleExport = async (format: 'json' | 'csv' = 'json') => {
    if (!service?.id) {
      toast.error('服務不存在')
      return
    }

    try {
      const params = new URLSearchParams()
      if (buildingId) params.append('buildingId', buildingId)
      if (communityId) params.append('communityId', communityId)
      params.append('format', format)

      const response = await fetch(`/api/catering/export?${params.toString()}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || '匯出失敗')
        return
      }

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `catering-export-${Date.now()}.${format}`
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success(`資料已匯出為 ${format.toUpperCase()} 格式`)
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('匯出失敗')
    }
  }

  const handleBatchUpload = async () => {
    if (!service?.id) {
      toast.error('服務不存在')
      return
    }

    // Validate all items
    for (let i = 0; i < batchItems.length; i++) {
      const item = batchItems[i]
      if (!item.name.trim() || !item.cost) {
        toast.error(`第 ${i + 1} 個項目：名稱和價格為必填`)
        return
      }
    }

    try {
      let successCount = 0
      let failCount = 0

      for (const item of batchItems) {
        try {
          const response = await fetch('/api/catering/menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              serviceId: service.id,
              categoryId: item.categoryId || undefined,
              name: item.name,
              description: item.description || undefined,
              imageUrl: item.imageUrl || undefined,
              cost: parseFloat(item.cost),
              quantityAvailable: parseInt(item.quantityAvailable.toString()) || 0,
              isActive: item.isActive,
              availableAllDay: true, // Default to all day for batch items
              timeSlots: [],
            }),
          })

          if (response.ok) {
            successCount++
          } else {
            failCount++
          }
        } catch (error) {
          console.error('Error creating batch item:', error)
          failCount++
        }
      }

      toast.success(`批次上傳完成：成功 ${successCount} 個，失敗 ${failCount} 個`)
      setShowBatchUpload(false)
      setBatchItems([{
        name: '',
        description: '',
        imageFile: null,
        imageUrl: '',
        cost: '',
        quantityAvailable: 0,
        categoryId: '',
        isActive: true,
      }])
      loadData()
    } catch (error) {
      console.error('Error in batch upload:', error)
      toast.error('批次上傳失敗')
    }
  }

  const addTimeSlot = () => {
    setItemForm({
      ...itemForm,
      timeSlots: [...itemForm.timeSlots, { dayOfWeek: -1, startTime: '09:00', endTime: '17:00' }],
    })
  }

  const removeTimeSlot = (index: number) => {
    setItemForm({
      ...itemForm,
      timeSlots: itemForm.timeSlots.filter((_, i) => i !== index),
    })
  }

  const updateTimeSlot = (index: number, field: 'dayOfWeek' | 'startTime' | 'endTime', value: string | number) => {
    const newSlots = [...itemForm.timeSlots]
    newSlots[index] = { ...newSlots[index], [field]: value }
    setItemForm({ ...itemForm, timeSlots: newSlots })
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">載入中...</p>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Catering service not enabled for this building/community</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 relative">
      {/* Watermark */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.03 }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-6xl font-bold text-gray-900 dark:text-white transform -rotate-45">
            ADMIN
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
      {/* Header with Export */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">餐飲服務管理</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => handleExport('json')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            title="匯出為 JSON 格式"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            匯出 JSON
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            title="匯出為 CSV 格式"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            匯出 CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            分類管理 ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'items'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            菜單項目管理 ({menuItems.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('orders')
              loadOrders()
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'orders'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            訂單管理 ({orders.length})
          </button>
        </nav>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">管理分類</h3>
            <button
              onClick={() => {
                setEditingCategory(null)
                setCategoryForm({ name: '', description: '', displayOrder: 0 })
                setShowCategoryForm(true)
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              新增分類
            </button>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>尚無分類</p>
              <p className="text-sm mt-2">點擊「新增分類」開始</p>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <p className="font-medium text-gray-900 dark:text-white">{category.name}</p>
                      <span className="text-xs text-gray-500">順序: {category.displayOrder}</span>
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          category.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {category.isActive ? '啟用' : '停用'}
                      </span>
                    </div>
                    {category.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{category.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => startEditCategory(category)}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Category Form Modal */}
          {showCategoryForm && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => {
                  setShowCategoryForm(false)
                  setEditingCategory(null)
                  setCategoryForm({ name: '', description: '', displayOrder: 0 })
                }} />
                <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 z-10">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {editingCategory ? '編輯分類' : '新增分類'}
                    </h3>
                    <button
                      onClick={() => {
                        setShowCategoryForm(false)
                        setEditingCategory(null)
                        setCategoryForm({ name: '', description: '', displayOrder: 0 })
                      }}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        分類名稱 *
                      </label>
                      <input
                        type="text"
                        required
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        描述
                      </label>
                      <textarea
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        顯示順序
                      </label>
                      <input
                        type="number"
                        value={categoryForm.displayOrder}
                        onChange={(e) => setCategoryForm({ ...categoryForm, displayOrder: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCategoryForm(false)
                          setEditingCategory(null)
                          setCategoryForm({ name: '', description: '', displayOrder: 0 })
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                      >
                        {editingCategory ? '更新' : '建立'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Menu Items Tab */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">管理菜單項目</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setShowBatchUpload(true)
                }}
                className="inline-flex items-center px-4 py-2 border border-primary-600 text-sm font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50"
              >
                <PhotoIcon className="h-4 w-4 mr-2" />
                批次上傳
              </button>
              <button
                onClick={() => {
                  setEditingItem(null)
                  resetItemForm()
                  setShowItemForm(true)
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                新增項目
              </button>
            </div>
          </div>

          {menuItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>尚無菜單項目</p>
              <p className="text-sm mt-2">點擊「新增項目」開始</p>
            </div>
          ) : (
            <div className="space-y-2">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-16 w-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            item.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {item.isActive ? '啟用' : '停用'}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600 dark:text-gray-300">
                        <span>售價: ${parseFloat(item.cost.toString()).toFixed(2)} 台幣</span>
                        <span>庫存: {item.quantityAvailable}</span>
                        {item.category && (
                          <span>分類: {item.category.name}</span>
                        )}
                        {!item.availableAllDay && item.timeSlots && item.timeSlots.length > 0 && (
                          <span className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            時段限制
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => startEditItem(item)}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Menu Item Form Modal */}
          {showItemForm && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => {
                  setShowItemForm(false)
                  setEditingItem(null)
                  resetItemForm()
                }} />
                <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 z-10 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {editingItem ? '編輯菜單項目' : '新增菜單項目'}
                    </h3>
                    <button
                      onClick={() => {
                        setShowItemForm(false)
                        setEditingItem(null)
                        resetItemForm()
                      }}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  <form onSubmit={editingItem ? handleUpdateItem : handleCreateItem} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          項目名稱 *
                        </label>
                        <input
                          type="text"
                          required
                          value={itemForm.name}
                          onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          分類
                        </label>
                        <select
                          value={itemForm.categoryId}
                          onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">無分類</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        描述
                      </label>
                      <textarea
                        value={itemForm.description}
                        onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          售價 (台幣) *
                        </label>
                        <div className="flex items-center">
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={itemForm.cost}
                            onChange={(e) => setItemForm({ ...itemForm, cost: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                          />
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">台幣</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          可用數量
                        </label>
                        <input
                          type="number"
                          value={itemForm.quantityAvailable}
                          onChange={(e) => setItemForm({ ...itemForm, quantityAvailable: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          狀態
                        </label>
                        <select
                          value={itemForm.isActive ? 'true' : 'false'}
                          onChange={(e) => setItemForm({ ...itemForm, isActive: e.target.value === 'true' })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="true">啟用</option>
                          <option value="false">停用</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        圖片 (JPG 格式，最大 2MB)
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="file"
                            accept="image/jpeg,.jpg,.jpeg,.png"
                            onChange={handleImageUpload}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                          />
                          {itemForm.imageFile && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {itemForm.imageFile.name}
                            </span>
                          )}
                        </div>
                        {itemForm.imageUrl && (
                          <div className="relative">
                            <img
                              src={itemForm.imageUrl}
                              alt="Preview"
                              className="h-32 w-32 object-cover rounded border border-gray-300 dark:border-gray-600"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setItemForm({ ...itemForm, imageUrl: '', imageFile: null })
                              }}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={itemForm.availableAllDay}
                          onChange={(e) => setItemForm({ ...itemForm, availableAllDay: e.target.checked, timeSlots: e.target.checked ? [] : itemForm.timeSlots })}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">全天可用</span>
                      </label>
                    </div>
                    {!itemForm.availableAllDay && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">可用時段</label>
                          <button
                            type="button"
                            onClick={addTimeSlot}
                            className="text-sm text-primary-600 hover:text-primary-700"
                          >
                            + 新增時段
                          </button>
                        </div>
                        {itemForm.timeSlots.map((slot, index) => (
                          <div key={index} className="flex items-center space-x-2 mb-2">
                            <select
                              value={slot.dayOfWeek}
                              onChange={(e) => updateTimeSlot(index, 'dayOfWeek', parseInt(e.target.value))}
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
                            >
                              <option value="-1">每天</option>
                              <option value="0">週日</option>
                              <option value="1">週一</option>
                              <option value="2">週二</option>
                              <option value="3">週三</option>
                              <option value="4">週四</option>
                              <option value="5">週五</option>
                              <option value="6">週六</option>
                            </select>
                            <input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) => updateTimeSlot(index, 'startTime', e.target.value)}
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
                            />
                            <span className="text-gray-500">-</span>
                            <input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) => updateTimeSlot(index, 'endTime', e.target.value)}
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => removeTimeSlot(index)}
                              className="p-1 text-red-600 hover:text-red-700"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowItemForm(false)
                          setEditingItem(null)
                          resetItemForm()
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                      >
                        {editingItem ? '更新' : '建立'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Batch Upload Modal */}
          {showBatchUpload && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => {
                  setShowBatchUpload(false)
                  setBatchItems([{
                    name: '',
                    description: '',
                    imageFile: null,
                    imageUrl: '',
                    cost: '',
                    quantityAvailable: 0,
                    categoryId: '',
                    isActive: true,
                  }])
                }} />
                <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full p-6 z-10 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      批次上傳菜單項目
                    </h3>
                    <button
                      onClick={() => {
                        setShowBatchUpload(false)
                        setBatchItems([{
                          name: '',
                          description: '',
                          imageFile: null,
                          imageUrl: '',
                          cost: '',
                          quantityAvailable: 0,
                          categoryId: '',
                          isActive: true,
                        }])
                      }}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  
                  {/* CSV Upload/Download Controls */}
                  <div className="flex justify-between items-center mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={handleDownloadBatchTemplate}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        下載模板
                      </button>
                      <label className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2 rotate-180" />
                        上傳 CSV
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleUploadBatchCSV}
                          className="hidden"
                        />
                      </label>
                      {batchItems.length > 0 && (
                        <button
                          type="button"
                          onClick={handleDownloadBatchCSV}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                          下載項目
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {batchItems.map((item, index) => (
                      <div key={index} className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">項目 {index + 1}</h4>
                          {batchItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeBatchItem(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              項目名稱 *
                            </label>
                            <input
                              type="text"
                              required
                              value={item.name}
                              onChange={(e) => {
                                const newBatch = [...batchItems]
                                newBatch[index].name = e.target.value
                                setBatchItems(newBatch)
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              分類
                            </label>
                            <select
                              value={item.categoryId}
                              onChange={(e) => {
                                const newBatch = [...batchItems]
                                newBatch[index].categoryId = e.target.value
                                setBatchItems(newBatch)
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                            >
                              <option value="">無分類</option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            描述
                          </label>
                          <textarea
                            value={item.description}
                            onChange={(e) => {
                              const newBatch = [...batchItems]
                              newBatch[index].description = e.target.value
                              setBatchItems(newBatch)
                            }}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              售價 (台幣) *
                            </label>
                            <div className="flex items-center">
                              <input
                                type="number"
                                step="0.01"
                                required
                                value={item.cost}
                                onChange={(e) => {
                                  const newBatch = [...batchItems]
                                  newBatch[index].cost = e.target.value
                                  setBatchItems(newBatch)
                                }}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                              />
                              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">台幣</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              可用數量
                            </label>
                            <input
                              type="number"
                              value={item.quantityAvailable}
                              onChange={(e) => {
                                const newBatch = [...batchItems]
                                newBatch[index].quantityAvailable = parseInt(e.target.value) || 0
                                setBatchItems(newBatch)
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              狀態
                            </label>
                            <select
                              value={item.isActive ? 'true' : 'false'}
                              onChange={(e) => {
                                const newBatch = [...batchItems]
                                newBatch[index].isActive = e.target.value === 'true'
                                setBatchItems(newBatch)
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                            >
                              <option value="true">啟用</option>
                              <option value="false">停用</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            圖片 (JPG/PNG 格式，最大 2MB)
                          </label>
                          <div className="space-y-2">
                            <input
                              type="file"
                              accept="image/jpeg,.jpg,.jpeg,.png"
                              onChange={(e) => handleImageUpload(e, true, index)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                            />
                            {item.imageFile && (
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {item.imageFile.name}
                              </span>
                            )}
                            {item.imageUrl && (
                              <div className="relative inline-block">
                                <img
                                  src={item.imageUrl}
                                  alt="Preview"
                                  className="h-24 w-24 object-cover rounded border border-gray-300 dark:border-gray-600"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none'
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newBatch = [...batchItems]
                                    newBatch[index].imageUrl = ''
                                    newBatch[index].imageFile = null
                                    setBatchItems(newBatch)
                                  }}
                                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                  <XMarkIcon className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-300 dark:border-gray-600">
                      <button
                        type="button"
                        onClick={addBatchItem}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        新增項目
                      </button>
                      <div className="flex space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowBatchUpload(false)
                            setBatchItems([{
                              name: '',
                              description: '',
                              imageFile: null,
                              imageUrl: '',
                              cost: '',
                              quantityAvailable: 0,
                              categoryId: '',
                              isActive: true,
                            }])
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                          取消
                        </button>
                        <button
                          type="button"
                          onClick={handleBatchUpload}
                          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                        >
                          批次上傳 ({batchItems.length} 個項目)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">訂單管理</h3>
            <button
              onClick={loadOrders}
              disabled={ordersLoading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              {ordersLoading ? '載入中...' : '重新整理'}
            </button>
          </div>

          {ordersLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>尚無訂單</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <div
                  key={order.id}
                  onClick={() => window.open(`/catering/orders/${order.id}`, '_blank')}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        訂單 #{order.orderNumber}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {order.household?.name || 'Unknown Household'}
                        {order.household?.building?.name && ` - ${order.household.building.name}`}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(order.orderedAt).toLocaleString('zh-TW')}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === 'delivered' || order.status === 'closed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      order.status === 'submitted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      order.status === 'accepted' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      order.status === 'ready' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {order.status === 'submitted' ? '已提交' :
                       order.status === 'accepted' ? '已接受' :
                       order.status === 'preparing' ? '準備中' :
                       order.status === 'ready' ? '已就緒' :
                       order.status === 'delivered' ? '已送達' :
                       order.status === 'closed' ? '已完成' :
                       order.status === 'cancelled' ? '已取消' :
                       order.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {order.items?.length || 0} 個項目
                    </span>
                    <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                      ${parseFloat(order.totalAmount?.toString() || '0').toFixed(2)} 台幣
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  )
}
