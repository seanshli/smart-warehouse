'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function NewBuildingPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const communityId = params.id as string

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    floorCount: '',
    unitCount: '',
    latitude: '',
    longitude: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('建筑名称是必填项')
      return
    }

    try {
      setSubmitting(true)
      
      const response = await fetch(`/api/community/${communityId}/buildings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          address: formData.address || undefined,
          floorCount: formData.floorCount ? parseInt(formData.floorCount) : undefined,
          unitCount: formData.unitCount ? parseInt(formData.unitCount) : undefined,
          latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
          longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create building')
      }

      const data = await response.json()
      toast.success('建筑创建成功！')
      
      // Redirect to building detail page
      router.push(`/building/${data.id}`)
    } catch (error) {
      console.error('Error creating building:', error)
      toast.error(error instanceof Error ? error.message : '创建建筑失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/community/${communityId}`}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            返回社区
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">创建新建筑</h1>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                建筑名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="例如：Twin-Oak S1"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                描述
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="建筑描述（可选）"
              />
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                地址
              </label>
              <input
                type="text"
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="建筑地址（可选）"
              />
            </div>

            {/* Floor Count and Unit Count */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="floorCount" className="block text-sm font-medium text-gray-700 mb-1">
                  楼层数
                </label>
                <input
                  type="number"
                  id="floorCount"
                  min="1"
                  value={formData.floorCount}
                  onChange={(e) => setFormData({ ...formData, floorCount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="例如：10"
                />
              </div>
              <div>
                <label htmlFor="unitCount" className="block text-sm font-medium text-gray-700 mb-1">
                  单元数
                </label>
                <input
                  type="number"
                  id="unitCount"
                  min="1"
                  value={formData.unitCount}
                  onChange={(e) => setFormData({ ...formData, unitCount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="例如：32"
                />
              </div>
            </div>

            {/* Latitude and Longitude */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                  纬度
                </label>
                <input
                  type="number"
                  id="latitude"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="例如：25.0330"
                />
              </div>
              <div>
                <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                  经度
                </label>
                <input
                  type="number"
                  id="longitude"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="例如：121.5654"
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? '创建中...' : '创建建筑'}
              </button>
              <Link
                href={`/community/${communityId}`}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 text-center"
              >
                取消
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

