'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  XMarkIcon,
  PhotoIcon,
  ClockIcon
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
  const [activeTab, setActiveTab] = useState<'categories' | 'items'>('categories')
  
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
    cost: '',
    quantityAvailable: 0,
    categoryId: '',
    isActive: true,
    availableAllDay: true,
    timeSlots: [] as Array<{ dayOfWeek: number; startTime: string; endTime: string }>
  })

  useEffect(() => {
    loadData()
  }, [buildingId, communityId])

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
      cost: '',
      quantityAvailable: 0,
      categoryId: '',
      isActive: true,
      availableAllDay: true,
      timeSlots: [],
    })
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
    <div className="space-y-6">
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
                        <span>價格: ${parseFloat(item.cost.toString()).toFixed(2)}</span>
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
                          價格 (成本) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={itemForm.cost}
                          onChange={(e) => setItemForm({ ...itemForm, cost: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                        />
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
                        圖片 URL
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="url"
                          value={itemForm.imageUrl}
                          onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
                          placeholder="https://example.com/image.jpg"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                        />
                        {itemForm.imageUrl && (
                          <img
                            src={itemForm.imageUrl}
                            alt="Preview"
                            className="h-12 w-12 object-cover rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
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
        </div>
      )}
    </div>
  )
}
