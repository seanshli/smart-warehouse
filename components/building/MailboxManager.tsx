'use client'

import { useState, useEffect } from 'react'
import { EnvelopeIcon, EnvelopeOpenIcon, CheckIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Mailbox {
  id: string
  mailboxNumber: string
  location?: string
  hasMail: boolean
  lastMailAt?: string
  floor?: {
    id: string
    floorNumber: number
    name?: string
  }
  household?: {
    id: string
    name: string
    floorNumber?: number
    unit?: string
    members?: Array<{
      user: {
        id: string
        name?: string
        email: string
      }
    }>
  }
}

interface MailboxManagerProps {
  buildingId: string
  householdId?: string
}

export default function MailboxManager({ buildingId, householdId }: MailboxManagerProps) {
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchMailboxes()
  }, [buildingId])

  const fetchMailboxes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/building/${buildingId}/mailboxes`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch mailboxes')
      }
      
      const data = await response.json()
      setMailboxes(data.mailboxes || [])
    } catch (error) {
      console.error('Error fetching mailboxes:', error)
      toast.error('Failed to load mailboxes')
    } finally {
      setLoading(false)
    }
  }

  const handleNotifyMail = async (mailboxId: string, mailboxNumber: string) => {
    try {
      setProcessing(mailboxId)
      
      const response = await fetch(`/api/building/${buildingId}/mailboxes/${mailboxId}/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to send notification')
      }

      const data = await response.json()
      
      // Update local state
      setMailboxes(prev =>
        prev.map(mb =>
          mb.id === mailboxId
            ? { ...mb, hasMail: true, lastMailAt: new Date().toISOString() }
            : mb
        )
      )

      toast.success(`通知已發送給 ${data.data.notificationsSent} 位住戶`)
    } catch (error) {
      console.error('Error notifying mail:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send notification')
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">載入中...</p>
      </div>
    )
  }

  // Group mailboxes by floor
  const mailboxesByFloor = mailboxes.reduce((acc, mailbox) => {
    const floorNum = mailbox.floor?.floorNumber || 0
    if (!acc[floorNum]) {
      acc[floorNum] = []
    }
    acc[floorNum].push(mailbox)
    return acc
  }, {} as Record<number, Mailbox[]>)

  const sortedFloors = Object.keys(mailboxesByFloor)
    .map(Number)
    .sort((a, b) => a - b)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">郵箱管理</h3>
          <p className="text-sm text-gray-500 mt-1">
            點擊郵箱標記郵件已到達，系統會自動通知對應住戶
          </p>
        </div>
        <button
          onClick={fetchMailboxes}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          刷新
        </button>
      </div>

      {mailboxes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <EnvelopeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">尚未設置郵箱</p>
          <p className="text-sm text-gray-400 mt-2">
            請先設置建築的樓層和單元
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedFloors.map(floorNum => {
            const floorMailboxes = mailboxesByFloor[floorNum]
            const floor = floorMailboxes[0]?.floor

            return (
              <div key={floorNum} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">
                    {floor?.name || `第 ${floorNum} 層`}
                  </h4>
                  <span className="text-sm text-gray-500">
                    {floorMailboxes.length} 個郵箱
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {floorMailboxes.map(mailbox => (
                    <div
                      key={mailbox.id}
                      className={`relative p-3 border-2 rounded-lg transition-all ${
                        mailbox.hasMail
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          {mailbox.mailboxNumber}
                        </span>
                        {mailbox.hasMail ? (
                          <EnvelopeOpenIcon className="h-5 w-5 text-blue-500" />
                        ) : (
                          <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </div>

                      {mailbox.household && (
                        <div className="text-xs text-gray-500 mb-2">
                          {mailbox.household.name}
                        </div>
                      )}

                      {mailbox.lastMailAt && (
                        <div className="text-xs text-gray-400 mb-2">
                          最後郵件: {new Date(mailbox.lastMailAt).toLocaleDateString('zh-TW')}
                        </div>
                      )}

                      <button
                        onClick={() => handleNotifyMail(mailbox.id, mailbox.mailboxNumber)}
                        disabled={processing === mailbox.id || mailbox.hasMail}
                        className={`w-full mt-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          mailbox.hasMail
                            ? 'bg-green-100 text-green-700 cursor-not-allowed'
                            : processing === mailbox.id
                            ? 'bg-gray-100 text-gray-400 cursor-wait'
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                        }`}
                      >
                        {processing === mailbox.id ? (
                          '處理中...'
                        ) : mailbox.hasMail ? (
                          <>
                            <CheckIcon className="h-4 w-4 inline mr-1" />
                            已通知
                          </>
                        ) : (
                          '標記有郵件'
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

