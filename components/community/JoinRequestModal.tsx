'use client'

import { useState } from 'react'
import { XMarkIcon, UserGroupIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useLanguage } from '@/components/LanguageProvider'

interface JoinRequestModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  type: 'community' | 'building'
  targetId: string
  targetName: string
}

export default function JoinRequestModal({
  isOpen,
  onClose,
  onSuccess,
  type,
  targetId,
  targetName,
}: JoinRequestModalProps) {
  const { t } = useLanguage()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/join-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          targetId,
          message: message.trim() || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('加入请求已发送')
        onSuccess()
        onClose()
        setMessage('')
      } else {
        toast.error(data.error || '发送请求失败')
      }
    } catch (error) {
      toast.error('发送请求失败')
    } finally {
      setLoading(false)
    }
  }

  const typeLabel = type === 'community' ? '社区' : '建筑'

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              请求加入{typeLabel}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start">
              <UserGroupIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">
                  {targetName}
                </h4>
                <p className="text-xs text-blue-700 mt-1">
                  您的请求将发送给{typeLabel}管理员审核
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                留言（可选）
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="请说明您希望加入的原因..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '发送中...' : '发送请求'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

