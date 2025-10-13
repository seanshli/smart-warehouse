'use client'

import { useLanguage } from '@/components/LanguageProvider'
import { useEffect, useState } from 'react'

export default function DebugPage() {
  const { t, currentLanguage } = useLanguage()
  const [roomData, setRoomData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRoomData()
  }, [])

  const fetchRoomData = async () => {
    try {
      const response = await fetch('/api/debug-rooms')
      if (response.ok) {
        const data = await response.json()
        setRoomData(data)
      }
    } catch (error) {
      console.error('Error fetching room data:', error)
    } finally {
      setLoading(false)
    }
  }

  const translateRoomName = (roomName: string) => {
    const roomNameMap: Record<string, string> = {
      'Living Room': t('livingRoom'),
      'Master Bedroom': t('masterBedroom'),
      'Kids Room': t('kidRoom'),
      'Kid Room': t('kidRoom'),
      'Kitchen': t('kitchen'),
      'Garage': t('garage'),
      '客廳': t('livingRoom'),
      '主臥室': t('masterBedroom'),
      '小孩房': t('kidRoom'),
      '兒童房': t('kidRoom'),
      '廚房': t('kitchen'),
      '車庫': t('garage')
    }
    
    return roomNameMap[roomName] || roomName
  }

  if (loading) {
    return <div className="p-8">Loading debug information...</div>
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔍 Debug Information</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Translation Test */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Translation Test</h2>
          <p className="mb-2"><strong>Current Language:</strong> {currentLanguage}</p>
          
          <div className="space-y-2">
            <div><strong>Kids Room:</strong> {t('kidRoom')}</div>
            <div><strong>Kitchen:</strong> {t('kitchen')}</div>
            <div><strong>Garage:</strong> {t('garage')}</div>
            <div><strong>Living Room:</strong> {t('livingRoom')}</div>
            <div><strong>Master Bedroom:</strong> {t('masterBedroom')}</div>
          </div>
        </div>

        {/* Room Data */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Room Data</h2>
          {roomData && (
            <div className="space-y-2">
              <p><strong>Total Rooms:</strong> {roomData.totalRooms}</p>
              <p><strong>Household ID:</strong> {roomData.householdId}</p>
              
              <div className="mt-4">
                <h3 className="font-semibold">Room Names:</h3>
                <ul className="list-disc list-inside">
                  {roomData.rooms.map((room: any) => (
                    <li key={room.id}>
                      <strong>Original:</strong> "{room.name}" → <strong>Translated:</strong> "{translateRoomName(room.name)}"
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Duplicate Detection */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Duplicate Detection Tests</h2>
          {roomData && (
            <div className="space-y-4">
              {roomData.duplicateTests.map((test: any, index: number) => (
                <div key={index} className="border p-3 rounded">
                  <p><strong>Room:</strong> "{test.roomName}"</p>
                  <p><strong>Possible Names:</strong> {test.allPossibleNames.join(', ')}</p>
                  <p><strong>Conflicts:</strong> {test.wouldConflictWith.length > 0 ? 
                    test.wouldConflictWith.map((conflict: any) => `"${conflict.name}"`).join(', ') : 
                    'None'
                  }</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Name Counts */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Name Counts</h2>
          {roomData && (
            <div className="space-y-2">
              {Object.entries(roomData.nameCounts).map(([name, count]) => (
                <div key={name}>
                  <strong>"{name}":</strong> {count as number} occurrence(s)
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <button 
          onClick={fetchRoomData}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Refresh Data
        </button>
      </div>
    </div>
  )
}
