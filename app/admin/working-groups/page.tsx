'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/components/LanguageProvider'
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface WorkingGroup {
  id: string
  name: string
  description?: string
  type: string
  communityId: string
  community: {
    id: string
    name: string
  }
  members: Array<{
    id: string
    userId: string
    userName: string | null
    userEmail: string
    role: string
    assignedAt: string
  }>
  permissions: Array<{
    id: string
    permission: string
    scope: string
    scopeId?: string
  }>
  stats: {
    members: number
    permissions: number
  }
  createdAt: string
  updatedAt: string
}

interface Community {
  id: string
  name: string
}

export default function AdminWorkingGroupsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()

  const [workingGroups, setWorkingGroups] = useState<WorkingGroup[]>([])
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCommunityId, setFilterCommunityId] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<WorkingGroup | null>(null)
  const [showGroupDetails, setShowGroupDetails] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session?.user) {
      router.push('/admin-auth/signin')
      return
    }

    // Check admin access - only super admin can access this page
    fetch('/api/admin/context')
      .then(res => res.json())
      .then(data => {
        if (!data.isSuperAdmin && !(session.user as any)?.isAdmin) {
          router.push('/admin-auth/signin')
        }
      })
      .catch(() => {
        if (!(session.user as any)?.isAdmin) {
          router.push('/admin-auth/signin')
        }
      })
  }, [session, status, router])

  useEffect(() => {
    fetchWorkingGroups()
    fetchCommunities()
  }, [filterCommunityId])

  const fetchCommunities = async () => {
    try {
      const res = await fetch('/api/admin/communities')
      if (res.ok) {
        const data = await res.json()
        setCommunities(data.communities || [])
      }
    } catch (error) {
      console.error('Error fetching communities:', error)
    }
  }

  const fetchWorkingGroups = async () => {
    try {
      setLoading(true)
      setError(null)
      const url = filterCommunityId
        ? `/api/admin/working-groups?communityId=${filterCommunityId}`
        : '/api/admin/working-groups'
      
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error('Failed to load working groups')
      }
      const data = await res.json()
      setWorkingGroups(data.workingGroups || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      toast.error('Failed to load working groups')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async (groupData: any) => {
    try {
      const res = await fetch('/api/admin/working-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create working group')
      }

      toast.success('Working group created successfully')
      setShowCreateModal(false)
      fetchWorkingGroups()
    } catch (error) {
      console.error('Error creating working group:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create working group')
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Delete this working group? This cannot be undone.')) return
    
    try {
      // Find the group to get community ID
      const group = workingGroups.find(g => g.id === groupId)
      if (!group) return

      const res = await fetch(`/api/community/${group.communityId}/working-groups/${groupId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Working group deleted')
        fetchWorkingGroups()
        if (selectedGroup?.id === groupId) {
          setSelectedGroup(null)
          setShowGroupDetails(false)
        }
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to delete working group')
      }
    } catch (error) {
      console.error('Error deleting group:', error)
      toast.error('Failed to delete working group')
    }
  }

  const filteredGroups = workingGroups.filter(group => {
    const matchesSearch = !searchTerm || 
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.type.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Working Groups Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage all working groups across communities and buildings
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Working Group
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, community, or type..."
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Community
            </label>
            <select
              value={filterCommunityId}
              onChange={(e) => setFilterCommunityId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Communities</option>
              {communities.map((community) => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Working Groups List */}
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No working groups found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100"
          >
            Create your first working group
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Community
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredGroups.map((group) => (
                  <tr key={group.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{group.name}</div>
                      {group.description && (
                        <div className="text-sm text-gray-500">{group.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {group.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{group.community.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {group.stats.members}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {group.stats.permissions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedGroup(group)
                          setShowGroupDetails(true)
                        }}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateWorkingGroupModal
          communities={communities}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateGroup}
        />
      )}

      {/* Group Details Modal */}
      {showGroupDetails && selectedGroup && (
        <WorkingGroupDetailsModal
          group={selectedGroup}
          onClose={() => {
            setShowGroupDetails(false)
            setSelectedGroup(null)
          }}
          onUpdate={fetchWorkingGroups}
        />
      )}
    </div>
  )
}

function CreateWorkingGroupModal({
  communities,
  onClose,
  onCreate,
}: {
  communities: Community[]
  onClose: () => void
  onCreate: (data: any) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('')
  const [communityId, setCommunityId] = useState('')
  const [creating, setCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !type || !communityId) {
      toast.error('Name, type, and community are required')
      return
    }

    setCreating(true)
    try {
      await onCreate({
        name,
        description,
        type: type.toUpperCase().replace(/\s+/g, '_'),
        communityId,
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Create Working Group</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Community *
            </label>
            <select
              value={communityId}
              onChange={(e) => setCommunityId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            >
              <option value="">Select community...</option>
              {communities.map((community) => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Type *
            </label>
            <input
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="e.g., MANAGEMENT, MAINTENANCE, FRONT_DOOR"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter custom type (will be converted to UPPER_CASE)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function WorkingGroupDetailsModal({
  group,
  onClose,
  onUpdate,
}: {
  group: WorkingGroup
  onClose: () => void
  onUpdate: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 my-8 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {group.community.name} • {group.type}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {group.description && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-1">Description</h4>
              <p className="text-sm text-gray-600">{group.description}</p>
            </div>
          )}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Members ({group.members.length})</h4>
            <div className="space-y-2">
              {group.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {member.userName || member.userEmail}
                    </p>
                    <p className="text-xs text-gray-500">{member.userEmail}</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Permissions ({group.permissions.length})</h4>
            <div className="space-y-1">
              {group.permissions.map((permission) => (
                <div key={permission.id} className="text-sm text-gray-600">
                  <span className="font-medium">{permission.permission}</span>
                  {' • '}
                  <span>{permission.scope}</span>
                  {permission.scopeId && (
                    <span className="text-gray-400"> • {permission.scopeId}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

