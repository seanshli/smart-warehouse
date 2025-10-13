'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, MapPinIcon, CubeIcon, TrashIcon, PencilIcon, ArrowDownIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import CheckoutModal from './CheckoutModal'
import { useLanguage } from './LanguageProvider'
import { useHousehold } from './HouseholdProvider'
import ItemCard from './ItemCard'

interface Room {
  id: string
  name: string
  description?: string
  cabinets: Cabinet[]
  _count: {
    items: number
  }
}

interface Cabinet {
  id: string
  name: string
  description?: string
  _count: {
    items: number
  }
}

export default function RoomManagement() {
  const { t, currentLanguage } = useLanguage()
  const { activeHouseholdId } = useHousehold()

  // Function to translate room names based on their original English names
  const translateRoomName = (roomName: string) => {
    // Use the t function from the language context with correct syntax
    // Map of original English names to translation keys
    const roomNameMap: Record<string, string> = {
      'Living Room': t('livingRoom'),
      'Master Bedroom': t('masterBedroom'),
      'Kids Room': t('kidRoom'), // Note: English is "Kids Room", not "Kid Room"
      'Kid Room': t('kidRoom'), // Keep both for compatibility
      'Kitchen': t('kitchen'),
      'Garage': t('garage'),
      // Add any other default room names that might exist
      '客廳': t('livingRoom'), // If somehow Chinese names are stored
      '主臥室': t('masterBedroom'),
      '小孩房': t('kidRoom'),
      '兒童房': t('kidRoom'), // Also map the correct Chinese translation
      '廚房': t('kitchen'),
      '車庫': t('garage')
    }
    
    const translatedName = roomNameMap[roomName] || roomName
    
    // Enhanced debug logging - check for exact match and similar names
    const similarNames = Object.keys(roomNameMap).filter(key => 
      key.toLowerCase().includes(roomName.toLowerCase()) || 
      roomName.toLowerCase().includes(key.toLowerCase())
    )
    
    console.log('Room translation debug:', {
      originalName: roomName,
      originalNameLength: roomName.length,
      originalNameChars: roomName.split('').map(c => c.charCodeAt(0)),
      currentLanguage,
      translatedName,
      isTranslated: roomNameMap[roomName] !== undefined,
      availableKeys: Object.keys(roomNameMap),
      similarNames,
      roomNameMapEntry: roomNameMap[roomName],
      exactMatch: roomNameMap[roomName] || 'NOT_FOUND',
      tValues: {
        livingRoom: t('livingRoom'),
        masterBedroom: t('masterBedroom'),
        kidRoom: t('kidRoom'),
        kitchen: t('kitchen'),
        garage: t('garage')
      }
    })
    
    return translatedName // Return translated name or original if not found
  }

  // Function to translate cabinet names based on their original English names
  const translateCabinetName = (cabinetName: string) => {
    // Use the t function from the language context with correct syntax
    // Map of original English names to translation keys
    const cabinetNameMap: Record<string, string> = {
      'Main Cabinet': t('mainCabinet'),
      '主櫥櫃': t('mainCabinet'),
      '側櫥櫃': '側櫥櫃', // Keep as is if already in Chinese
      '孩子衣櫥': '孩子衣櫥', // Keep as is if already in Chinese
      '右櫥櫃': '右櫥櫃', // Keep as is if already in Chinese
      '左櫥櫃': '左櫥櫃' // Keep as is if already in Chinese
    }
    
    const translatedName = cabinetNameMap[cabinetName] || cabinetName
    
    // Enhanced debug logging - check for exact match and similar names
    const similarNames = Object.keys(cabinetNameMap).filter(key => 
      key.toLowerCase().includes(cabinetName.toLowerCase()) || 
      cabinetName.toLowerCase().includes(key.toLowerCase())
    )
    
    console.log('Cabinet translation debug:', {
      originalName: cabinetName,
      originalNameLength: cabinetName.length,
      originalNameChars: cabinetName.split('').map(c => c.charCodeAt(0)),
      currentLanguage,
      translatedName,
      isTranslated: cabinetNameMap[cabinetName] !== undefined,
      availableKeys: Object.keys(cabinetNameMap),
      similarNames,
      cabinetNameMapEntry: cabinetNameMap[cabinetName],
      exactMatch: cabinetNameMap[cabinetName] || 'NOT_FOUND',
      tValue: t('mainCabinet')
    })
    
    return translatedName // Return translated name or original if not found
  }
  const [rooms, setRooms] = useState<Room[]>([])
  const [showAddRoom, setShowAddRoom] = useState(false)
  const [showAddCabinet, setShowAddCabinet] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomDescription, setNewRoomDescription] = useState('')
  const [newCabinetName, setNewCabinetName] = useState('')
  const [newCabinetDescription, setNewCabinetDescription] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list')
  const [selectedRoomForDetail, setSelectedRoomForDetail] = useState<Room | null>(null)
  const [showMoveItem, setShowMoveItem] = useState(false)
  const [selectedItemForMove, setSelectedItemForMove] = useState<any>(null)
  const [moveToRoom, setMoveToRoom] = useState('')
  const [moveToCabinet, setMoveToCabinet] = useState('')
  const [showItemHistory, setShowItemHistory] = useState(false)
  const [selectedItemForHistory, setSelectedItemForHistory] = useState<any>(null)
  const [itemHistory, setItemHistory] = useState<any[]>([])
  const [showEditRoom, setShowEditRoom] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [editRoomName, setEditRoomName] = useState('')
  const [editRoomDescription, setEditRoomDescription] = useState('')
  const [showEditCabinet, setShowEditCabinet] = useState(false)
  const [editingCabinet, setEditingCabinet] = useState<any>(null)
  const [editCabinetName, setEditCabinetName] = useState('')
  const [editCabinetDescription, setEditCabinetDescription] = useState('')
  const [showDeleteCabinet, setShowDeleteCabinet] = useState(false)
  const [cabinetToDelete, setCabinetToDelete] = useState<any>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [selectedItemForCheckout, setSelectedItemForCheckout] = useState<any>(null)

  useEffect(() => {
    fetchRooms()
  }, [activeHouseholdId])

  // Force re-render when language changes to update translations
  useEffect(() => {
    console.log('=== LANGUAGE CHANGE DEBUG ===')
    console.log('Language changed to:', currentLanguage)
    console.log('Translation test - Kids Room should be:', t('kidRoom'))
    console.log('Translation test - Kitchen should be:', t('kitchen'))
    console.log('Translation test - Garage should be:', t('garage'))
    console.log('Translation test - Living Room should be:', t('livingRoom'))
    console.log('Translation test - Master Bedroom should be:', t('masterBedroom'))
    
    // Test the translation function directly
    console.log('=== TRANSLATION FUNCTION TEST ===')
    const testNames = ['Kids Room', 'Kitchen', 'Garage', 'Living Room', 'Master Bedroom']
    testNames.forEach(name => {
      const translated = translateRoomName(name)
      console.log(`"${name}" -> "${translated}"`)
    })
    console.log('=== END TRANSLATION FUNCTION TEST ===')
    
    // The component will automatically re-render when currentLanguage changes
  }, [currentLanguage])

  const fetchRooms = async () => {
    try {
      const params = activeHouseholdId ? `?householdId=${encodeURIComponent(activeHouseholdId)}` : ''
      const response = await fetch(`/api/rooms${params}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Rooms API response:', data)
        
        // Debug: Log each room name and its translation
        if (data.rooms) {
          data.rooms.forEach((room: any) => {
            console.log(`Room "${room.name}" -> translated to: "${translateRoomName(room.name)}"`)
          })
        }
        
        setRooms(data.rooms || data) // Handle both old and new API response formats
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
    }
  }

  const handleRoomClick = async (room: Room) => {
    try {
      if (!room || !room.id) {
        console.error('Invalid room object:', room)
        toast.error('Invalid room selected')
        return
      }
      
      console.log('Fetching room details for:', room.id)
      
      // Fetch detailed room data including items
      const response = await fetch(`/api/rooms/${room.id}/items`)
      if (response.ok) {
        const roomDetail = await response.json()
        console.log('Room detail response:', roomDetail)
        
        if (roomDetail && roomDetail.id) {
          // Ensure cabinets have valid items and are arrays
          if (roomDetail.cabinets && Array.isArray(roomDetail.cabinets)) {
            roomDetail.cabinets = roomDetail.cabinets.map((cabinet: any) => ({
              ...cabinet,
              items: cabinet.items && Array.isArray(cabinet.items) ? cabinet.items.filter((item: any) => item && item.id && item.name) : []
            }))
          } else {
            // Ensure cabinets is always an array
            roomDetail.cabinets = []
          }
          setSelectedRoomForDetail(roomDetail)
          setViewMode('detail')
        } else {
          console.error('Invalid room detail response:', roomDetail)
          toast.error('Failed to load room details')
          setSelectedRoomForDetail(room)
          setViewMode('detail')
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Error fetching room details:', response.status, errorData)
        toast.error(`Failed to load room: ${errorData.error || 'Unknown error'}`)
        // Fallback to basic room info
        setSelectedRoomForDetail(room)
        setViewMode('detail')
      }
    } catch (error) {
      console.error('Exception in handleRoomClick:', error)
      toast.error('An error occurred while loading the room')
      // Fallback to basic room info
      setSelectedRoomForDetail(room)
      setViewMode('detail')
    }
  }

  const handleBackToList = () => {
    setViewMode('list')
    setSelectedRoomForDetail(null)
  }

  const handleMoveItem = (item: any) => {
    setSelectedItemForMove(item)
    setMoveToRoom('')
    setMoveToCabinet('')
    setShowMoveItem(true)
  }

  const handleConfirmMove = async () => {
    if (!selectedItemForMove || !moveToRoom) return

    try {
      const response = await fetch(`/api/items/${selectedItemForMove.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: moveToRoom,
          cabinetId: moveToCabinet || null,
        }),
      })

      if (response.ok) {
        toast.success('Item moved successfully!')
        setShowMoveItem(false)
        setSelectedItemForMove(null)
        setMoveToRoom('')
        setMoveToCabinet('')
        
        // Refresh the room detail view
        if (selectedRoomForDetail) {
          const roomResponse = await fetch(`/api/rooms/${selectedRoomForDetail.id}/items`)
          if (roomResponse.ok) {
            const updatedRoom = await roomResponse.json()
            setSelectedRoomForDetail(updatedRoom)
          }
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to move item')
      }
    } catch (error) {
      console.error('Error moving item:', error)
      toast.error('An error occurred while moving the item')
    }
  }

  const handleViewHistory = async (item: any) => {
    try {
      const response = await fetch(`/api/items/${item.id}/history`)
      if (response.ok) {
        const history = await response.json()
        setItemHistory(history)
        setSelectedItemForHistory(item)
        setShowItemHistory(true)
      } else {
        toast.error('Failed to load item history')
      }
    } catch (error) {
      console.error('Error fetching item history:', error)
      toast.error('An error occurred while loading history')
    }
  }

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoomName.trim()) return

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newRoomName, description: newRoomDescription, householdId: activeHouseholdId }),
      })

      if (response.ok) {
        toast.success('Room added successfully!')
        setNewRoomName('')
        setNewRoomDescription('')
        setShowAddRoom(false)
        fetchRooms()
      } else {
        const errorData = await response.json()
        if (response.status === 409) {
          toast.error(`${errorData.error}. ${errorData.suggestion}`)
        } else {
          toast.error(errorData.error || 'Failed to add room')
        }
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleAddCabinet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRoom || !newCabinetName.trim()) return

    try {
      const response = await fetch('/api/cabinets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCabinetName,
          description: newCabinetDescription,
          roomId: selectedRoom,
        }),
      })

      if (response.ok) {
        toast.success('Cabinet added successfully!')
        setNewCabinetName('')
        setNewCabinetDescription('')
        setShowAddCabinet(false)
        setSelectedRoom(null)
        fetchRooms()
      } else {
        toast.error('Failed to add cabinet')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    if (!confirm(`Are you sure you want to delete the room "${roomName}"? This will also delete all cabinets and items in this room. This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success(`Room "${roomName}" deleted successfully!`)
        fetchRooms()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to delete room')
      }
    } catch (error) {
      console.error('Error deleting room:', error)
      toast.error('An error occurred while deleting the room')
    }
  }

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room)
    setEditRoomName(room.name)
    setEditRoomDescription(room.description || '')
    setShowEditRoom(true)
  }

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRoom || !editRoomName.trim()) return

    try {
      const response = await fetch(`/api/rooms/${editingRoom.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editRoomName,
          description: editRoomDescription,
        }),
      })

      if (response.ok) {
        toast.success('Room updated successfully!')
        setShowEditRoom(false)
        setEditingRoom(null)
        setEditRoomName('')
        setEditRoomDescription('')
        fetchRooms()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to update room')
      }
    } catch (error) {
      console.error('Error updating room:', error)
      toast.error('An error occurred while updating the room')
    }
  }

  const handleEditCabinet = (cabinet: any) => {
    setEditingCabinet(cabinet)
    setEditCabinetName(cabinet.name)
    setEditCabinetDescription(cabinet.description || '')
    setShowEditCabinet(true)
  }

  const handleUpdateCabinet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCabinet || !editCabinetName.trim()) return

    try {
      const response = await fetch(`/api/cabinets/${editingCabinet.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editCabinetName,
          description: editCabinetDescription,
        }),
      })

      if (response.ok) {
        toast.success('Cabinet updated successfully!')
        setShowEditCabinet(false)
        setEditingCabinet(null)
        setEditCabinetName('')
        setEditCabinetDescription('')
        fetchRooms()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to update cabinet')
      }
    } catch (error) {
      console.error('Error updating cabinet:', error)
      toast.error('An error occurred while updating the cabinet')
    }
  }

  const handleDeleteCabinet = async () => {
    if (!cabinetToDelete) return

    try {
      const response = await fetch(`/api/cabinets/${cabinetToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        toast.success('Cabinet deleted successfully!')
        setShowDeleteCabinet(false)
        setCabinetToDelete(null)
        fetchRooms() // Refresh the rooms data
      } else {
        toast.error('Failed to delete cabinet')
      }
    } catch (error) {
      console.error('Error deleting cabinet:', error)
      toast.error('Failed to delete cabinet')
    }
  }

  const handleCheckoutItem = (item: any) => {
    setSelectedItemForCheckout(item)
    setShowCheckout(true)
  }

  return (
    <div className="space-y-6">
      {viewMode === 'list' && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">{t('roomManagement')}</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                className="inline-flex items-center px-4 py-2 border border-yellow-300 text-sm font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
              >
                🔍 Debug
              </button>
              <button
                onClick={() => setShowAddRoom(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                {t('addRoom')}
              </button>
              <button
                onClick={() => setShowAddCabinet(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                {t('addCabinet')}
              </button>
            </div>
          </div>

          {/* Debug Information Panel */}
          {showDebugInfo && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4">🔍 Debug Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Translation Test */}
                <div className="bg-white p-4 rounded border">
                  <h4 className="font-semibold mb-2">Translation Test</h4>
                  <p><strong>Current Language:</strong> {currentLanguage}</p>
                  <div className="mt-2 space-y-1">
                    <div><strong>Kids Room:</strong> {t('kidRoom')}</div>
                    <div><strong>Kitchen:</strong> {t('kitchen')}</div>
                    <div><strong>Garage:</strong> {t('garage')}</div>
                    <div><strong>Living Room:</strong> {t('livingRoom')}</div>
                    <div><strong>Master Bedroom:</strong> {t('masterBedroom')}</div>
                  </div>
                </div>

                {/* Room Translation Test */}
                <div className="bg-white p-4 rounded border">
                  <h4 className="font-semibold mb-2">Room Translation Test</h4>
                  <div className="space-y-1">
                    <div>"Kids Room" → "{translateRoomName('Kids Room')}"</div>
                    <div>"Kitchen" → "{translateRoomName('Kitchen')}"</div>
                    <div>"Garage" → "{translateRoomName('Garage')}"</div>
                    <div>"Living Room" → "{translateRoomName('Living Room')}"</div>
                    <div>"Master Bedroom" → "{translateRoomName('Master Bedroom')}"</div>
                  </div>
                </div>

                {/* Cabinet Translation Test */}
                <div className="bg-white p-4 rounded border">
                  <h4 className="font-semibold mb-2">Cabinet Translation Test</h4>
                  <div className="space-y-1">
                    <div>"Main Cabinet" → "{translateCabinetName('Main Cabinet')}"</div>
                    <div>"主櫥櫃" → "{translateCabinetName('主櫥櫃')}"</div>
                    <div>"側櫥櫃" → "{translateCabinetName('側櫥櫃')}"</div>
                    <div>"孩子衣櫥" → "{translateCabinetName('孩子衣櫥')}"</div>
                    <div>"右櫥櫃" → "{translateCabinetName('右櫥櫃')}"</div>
                    <div>"左櫥櫃" → "{translateCabinetName('左櫥櫃')}"</div>
                  </div>
                </div>

                {/* Current Rooms */}
                <div className="bg-white p-4 rounded border">
                  <h4 className="font-semibold mb-2">Current Rooms ({rooms.length})</h4>
                  <div className="space-y-1">
                    {rooms.map(room => (
                      <div key={room.id}>
                        <strong>Original:</strong> "{room.name}" → <strong>Translated:</strong> "{translateRoomName(room.name)}"
                      </div>
                    ))}
                  </div>
                </div>

                {/* Duplicate Check */}
                <div className="bg-white p-4 rounded border">
                  <h4 className="font-semibold mb-2">Duplicate Check</h4>
                  <div className="space-y-1">
                    <div><strong>Kids Room:</strong> {rooms.filter(r => r.name === 'Kids Room').length} occurrence(s)</div>
                    <div><strong>兒童房:</strong> {rooms.filter(r => r.name === '兒童房').length} occurrence(s)</div>
                    <div><strong>Kitchen:</strong> {rooms.filter(r => r.name === 'Kitchen').length} occurrence(s)</div>
                    <div><strong>廚房:</strong> {rooms.filter(r => r.name === '廚房').length} occurrence(s)</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-sm text-yellow-700">
                <p><strong>Instructions:</strong></p>
                <p>1. Switch language from English to Chinese (ZH-TW)</p>
                <p>2. Check if "Kids Room" changes to "兒童房"</p>
                <p>3. Look at browser console for detailed debug logs</p>
                
                <div className="mt-4 space-x-2">
                  <button 
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/cleanup-duplicates', { method: 'POST' })
                        const result = await response.json()
                        if (response.ok) {
                          console.log('Room cleanup result:', result)
                          alert(`Room cleanup completed! Deleted ${result.cleanupResults.length} duplicate groups.`)
                          fetchRooms() // Refresh the room list
                        } else {
                          alert(`Room cleanup error: ${result.error}`)
                        }
                      } catch (error) {
                        alert(`Room cleanup error: ${error}`)
                      }
                    }}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
                  >
                    🧹 Clean Up Duplicate Rooms
                  </button>
                  
                  <button 
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/cleanup-category-duplicates', { method: 'POST' })
                        const result = await response.json()
                        if (response.ok) {
                          console.log('Category cleanup result:', result)
                          alert(`Category cleanup completed! Deleted ${result.cleanupResults.length} duplicate groups.`)
                          // Refresh the page to show updated categories
                          window.location.reload()
                        } else {
                          alert(`Category cleanup error: ${result.error}`)
                        }
                      } catch (error) {
                        alert(`Category cleanup error: ${error}`)
                      }
                    }}
                    className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 text-sm"
                  >
                    🗂️ Clean Up Duplicate Categories
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Rooms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms && Array.isArray(rooms) ? rooms.map((room) => (
              <div 
                key={room.id} 
                className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow duration-200"
                onClick={() => handleRoomClick(room)}
              >
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <MapPinIcon className="h-8 w-8 text-primary-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {translateRoomName(room.name)}
                      </h3>
                      {room.description && (
                        <p className="text-sm text-gray-500 mt-1">
                          {room.description}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        {room._count.items} {t('items')} • {t('clickToViewDetails')}
                      </p>
                    </div>
                         <div className="flex-shrink-0 flex items-center space-x-2">
                           <button
                             onClick={(e) => {
                               e.stopPropagation()
                               handleEditRoom(room)
                             }}
                             className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                             title="Edit room"
                           >
                             <PencilIcon className="h-4 w-4" />
                           </button>
                           <button
                             onClick={(e) => {
                               e.stopPropagation()
                               handleDeleteRoom(room.id, room.name)
                             }}
                             className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                             title="Delete room"
                           >
                             <TrashIcon className="h-4 w-4" />
                           </button>
                           <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                           </svg>
                         </div>
                  </div>
                </div>

                {/* Cabinets */}
                <div className="border-t border-gray-200">
                  <div className="px-6 py-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      {t('cabinets')} ({room.cabinets.length})
                    </h4>
                    {room.cabinets && Array.isArray(room.cabinets) && room.cabinets.length > 0 ? (
                      <ul className="divide-y divide-gray-200">
                        {room.cabinets.map((cabinet) => (
                          <li key={cabinet.id} className="py-2 flex items-center justify-between">
                            <div className="flex items-center">
                              <CubeIcon className="h-5 w-5 text-gray-500 mr-2" />
                              <span className="text-sm text-gray-700">{translateCabinetName(cabinet.name)}</span>
                            </div>
                            <span className="text-xs text-gray-500">{cabinet._count.items} {t('items')}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">{t('noCabinetsInThisRoom')}</p>
                    )}
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center text-gray-500 py-8">
                No rooms found. Add a room to get started.
              </div>
            )}
          </div>

          {rooms.length === 0 && (
            <div className="text-center py-8">
              <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No rooms</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first room.
              </p>
            </div>
          )}
        </>
      )}

      {/* Room Detail View */}
      {viewMode === 'detail' && selectedRoomForDetail && selectedRoomForDetail.id && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <button
              onClick={handleBackToList}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('backToRooms')}
            </button>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <MapPinIcon className="h-8 w-8 text-primary-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {translateRoomName(selectedRoomForDetail.name)}
                  </h1>
                  {selectedRoomForDetail.description && (
                    <p className="text-gray-600 mt-1">
                      {selectedRoomForDetail.description}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    {selectedRoomForDetail._count.items} {t('itemsTotal')}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Cabinets and Items */}
              <div className="space-y-6">
                {selectedRoomForDetail.cabinets && Array.isArray(selectedRoomForDetail.cabinets) && selectedRoomForDetail.cabinets.length > 0 ? (
                  selectedRoomForDetail.cabinets.map((cabinet: any, cabinetIndex: number) => {
                    // Safety check for cabinet
                    if (!cabinet || !cabinet.id) {
                      console.warn(`Skipping invalid cabinet at index ${cabinetIndex}:`, cabinet)
                      return null
                    }
                    
                    return (
                    <div key={cabinet.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <CubeIcon className="h-6 w-6 text-gray-600 mr-2" />
                          <h3 className="text-lg font-medium text-gray-900">
                            {translateCabinetName(cabinet.name)}
                          </h3>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleEditCabinet(cabinet)}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Edit cabinet"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setCabinetToDelete(cabinet)
                                setShowDeleteCabinet(true)
                              }}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete cabinet"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {cabinet._count?.items || 0} {t('items')}
                        </span>
                      </div>
                      
                      {/* Items in Cabinet */}
                      {cabinet.items && Array.isArray(cabinet.items) && cabinet.items.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {cabinet.items.map((item: any, index: number) => {
                            // Skip items that are null or missing required fields
                            if (!item || !item.id || !item.name) {
                              console.warn(`Skipping invalid item at index ${index}:`, item)
                              return null
                            }
                            
                            return (
                              <ItemCard
                                key={item.id}
                                item={item}
                                onEdit={(item) => {
                                  console.log('Room: Edit item called for:', item?.name || 'Unknown Item')
                                  // For now, just show an alert since we don't have the modal state here
                                  alert(`Edit functionality for "${item?.name || 'Unknown Item'}" - This would open the edit modal`)
                                }}
                              onMove={() => {
                                setSelectedItemForMove(item)
                                setMoveToRoom(item.roomId || '')
                                setMoveToCabinet(item.cabinetId || '')
                                setShowMoveItem(true)
                              }}
                              onCheckout={() => {
                                setSelectedItemForCheckout(item)
                                setShowCheckout(true)
                              }}
                              onHistory={() => {
                                handleViewHistory(item)
                              }}
                            />
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">{t('noItemsInThisCabinet')}</p>
                      )}
                    </div>
                    )
                  }).filter(Boolean)
                ) : (
                  <div className="text-center py-8">
                    <CubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Cabinets</h3>
                    <p className="text-gray-500">This room doesn't have any cabinets yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Error fallback for room detail view */}
      {viewMode === 'detail' && (!selectedRoomForDetail || !selectedRoomForDetail.id) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium">Error loading room details</h3>
            <p className="text-red-600 text-sm mt-1">There was an error loading the room details. Please try again.</p>
            <button
              onClick={handleBackToList}
              className="mt-3 inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
            >
              Back to Rooms
            </button>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {showAddRoom && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t('addNewRoom')}
              </h3>
              <form onSubmit={handleAddRoom} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('roomName')}
                  </label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., Kitchen, Living Room"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newRoomDescription}
                    onChange={(e) => setNewRoomDescription(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Brief description of the room"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddRoom(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
                  >
                    {t('addRoom')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Cabinet Modal */}
      {showAddCabinet && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t('addNewCabinet')}
              </h3>
              <form onSubmit={handleAddCabinet} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Select Room
                  </label>
                  <select
                    value={selectedRoom || ''}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Choose a room</option>
                    {rooms && Array.isArray(rooms) ? rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {translateRoomName(room.name)}
                      </option>
                    )) : null}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Cabinet Name
                  </label>
                  <input
                    type="text"
                    value={newCabinetName}
                    onChange={(e) => setNewCabinetName(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., Top Shelf, Drawer 1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newCabinetDescription}
                    onChange={(e) => setNewCabinetDescription(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Brief description of the cabinet"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddCabinet(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
                  >
                    Add Cabinet
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Move Item Modal */}
      {showMoveItem && selectedItemForMove && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Move Item: {selectedItemForMove.name}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Move to Room
                  </label>
                  <select
                    value={moveToRoom}
                    onChange={(e) => {
                      setMoveToRoom(e.target.value)
                      setMoveToCabinet('') // Reset cabinet when room changes
                    }}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Select a room</option>
                    {rooms && Array.isArray(rooms) ? rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {translateRoomName(room.name)}
                      </option>
                    )) : null}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Move to Cabinet (Optional)
                  </label>
                  <select
                    value={moveToCabinet}
                    onChange={(e) => setMoveToCabinet(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    disabled={!moveToRoom}
                  >
                    <option value="">No specific cabinet</option>
                    {moveToRoom && rooms && Array.isArray(rooms) ? rooms.find(r => r.id === moveToRoom)?.cabinets?.map((cabinet) => (
                      <option key={cabinet.id} value={cabinet.id}>
                        {translateCabinetName(cabinet.name)}
                      </option>
                    )) : null}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowMoveItem(false)
                    setSelectedItemForMove(null)
                    setMoveToRoom('')
                    setMoveToCabinet('')
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmMove}
                  disabled={!moveToRoom}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Move Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Item History Modal */}
      {showItemHistory && selectedItemForHistory && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-2xl shadow-lg rounded-md bg-white max-h-96 overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                History: {selectedItemForHistory.name}
              </h3>
              
              {itemHistory && Array.isArray(itemHistory) && itemHistory.length > 0 ? (
                <div className="space-y-4">
                  {itemHistory.map((historyItem: any) => (
                    <div key={historyItem.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {historyItem.action.charAt(0).toUpperCase() + historyItem.action.slice(1)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {historyItem.description}
                          </p>
                          {historyItem.oldRoom || historyItem.newRoom ? (
                            <p className="text-xs text-gray-500 mt-1">
                              {historyItem.oldRoom && historyItem.newRoom ? (
                                `Moved from ${historyItem.oldRoom.name} to ${historyItem.newRoom.name}`
                              ) : historyItem.newRoom ? (
                                `Added to ${historyItem.newRoom.name}`
                              ) : historyItem.oldRoom ? (
                                `Removed from ${historyItem.oldRoom.name}`
                              ) : null}
                            </p>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {new Date(historyItem.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(historyItem.createdAt).toLocaleTimeString()}
                          </p>
                          {historyItem.performer && (
                            <p className="text-xs text-gray-400">
                              by {historyItem.performer.name || historyItem.performer.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No history</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    This item doesn't have any history yet.
                  </p>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowItemHistory(false)
                    setSelectedItemForHistory(null)
                    setItemHistory([])
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {showEditRoom && editingRoom && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Edit Room
              </h3>
              
              <form onSubmit={handleUpdateRoom} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={editRoomName}
                    onChange={(e) => setEditRoomName(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description (Optional)
                  </label>
                  <textarea
                    value={editRoomDescription}
                    onChange={(e) => setEditRoomDescription(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditRoom(false)
                      setEditingRoom(null)
                      setEditRoomName('')
                      setEditRoomDescription('')
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
                  >
                    Update Room
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Cabinet Modal */}
      {showEditCabinet && editingCabinet && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t('editCabinet')}
              </h3>
              
              <form onSubmit={handleUpdateCabinet} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('cabinetName')}
                  </label>
                  <input
                    type="text"
                    value={editCabinetName}
                    onChange={(e) => setEditCabinetName(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('description')} ({t('optional')})
                  </label>
                  <textarea
                    value={editCabinetDescription}
                    onChange={(e) => setEditCabinetDescription(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditCabinet(false)
                      setEditingCabinet(null)
                      setEditCabinetName('')
                      setEditCabinetDescription('')
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
                  >
                    {t('updateCabinet')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Cabinet Confirmation Modal */}
      {showDeleteCabinet && cabinetToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t('deleteCabinet')}
              </h3>
              
              <p className="text-sm text-gray-600 mb-6">
                {t('deleteCabinetConfirmation')} "{cabinetToDelete.name}"? {t('deleteCabinetWarning')}
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteCabinet(false)
                    setCabinetToDelete(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleDeleteCabinet}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                >
                  {t('deleteCabinet')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && selectedItemForCheckout && (
        <CheckoutModal
          onClose={() => {
            setShowCheckout(false)
            setSelectedItemForCheckout(null)
          }}
          item={selectedItemForCheckout}
          onSuccess={() => {
            // Refresh the room data to show updated quantities
            if (selectedRoomForDetail) {
              handleRoomClick(selectedRoomForDetail)
            }
          }}
        />
      )}
    </div>
  )
}