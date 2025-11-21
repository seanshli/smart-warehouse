'use client'
// 移動物品模態框組件
// 用於將物品從一個位置移動到另一個位置，支援部分移動和完整移動，可同時更改房間、櫃子和分類

import { useState, useEffect } from 'react'
import { XMarkIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useLanguage } from '../LanguageProvider'
import { useHousehold } from '../HouseholdProvider'

// 物品介面定義
interface Item {
  id: string // 物品 ID
  name: string // 物品名稱
  description?: string // 物品描述（可選）
  quantity: number // 數量
  minQuantity: number // 最小數量
  imageUrl?: string // 圖片 URL（可選）
  category?: {
    id?: string // 分類 ID（可選）
    name: string // 分類名稱
    parent?: {
      name: string // 父分類名稱
    }
  }
  room?: {
    id?: string // 房間 ID（可選）
    name: string // 房間名稱
  }
  cabinet?: {
    id?: string // 櫃子 ID（可選）
    name: string // 櫃子名稱
  }
  // 群組物品欄位（同一物品可能存儲在多個位置）
  locations?: Array<{
    id: string // 資料庫中的實際物品 ID
    quantity: number // 該位置的數量
    room: { id: string; name: string } | null // 房間資訊
    cabinet: { id: string; name: string } | null // 櫃子資訊
  }>
  totalQuantity?: number // 總數量（用於群組物品）
  itemIds?: string[] // 物品 ID 列表（用於群組顯示）
}

// 分類介面定義
interface Category {
  id: string // 分類 ID
  name: string // 分類名稱
  level: number // 分類層級
  parent?: {
    id: string // 父分類 ID
    name: string // 父分類名稱
  }
  children?: Category[] // 子分類列表
}

// 移動物品模態框屬性介面
interface MoveItemModalProps {
  item: Item // 要移動的物品
  onClose: () => void // 關閉回調
  onSuccess: () => void // 成功回調
}

