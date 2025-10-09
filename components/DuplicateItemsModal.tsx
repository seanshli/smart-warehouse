'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, ArrowRightIcon, PlusIcon } from '@heroicons/react/24/outline'
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
    name: string
  }
}

interface DuplicateGroup {
  id: string
  name: string
  totalQuantity: number
  items: Item[]
  location: string
}

interface DuplicateItemsModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function DuplicateItemsModal({ onClose, onSuccess }: DuplicateItemsModalProps) {
  const { t } = useLanguage()
  const { activeHouseholdId } = useHousehold()
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [combiningItems, setCombiningItems] = useState<string[]>([])

  useEffect(() => {
    fetchDuplicates()
  }, [activeHouseholdId])

  const fetchDuplicates = async () => {
    if (!activeHouseholdId) return

    try {
      const response = await fetch(`/api/items/duplicates?householdId=${activeHouseholdId}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        const duplicateGroups: DuplicateGroup[] = data.map((group: Item[], index: number) => ({
          id: `group-${index}`,
          name: group[0].name,
          totalQuantity: group.reduce((sum, item) => sum + item.quantity, 0),
          items: group,
          location: `${group[0].room?.name || 'No Room'} > ${group[0].cabinet?.name || 'No Cabinet'}`
        }))
        setDuplicates(duplicateGroups)
      } else {
        toast.error('Failed to load duplicate items')
      }
    } catch (error) {
      console.error('Error fetching duplicates:', error)
      toast.error('Failed to load duplicate items')
    } finally {
      setIsLoading(false)
    }
  }

  const combineItems = async (group: DuplicateGroup, targetItemId: string) => {
    const sourceItemIds = group.items.filter(item => item.id !== targetItemId).map(item => item.id)
    
    if (sourceItemIds.length === 0) {
      toast.error('No items to combine')
      return
    }

    setCombiningItems(sourceItemIds)

    try {
      const response = await fetch('/api/items/duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          itemIds: sourceItemIds,
          targetItemId: targetItemId
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Successfully combined ${result.combinedCount} items!`)
        onSuccess()
        fetchDuplicates() // Refresh the list
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to combine items')
      }
    } catch (error) {
      console.error('Error combining items:', error)
      toast.error('Failed to combine items')
    } finally {
      setCombiningItems([])
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="mt-3 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading duplicate items...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <PlusIcon className="h-5 w-5 mr-2 text-primary-600" />
              Duplicate Items
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {duplicates.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">✅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Duplicates Found</h3>
              <p className="text-gray-600">All your items are unique!</p>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-gray-600">
                Found {duplicates.length} groups of duplicate items. You can combine them to reduce clutter.
              </p>

              {duplicates.map((group) => (
                <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{group.name}</h4>
                      <p className="text-sm text-gray-600">{group.location}</p>
                      <p className="text-sm text-gray-500">
                        {group.items.length} items • Total quantity: {group.totalQuantity}
                      </p>
                    </div>
                    <button
                      onClick={() => combineItems(group, group.items[0].id)}
                      disabled={combiningItems.length > 0}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                    >
                      {combiningItems.length > 0 ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Combining...
                        </>
                      ) : (
                        <>
                          <ArrowRightIcon className="h-4 w-4 mr-2" />
                          Combine All
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {group.items.map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900 mr-3">#{index + 1}</span>
                          <div>
                            <p className="text-sm text-gray-900">Quantity: {item.quantity}</p>
                            {item.description && (
                              <p className="text-xs text-gray-600 truncate max-w-xs">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {item.id !== group.items[0].id && (
                            <button
                              onClick={() => combineItems(group, item.id)}
                              disabled={combiningItems.includes(item.id)}
                              className="text-xs text-primary-600 hover:text-primary-800 disabled:opacity-50"
                            >
                              Use as Target
                            </button>
                          )}
                          {item.id === group.items[0].id && (
                            <span className="text-xs text-green-600 font-medium">Target Item</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
