'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, PlusIcon, ShoppingBagIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface CateringSetupModalProps {
  buildingId?: string
  communityId?: string
  onClose: () => void
}

interface Category {
  id: string
  name: string
  description?: string
  displayOrder: number
  isActive: boolean
}

interface MenuItem {
  id: string
  name: string
  description?: string
  imageUrl?: string
  cost: number | string
  quantityAvailable: number
  isActive: boolean
  category?: { id: string; name: string }
}

export default function CateringSetupModal({ buildingId, communityId, onClose }: CateringSetupModalProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'menu'>('overview')
  const [serviceId, setServiceId] = useState<string | null>(null)

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
        fetch(`/api/catering/menu?${params.toString()}`),
        fetch(`/api/catering/service?${params.toString()}`),
      ])

      if (menuRes.ok) {
        const menuData = await menuRes.json()
        setCategories(menuData.categories || [])
        setMenuItems(menuData.menuItems || [])
      }

      if (serviceRes.ok) {
        const serviceData = await serviceRes.json()
        if (serviceData.service) {
          setServiceId(serviceData.service.id)
        }
      } else {
        toast.error('Service not found')
        onClose()
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = () => {
    if (!serviceId) {
      toast.error('Service ID not found')
      return
    }

    const name = prompt('Enter category name:')
    if (!name) return

    const description = prompt('Enter category description (optional):') || undefined

    fetch('/api/catering/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'category',
        serviceId: serviceId,
        name,
        description,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          toast.error(data.error)
        } else {
          toast.success('Category added')
          loadData()
        }
      })
      .catch(err => {
        console.error('Error adding category:', err)
        toast.error('Failed to add category')
      })
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <ShoppingBagIcon className="h-6 w-6 text-primary-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  餐飲服務設定
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'overview'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  概覽
                </button>
                <button
                  onClick={() => setActiveTab('categories')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'categories'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  分類 ({categories.length})
                </button>
                <button
                  onClick={() => setActiveTab('menu')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'menu'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  菜單項目 ({menuItems.length})
                </button>
              </nav>
            </div>

            {/* Content */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">載入中...</p>
              </div>
            ) : (
              <div>
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        ✅ 餐飲服務已啟用
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">分類數量</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {categories.length}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">菜單項目</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {menuItems.length}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        下一步：
                      </h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>添加分類以組織菜單項目</li>
                        <li>添加菜單項目（包括照片、描述、價格）</li>
                        <li>設定可用時間和數量</li>
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === 'categories' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        管理菜單分類
                      </p>
                      <button
                        onClick={handleAddCategory}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        添加分類
                      </button>
                    </div>
                    {categories.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>尚無分類</p>
                        <p className="text-sm mt-2">點擊「添加分類」開始</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {categories.map((category) => (
                          <div
                            key={category.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {category.name}
                              </p>
                              {category.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {category.description}
                                </p>
                              )}
                            </div>
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
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'menu' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        管理菜單項目
                      </p>
                      <Link
                        href={`/admin/catering?buildingId=${buildingId || ''}&communityId=${communityId || ''}`}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        添加項目
                      </Link>
                    </div>
                    {menuItems.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>尚無菜單項目</p>
                        <p className="text-sm mt-2">點擊「添加項目」開始</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {menuItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              {item.imageUrl && (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="h-12 w-12 object-cover rounded"
                                />
                              )}
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {item.name}
                                </p>
                                {item.description && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {item.description}
                                  </p>
                                )}
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  ${parseFloat(item.cost.toString()).toFixed(2)} • 
                                  庫存: {item.quantityAvailable}
                                </p>
                              </div>
                            </div>
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
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
            >
              完成
            </button>
            <Link
              href={`/admin/catering?buildingId=${buildingId || ''}&communityId=${communityId || ''}`}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              完整管理頁面
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
