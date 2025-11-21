'use client'
// 物品列表組件
// 顯示和管理物品列表，支援搜尋、分類篩選、房間篩選等功能

import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '../LanguageProvider'
import { useHousehold } from '../HouseholdProvider'
import ItemCard from './ItemCard'

// 物品介面定義
interface Item {
  id: string // 物品 ID
  name: string // 物品名稱
  description?: string // 物品描述（可選）
  quantity: number // 數量
  minQuantity: number // 最小數量
  imageUrl?: string // 圖片 URL（可選）
  category?: {
    id: string // 分類 ID
    name: string // 分類名稱
    parent?: {
      name: string // 父分類名稱
    }
  }
  room?: {
    id: string // 房間 ID
    name: string // 房間名稱
  }
  cabinet?: {
    id: string // 櫃子 ID
    name: string // 櫃子名稱
  }
  itemIds?: string[] // 追蹤此群組的所有物品 ID（可選，用於合併顯示）
}

// 物品列表屬性介面
interface ItemsListProps {
  showCategory?: boolean // 是否顯示分類
  showLocation?: boolean // 是否顯示位置
  onItemEdit?: (item: Item) => void // 編輯物品回調
  onItemMove?: (item: Item) => void // 移動物品回調
  onItemCheckout?: (item: Item) => void // 取出物品回調
  onItemHistory?: (item: Item) => void // 查看歷史回調
  onItemQuantityAdjust?: (item: Item) => void // 調整數量回調
  className?: string // 自訂 CSS 類名
  searchTerm?: string // 搜尋關鍵字
  selectedCategory?: string // 選中的分類 ID
  selectedRoom?: string // 選中的房間 ID
  onRef?: (refreshFn: () => void) => void // 刷新函數引用回調
}

export default function ItemsList({
  showCategory = false,
  showLocation = false,
  onItemEdit,
  onItemMove,
  onItemCheckout,
  onItemHistory,
  onItemQuantityAdjust,
  className = '',
  searchTerm = '',
  selectedCategory = '',
  selectedRoom = '',
  onRef
}: ItemsListProps) {
  const { t } = useLanguage() // 語言設定
  const { household } = useHousehold() // 當前家庭
  const [items, setItems] = useState<Item[]>([]) // 物品列表
  const [loading, setLoading] = useState(true) // 載入狀態
  const [error, setError] = useState<string | null>(null) // 錯誤訊息

  // 獲取分組物品（支援搜尋和篩選）
  const fetchGroupedItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 關鍵：等待家庭載入完成後再獲取資料
      if (!household?.id) {
        console.log('ItemsList: Waiting for household to load, skipping fetch')
        setLoading(false)
        setItems([])
        return
      }
      
      // 添加小延遲以防止快速連續請求
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 構建查詢參數
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm) // 搜尋關鍵字
      if (selectedCategory) params.append('category', selectedCategory) // 分類篩選
      if (selectedRoom) params.append('room', selectedRoom) // 房間篩選
      params.append('householdId', household.id) // 始終包含家庭 ID
      
      const url = `/api/warehouse/items${params.toString() ? '?' + params.toString() : ''}`
      console.log('ItemsList: Fetching from URL:', url)
      console.log('ItemsList: Active household:', household.id, household.name)
      const response = await fetch(url)
      
      if (response.ok) {
        const data = await response.json()
        console.log('ItemsList: Successfully fetched', data.length, 'items')
        setItems(data) // 設定物品列表
      } else {
        let errorMessage = 'Failed to fetch items'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
        }
        console.error('ItemsList: API error:', response.status, errorMessage)
        setError(errorMessage)
      }
    } catch (err) {
      console.error('Error fetching grouped items:', err)
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, selectedCategory, selectedRoom, household?.id])

  useEffect(() => {
    fetchGroupedItems()
  }, [fetchGroupedItems])

  // Expose refresh function to parent component
  useEffect(() => {
    console.log('ItemsList: onRef callback available:', !!onRef)
    if (onRef) {
      console.log('ItemsList: Calling onRef with fetchGroupedItems function')
      onRef(fetchGroupedItems)
    }
  }, [onRef, fetchGroupedItems])

  // Filter items on the client side as well for better responsiveness
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !selectedCategory || 
      item.category?.id === selectedCategory ||
      item.category?.name === selectedCategory
    
    const matchesRoom = !selectedRoom || 
      item.room?.id === selectedRoom ||
      item.room?.name === selectedRoom
    
    return matchesSearch && matchesCategory && matchesRoom
  })

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                  <div className="flex space-x-2">
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4 ${className}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Error loading items
            </h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchGroupedItems}
                className="bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200 dark:hover:bg-red-700"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (filteredItems.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          {searchTerm || selectedCategory || selectedRoom ? t('noItemsFound') : t('noItemsFound')}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {searchTerm || selectedCategory || selectedRoom 
            ? t('searchTips') 
            : t('startAddingItems')
          }
        </p>
        <div className="mt-4">
          <button
            onClick={() => {
              // Force hard refresh
              window.location.reload();
            }}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {t('forceRefreshPage')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {t('allItems')} ({filteredItems.length})
        </h3>
        <button
          onClick={fetchGroupedItems}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          {t('refresh')}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            showCategory={showCategory}
            showLocation={showLocation}
            onEdit={(itemData) => {
              console.log('ItemsList: onItemEdit called for:', itemData.name)
              onItemEdit?.(itemData)
            }}
            onMove={(itemData) => {
              console.log('ItemsList: onItemMove called for:', itemData.name)
              onItemMove?.(itemData)
            }}
            onCheckout={(itemData) => {
              console.log('ItemsList: onItemCheckout called for:', itemData.name)
              onItemCheckout?.(itemData)
            }}
            onHistory={(itemData) => {
              console.log('ItemsList: onItemHistory called for:', itemData.name)
              onItemHistory?.(itemData)
            }}
            onQuantityAdjust={(itemData) => {
              console.log('ItemsList: onItemQuantityAdjust called for:', itemData.name)
              onItemQuantityAdjust?.(itemData)
            }}
          />
        ))}
      </div>
    </div>
  )
}
