'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, CubeIcon, ChevronRightIcon, TrashIcon, PencilIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useLanguage } from './LanguageProvider'
import { useHousehold } from './HouseholdProvider'
import { translateCategoryName } from '@/lib/location-translations'

interface Category {
  id: string
  name: string
  description?: string
  level: number
  parentId?: string
  children: Category[]
  _count: {
    items: number
  }
}

export default function CategoryManagement() {
  const { t, currentLanguage } = useLanguage()
  const { household } = useHousehold()
  const [categories, setCategories] = useState<Category[]>([])
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')
  const [newCategoryLevel, setNewCategoryLevel] = useState(1)
  const [newCategoryParent, setNewCategoryParent] = useState('')
  const [newCategoryGrandParent, setNewCategoryGrandParent] = useState('')
  const [showCreateLevel2, setShowCreateLevel2] = useState(false)
  const [newLevel2CategoryName, setNewLevel2CategoryName] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [debugData, setDebugData] = useState<any>(null)
  const [showEditCategory, setShowEditCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [editCategoryDescription, setEditCategoryDescription] = useState('')
  const [showMoveCategory, setShowMoveCategory] = useState(false)
  const [movingCategory, setMovingCategory] = useState<Category | null>(null)
  const [moveToLevel, setMoveToLevel] = useState(1)
  const [moveToParent, setMoveToParent] = useState('')
  const [moveToGrandParent, setMoveToGrandParent] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [household?.id])

  const fetchCategories = async () => {
    try {
      // CRITICAL: Don't fetch until household is loaded
      if (!household?.id) {
        console.log('CategoryManagement: Waiting for household to load, skipping fetch')
        setCategories([])
        return
      }
      
      const params = new URLSearchParams()
      params.append('householdId', household.id) // Always include householdId
      
      const url = `/api/categories${params.toString() ? '?' + params.toString() : ''}`
      console.log('CategoryManagement: Fetching from URL:', url)
      console.log('CategoryManagement: Active household:', household.id, household.name)
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        console.log('Raw categories data from API:', data)
        
        // Build hierarchical structure from flat API response
        const buildHierarchy = (categories: any[]): any[] => {
          const categoryMap = new Map()
          const roots: any[] = []
          
          // First pass: create map of all categories
          categories.forEach(category => {
            categoryMap.set(category.id, {
              ...category,
              children: []
            })
          })
          
          // Second pass: build hierarchy
          categories.forEach(category => {
            const categoryObj = categoryMap.get(category.id)
            if (category.parentId) {
              const parent = categoryMap.get(category.parentId)
              if (parent) {
                parent.children.push(categoryObj)
              }
            } else {
              roots.push(categoryObj)
            }
          })
          
          return roots
        }
        
        console.log('Categories API response:', data)
        const hierarchicalData = buildHierarchy(data.categories || data)
        console.log('Hierarchical categories:', hierarchicalData)
        setCategories(hierarchicalData)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategoryName,
          description: newCategoryDescription,
          level: newCategoryLevel,
          parentId: newCategoryParent || null,
        }),
      })

      if (response.ok) {
        toast.success('Category added successfully!')
        setNewCategoryName('')
        setNewCategoryDescription('')
        setNewCategoryLevel(1)
        setNewCategoryParent('')
        setNewCategoryGrandParent('')
        setShowCreateLevel2(false)
        setNewLevel2CategoryName('')
        setShowAddCategory(false)
        await fetchCategories() // Wait for categories to refresh
      } else {
        const errorData = await response.json()
        if (response.status === 409) {
          toast.error(`${errorData.error}. ${errorData.suggestion}`)
        } else {
          toast.error(errorData.error || 'Failed to add category')
        }
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const handleCategoryClick = (category: Category) => {
    // Allow expansion for all levels except level 3 (which can't have children)
    if (category.level < 3) {
      toggleExpanded(category.id)
    }
  }

  const handleDeleteCategory = async (categoryId: string, categoryName: string, itemCount: number) => {
    if (itemCount > 0) {
      toast.error(`Cannot delete category "${categoryName}". It contains ${itemCount} item(s). Please move or delete all items first.`)
      return
    }

    if (!confirm(`Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success(`Category "${categoryName}" deleted successfully!`)
        await fetchCategories()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('An error occurred while deleting the category')
    }
  }

  const fetchDebugData = async () => {
    try {
      const response = await fetch('/api/debug/categories')
      if (response.ok) {
        const data = await response.json()
        setDebugData(data)
        console.log('Debug data:', data)
      }
    } catch (error) {
      console.error('Error fetching debug data:', error)
    }
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setEditCategoryName(category.name)
    setEditCategoryDescription(category.description || '')
    setShowEditCategory(true)
  }

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory || !editCategoryName.trim()) return

    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editCategoryName,
          description: editCategoryDescription,
        }),
      })

      if (response.ok) {
        toast.success('Category updated successfully!')
        setShowEditCategory(false)
        setEditingCategory(null)
        setEditCategoryName('')
        setEditCategoryDescription('')
        await fetchCategories()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to update category')
      }
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('An error occurred while updating the category')
    }
  }

  const handleMoveCategory = (category: Category) => {
    setMovingCategory(category)
    setMoveToLevel(category.level)
    setMoveToParent(category.parentId || '')
    setMoveToGrandParent('')
    setShowMoveCategory(true)
  }

  const handleConfirmMove = async () => {
    if (!movingCategory) return

    try {
      const response = await fetch(`/api/categories/${movingCategory.id}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newLevel: moveToLevel,
          newParentId: moveToParent || null,
        }),
      })

      if (response.ok) {
        toast.success('Category moved successfully!')
        setShowMoveCategory(false)
        setMovingCategory(null)
        setMoveToLevel(1)
        setMoveToParent('')
        setMoveToGrandParent('')
        await fetchCategories()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to move category')
      }
    } catch (error) {
      console.error('Error moving category:', error)
      toast.error('An error occurred while moving the category')
    }
  }

  // Helper function to flatten hierarchical categories for filtering
  const flattenCategoriesForFilter = (categories: any[]): any[] => {
    const result: any[] = []
    categories.forEach(category => {
      result.push(category)
      if (category.children && category.children.length > 0) {
        result.push(...flattenCategoriesForFilter(category.children))
      }
    })
    return result
  }

  const getParentCategories = (level: number, grandParentId?: string) => {
    console.log('getParentCategories called with:', { level, grandParentId })
    console.log('All categories:', categories)
    
    if (level === 1) return []
    
    // Flatten categories for filtering
    const flatCategories = flattenCategoriesForFilter(categories)
    
    if (level === 2) {
      // For 2nd level, show all 1st level categories (excluding the moving category itself)
      const result = flatCategories.filter(cat => 
        cat.level === 1 && cat.id !== movingCategory?.id
      )
      console.log('Level 2 parent categories:', result)
      return result
    }
    
    if (level === 3) {
      // For 3rd level, show 2nd level categories under the selected grandparent
      if (grandParentId) {
        const result = flatCategories.filter(cat => 
          cat.level === 2 && 
          cat.parentId === grandParentId &&
          cat.id !== movingCategory?.id
        )
        console.log('Level 3 parent categories for grandparent', grandParentId, ':', result)
        console.log('All level 2 categories:', flatCategories.filter(cat => cat.level === 2))
        return result
      }
      // If no grandparent selected, show all 2nd level categories
      const result = flatCategories.filter(cat => 
        cat.level === 2 && cat.id !== movingCategory?.id
      )
      console.log('All Level 2 categories (no grandparent):', result)
      return result
    }
    
    return []
  }

  const getGrandParentCategories = () => {
    // For 3rd level categories, show 1st level categories as grandparent options (excluding the moving category itself)
    const flatCategories = flattenCategoriesForFilter(categories)
    return flatCategories.filter(cat => cat.level === 1 && cat.id !== movingCategory?.id)
  }

  const renderCategoryTree = (categories: Category[], level = 0) => {
    return categories.map((category) => (
      <div key={category.id} className={`${level > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}`}>
        <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg mb-2">
          <div className="flex items-center">
            {(category.children.length > 0 || category.level < 3) && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleCategoryClick(category)
                }}
                className="mr-2 p-1 hover:bg-gray-100 rounded"
              >
                <ChevronRightIcon 
                  className={`h-4 w-4 text-gray-500 transition-transform ${
                    expandedCategories.has(category.id) ? 'rotate-90' : ''
                  }`} 
                />
              </button>
            )}
            <CubeIcon className="h-5 w-5 text-primary-600 mr-3" />
            <div 
              className="flex-1 cursor-pointer"
              onClick={() => handleCategoryClick(category)}
            >
              <h4 className="text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors">
                {translateCategoryName(category.name, currentLanguage)}
                <span className="ml-2 text-xs text-gray-500">
                  (Level {category.level})
                </span>
                {category.children.length > 0 && (
                  <span className="ml-2 text-xs text-blue-600">
                    {category.children.length} subcategor{category.children.length === 1 ? 'y' : 'ies'}
                  </span>
                )}
              </h4>
              {category.description && (
                <p className="text-xs text-gray-500 mt-1">
                  {category.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {category._count.items} items
            </span>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleEditCategory(category)}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Edit category"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              {category.level < 3 && (
                <button
                  onClick={() => handleMoveCategory(category)}
                  className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                  title="Move to different level"
                >
                  <ArrowDownIcon className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => handleDeleteCategory(category.id, category.name, category._count.items)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete category"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        {expandedCategories.has(category.id) && (
          <div className="ml-4 mt-2">
            {category.children.length > 0 ? (
              renderCategoryTree(category.children, level + 1)
            ) : (
              <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                No subcategories yet. Add one using the "Add Category" button.
              </div>
            )}
          </div>
        )}
      </div>
    ))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{t('categoryManagement')}</h2>
        <div className="flex space-x-3">
          <button
            onClick={fetchDebugData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Debug Data
          </button>
          <button
            onClick={() => setShowAddCategory(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            {t('addCategory')}
          </button>
        </div>
      </div>

      {/* Debug Info */}
      {debugData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Debug Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Categories:</span> {debugData.summary.totalCategories}
            </div>
            <div>
              <span className="font-medium">Level 1:</span> {debugData.summary.level1Categories}
            </div>
            <div>
              <span className="font-medium">Level 2:</span> {debugData.summary.level2Categories}
            </div>
            <div>
              <span className="font-medium">Level 3:</span> {debugData.summary.level3Categories}
            </div>
            <div>
              <span className="font-medium">Total Items:</span> {debugData.summary.totalItems}
            </div>
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer text-blue-700 font-medium">Show Raw Data</summary>
            <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-40">
              {JSON.stringify(debugData, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Category Cleanup Section */}
      <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-orange-800">Duplicate Category Cleanup</h3>
            <p className="text-sm text-orange-700">Remove duplicate categories (Clothing, 服裝, 衣服, etc.)</p>
          </div>
          <button 
            onClick={async () => {
              try {
                console.log('Starting category cleanup...')
                const response = await fetch('/api/cleanup-category-duplicates', { method: 'POST' })
                console.log('Category cleanup response status:', response.status)
                const result = await response.json()
                console.log('Category cleanup result:', result)
                
                if (response.ok) {
                  if (result.cleanupResults && result.cleanupResults.length > 0) {
                    alert(`Category cleanup completed! Deleted ${result.cleanupResults.length} duplicate groups.`)
                  } else {
                    alert('No duplicate categories found to clean up.')
                  }
                  // Refresh the categories to show updated list
                  fetchCategories()
                } else {
                  alert(`Category cleanup error: ${result.error}`)
                }
              } catch (error) {
                console.error('Category cleanup error:', error)
                alert(`Category cleanup error: ${error}`)
              }
            }}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 font-bold text-lg"
          >
{t('cleanDuplicateCategories') || '🗂️ CLEAN DUPLICATE CATEGORIES'}
          </button>
        </div>
      </div>

      {/* Category Tree */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t('categoryHierarchy') || 'Category Hierarchy'}
        </h3>
        {categories.length > 0 ? (
          <div className="space-y-2">
            {renderCategoryTree(categories.filter(cat => cat.level === 1))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No categories</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first category.
            </p>
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t('addNewCategory')}
              </h3>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('categoryName')}
                  </label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., Electronics, Kitchen"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('level')}
                  </label>
                  <select
                    value={newCategoryLevel}
                    onChange={(e) => {
                      const level = parseInt(e.target.value)
                      setNewCategoryLevel(level)
                      // Reset parent selections when level changes
                      setNewCategoryParent('')
                      setNewCategoryGrandParent('')
                      setShowCreateLevel2(false)
                      setNewLevel2CategoryName('')
                    }}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value={1}>{t('level1MainCategory')}</option>
                    <option value={2}>{t('level2Subcategory')}</option>
                    <option value={3}>{t('level3SubSubcategory')}</option>
                  </select>
                </div>

                {newCategoryLevel > 1 && (
                  <div>
                    {newCategoryLevel === 3 && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Grandparent Category (Level 1)
                        </label>
                        <select
                          value={newCategoryGrandParent}
                          onChange={(e) => {
                            setNewCategoryGrandParent(e.target.value)
                            setNewCategoryParent('') // Reset parent when grandparent changes
                          }}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                          required
                        >
                          <option value="">Choose a grandparent category</option>
                          {getGrandParentCategories().map((category) => (
                            <option key={category.id} value={category.id}>
                              {translateCategoryName(category.name, currentLanguage)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Parent Category {newCategoryLevel === 3 ? '(Level 2)' : ''}
                      </label>
                      <select
                        value={newCategoryParent}
                        onChange={(e) => {
                          if (e.target.value === 'create-new-level2') {
                            setShowCreateLevel2(true)
                            setNewCategoryParent('')
                          } else {
                            setNewCategoryParent(e.target.value)
                            setShowCreateLevel2(false)
                          }
                        }}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        required
                        disabled={newCategoryLevel === 3 && !newCategoryGrandParent}
                      >
                        <option value="">
                          {newCategoryLevel === 3 && !newCategoryGrandParent 
                            ? "First select a grandparent category" 
                            : "Choose a parent category"
                          }
                        </option>
                        {getParentCategories(newCategoryLevel, newCategoryGrandParent).map((category) => (
                          <option key={category.id} value={category.id}>
                            {translateCategoryName(category.name, currentLanguage)}
                          </option>
                        ))}
                        {newCategoryLevel === 3 && getParentCategories(newCategoryLevel, newCategoryGrandParent).length === 0 && newCategoryGrandParent && (
                          <option value="create-new-level2" style={{ color: '#666', fontStyle: 'italic' }}>
                            No Level 2 categories found - Create new one
                          </option>
                        )}
                      </select>
                    </div>
                  </div>
                )}

                {showCreateLevel2 && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">
                      Create New Level 2 Category
                    </h4>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('level')} 2 Category Name
                      </label>
                      <input
                        type="text"
                        value={newLevel2CategoryName}
                        onChange={(e) => setNewLevel2CategoryName(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter Level 2 category name"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!newLevel2CategoryName.trim()) return
                          
                          try {
                            const response = await fetch('/api/categories', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                name: newLevel2CategoryName,
                                description: '',
                                level: 2,
                                parentId: newCategoryGrandParent,
                              }),
                            })

                            if (response.ok) {
                              const newCategory = await response.json()
                              toast.success('Level 2 category created successfully!')
                              setNewLevel2CategoryName('')
                              setShowCreateLevel2(false)
                              
                              // Refresh categories and then select the new one
                              await fetchCategories()
                              
                              // Small delay to ensure categories are updated
                              setTimeout(() => {
                                setNewCategoryParent(newCategory.id)
                              }, 100)
                            } else {
                              toast.error('Failed to create Level 2 category')
                            }
                          } catch (error) {
                            toast.error('An error occurred')
                          }
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        disabled={!newLevel2CategoryName.trim()}
                      >
                        Create & Select
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateLevel2(false)
                          setNewLevel2CategoryName('')
                        }}
                        className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Brief description of the category"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Add Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditCategory && editingCategory && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Edit Category
              </h3>
              
              <form onSubmit={handleUpdateCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('categoryName')}
                  </label>
                  <input
                    type="text"
                    value={editCategoryName}
                    onChange={(e) => setEditCategoryName(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description (Optional)
                  </label>
                  <textarea
                    value={editCategoryDescription}
                    onChange={(e) => setEditCategoryDescription(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditCategory(false)
                      setEditingCategory(null)
                      setEditCategoryName('')
                      setEditCategoryDescription('')
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
                  >
                    Update Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Move Category Modal */}
      {showMoveCategory && movingCategory && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Move Category: {movingCategory.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Current: Level {movingCategory.level}
                {movingCategory.parentId && ' (under parent)'}
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    New Level
                  </label>
                  <select
                    value={moveToLevel}
                    onChange={(e) => {
                      const level = parseInt(e.target.value)
                      setMoveToLevel(level)
                      setMoveToParent('')
                      setMoveToGrandParent('')
                    }}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value={1}>{t('level1MainCategory')}</option>
                    <option value={2}>{t('level2Subcategory')}</option>
                    <option value={3}>{t('level3SubSubcategory')}</option>
                  </select>
                </div>

                {moveToLevel > 1 && (
                  <>
                    {moveToLevel === 3 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Grandparent Category (Level 1)
                        </label>
                        <select
                          value={moveToGrandParent}
                          onChange={(e) => {
                            setMoveToGrandParent(e.target.value)
                            setMoveToParent('') // Reset parent when grandparent changes
                          }}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                          required
                        >
                          <option value="">Select a grandparent category</option>
                          {getGrandParentCategories().map((category) => (
                            <option key={category.id} value={category.id}>
                              {translateCategoryName(category.name, currentLanguage)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Parent Category ({moveToLevel === 2 ? 'Level 1' : 'Level 2'})
                      </label>
                      <select
                        value={moveToParent}
                        onChange={(e) => setMoveToParent(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        required
                        disabled={moveToLevel === 3 && !moveToGrandParent}
                      >
                        <option value="">Select a parent category</option>
                        {moveToLevel === 2 && getParentCategories(2).map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                        {moveToLevel === 3 && getParentCategories(3, moveToGrandParent).map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Moving this category will update all items that reference it.
                    Items will be automatically updated to use the new category structure.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowMoveCategory(false)
                    setMovingCategory(null)
                    setMoveToLevel(1)
                    setMoveToParent('')
                    setMoveToGrandParent('')
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmMove}
                  disabled={moveToLevel > 1 && (!moveToParent || (moveToLevel === 3 && !moveToGrandParent))}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Move Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


