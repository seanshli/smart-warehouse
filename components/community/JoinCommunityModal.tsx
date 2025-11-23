'use client'

import { useState } from 'react'
import { XMarkIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useLanguage } from '@/components/LanguageProvider'

interface JoinCommunityModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  type: 'community' | 'building' | 'household'
}

export default function JoinCommunityModal({
  isOpen,
  onClose,
  onSuccess,
  type,
}: JoinCommunityModalProps) {
  const { t } = useLanguage()
  const [invitationCode, setInvitationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [targetInfo, setTargetInfo] = useState<any>(null)

  if (!isOpen) return null

  const handleValidateCode = async () => {
    if (!invitationCode.trim()) {
      toast.error('请输入邀请码')
      return
    }

    setValidating(true)
    try {
      const response = await fetch(`/api/join?type=${type}&code=${encodeURIComponent(invitationCode)}`)
      const data = await response.json()

      if (response.ok) {
        setTargetInfo(data[type] || data.household || data.building)
        toast.success(`找到${type === 'community' ? '社区' : type === 'building' ? '建筑' : '家庭'}: ${data[type]?.name || data.household?.name || data.building?.name}`)
      } else {
        toast.error(data.error || '无效的邀请码')
        setTargetInfo(null)
      }
    } catch (error) {
      toast.error('验证邀请码失败')
      setTargetInfo(null)
    } finally {
      setValidating(false)
    }
  }

  const handleJoin = async () => {
    if (!invitationCode.trim()) {
      toast.error('请输入邀请码')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          invitationCode: invitationCode.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || '加入成功')
        onSuccess()
        onClose()
        setInvitationCode('')
        setTargetInfo(null)
      } else {
        toast.error(data.error || '加入失败')
      }
    } catch (error) {
      toast.error('加入失败')
    } finally {
      setLoading(false)
    }
  }

  const typeLabels = {
    community: { name: '社区', placeholder: '输入社区邀请码' },
    building: { name: '建筑', placeholder: '输入建筑邀请码' },
    household: { name: '家庭', placeholder: '输入家庭邀请码' },
  }

  const label = typeLabels[type]

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              加入{label.name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                邀请码
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={invitationCode}
                  onChange={(e) => {
                    setInvitationCode(e.target.value)
                    setTargetInfo(null)
                  }}
                  placeholder={label.placeholder}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <button
                  onClick={handleValidateCode}
                  disabled={validating || !invitationCode.trim()}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {validating ? '验证中...' : '验证'}
                </button>
              </div>
            </div>

            {targetInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-start">
                  <UserGroupIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-900">
                      {targetInfo.name}
                    </h4>
                    {targetInfo.description && (
                      <p className="text-sm text-blue-700 mt-1">
                        {targetInfo.description}
                      </p>
                    )}
                    {targetInfo.membersCount !== undefined && (
                      <p className="text-xs text-blue-600 mt-1">
                        {targetInfo.membersCount} 位成员
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleJoin}
                disabled={loading || !targetInfo}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '加入中...' : '加入'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

