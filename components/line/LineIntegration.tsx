'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useHousehold } from '../HouseholdProvider'
import { useLanguage } from '../LanguageProvider'
import { QrCodeIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface LineUser {
  lineUserId: string
  displayName?: string
  pictureUrl?: string
}

interface LineGroup {
  householdId: string
  householdName: string
  lineGroupId: string
  groupName: string
}

export default function LineIntegration() {
  const { data: session } = useSession()
  const { household, memberships } = useHousehold()
  const { t } = useLanguage()
  const [lineUser, setLineUser] = useState<LineUser | null>(null)
  const [lineGroups, setLineGroups] = useState<LineGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchLineStatus()
  }, [session, household])

  const fetchLineStatus = async () => {
    if (!session?.user) return

    try {
      setLoading(true)
      
      // 獲取用戶的 LINE 綁定狀態
      const userResponse = await fetch('/api/line/user')
      if (userResponse.ok) {
        const userData = await userResponse.json()
        setLineUser(userData.lineUser)
      }

      // 獲取用戶的 LINE 群組
      const groupsResponse = await fetch('/api/line/groups')
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json()
        setLineGroups(groupsData.groups || [])
      }
    } catch (error) {
      console.error('Error fetching LINE status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLinkLineAccount = async () => {
    try {
      setLinking(true)
      
      // 生成 LINE 綁定 QR Code
      const response = await fetch('/api/line/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Failed to generate QR code')
      }

      const data = await response.json()
      setQrCodeUrl(data.qrCodeUrl)
      
      // 開始輪詢檢查綁定狀態
      pollLinkStatus()
    } catch (error) {
      console.error('Error linking LINE account:', error)
      toast.error('綁定 LINE 帳號失敗')
    } finally {
      setLinking(false)
    }
  }

  const pollLinkStatus = async () => {
    const maxAttempts = 60 // 最多輪詢 60 次（5 分鐘）
    let attempts = 0

    const interval = setInterval(async () => {
      attempts++
      
      try {
        const response = await fetch('/api/line/user')
        if (response.ok) {
          const data = await response.json()
          if (data.lineUser) {
            setLineUser(data.lineUser)
            setQrCodeUrl(null)
            clearInterval(interval)
            toast.success('LINE 帳號綁定成功！')
            fetchLineStatus()
          }
        }

        if (attempts >= maxAttempts) {
          clearInterval(interval)
          setQrCodeUrl(null)
          toast.error('綁定超時，請重試')
        }
      } catch (error) {
        console.error('Error polling link status:', error)
      }
    }, 5000) // 每 5 秒檢查一次
  }

  const handleCreateGroup = async (householdId: string) => {
    try {
      const response = await fetch('/api/line/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ householdId }),
      })

      if (!response.ok) {
        throw new Error('Failed to create LINE group')
      }

      toast.success('LINE 群組創建成功！請在 LINE 中邀請成員加入群組。')
      fetchLineStatus()
    } catch (error) {
      console.error('Error creating LINE group:', error)
      toast.error('創建 LINE 群組失敗')
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        LINE 對話整合
      </h2>

      {/* LINE 帳號綁定狀態 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            LINE 帳號狀態
          </span>
          {lineUser ? (
            <div className="flex items-center text-green-600 dark:text-green-400">
              <CheckCircleIcon className="h-5 w-5 mr-1" />
              <span className="text-sm">已綁定</span>
            </div>
          ) : (
            <div className="flex items-center text-gray-400">
              <XCircleIcon className="h-5 w-5 mr-1" />
              <span className="text-sm">未綁定</span>
            </div>
          )}
        </div>

        {!lineUser && (
          <div className="mt-4">
            <button
              onClick={handleLinkLineAccount}
              disabled={linking}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <QrCodeIcon className="h-5 w-5 mr-2" />
              {linking ? '生成中...' : '綁定 LINE 帳號'}
            </button>
          </div>
        )}

        {qrCodeUrl && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              請使用 LINE 掃描此 QR Code 完成綁定：
            </p>
            <img src={qrCodeUrl} alt="LINE QR Code" className="w-48 h-48 mx-auto" />
          </div>
        )}
      </div>

      {/* LINE 群組列表 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          我的 LINE 群組
        </h3>

        {lineGroups.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            尚未加入任何 LINE 群組
          </div>
        ) : (
          <div className="space-y-2">
            {lineGroups.map((group) => (
              <div
                key={group.householdId}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {group.groupName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {group.householdName}
                  </p>
                </div>
                <a
                  href={`line://ti/g/${group.lineGroupId}`}
                  className="text-sm text-green-600 dark:text-green-400 hover:underline"
                >
                  打開群組
                </a>
              </div>
            ))}
          </div>
        )}

        {/* 為當前 household 創建群組 */}
        {household && !lineGroups.find(g => g.householdId === household.id) && (
          <div className="mt-4">
            <button
              onClick={() => handleCreateGroup(household.id)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              為 {household.name} 創建 LINE 群組
            </button>
          </div>
        )}
      </div>

      {/* 功能說明 */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
          功能說明
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• 綁定 LINE 帳號後，可以通過 LINE 與家庭成員對話</li>
          <li>• 系統會自動將包裹、郵件、門鈴等通知發送到 LINE 群組</li>
          <li>• 每個 household 可以創建一個專屬的 LINE 群組</li>
          <li>• 群組消息會同步到系統內的消息記錄</li>
        </ul>
      </div>
    </div>
  )
}

