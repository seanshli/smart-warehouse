'use client'

// For static export compatibility
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  BuildingOfficeIcon,
  UserGroupIcon,
  CogIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import toast from 'react-hot-toast'
import JoinRequestList from '@/components/community/JoinRequestList'

interface Community {
  id: string
  name: string
  description?: string
  address?: string
  city?: string
  district?: string
  country?: string
  invitationCode?: string
  createdAt: string
  stats: {
    buildings: number
    members: number
    workingGroups: number
  }
}

export default function CommunityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const communityId = params.id as string

  const [community, setCommunity] = useState<Community | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'buildings' | 'members' | 'working-groups'>('overview')

  useEffect(() => {
    if (communityId) {
      fetchCommunity()
    }
  }, [communityId])

  const fetchCommunity = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/community/${communityId}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.message || `Failed to fetch community (${response.status})`
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      
      if (!data || !data.id) {
        throw new Error('Invalid community data received')
      }
      
      setCommunity(data)
    } catch (err) {
      console.error('[Community] Error fetching community:', err)
      setError(err instanceof Error ? err.message : 'Failed to load community')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error || !community) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Community not found'}</p>
          <Link href="/community" className="mt-4 text-primary-600 hover:text-primary-700">
            返回社区列表
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/community"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            返回社区列表
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{community.name}</h1>
              {community.description && (
                <p className="mt-2 text-sm text-gray-600">{community.description}</p>
              )}
            </div>
            <div className="flex space-x-3">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <CogIcon className="h-5 w-5 mr-2" />
                设置
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: '概览', icon: BuildingOfficeIcon },
              { id: 'buildings', name: '建筑', icon: BuildingOfficeIcon },
              { id: 'members', name: '成员', icon: UserGroupIcon },
              { id: 'working-groups', name: '工作组', icon: CogIcon },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {activeTab === 'overview' && <OverviewTab community={community} />}
          {activeTab === 'buildings' && <BuildingsTab communityId={communityId} />}
          {activeTab === 'members' && <MembersTab communityId={communityId} />}
          {activeTab === 'working-groups' && <WorkingGroupsTab communityId={communityId} />}
        </div>
      </div>
    </div>
  )
}

function OverviewTab({ community }: { community: Community }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">基本信息</h3>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">地址</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {[community.address, community.city, community.district, community.country]
                .filter(Boolean)
                .join(', ') || '未设置'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">创建时间</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(community.createdAt).toLocaleDateString('zh-CN')}
            </dd>
          </div>
          {community.invitationCode && (
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500 mb-1">邀请码</dt>
              <dd className="mt-1">
                <div className="flex items-center space-x-2">
                  <code className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm font-mono">
                    {community.invitationCode}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(community.invitationCode!)
                      toast.success('邀请码已复制')
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    复制
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  分享此邀请码给其他人，让他们可以加入此社区
                </p>
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">统计信息</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-gray-900">{community.stats.buildings}</div>
            <div className="text-sm text-gray-500 mt-1">建筑</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-gray-900">{community.stats.members}</div>
            <div className="text-sm text-gray-500 mt-1">成员</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-gray-900">{community.stats.workingGroups}</div>
            <div className="text-sm text-gray-500 mt-1">工作组</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BuildingsTab({ communityId }: { communityId: string }) {
  const [buildings, setBuildings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBuildings()
  }, [communityId])

  const fetchBuildings = async () => {
    try {
      const response = await fetch(`/api/community/${communityId}/buildings`)
      if (response.ok) {
        const data = await response.json()
        setBuildings(data.buildings || [])
      }
    } catch (err) {
      console.error('Failed to fetch buildings:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">加载中...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">建筑列表</h3>
        <Link
          href={`/community/${communityId}/buildings/new`}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          添加建筑
        </Link>
      </div>
      {buildings.length === 0 ? (
        <div className="text-center py-8 text-gray-500">暂无建筑</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {buildings.map((building) => (
            <Link
              key={building.id}
              href={`/building/${building.id}`}
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <h4 className="font-medium text-gray-900">{building.name}</h4>
              {building.description && (
                <p className="text-sm text-gray-600 mt-1">{building.description}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {building.householdCount || 0} 个住户
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function MembersTab({ communityId }: { communityId: string }) {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMembers()
  }, [communityId])

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/community/${communityId}/members`)
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members || [])
      }
    } catch (err) {
      console.error('Failed to fetch members:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">加载中...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">成员列表</h3>
        <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
          添加成员
        </button>
      </div>
      {members.length === 0 ? (
        <div className="text-center py-8 text-gray-500">暂无成员</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  角色
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  加入时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{member.user.name || member.user.email}</div>
                    <div className="text-sm text-gray-500">{member.user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      member.role === 'ADMIN' 
                        ? 'bg-red-100 text-red-800'
                        : member.role === 'MANAGER'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(member.joinedAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-primary-600 hover:text-primary-900 mr-4">编辑</button>
                    <button className="text-red-600 hover:text-red-900">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function WorkingGroupsTab({ communityId }: { communityId: string }) {
  const [workingGroups, setWorkingGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWorkingGroups()
  }, [communityId])

  const fetchWorkingGroups = async () => {
    try {
      const response = await fetch(`/api/community/${communityId}/working-groups`)
      if (response.ok) {
        const data = await response.json()
        setWorkingGroups(data.workingGroups || [])
      }
    } catch (err) {
      console.error('Failed to fetch working groups:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">加载中...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">工作组列表</h3>
        <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
          创建工作组
        </button>
      </div>
      {workingGroups.length === 0 ? (
        <div className="text-center py-8 text-gray-500">暂无工作组</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workingGroups.map((group) => (
            <div key={group.id} className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900">{group.name}</h4>
              {group.description && (
                <p className="text-sm text-gray-600 mt-1">{group.description}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                类型: {group.type} | 成员: {group.memberCount || 0}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

