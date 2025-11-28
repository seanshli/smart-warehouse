'use client'

import { useState, useEffect } from 'react'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface JoinRequest {
  id: string
  user: {
    id: string
    name: string | null
    email: string
  }
  type: 'community' | 'building' | 'household'
  targetId: string
  status: 'pending' | 'approved' | 'rejected'
  message: string | null
  requestedAt: string
  reviewedAt: string | null
  reviewedBy: string | null
}

interface JoinRequestListProps {
  type: 'community' | 'building' | 'household'
  targetId: string
  onUpdate?: () => void
}

export default function JoinRequestList({
  type,
  targetId,
  onUpdate,
}: JoinRequestListProps) {
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchRequests()
  }, [type, targetId])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/join-request?type=${type}&targetId=${targetId}&status=pending`
      )
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Failed to fetch join requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId: string) => {
    try {
      const role = selectedRoles[requestId] || (type === 'household' ? 'USER' : 'MEMBER')
      const response = await fetch(`/api/join-request/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })

      if (response.ok) {
        toast.success('请求已批准')
        fetchRequests()
        onUpdate?.()
        // Clear selected role for this request
        setSelectedRoles(prev => {
          const next = { ...prev }
          delete next[requestId]
          return next
        })
      } else {
        const data = await response.json()
        toast.error(data.error || '批准失败')
      }
    } catch (error) {
      toast.error('批准失败')
    }
  }

  const handleReject = async (requestId: string) => {
    try {
      const response = await fetch(`/api/join-request/${requestId}/reject`, {
        method: 'POST',
      })

      if (response.ok) {
        toast.success('请求已拒绝')
        fetchRequests()
      } else {
        const data = await response.json()
        toast.error(data.error || '拒绝失败')
      }
    } catch (error) {
      toast.error('拒绝失败')
    }
  }

  if (loading) {
    return <div className="text-center py-4">加载中...</div>
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        暂无待处理的加入请求
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        待处理的加入请求 ({requests.length})
      </h3>
      {requests.map((request) => (
        <div
          key={request.id}
          className="bg-white border border-gray-200 rounded-lg p-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {request.user.name || request.user.email}
                  </h4>
                  <p className="text-xs text-gray-500">{request.user.email}</p>
                </div>
              </div>
              {request.message && (
                <p className="mt-2 text-sm text-gray-600">{request.message}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                请求时间: {new Date(request.requestedAt).toLocaleString('zh-TW')}
              </p>
              {type === 'household' && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    角色:
                  </label>
                  <select
                    value={selectedRoles[request.id] || 'USER'}
                    onChange={(e) => setSelectedRoles(prev => ({ ...prev, [request.id]: e.target.value }))}
                    className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="USER">USER</option>
                    <option value="OWNER">OWNER</option>
                    <option value="VISITOR">VISITOR</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => handleApprove(request.id)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                批准
              </button>
              <button
                onClick={() => handleReject(request.id)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <XCircleIcon className="h-4 w-4 mr-1" />
                拒绝
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