export default function MoveItemModal({ item, onClose, onSuccess }: MoveItemModalProps) {
  const { t } = useLanguage() // 語言設定
  const { activeHouseholdId } = useHousehold() // 當前家庭 ID
  const [selectedRoom, setSelectedRoom] = useState(item.room?.id || '') // 選中的目標房間 ID
  const [selectedCabinet, setSelectedCabinet] = useState(item.cabinet?.id || '') // 選中的目標櫃子 ID
  const [selectedCategory, setSelectedCategory] = useState(item.category?.id || '') // 選中的目標分類 ID
  const [moveQuantity, setMoveQuantity] = useState(1) // 要移動的數量
  const [rooms, setRooms] = useState<Array<{id: string, name: string}>>([]) // 房間列表
  const [cabinets, setCabinets] = useState<Array<{id: string, name: string}>>([]) // 櫃子列表
  const [categories, setCategories] = useState<Category[]>([]) // 分類列表
  const [isLoading, setIsLoading] = useState(false) // 載入狀態
  
  // 群組物品的來源選擇（當同一物品存儲在多個位置時）
  const availableQuantity = item.totalQuantity || item.quantity // 可用總數量
  const hasMultipleLocations = item.locations && item.locations.length > 1 // 是否有多個位置
  const [selectedSources, setSelectedSources] = useState<Array<{itemId: string, locationId: string, quantity: number, available: number}>>([]) // 選中的來源位置列表
  
  // 當模態框打開時初始化來源
  useEffect(() => {
    if (hasMultipleLocations && item.locations) {
      // 如果只移動少量物品，自動選擇第一個位置
      setSelectedSources([{
        itemId: item.locations[0].id,
        locationId: `${item.locations[0].room?.id || ''}_${item.locations[0].cabinet?.id || ''}`,
        quantity: 0,
        available: item.locations[0].quantity
      }])
    }
  }, [hasMultipleLocations, item.locations])

  // 當從多個來源移動時，自動計算從選中來源移動的總數量
  const totalSelectedFromSources = selectedSources.reduce((sum, s) => sum + s.quantity, 0) // 從選中來源移動的總數量
  const effectiveMoveQuantity = hasMultipleLocations ? totalSelectedFromSources : moveQuantity // 有效移動數量

  useEffect(() => {
    fetchRooms()
    fetchCategories()
  }, [activeHouseholdId])

  useEffect(() => {
    if (selectedRoom) {
      console.log('MoveItemModal: Room selected, fetching cabinets for:', selectedRoom)
      // Clear cabinet selection when room changes
      setSelectedCabinet('')
      fetchCabinets(selectedRoom)
    } else {
      console.log('MoveItemModal: No room selected, clearing cabinets')
      setCabinets([])
      setSelectedCabinet('')
    }
  }, [selectedRoom])

  const fetchRooms = async () => {
    if (!activeHouseholdId) return

    try {
      const response = await fetch(`/api/warehouse/rooms?householdId=${activeHouseholdId}`, { credentials: 'include' })
      if (response.ok) {
        const roomsData = await response.json()
        console.log('MoveItemModal - Rooms API response:', roomsData)
        
        // Handle different response formats
        const roomsArray = Array.isArray(roomsData) ? roomsData : 
                          roomsData.rooms || 
                          (roomsData.data ? roomsData.data : [])
        
        setRooms(roomsArray)
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
      toast.error('Failed to load rooms.')
    }
  }

  const fetchCabinets = async (roomId: string) => {
    try {
      console.log('MoveItemModal - Fetching cabinets for roomId:', roomId, 'householdId:', activeHouseholdId)
      const response = await fetch(`/api/warehouse/cabinets?roomId=${roomId}`, { credentials: 'include' })
      console.log('MoveItemModal - Cabinet API response status:', response.status)
      
      if (response.ok) {
        const cabinetsData = await response.json()
        console.log('MoveItemModal - Cabinets API response:', cabinetsData)
        
        // Handle different response formats
        const cabinetsArray = Array.isArray(cabinetsData) ? cabinetsData : 
                             cabinetsData.cabinets || 
                             (cabinetsData.data ? cabinetsData.data : [])
        
        console.log('MoveItemModal - Processed cabinets array:', cabinetsArray)
        setCabinets(cabinetsArray)
      } else {
        const errorData = await response.json()
        console.error('MoveItemModal - Cabinet API error:', errorData)
        toast.error(`Failed to load cabinets: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error fetching cabinets:', error)
      toast.error('Failed to load cabinets.')
    }
  }

  const fetchCategories = async () => {
    if (!activeHouseholdId) return

    try {
      const response = await fetch(`/api/warehouse/categories?householdId=${activeHouseholdId}`, { credentials: 'include' })
      if (response.ok) {
        const categoriesData = await response.json()
        console.log('MoveItemModal - Categories API response:', categoriesData)
        
        // Handle different response formats
        const categoriesArray = Array.isArray(categoriesData) ? categoriesData : 
                               categoriesData.categories || 
                               (categoriesData.data ? categoriesData.data : [])
        
        setCategories(categoriesArray)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedRoom) {
      toast.error('Please select a room')
      return
    }

    // Validate source selection for grouped items with multiple locations
    if (hasMultipleLocations && item.locations && item.locations.length > 1) {
      if (selectedSources.length === 0) {
        toast.error('Please select at least one source location')
        return
      }
      
      // Auto-distribute if user selected sources but didn't specify quantities
      let totalFromSources = selectedSources.reduce((sum, s) => sum + s.quantity, 0)
      if (totalFromSources === 0) {
        // Auto-distribute moveQuantity across selected sources
        const perSource = Math.floor(moveQuantity / selectedSources.length)
        const remainder = moveQuantity % selectedSources.length
        const updatedSources = selectedSources.map((s, idx) => ({
          ...s,
          quantity: perSource + (idx < remainder ? 1 : 0)
        }))
        setSelectedSources(updatedSources)
        totalFromSources = moveQuantity
      }
      
      if (totalFromSources !== moveQuantity) {
        toast.error(`Selected source quantities (${totalFromSources}) must equal move quantity (${moveQuantity})`)
        return
      }
      
      // Validate each source has enough quantity
      for (const source of selectedSources) {
        const location = item.locations.find(l => l.id === source.itemId)
        if (!location || source.quantity > location.quantity) {
          toast.error(`Invalid quantity for source: ${location?.room?.name || 'Unknown'}`)
          return
        }
      }
    }

    setIsLoading(true)

    try {
      // For grouped items with multiple sources, move from each source
      if (hasMultipleLocations && item.locations && item.locations.length > 1 && selectedSources.length > 0) {
        let successCount = 0
        let errorCount = 0
        
        for (const source of selectedSources) {
          try {
            const response = await fetch(`/api/warehouse/items/${source.itemId}/move`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                roomId: selectedRoom,
                cabinetId: selectedCabinet || null,
                categoryId: selectedCategory || null,
                quantity: source.quantity
              })
            })

            if (response.ok) {
              successCount++
            } else {
              const errorData = await response.json()
              console.error(`Failed to move from source ${source.itemId}:`, errorData.error)
              errorCount++
            }
          } catch (error) {
            console.error(`Error moving from source ${source.itemId}:`, error)
            errorCount++
          }
        }
        
        if (successCount > 0 && errorCount === 0) {
          toast.success(`Successfully moved ${moveQuantity} items from ${successCount} location(s)!`)
          onSuccess()
          onClose()
        } else if (successCount > 0) {
          toast.error(`Partially moved: ${successCount} succeeded, ${errorCount} failed`)
          onSuccess() // Still refresh to show partial updates
          onClose()
        } else {
          toast.error(`Failed to move items from all sources`)
        }
      } else {
        // Single item or single location - use original logic
        let itemIdToUse = item.id
        if (hasMultipleLocations && item.locations && item.locations.length === 1) {
          // Single location grouped item - use that location's item ID
          itemIdToUse = item.locations[0].id
        } else if (hasMultipleLocations && selectedSources.length === 1) {
          // User selected single source
          itemIdToUse = selectedSources[0].itemId
        }
        
        const response = await fetch(`/api/warehouse/items/${itemIdToUse}/move`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            roomId: selectedRoom,
            cabinetId: selectedCabinet || null,
            categoryId: selectedCategory || null,
            quantity: moveQuantity
          })
        })

        if (response.ok) {
          toast.success('Item moved successfully!')
          onSuccess()
          onClose()
        } else {
          const errorData = await response.json()
          toast.error(errorData.error || 'Failed to move item')
        }
      }
    } catch (error) {
      console.error('Error moving item:', error)
      toast.error('Failed to move item')
    } finally {
      setIsLoading(false)
    }
  }

  const currentLocation = item.room?.name && item.cabinet?.name 
    ? `${item.room.name} → ${item.cabinet.name}`
    : item.room?.name || 'No location set'

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {t('moveItem')}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{item?.name || 'Unknown Item'}</h4>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Total {t('qty')}:</span> {availableQuantity}
                </p>
              </div>
              {hasMultipleLocations && item.locations && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-700 mb-2">{t('moveFrom') || 'Move from'}:</p>
                  <div className="space-y-2">
                    {item.locations.map((location, idx) => {
                      const source = selectedSources.find(s => s.itemId === location.id)
                      const isSelected = !!source
                      return (
                        <div key={location.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSources([...selectedSources, {
                                  itemId: location.id,
                                  locationId: `${location.room?.id || ''}_${location.cabinet?.id || ''}`,
                                  quantity: 0,
                                  available: location.quantity
                                }])
                              } else {
                                setSelectedSources(selectedSources.filter(s => s.itemId !== location.id))
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <label className="flex-1 text-sm text-gray-700">
                            {location.room?.name || 'No room'} {location.cabinet?.name ? `→ ${location.cabinet.name}` : ''} 
                            <span className="text-gray-500 ml-1">({location.quantity} {t('qty') || 'available'})</span>
                          </label>
                          {isSelected && (
                            <input
                              type="number"
                              min="1"
                              max={location.quantity}
                              value={source?.quantity || 0}
                              onChange={(e) => {
                                const qty = parseInt(e.target.value) || 0
                                setSelectedSources(selectedSources.map(s => 
                                  s.itemId === location.id ? { ...s, quantity: Math.min(qty, location.quantity) } : s
                                ))
                              }}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                              placeholder="Qty"
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Selected total: {selectedSources.reduce((sum, s) => sum + s.quantity, 0)} / {moveQuantity}
                  </p>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="room" className="block text-sm font-medium text-gray-700">
                {t('moveToRoom')} *
              </label>
              <select
                id="room"
                value={selectedRoom}
                onChange={(e) => {
                  setSelectedRoom(e.target.value)
                  setSelectedCabinet('')
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
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

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Keep Current Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {'  '.repeat(category.level - 1)}{category.name} (Level {category.level})
                  </option>
                ))}
              </select>
            </div>

            {!hasMultipleLocations && (
              <div>
                <label htmlFor="moveQuantity" className="block text-sm font-medium text-gray-700">
                  {t('moveQuantity') || 'Quantity to Move'} *
                </label>
                <input
                  type="number"
                  id="moveQuantity"
                  min="1"
                  max={availableQuantity}
                  value={moveQuantity}
                  onChange={(e) => {
                    const inputValue = e.target.value
                    if (inputValue === '') {
                      setMoveQuantity(1)
                      return
                    }
                    const numValue = parseInt(inputValue)
                    if (!isNaN(numValue)) {
                      if (numValue >= 1 && numValue <= availableQuantity) {
                        setMoveQuantity(numValue)
                      }
                    }
                  }}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Available: {availableQuantity} | Moving: {moveQuantity}
                </p>
              </div>
            )}

            {selectedRoom && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-center">
                  <ArrowRightIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm text-blue-800">
                    {t('moveConfirmation')}: {rooms.find(r => r.id === selectedRoom)?.name || 'Unknown Room'}
                    {selectedCabinet && cabinets.find(c => c.id === selectedCabinet)?.name && ` → ${cabinets.find(c => c.id === selectedCabinet)?.name}`}
                    {selectedCategory && categories.find(c => c.id === selectedCategory)?.name && ` → ${categories.find(c => c.id === selectedCategory)?.name}`}
                    {` • ${t('moveQuantity') || 'Quantity to Move'}: ${effectiveMoveQuantity}`}
                  </span>
                </div>
              </div>
            )}

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
                disabled={isLoading || !selectedRoom || (hasMultipleLocations && effectiveMoveQuantity <= 0)}
              >
                {isLoading ? t('moving') : t('move')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
