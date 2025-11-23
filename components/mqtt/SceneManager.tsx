'use client'
// 场景管理组件
// Scene Management Component

import { useState, useEffect } from 'react'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useHousehold } from '../HouseholdProvider'

interface Scene {
  id: string
  name: string
  description?: string
  enabled: boolean
  actions: SceneAction[]
  createdAt: string
  updatedAt: string
}

interface SceneAction {
  id: string
  deviceId: string
  action: string
  value?: any
  order: number
  delayMs: number
  device?: {
    id: string
    name: string
    vendor: string
  }
}

interface SceneManagerProps {
  onSceneActivated?: (sceneId: string) => void
}

export default function SceneManager({ onSceneActivated }: SceneManagerProps) {
  const { household } = useHousehold()
  const [scenes, setScenes] = useState<Scene[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingScene, setEditingScene] = useState<Scene | null>(null)
  const [activatingSceneId, setActivatingSceneId] = useState<string | null>(null)

  useEffect(() => {
    if (household?.id) {
      fetchScenes()
    }
  }, [household?.id])

  const fetchScenes = async () => {
    if (!household?.id) return

    try {
      setLoading(true)
      const response = await fetch(`/api/mqtt/scenes?householdId=${household.id}`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setScenes(data.scenes || [])
      }
    } catch (error) {
      console.error('Failed to fetch scenes:', error)
      toast.error('获取场景列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleActivateScene = async (sceneId: string) => {
    try {
      setActivatingSceneId(sceneId)
      const response = await fetch(`/api/mqtt/scenes/${sceneId}/activate`, {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`场景 "${data.sceneName}" 已激活`)
        if (onSceneActivated) {
          onSceneActivated(sceneId)
        }
      } else {
        const error = await response.json()
        toast.error(error.error || '激活场景失败')
      }
    } catch (error) {
      console.error('Failed to activate scene:', error)
      toast.error('激活场景失败')
    } finally {
      setActivatingSceneId(null)
    }
  }

  const handleDeleteScene = async (sceneId: string) => {
    if (!confirm('确定要删除这个场景吗？')) {
      return
    }

    try {
      const response = await fetch(`/api/mqtt/scenes/${sceneId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        toast.success('场景已删除')
        fetchScenes()
      } else {
        const error = await response.json()
        toast.error(error.error || '删除场景失败')
      }
    } catch (error) {
      console.error('Failed to delete scene:', error)
      toast.error('删除场景失败')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">加载中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">场景管理</h3>
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          创建场景
        </button>
      </div>

      {scenes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">还没有场景</p>
          <button
            onClick={() => setIsCreating(true)}
            className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            创建第一个场景
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenes.map((scene) => (
            <div
              key={scene.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-900">{scene.name}</h4>
                  {scene.description && (
                    <p className="text-sm text-gray-600 mt-1">{scene.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleActivateScene(scene.id)}
                    disabled={!scene.enabled || activatingSceneId === scene.id}
                    className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    title="激活场景"
                  >
                    <PlayIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setEditingScene(scene)}
                    className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md"
                    title="编辑场景"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteScene(scene.id)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                    title="删除场景"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">
                  {scene.actions.length} 个动作
                </p>
                <div className="space-y-1">
                  {scene.actions.slice(0, 3).map((action, index) => (
                    <div key={action.id} className="text-xs text-gray-600">
                      {index + 1}. {action.device?.name || action.deviceId}: {action.action}
                    </div>
                  ))}
                  {scene.actions.length > 3 && (
                    <div className="text-xs text-gray-400">
                      ...还有 {scene.actions.length - 3} 个动作
                    </div>
                  )}
                </div>
              </div>

              {!scene.enabled && (
                <div className="mt-2 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                  场景已禁用
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {(isCreating || editingScene) && (
        <SceneEditor
          scene={editingScene}
          onClose={() => {
            setIsCreating(false)
            setEditingScene(null)
          }}
          onSuccess={() => {
            setIsCreating(false)
            setEditingScene(null)
            fetchScenes()
          }}
        />
      )}
    </div>
  )
}

// 场景编辑器组件
function SceneEditor({
  scene,
  onClose,
  onSuccess,
}: {
  scene?: Scene | null
  onClose: () => void
  onSuccess: () => void
}) {
  const { household } = useHousehold()
  const [name, setName] = useState(scene?.name || '')
  const [description, setDescription] = useState(scene?.description || '')
  const [enabled, setEnabled] = useState(scene?.enabled ?? true)
  const [actions, setActions] = useState<Omit<SceneAction, 'id'>[]>(
    scene?.actions.map(a => ({
      deviceId: a.deviceId,
      action: a.action,
      value: a.value,
      order: a.order,
      delayMs: a.delayMs,
    })) || []
  )
  const [devices, setDevices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (household?.id) {
      fetchDevices()
    }
  }, [household?.id])

  const fetchDevices = async () => {
    if (!household?.id) return

    try {
      const response = await fetch(`/api/mqtt/iot/devices?householdId=${household.id}`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setDevices(data || [])
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error)
    }
  }

  const handleAddAction = () => {
    setActions([
      ...actions,
      {
        deviceId: '',
        action: 'power_on',
        value: null,
        order: actions.length,
        delayMs: 0,
      },
    ])
  }

  const handleRemoveAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index))
  }

  const handleUpdateAction = (index: number, field: string, value: any) => {
    const updated = [...actions]
    updated[index] = { ...updated[index], [field]: value }
    setActions(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !household?.id) {
      toast.error('场景名称是必需的')
      return
    }

    if (actions.length === 0) {
      toast.error('至少需要添加一个动作')
      return
    }

    try {
      setLoading(true)
      const url = scene
        ? `/api/mqtt/scenes/${scene.id}`
        : '/api/mqtt/scenes'
      const method = scene ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name,
          description,
          enabled,
          householdId: household.id,
          actions: actions.map((a, index) => ({
            ...a,
            order: index,
          })),
        }),
      })

      if (response.ok) {
        toast.success(scene ? '场景已更新' : '场景已创建')
        onSuccess()
      } else {
        const error = await response.json()
        toast.error(error.error || '操作失败')
      }
    } catch (error) {
      console.error('Failed to save scene:', error)
      toast.error('保存场景失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {scene ? '编辑场景' : '创建场景'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              场景名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enabled"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="enabled" className="ml-2 block text-sm text-gray-700">
              启用场景
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                动作 <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddAction}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                + 添加动作
              </button>
            </div>

            <div className="space-y-3">
              {actions.map((action, index) => (
                <div
                  key={index}
                  className="p-3 border border-gray-200 rounded-md bg-gray-50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      动作 {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAction(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">设备</label>
                      <select
                        value={action.deviceId}
                        onChange={(e) => handleUpdateAction(index, 'deviceId', e.target.value)}
                        required
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                      >
                        <option value="">选择设备</option>
                        {devices.map((device) => (
                          <option key={device.id} value={device.id}>
                            {device.name} ({device.vendor})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">操作</label>
                      <select
                        value={action.action}
                        onChange={(e) => handleUpdateAction(index, 'action', e.target.value)}
                        required
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                      >
                        <option value="power_on">开启</option>
                        <option value="power_off">关闭</option>
                        <option value="toggle">切换</option>
                        <option value="set_brightness">设置亮度</option>
                        <option value="set_color">设置颜色</option>
                        <option value="set_temperature">设置温度</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">值（可选）</label>
                      <input
                        type="text"
                        value={action.value || ''}
                        onChange={(e) => handleUpdateAction(index, 'value', e.target.value)}
                        placeholder="例如: 50, true, #FF0000"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">延迟（毫秒）</label>
                      <input
                        type="number"
                        value={action.delayMs}
                        onChange={(e) => handleUpdateAction(index, 'delayMs', parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
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
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? '保存中...' : scene ? '更新' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

