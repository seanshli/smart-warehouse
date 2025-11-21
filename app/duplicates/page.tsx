'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/components/LanguageProvider'
import { toast } from 'react-hot-toast'
import { 
  HomeIcon, 
  CubeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import DuplicateItemsModal from '@/components/warehouse/DuplicateItemsModal'

interface DuplicateItem {
  id: string
  name: string
  quantity: number
  room?: string
  cabinet?: string
  category?: string
  similarity: number
  imageUrl?: string
}

export default function DuplicatesPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [duplicateItems, setDuplicateItems] = useState<DuplicateItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadDuplicates()
  }, [])

  const loadDuplicates = async () => {
    setLoading(true)
    try {
      // First get the user's household ID
      const householdResponse = await fetch('/api/user/household')
      if (!householdResponse.ok) {
        throw new Error('Failed to get household ID')
      }
      const householdData = await householdResponse.json()
      const householdId = householdData.householdId
      
      if (!householdId) {
        throw new Error('No household found')
      }
      
      const response = await fetch(`/api/warehouse/items/duplicates?householdId=${householdId}`)
      if (response.ok) {
        const data = await response.json()
        // The API returns an array of duplicate groups, we need to flatten it
        const flattenedDuplicates = data.flatMap((group: any[]) => 
          group.map((item: any) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            room: item.room?.name,
            cabinet: item.cabinet?.name,
            category: item.category?.name,
            similarity: 95, // Since they're grouped by name, assume high similarity
            imageUrl: item.imageUrl
          }))
        )
        setDuplicateItems(flattenedDuplicates)
      } else {
        toast.error('Failed to load duplicates')
      }
    } catch (error) {
      console.error('Error loading duplicates:', error)
      toast.error('Error loading duplicates')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setShowModal(false)
    loadDuplicates() // Refresh after closing
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </button>
              <div className="flex items-center space-x-2">
                <CubeIcon className="h-7 w-7 text-primary-600" />
                <div>
                  <h1 className="text-2xl font-bold">Find Duplicates</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Identify and merge duplicate items in your inventory
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 rounded-md p-3">
                  <CubeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Duplicate Items</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{duplicateItems.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Duplicate Items List */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                  Potential Duplicates
                </h3>
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                >
                  <CubeIcon className="h-5 w-5 mr-2" />
                  Review All Duplicates
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-4 text-gray-500 dark:text-gray-400">Loading duplicates...</p>
                </div>
              ) : duplicateItems.length > 0 ? (
                <div className="space-y-4">
                  {duplicateItems.map((item, index) => (
                    <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {item.imageUrl && (
                            <img 
                              src={item.imageUrl} 
                              alt={item.name}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {item.room}{item.cabinet && ` → ${item.cabinet}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.similarity >= 90 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.similarity}% similar
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No Duplicates Found</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Your inventory is clean! No duplicate items detected.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Duplicate Items Modal */}
      {showModal && (
        <DuplicateItemsModal 
          onClose={handleClose}
          onSuccess={() => {
            setShowModal(false)
            loadDuplicates()
            toast.success('Duplicates processed successfully!')
          }}
        />
      )}
    </div>
  )
}
