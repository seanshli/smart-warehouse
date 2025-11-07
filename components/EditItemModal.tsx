'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useLanguage } from './LanguageProvider'
import { translateCategoryName } from '@/lib/translations'
import { useHousehold } from './HouseholdProvider'
import { useActivityTracker } from '@/lib/activity-tracker-client'

interface Item {
  id: string
  name: string
  description?: string
  quantity: number
  minQuantity: number
  imageUrl?: string
  category?: {
    id?: string
    name: string
    parent?: {
      name: string
    }
  }
  room?: {
    id?: string
    name: string
  }
  cabinet?: {
    id?: string
    name: string
  }
}

interface EditItemModalProps {
  item: Item
  onClose: () => void
  onSuccess: () => void
}

export default function EditItemModal({ item, onClose, onSuccess }: EditItemModalProps) {
  const { t } = useLanguage()
  const { household } = useHousehold()
  const { currentLanguage } = useLanguage()
  const { trackActivity } = useActivityTracker()
  
  // Debug logging for item data
  console.log('EditItemModal - Item data:', {
    id: item.id,
    name: item.name,
    category: item.category,
    room: item.room,
    cabinet: item.cabinet,
    imageUrl: item.imageUrl ? 'Has image URL' : 'No image URL'
  })
  const [formData, setFormData] = useState({
    name: item.name,
    description: item.description || '',
    quantity: item.quantity,
    minQuantity: item.minQuantity,
    imageUrl: item.imageUrl || ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Array<{id: string, name: string, level: number, parent?: {name: string}, pathNames?: string[], label?: string}>>([])
  const [rooms, setRooms] = useState<Array<{id: string, name: string}>>([])
  const [cabinets, setCabinets] = useState<Array<{id: string, name: string}>>([])
  const [selectedCategory, setSelectedCategory] = useState(item.category?.id || '')
  
  // Debug logging for selected category
  useEffect(() => {
    console.log('EditItemModal - Selected category changed:', selectedCategory)
    if (selectedCategory) {
      const selectedCat = categories.find(cat => cat.id === selectedCategory)
      console.log('EditItemModal - Selected category details:', selectedCat)
    }
  }, [selectedCategory, categories])
  const [selectedRoom, setSelectedRoom] = useState(item.room?.id || '')
  const [selectedCabinet, setSelectedCabinet] = useState(item.cabinet?.id || '')
  const [imagePreview, setImagePreview] = useState<string | null>(item.imageUrl || null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Track item detail view when modal opens
  useEffect(() => {
    if (item?.id && household?.id) {
      trackActivity(
        'view_item',
        'view_item_detail',
        {
          itemName: item.name,
          itemId: item.id,
          category: item.category?.name,
          room: item.room?.name,
          cabinet: item.cabinet?.name
        },
        `Opened item details: ${item.name}`,
        item.id,
        item.room?.id,
        item.cabinet?.id,
        item.category?.id
      )
    }
  }, []) // Only track once when modal opens

  // Local room translator to reflect current language in dropdowns
  const translateRoomDisplayName = (roomName: string): string => {
    const englishToKey: Record<string, string> = {
      'Living Room': (t as any)('livingRoom'),
      'Kitchen': (t as any)('kitchen'),
      'Bedroom': (t as any)('bedroom'),
      'Master Bedroom': (t as any)('masterBedroom'),
      'Kids Room': (t as any)('kidsRoom'),
      'Bathroom': (t as any)('bathroom'),
      'Garage': (t as any)('garage'),
      'Dining Room': (t as any)('diningRoom'),
      'Study': (t as any)('study'),
    }
    const chineseToEnglish: Record<string, string> = {
      '客廳': 'Living Room',
      '廚房': 'Kitchen',
      '臥室': 'Bedroom',
      '主臥室': 'Master Bedroom',
      '兒童房': 'Kids Room',
      '浴室': 'Bathroom',
      '車庫': 'Garage',
      '餐廳': 'Dining Room',
      '書房': 'Study',
    }
    // If current language is English and we got Chinese, map to English
    if (currentLanguage === 'en' && chineseToEnglish[roomName]) {
      return chineseToEnglish[roomName]
    }
    // If we have a known English key, return translation via t()
    if (englishToKey[roomName]) {
      return englishToKey[roomName]
    }
    return roomName
  }

  // Local cabinet translator to reflect current language in dropdowns
  const translateCabinetDisplayName = (cabinetName: string): string => {
    const englishToKey: Record<string, string> = {
      'Main Cabinet': (t as any)('mainCabinet'),
      'Side Cabinet': (t as any)('sideCabinet'),
      'Default Cabinet': (t as any)('defaultCabinet'),
      'Closet': (t as any)('closet'),
      'Dresser': (t as any)('dresser'),
      'Right Cabinet': (t as any)('rightCabinet'),
      'Middle Cabinet': (t as any)('middleCabinet'),
    }
    const chineseToEnglish: Record<string, string> = {
      '主櫥櫃': 'Main Cabinet',
      '側櫥櫃': 'Side Cabinet',
      '主櫃': 'Main Cabinet',
      '側櫃': 'Side Cabinet',
      '右櫥櫃': 'Right Cabinet',
      '左櫥櫃': 'Left Cabinet',
      '中間櫥櫃': 'Middle Cabinet',
    }
    // If current language is English and we got Chinese, map to English
    if (currentLanguage === 'en' && chineseToEnglish[cabinetName]) {
      return chineseToEnglish[cabinetName]
    }
    // If we have a known English key, return translation via t()
    if (englishToKey[cabinetName]) {
      return englishToKey[cabinetName]
    }
    return cabinetName
  }

  useEffect(() => {
    fetchCategoriesAndRooms()
  }, [household?.id])

  // Also fetch data when modal opens
  useEffect(() => {
    if (item.id) {
      fetchCategoriesAndRooms()
    }
  }, [item.id])

  // Update selected values when item data changes
  useEffect(() => {
    console.log('EditItemModal - Item data changed, updating form:', {
      categoryId: item.category?.id,
      roomId: item.room?.id,
      cabinetId: item.cabinet?.id
    })
    setSelectedCategory(item.category?.id || '')
    setSelectedRoom(item.room?.id || '')
    setSelectedCabinet(item.cabinet?.id || '')
    setFormData({
      name: item.name,
      description: item.description || '',
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      imageUrl: item.imageUrl || ''
    })
    setImagePreview(item.imageUrl || null)
  }, [item])

  useEffect(() => {
    if (selectedRoom) {
      fetchCabinets(selectedRoom)
    }
  }, [selectedRoom])

  // Fetch cabinets on mount if room is already selected
  useEffect(() => {
    if (item.room?.id) {
      fetchCabinets(item.room.id)
    }
  }, [])

  const fetchCategoriesAndRooms = async () => {
    if (!household?.id) return

    try {
      const [categoriesResponse, roomsResponse] = await Promise.all([
        fetch(`/api/categories?householdId=${household.id}`, { credentials: 'include' }),
        fetch(`/api/rooms?householdId=${household.id}`, { credentials: 'include' })
      ])

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json()
        console.log('Categories API response:', categoriesData)
        
        // Handle different response formats - the API now returns { categories: [...], debug: {...} }
        const categoriesArray = Array.isArray(categoriesData) ? categoriesData : 
                               categoriesData.categories || 
                               (categoriesData.data ? categoriesData.data : [])
        
        const flattenCategories = (cats: any[], parent?: any, level = 0, parentPath: string[] = []): any[] => {
          let result: any[] = []
          if (Array.isArray(cats)) {
            cats.forEach(cat => {
              const currentPath = parent ? [...parentPath, cat.name] : [cat.name]
              const categoryData = { 
                id: cat.id, 
                name: cat.name, 
                level: cat.level || level,
                parent: parent ? { name: parent.name } : undefined,
                pathNames: parent ? [...parentPath, cat.name] : [cat.name],
                label: currentPath.join(' > ')
              }
              result.push(categoryData)
              if (cat.children && cat.children.length > 0) {
                result = result.concat(flattenCategories(cat.children, cat, level + 1, currentPath))
              }
            })
          }
          return result
        }
        
        // First flatten the categories to include all levels
        let flattenedCategories = flattenCategories(categoriesArray)

        // De-duplicate by label (keep the first occurrence)
        const dedupedByLabel = new Map<string, any>()
        flattenedCategories.forEach(cat => {
          const key = cat.label || cat.name
          if (!dedupedByLabel.has(key)) {
            dedupedByLabel.set(key, cat)
          }
        })
        flattenedCategories = Array.from(dedupedByLabel.values())
        
        // Sort by level first, then by name for better dropdown display
        flattenedCategories.sort((a, b) => {
          if (a.level !== b.level) {
            return a.level - b.level
          }
          return (a.label || a.name).localeCompare(b.label || b.name)
        })
        
        console.log('EditItemModal - Loaded categories:', flattenedCategories.length, flattenedCategories)
        setCategories(flattenedCategories)
        
        // After categories are loaded, ensure selected category is set if item has one
        if (item.category?.id) {
          console.log('Setting selected category after categories loaded:', item.category.id)
          setSelectedCategory(item.category.id)
        }
      }

      if (roomsResponse.ok) {
        const roomsData = await roomsResponse.json()
        console.log('Rooms API response:', roomsData)
        
        // Handle different response formats - the API now returns { rooms: [...], debug: {...} }
        const roomsArray = Array.isArray(roomsData) ? roomsData : 
                          roomsData.rooms || 
                          (roomsData.data ? roomsData.data : [])
        
        console.log('EditItemModal - Loaded rooms:', roomsArray.length, roomsArray)
        setRooms(roomsArray)
        
        // After rooms are loaded, ensure selected room is set if item has one
        if (item.room?.id) {
          console.log('Setting selected room after rooms loaded:', item.room.id)
          setSelectedRoom(item.room.id)
        }
      }
    } catch (error) {
      console.error('Error fetching categories and rooms:', error)
      toast.error('Failed to load categories and rooms.')
    }
  }

  const fetchCabinets = async (roomId: string) => {
    try {
      const response = await fetch(`/api/cabinets?roomId=${roomId}`, { credentials: 'include' })
      if (response.ok) {
        const cabinetsData = await response.json()
        console.log('EditItemModal - Loaded cabinets for room:', roomId, cabinetsData)
        setCabinets(cabinetsData)
        
        // After cabinets are loaded, ensure selected cabinet is set if item has one
        if (item.cabinet?.id && item.room?.id === roomId) {
          console.log('Setting selected cabinet after cabinets loaded:', item.cabinet.id)
          setSelectedCabinet(item.cabinet.id)
        }
      }
    } catch (error) {
      console.error('Error fetching cabinets:', error)
      toast.error('Failed to load cabinets.')
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setIsUploadingImage(true)
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        setImagePreview(base64)
        setFormData(prev => ({
          ...prev,
          imageUrl: base64
        }))
        setIsUploadingImage(false)
        toast.success('Image uploaded successfully!')
      }
      reader.onerror = () => {
        toast.error('Failed to read image file')
        setIsUploadingImage(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Please enter an item name')
      return
    }

    if (formData.quantity < 0) {
      toast.error('Quantity cannot be negative')
      return
    }

    setIsLoading(true)

    try {
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        quantity: formData.quantity,
        minQuantity: formData.minQuantity,
        categoryId: selectedCategory || null,
        roomId: selectedRoom || null,
        cabinetId: selectedCabinet || null,
        imageUrl: formData.imageUrl
      }
      
      console.log('Updating item:', item.id, 'with data:', updateData)
      console.log('Form data before update:', formData)
      
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        toast.success('Item updated successfully!')
        onSuccess()
        onClose()
      } else {
        const errorData = await response.json()
        console.error('Update failed:', response.status, errorData)
        toast.error(errorData.error || `Failed to update item (${response.status})`)
      }
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error('Failed to update item')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {t('editItem')}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                {t('itemName')} *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                {t('description')}
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                  {t('quantity')} *
                </label>
                <input
                  type="number"
                  id="quantity"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="minQuantity" className="block text-sm font-medium text-gray-700">
                  {t('minimumQuantity')}
                </label>
                <input
                  type="number"
                  id="minQuantity"
                  min="0"
                  value={formData.minQuantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, minQuantity: parseInt(e.target.value) || 0 }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('itemPhoto')}
              </label>
              <div className="flex items-center space-x-4">
                {/* Current Image Preview */}
                {imagePreview && (
                  <div className="flex-shrink-0">
                    <img
                      src={imagePreview}
                      alt="Item preview"
                      className="h-20 w-20 object-cover rounded-lg border border-gray-300"
                    />
                  </div>
                )}
                
                {/* Upload Button */}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploadingImage}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                  >
                    <PhotoIcon className="h-4 w-4 mr-2" />
                    {isUploadingImage ? t('uploading') : (imagePreview ? t('changePhoto') : t('addPhoto'))}
                  </label>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null)
                        setFormData(prev => ({ ...prev, imageUrl: '' }))
                      }}
                      className="ml-2 text-sm text-red-600 hover:text-red-800"
                    >
                      {t('removePhoto')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                {t('category')}
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">{t('selectCategory')}</option>
                {categories.map(category => {
                  // Build translated label using path if available
                  const label = category.pathNames && category.pathNames.length > 0
                    ? category.pathNames
                        .map(name => translateCategoryName(name, currentLanguage))
                        .join(' > ')
                    : translateCategoryName(category.name, currentLanguage)
                  return (
                    <option key={category.id} value={category.id}>{label}</option>
                  )
                })}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="room" className="block text-sm font-medium text-gray-700">
                  {t('room')}
                </label>
                <select
                  id="room"
                  value={selectedRoom}
                  onChange={(e) => {
                    setSelectedRoom(e.target.value)
                    setSelectedCabinet('')
                  }}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">{(t as any)('selectRoom')}</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>{translateRoomDisplayName(room.name)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="cabinet" className="block text-sm font-medium text-gray-700">
                  {t('cabinet')}
                </label>
                <select
                  id="cabinet"
                  value={selectedCabinet}
                  onChange={(e) => setSelectedCabinet(e.target.value)}
                  disabled={!selectedRoom}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{(t as any)('selectCabinet')}</option>
                  {cabinets.map(cabinet => (
                    <option key={cabinet.id} value={cabinet.id}>{translateCabinetDisplayName(cabinet.name)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                disabled={isLoading}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? t('saving') : t('save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
