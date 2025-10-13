'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useLanguage } from './LanguageProvider'
import { useHousehold } from './HouseholdProvider'

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
  const { activeHouseholdId } = useHousehold()
  
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
  const [categories, setCategories] = useState<Array<{id: string, name: string, level: number, parent?: {name: string}}>>([])
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

  useEffect(() => {
    fetchCategoriesAndRooms()
  }, [activeHouseholdId])

  // Also fetch data when modal opens
  useEffect(() => {
    if (item.id) {
      fetchCategoriesAndRooms()
    }
  }, [item.id])

  // Update selected values when item data changes
  useEffect(() => {
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
    if (!activeHouseholdId) return

    try {
      const [categoriesResponse, roomsResponse] = await Promise.all([
        fetch(`/api/categories?householdId=${activeHouseholdId}`, { credentials: 'include' }),
        fetch(`/api/rooms?householdId=${activeHouseholdId}`, { credentials: 'include' })
      ])

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json()
        console.log('Categories API response:', categoriesData)
        
        // Handle different response formats - the API now returns { categories: [...], debug: {...} }
        const categoriesArray = Array.isArray(categoriesData) ? categoriesData : 
                               categoriesData.categories || 
                               (categoriesData.data ? categoriesData.data : [])
        
        const flattenCategories = (cats: any[], parent?: any, level = 0): any[] => {
          let result: any[] = []
          if (Array.isArray(cats)) {
            cats.forEach(cat => {
              const categoryData = { 
                id: cat.id, 
                name: cat.name, 
                level: cat.level || level,
                parent: parent ? { name: parent.name } : undefined
              }
              result.push(categoryData)
              if (cat.children && cat.children.length > 0) {
                result = result.concat(flattenCategories(cat.children, cat, level + 1))
              }
            })
          }
          return result
        }
        
        // First flatten the categories to include all levels
        const flattenedCategories = flattenCategories(categoriesArray)
        
        // Sort by level first, then by name for better dropdown display
        flattenedCategories.sort((a, b) => {
          if (a.level !== b.level) {
            return a.level - b.level
          }
          return a.name.localeCompare(b.name)
        })
        
        console.log('EditItemModal - Loaded categories:', flattenedCategories.length, flattenedCategories)
        setCategories(flattenedCategories)
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
        setCabinets(cabinetsData)
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
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.level > 0 ? '  '.repeat(category.level) + '└ ' : ''}
                    {category.parent ? `${category.parent.name} > ${category.name}` : category.name}
                  </option>
                ))}
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
                  <option value="">Select Room</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>{room.name}</option>
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
                  <option value="">Select Cabinet</option>
                  {cabinets.map(cabinet => (
                    <option key={cabinet.id} value={cabinet.id}>{cabinet.name}</option>
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
