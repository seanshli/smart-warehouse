'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  UserPlusIcon, 
  TrashIcon, 
  KeyIcon, 
  EyeIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { useLanguage } from '@/components/LanguageProvider'
import toast from 'react-hot-toast'

interface User {
  id: string
  name: string
  email: string
  phone?: string
  contact?: string
  language: string
  isAdmin: boolean
  createdAt: string
  households: Array<{
    id: string
    name: string
    role: string
    joinedAt: string
    building?: {
      id: string
      name: string
      community?: {
        id: string
        name: string
      }
    }
  }>
  communities?: Array<{
    membershipId: string
    id: string
    name: string
    role: string
    joinedAt: string
  }>
  buildings?: Array<{
    membershipId: string
    id: string
    name: string
    role: string
    joinedAt: string
  }>
  workingGroups?: Array<{
    id: string
    name: string
    type: string
    role: string
    assignedAt: string
  }>
}

interface CreateUserModalProps {
  onClose: () => void
  onSuccess: () => void
}

function CreateUserModal({ onClose, onSuccess }: CreateUserModalProps) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    contact: '',
    password: '',
    isAdmin: false,
    userType: 'household' as 'household' | 'working-team',
    communityId: '',
    buildingId: '',
    role: 'MEMBER' as 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [adminContext, setAdminContext] = useState<{
    isSuperAdmin: boolean
    communityAdmins: Array<{ id: string; name: string }>
    buildingAdmins: Array<{ id: string; name: string; communityId: string; communityName: string }>
  } | null>(null)
  const [communities, setCommunities] = useState<Array<{ id: string; name: string }>>([])
  const [buildings, setBuildings] = useState<Array<{ id: string; name: string; communityId: string }>>([])
  const [loadingContext, setLoadingContext] = useState(true)

  useEffect(() => {
    // Fetch admin context and available communities/buildings
    const loadData = async () => {
      try {
        const [contextRes, communitiesRes, buildingsRes] = await Promise.all([
          fetch('/api/admin/context'),
          fetch('/api/admin/communities'),
          fetch('/api/admin/buildings'),
        ])
        
        const context = await contextRes.json()
        const communitiesData = communitiesRes.ok ? await communitiesRes.json() : { communities: [] }
        const buildingsData = buildingsRes.ok ? await buildingsRes.json() : { buildings: [] }
        
        setAdminContext(context)
        setCommunities(communitiesData.communities || [])
        setBuildings(buildingsData.buildings || [])
        setLoadingContext(false)
      } catch (err) {
        console.error('Error loading context:', err)
        setLoadingContext(false)
      }
    }
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        contact: formData.contact,
        password: formData.password,
        isAdmin: formData.isAdmin,
      }

      // Add community or building membership if selected
      if (formData.communityId) {
        payload.communityMembership = {
          communityId: formData.communityId,
          role: formData.role,
          memberClass: formData.userType === 'working-team' ? 'community' : 'household',
        }
      }
      if (formData.buildingId) {
        payload.buildingMembership = {
          buildingId: formData.buildingId,
          role: formData.role,
          memberClass: formData.userType === 'working-team' ? 'building' : 'household',
        }
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok || response.status === 201) {
        const result = await response.json()
        if (result.warning) {
          toast.success(result.message || 'User created successfully', {
            duration: 5000
          })
          toast.error(result.warning + (result.details ? `: ${result.details}` : ''), {
            duration: 8000,
            icon: '⚠️'
          })
        } else {
          toast.success(result.message || 'User created successfully')
        }
        // Small delay to ensure database is updated
        await new Promise(resolve => setTimeout(resolve, 500))
        onSuccess()
        onClose()
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.error || errorData.details || 'Failed to create user'
        const fullMessage = errorData.details ? `${errorMessage}\n${errorData.details}` : errorMessage
        setError(fullMessage)
        toast.error(errorMessage)
      }
    } catch (err: any) {
      console.error('[Create User] Request failed:', err)
      const errorMessage = err.message || 'Failed to create user. Please check your connection and try again.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Filter buildings by selected community
  const filteredBuildings = formData.communityId
    ? buildings.filter(b => b.communityId === formData.communityId)
    : []

  // Determine available options based on admin level
  const canCreateCommunityAdmin = adminContext?.isSuperAdmin || false
  const canCreateBuildingAdmin = adminContext?.isSuperAdmin || (adminContext?.communityAdmins && adminContext.communityAdmins.length > 0) || false
  const availableCommunities = adminContext?.isSuperAdmin 
    ? communities 
    : communities.filter(c => adminContext?.communityAdmins.some(ca => ca.id === c.id))
  const availableBuildings = adminContext?.isSuperAdmin
    ? buildings
    : buildings.filter(b => {
        if (adminContext?.communityAdmins.some(ca => ca.id === b.communityId)) return true
        return adminContext?.buildingAdmins.some(ba => ba.id === b.id)
      })

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-2 sm:p-4">
        <div className="fixed inset-0 bg-black opacity-30" onClick={onClose}></div>
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-full sm:max-w-md w-full p-4 sm:p-6 mx-2 sm:mx-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Create New User
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Info
              </label>
              <input
                type="text"
                value={formData.contact}
                onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            {/* User Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                User Type *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="userType"
                    value="household"
                    checked={formData.userType === 'household'}
                    onChange={(e) => setFormData(prev => ({ ...prev, userType: 'household', communityId: '', buildingId: '', role: 'MEMBER' }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Household Member</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="userType"
                    value="working-team"
                    checked={formData.userType === 'working-team'}
                    onChange={(e) => setFormData(prev => ({ ...prev, userType: 'working-team' }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Working Team Member</span>
                </label>
              </div>
            </div>

            {/* Community and Building Selection - Available for all user types */}
            {/* Community Selection */}
            {availableCommunities.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Add to Community (optional)
                </label>
                <select
                  value={formData.communityId}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, communityId: e.target.value, buildingId: '' }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">None (don't add to community)</option>
                  {availableCommunities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Select a community to automatically add this user as a member
                </p>
              </div>
            )}

            {/* Building Selection - Only show if community is selected or user is super admin */}
            {canCreateBuildingAdmin && (formData.communityId || availableBuildings.length > 0) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Add to Building (optional)
                </label>
                <select
                  value={formData.buildingId}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, buildingId: e.target.value }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                  disabled={!formData.communityId && filteredBuildings.length === 0}
                >
                  <option value="">None (don't add to building)</option>
                  {(formData.communityId ? filteredBuildings : availableBuildings).map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                {!formData.communityId && (
                  <p className="mt-1 text-xs text-gray-500">
                    Select a community first to see buildings
                  </p>
                )}
              </div>
            )}

            {/* Role Selection - Only show if community or building is selected */}
            {(formData.communityId || formData.buildingId) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                >
                  {canCreateCommunityAdmin && formData.communityId && (
                    <option value="ADMIN">ADMIN</option>
                  )}
                  <option value="MANAGER">MANAGER</option>
                  <option value="MEMBER">MEMBER</option>
                  <option value="VIEWER">VIEWER</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Role for {formData.communityId ? 'community' : 'building'} membership
                </p>
              </div>
            )}

            {/* Super Admin Checkbox */}
            {adminContext?.isSuperAdmin && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={formData.isAdmin}
                  onChange={(e) => setFormData(prev => ({ ...prev, isAdmin: e.target.checked }))}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isAdmin" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Super Admin (Global Administrator)
                </label>
              </div>
            )}

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    contact: '',
    language: 'en',
    isAdmin: false
  })
  const [saving, setSaving] = useState(false)
  const [isCurrentUserSuperAdmin, setIsCurrentUserSuperAdmin] = useState(false)
  const [editingCommunityRole, setEditingCommunityRole] = useState<string | null>(null)
  const [editingBuildingRole, setEditingBuildingRole] = useState<string | null>(null)
  const [savingRole, setSavingRole] = useState(false)
  const [showAddCommunity, setShowAddCommunity] = useState(false)
  const [showAddBuilding, setShowAddBuilding] = useState(false)
  const [newCommunityId, setNewCommunityId] = useState('')
  const [newBuildingId, setNewBuildingId] = useState('')
  const [newCommunityRole, setNewCommunityRole] = useState('MEMBER')
  const [newBuildingRole, setNewBuildingRole] = useState('MEMBER')
  const [addingMembership, setAddingMembership] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'community' | 'building' | 'other'>('all')
  const [communities, setCommunities] = useState<Array<{ id: string; name: string }>>([])
  const [buildings, setBuildings] = useState<Array<{ id: string; name: string; communityId: string }>>([])
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('')
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('')
  
  // Get buildings filtered by selected community
  const filteredBuildings = selectedCommunityId
    ? buildings.filter(b => b.communityId === selectedCommunityId)
    : buildings

  // Check admin access
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session?.user || !(session.user as any)?.isAdmin) {
      router.push('/admin-auth/signin')
      return
    }
  }, [session, status, router])

  // Fetch admin context to check if current user is super admin
  useEffect(() => {
    fetch('/api/admin/context')
      .then(res => res.json())
      .then(data => {
        setIsCurrentUserSuperAdmin(data.isSuperAdmin || false)
      })
      .catch(err => {
        console.error('Error fetching admin context:', err)
      })
  }, [])

  // Fetch users, communities, and buildings
  useEffect(() => {
    fetchUsers()
    fetchCommunities()
    fetchBuildings()
  }, [])

  // Refetch users when filter changes
  useEffect(() => {
    fetchUsers()
  }, [selectedCommunityId, selectedBuildingId, filterType])

  // Reset selections when filter type changes
  useEffect(() => {
    if (filterType !== 'community') {
      setSelectedCommunityId('')
    }
    if (filterType !== 'building') {
      setSelectedBuildingId('')
    }
  }, [filterType])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      // Simple filtering based on filterType
      if (filterType === 'community' && selectedCommunityId) {
        params.append('communityId', selectedCommunityId)
      } else if (filterType === 'building' && selectedBuildingId) {
        params.append('buildingId', selectedBuildingId)
      } else if (filterType === 'other') {
        params.append('filterType', 'other') // Special filter for users with no community/building
      }
      // 'all' doesn't need any params
      
      const response = await fetch(`/api/admin/users?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        let filteredUsers = data.users || []
        
        // Client-side filter for "other" (users with no community/building)
        if (filterType === 'other') {
          filteredUsers = filteredUsers.filter((user: User) => {
            const hasCommunity = user.communities && user.communities.length > 0
            const hasBuilding = user.buildings && user.buildings.length > 0
            const hasHouseholdWithBuilding = user.households && user.households.some((h: any) => h.building)
            return !hasCommunity && !hasBuilding && !hasHouseholdWithBuilding
          })
        }
        
        setUsers(filteredUsers)
      } else {
        setError('Failed to fetch users')
      }
    } catch (err: any) {
      console.error('[Fetch Users] Request failed:', err)
      const errorMessage = err.message || 'Failed to fetch users. Please check your connection and try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const fetchCommunities = async () => {
    try {
      const response = await fetch('/api/admin/communities')
      if (response.ok) {
        const data = await response.json()
        setCommunities(data.communities || [])
      }
    } catch (err) {
      console.error('Failed to fetch communities:', err)
    }
  }

  const fetchBuildings = async () => {
    try {
      const response = await fetch('/api/admin/buildings')
      if (response.ok) {
        const data = await response.json()
        setBuildings(data.buildings || [])
      }
    } catch (err) {
      console.error('Failed to fetch buildings:', err)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchUsers() // Refresh the list
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to delete user')
      }
    } catch (err: any) {
      console.error('[Delete User] Request failed:', err)
      alert(err.message || 'Failed to delete user. Please check your connection and try again.')
    }
  }

  const handleUpdateCommunityRole = async (communityId: string, membershipId: string, newRole: string) => {
    setSavingRole(true)
    try {
      console.log('[Update Community Role] Request:', { communityId, membershipId, newRole })
      const response = await fetch(`/api/community/${communityId}/members/${membershipId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole })
      })

      const responseData = await response.json()
      console.log('[Update Community Role] Response:', { status: response.status, data: responseData })

      if (response.ok) {
        toast.success('Community role updated successfully')
        setEditingCommunityRole(null)
        fetchUsers() // Refresh the list
        // Refresh selected user data from API to ensure consistency
        if (selectedUser) {
          try {
            const userResponse = await fetch(`/api/admin/users/${selectedUser.id}`)
            if (userResponse.ok) {
              const userData = await userResponse.json()
              if (userData.user) {
                setSelectedUser(userData.user)
              }
            }
          } catch (err) {
            console.error('[Update Community Role] Failed to refresh user data:', err)
            // Fallback to local update if API refresh fails
            const updatedCommunities = selectedUser.communities?.map(c => 
              c.membershipId === membershipId ? { ...c, role: newRole } : c
            )
            setSelectedUser({ ...selectedUser, communities: updatedCommunities })
          }
        }
      } else {
        toast.error(responseData.error || 'Failed to update community role')
        console.error('[Update Community Role] Error:', responseData)
      }
    } catch (err: any) {
      console.error('[Update Community Role] Request failed:', err)
      toast.error(err.message || 'Failed to update community role. Please check your connection and try again.')
    } finally {
      setSavingRole(false)
    }
  }

  const handleUpdateBuildingRole = async (buildingId: string, membershipId: string, newRole: string) => {
    setSavingRole(true)
    try {
      console.log('[Update Building Role] Request:', { buildingId, membershipId, newRole })
      const response = await fetch(`/api/building/${buildingId}/members/${membershipId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole })
      })

      const responseData = await response.json()
      console.log('[Update Building Role] Response:', { status: response.status, data: responseData })

      if (response.ok) {
        toast.success('Building role updated successfully')
        setEditingBuildingRole(null)
        fetchUsers() // Refresh the list
        // Refresh selected user data from API to ensure consistency
        if (selectedUser) {
          try {
            const userResponse = await fetch(`/api/admin/users/${selectedUser.id}`)
            if (userResponse.ok) {
              const userData = await userResponse.json()
              if (userData.user) {
                setSelectedUser(userData.user)
              }
            }
          } catch (err) {
            console.error('[Update Building Role] Failed to refresh user data:', err)
            // Fallback to local update if API refresh fails
            const updatedBuildings = selectedUser.buildings?.map(b => 
              b.membershipId === membershipId ? { ...b, role: newRole } : b
            )
            setSelectedUser({ ...selectedUser, buildings: updatedBuildings })
          }
        }
      } else {
        toast.error(responseData.error || 'Failed to update building role')
        console.error('[Update Building Role] Error:', responseData)
      }
    } catch (err: any) {
      console.error('[Update Building Role] Request failed:', err)
      toast.error(err.message || 'Failed to update building role. Please check your connection and try again.')
    } finally {
      setSavingRole(false)
    }
  }

  const handleSaveUser = async () => {
    if (!selectedUser) return

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      })

      if (response.ok) {
        toast.success('User updated successfully')
        setIsEditing(false)
        fetchUsers() // Refresh the list
        // Update selected user with new data
        setSelectedUser({
          ...selectedUser,
          ...editFormData
        })
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to update user')
      }
    } catch (err: any) {
      console.error('[Save User] Request failed:', err)
      toast.error(err.message || 'Failed to update user. Please check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleResetPassword = async (userId: string) => {
    if (!confirm('Are you sure you want to reset this user\'s password? They will need to set a new password on next login.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Password reset successfully. Temporary password: ${data.tempPassword}\n\nPlease communicate this password to the user securely.`)
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to reset password')
      }
    } catch (err: any) {
      console.error('[Reset Password] Request failed:', err)
      alert(err.message || 'Failed to reset password. Please check your connection and try again.')
    }
  }

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = filterRole === 'all' || 
                       (filterRole === 'admin' && user.isAdmin) ||
                       (filterRole === 'user' && !user.isAdmin)
    
    return matchesSearch && matchesRole
  })

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Manage all users in the system
          </p>
        </div>

        {/* Filter */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Filter Users
          </label>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 items-stretch sm:items-end">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="all">All Users</option>
              <option value="community">By Community</option>
              <option value="building">By Building</option>
              <option value="other">Other (No Community/Building)</option>
            </select>

            {filterType === 'community' && (
              <select
                value={selectedCommunityId}
                onChange={(e) => setSelectedCommunityId(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">Select Community</option>
                {communities.map((community) => (
                  <option key={community.id} value={community.id}>
                    {community.name}
                  </option>
                ))}
              </select>
            )}

            {filterType === 'building' && (
              <select
                value={selectedBuildingId}
                onChange={(e) => setSelectedBuildingId(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">Select Building</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-2 sm:gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="all">All Users</option>
              <option value="admin">Admins Only</option>
              <option value="user">Regular Users</option>
            </select>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Add User
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No users found</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <li key={user.id} className="px-2 sm:px-4 md:px-6 py-3 sm:py-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                    <div className="flex-1 min-w-0 w-full sm:w-auto">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {user.name}
                            </p>
                            {user.isAdmin && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                Admin
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500 dark:text-gray-400">
                            {user.phone && <span>📞 {user.phone}</span>}
                            <span>🏠 {user.households.length} household(s)</span>
                            <span>📅 Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 sm:space-x-2 w-full sm:w-auto justify-end sm:justify-start">
                      <button
                        onClick={async () => {
                          // Fetch fresh user data with all memberships using dedicated endpoint
                          try {
                            const response = await fetch(`/api/admin/users/${user.id}`)
                            if (response.ok) {
                              const data = await response.json()
                              const freshUser = data.user
                              if (freshUser) {
                                console.log('[View User] Fetched user data:', {
                                  id: freshUser.id,
                                  name: freshUser.name,
                                  buildings: freshUser.buildings?.length || 0,
                                  communities: freshUser.communities?.length || 0
                                })
                                setSelectedUser(freshUser)
                                setEditFormData({
                                  name: freshUser.name || '',
                                  email: freshUser.email || '',
                                  phone: freshUser.phone || '',
                                  contact: freshUser.contact || '',
                                  language: freshUser.language || 'en',
                                  isAdmin: freshUser.isAdmin || false
                                })
                              } else {
                                console.warn('[View User] User not found in response, using cached data')
                                setSelectedUser(user)
                                setEditFormData({
                                  name: user.name || '',
                                  email: user.email || '',
                                  phone: user.phone || '',
                                  contact: user.contact || '',
                                  language: user.language || 'en',
                                  isAdmin: user.isAdmin || false
                                })
                              }
                            } else {
                              const errorData = await response.json().catch(() => ({}))
                              console.error('[View User] Failed to fetch user:', {
                                status: response.status,
                                statusText: response.statusText,
                                error: errorData
                              })
                              const errorMsg = errorData.error || errorData.details || `Failed to fetch user details (${response.status})`
                              toast.error(errorMsg)
                              // Use cached user data as fallback
                              setSelectedUser(user)
                              setEditFormData({
                                name: user.name || '',
                                email: user.email || '',
                                phone: user.phone || '',
                                contact: user.contact || '',
                                language: user.language || 'en',
                                isAdmin: user.isAdmin || false
                              })
                            }
                          } catch (err: any) {
                            console.error('[View User] Error fetching user data:', err)
                            toast.error(err.message || 'Failed to fetch user details. Please check your connection and try again.')
                            // Use cached user data as fallback
                            setSelectedUser(user)
                            setEditFormData({
                              name: user.name || '',
                              email: user.email || '',
                              phone: user.phone || '',
                              contact: user.contact || '',
                              language: user.language || 'en',
                              isAdmin: user.isAdmin || false
                            })
                          }
                          setIsEditing(false)
                          setShowUserDetails(true)
                        }}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                        title="View/Edit Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleResetPassword(user.id)}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                        title="Reset Password"
                      >
                        <KeyIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="inline-flex items-center px-2 py-1 border border-red-300 dark:border-red-600 text-xs font-medium rounded text-red-700 dark:text-red-300 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900"
                        title="Delete User"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* User Details Modal */}
        {showUserDetails && selectedUser && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-2 sm:p-4">
              <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowUserDetails(false)}></div>
              
              <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-full sm:max-w-lg md:max-w-2xl w-full p-4 sm:p-6 mx-2 sm:mx-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    User Details: {selectedUser.name}
                  </h3>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.name}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 dark:text-gray-100">{selectedUser.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editFormData.email}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 dark:text-gray-100">{selectedUser.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editFormData.phone}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="Not provided"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 dark:text-gray-100">{selectedUser.phone || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.contact}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, contact: e.target.value }))}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="Not provided"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 dark:text-gray-100">{selectedUser.contact || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Language</label>
                      {isEditing ? (
                        <select
                          value={editFormData.language}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, language: e.target.value }))}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                        >
                          <option value="en">English</option>
                          <option value="zh-TW">繁體中文</option>
                          <option value="zh-CN">简体中文</option>
                          <option value="ja">日本語</option>
                        </select>
                      ) : (
                        <p className="text-sm text-gray-900 dark:text-gray-100">{selectedUser.language}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Global Admin</label>
                      {isEditing ? (
                        <div className="mt-1 flex items-center">
                          <input
                            type="checkbox"
                            checked={editFormData.isAdmin}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, isAdmin: e.target.checked }))}
                            disabled={!isCurrentUserSuperAdmin}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            System Administrator
                            {!isCurrentUserSuperAdmin && (
                              <span className="ml-2 text-xs text-gray-500">(Only super admin can change)</span>
                            )}
                          </label>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {selectedUser.isAdmin ? 'System Administrator' : 'Regular User'}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {selectedUser.isAdmin 
                          ? 'Has full system access' 
                          : 'See roles below for community/building permissions'}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Households</label>
                    {selectedUser.households.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No households</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedUser.households.map((household) => (
                          <div key={household.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{household.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Role: {household.role}</p>
                              {household.building && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Building: {household.building.name}
                                  {household.building.community && ` (${household.building.community.name})`}
                                </p>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Joined: {new Date(household.joinedAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Community Memberships
                      </label>
                      <button
                        onClick={() => {
                          setShowAddCommunity(true)
                          setNewCommunityId('')
                          setNewCommunityRole('MEMBER')
                        }}
                        className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                      >
                        + Add Community
                      </button>
                    </div>
                  {selectedUser.communities && selectedUser.communities.length > 0 ? (
                    <div className="space-y-2">
                        {selectedUser.communities.map((community) => {
                          // Check if user is building admin in this community but not community admin
                          // Find buildings in this community where user is ADMIN
                          const buildingsInThisCommunity = selectedUser.buildings?.filter(b => {
                            // Check if building belongs to this community
                            // For now, if user is building admin, assume they're admin in this community's buildings
                            // We'll check by matching community if available
                            const buildingCommunityId = (b as any).communityId || (b as any).community?.id
                            return b.role === 'ADMIN' && (!buildingCommunityId || buildingCommunityId === community.id)
                          }) || []
                          
                          const isBuildingAdminOnly = buildingsInThisCommunity.length > 0 && community.role !== 'ADMIN'
                          const isCommunityRoleLocked = isBuildingAdminOnly
                          
                          // If user is building admin but community role is not MEMBER, we should show MEMBER (locked)
                          const displayRole = isCommunityRoleLocked ? 'MEMBER' : (community.role || 'MEMBER')
                          
                          return (
                            <div key={community.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{community.name}</p>
                                <div className="mt-1 flex items-center space-x-3">
                                  {editingCommunityRole === community.membershipId && !isCommunityRoleLocked ? (
                                    <>
                                      <select
                                        value={community.role || 'MEMBER'}
                                        onChange={(e) => {
                                          handleUpdateCommunityRole(community.id, community.membershipId, e.target.value)
                                        }}
                                        disabled={savingRole}
                                        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-600 dark:text-gray-100"
                                      >
                                        <option value="ADMIN">ADMIN</option>
                                        <option value="MANAGER">MANAGER</option>
                                        <option value="MEMBER">MEMBER</option>
                                        <option value="VIEWER">VIEWER</option>
                                      </select>
                                      <button
                                        onClick={() => setEditingCommunityRole(null)}
                                        className="text-xs text-gray-500 hover:text-gray-700"
                                        disabled={savingRole}
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        displayRole === 'ADMIN' 
                                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                          : displayRole === 'MANAGER'
                                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                          : displayRole === 'MEMBER'
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                      }`}>
                                        {displayRole}
                                        {isCommunityRoleLocked && ' (Locked)'}
                                      </span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        Joined: {new Date(community.joinedAt).toLocaleDateString()}
                                      </span>
                                      {!isCommunityRoleLocked && (
                                        <button
                                          onClick={() => setEditingCommunityRole(community.membershipId)}
                                          className="ml-2 text-xs text-primary-600 hover:text-primary-800"
                                          title="Edit role"
                                          disabled={savingRole}
                                        >
                                          <PencilIcon className="h-3 w-3" />
                                        </button>
                                      )}
                                      {isCommunityRoleLocked && (
                                        <span className="ml-2 text-xs text-gray-400 italic">
                                          Building admin - community role locked to MEMBER
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No community memberships</p>
                    )}
                    {showAddCommunity && (
                      <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900 rounded border border-blue-200 dark:border-blue-700">
                        <div className="flex items-center space-x-2">
                          <select
                            value={newCommunityId}
                            onChange={(e) => setNewCommunityId(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                          >
                            <option value="">Select Community</option>
                            {communities.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                          <select
                            value={newCommunityRole}
                            onChange={(e) => setNewCommunityRole(e.target.value)}
                            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="MANAGER">MANAGER</option>
                            <option value="MEMBER">MEMBER</option>
                            <option value="VIEWER">VIEWER</option>
                          </select>
                          <button
                            onClick={async () => {
                              if (!newCommunityId) {
                                toast.error('Please select a community')
                                return
                              }
                              setAddingMembership(true)
                              try {
                                const response = await fetch(`/api/community/${newCommunityId}/members`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  credentials: 'include',
                                  body: JSON.stringify({
                                    targetUserId: selectedUser?.id,
                                    role: newCommunityRole,
                                    memberClass: 'community' // Working team member
                                  })
                                })
                                const data = await response.json()
                                if (response.ok) {
                                  toast.success('Added to community successfully')
                                  setShowAddCommunity(false)
                                  setNewCommunityId('')
                                  setNewCommunityRole('MEMBER')
                                  // Fetch fresh user data
                                  await fetchUsers()
                                  // Refresh selected user details
                                  if (selectedUser) {
                                    try {
                                      const userResponse = await fetch(`/api/admin/users/${selectedUser.id}`)
                                      if (userResponse.ok) {
                                        const userData = await userResponse.json()
                                        setSelectedUser(userData.user)
                                      } else {
                                        // Fallback to finding in updated users list
                                        const updated = users.find(u => u.id === selectedUser.id)
                                        if (updated) setSelectedUser(updated)
                                      }
                                    } catch (err) {
                                      console.error('Error refreshing user data:', err)
                                      // Fallback to finding in updated users list
                                      const updated = users.find(u => u.id === selectedUser.id)
                                      if (updated) setSelectedUser(updated)
                                    }
                                  }
                                } else {
                                  const errorMsg = data.error || data.details || 'Failed to add to community'
                                  console.error('[Add Community Member] Error:', data)
                                  toast.error(errorMsg)
                                }
                              } catch (err: any) {
                                console.error('[Add Community Member] Request failed:', err)
                                const errorMessage = err.message || 'Failed to add community member. Please check your connection and try again.'
                                toast.error(errorMessage)
                              } finally {
                                setAddingMembership(false)
                              }
                            }}
                            disabled={addingMembership || !newCommunityId}
                            className="px-3 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => setShowAddCommunity(false)}
                            className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Building Memberships
                      </label>
                      <button
                        onClick={() => {
                          setShowAddBuilding(true)
                          setNewBuildingId('')
                          setNewBuildingRole('MEMBER')
                        }}
                        className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                      >
                        + Add Building
                      </button>
                    </div>
                  {selectedUser.buildings && selectedUser.buildings.length > 0 ? (
                    <div className="space-y-2">
                        {selectedUser.buildings.map((building) => (
                          <div key={building.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{building.name}</p>
                              <div className="mt-1 flex items-center space-x-3">
                                {editingBuildingRole === building.membershipId ? (
                                  <>
                                    <select
                                      value={building.role || 'MEMBER'}
                                      onChange={(e) => {
                                        handleUpdateBuildingRole(building.id, building.membershipId, e.target.value)
                                      }}
                                      disabled={savingRole}
                                      className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-600 dark:text-gray-100"
                                    >
                                      <option value="ADMIN">ADMIN</option>
                                      <option value="MANAGER">MANAGER</option>
                                      <option value="MEMBER">MEMBER</option>
                                      <option value="VIEWER">VIEWER</option>
                                    </select>
                                    <button
                                      onClick={() => setEditingBuildingRole(null)}
                                      className="text-xs text-gray-500 hover:text-gray-700"
                                      disabled={savingRole}
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      building.role === 'ADMIN' 
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        : building.role === 'MANAGER'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                        : building.role === 'MEMBER'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                    }`}>
                                      {building.role || 'MEMBER'}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      Joined: {new Date(building.joinedAt).toLocaleDateString()}
                                    </span>
                                    <button
                                      onClick={() => setEditingBuildingRole(building.membershipId)}
                                      className="ml-2 text-xs text-primary-600 hover:text-primary-800"
                                      title="Edit role"
                                      disabled={savingRole}
                                    >
                                      <PencilIcon className="h-3 w-3" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No building memberships</p>
                    )}
                    {showAddBuilding && (
                      <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900 rounded border border-blue-200 dark:border-blue-700">
                        <div className="flex items-center space-x-2">
                          <select
                            value={newBuildingId}
                            onChange={(e) => setNewBuildingId(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                          >
                            <option value="">Select Building</option>
                            {buildings.map((b) => (
                              <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                          </select>
                          <select
                            value={newBuildingRole}
                            onChange={(e) => setNewBuildingRole(e.target.value)}
                            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="MANAGER">MANAGER</option>
                            <option value="MEMBER">MEMBER</option>
                            <option value="VIEWER">VIEWER</option>
                          </select>
                          <button
                            onClick={async () => {
                              if (!newBuildingId) {
                                toast.error('Please select a building')
                                return
                              }
                              setAddingMembership(true)
                              try {
                                const response = await fetch(`/api/building/${newBuildingId}/members`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  credentials: 'include',
                                  body: JSON.stringify({
                                    targetUserId: selectedUser?.id,
                                    role: newBuildingRole,
                                    memberClass: 'building' // Working team member
                                  })
                                })
                                const data = await response.json()
                                if (response.ok) {
                                  toast.success('Added to building successfully')
                                  setShowAddBuilding(false)
                                  setNewBuildingId('')
                                  setNewBuildingRole('MEMBER')
                                  // Fetch fresh user data
                                  await fetchUsers()
                                  // Refresh selected user details
                                  if (selectedUser) {
                                    try {
                                      const userResponse = await fetch(`/api/admin/users/${selectedUser.id}`)
                                      if (userResponse.ok) {
                                        const userData = await userResponse.json()
                                        setSelectedUser(userData.user)
                                      } else {
                                        // Fallback to finding in updated users list
                                        const updated = users.find(u => u.id === selectedUser.id)
                                        if (updated) setSelectedUser(updated)
                                      }
                                    } catch (err) {
                                      console.error('Error refreshing user data:', err)
                                      // Fallback to finding in updated users list
                                      const updated = users.find(u => u.id === selectedUser.id)
                                      if (updated) setSelectedUser(updated)
                                    }
                                  }
                                } else {
                                  const errorMsg = data.error || data.details || 'Failed to add to building'
                                  console.error('[Add Building Member] Error:', data)
                                  toast.error(errorMsg)
                                }
                              } catch (err: any) {
                                console.error('[Add Building Member] Request failed:', err)
                                const errorMessage = err.message || 'Failed to add building member. Please check your connection and try again.'
                                toast.error(errorMessage)
                              } finally {
                                setAddingMembership(false)
                              }
                            }}
                            disabled={addingMembership || !newBuildingId}
                            className="px-3 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => setShowAddBuilding(false)}
                            className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedUser.workingGroups && selectedUser.workingGroups.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Working Groups</label>
                      <div className="space-y-2">
                        {selectedUser.workingGroups.map((wg) => (
                          <div key={wg.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{wg.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Type: {wg.type} | Role: {wg.role}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Assigned: {new Date(wg.assignedAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => {
                          setIsEditing(false)
                          setEditFormData({
                            name: selectedUser.name,
                            email: selectedUser.email,
                            phone: selectedUser.phone || '',
                            contact: selectedUser.contact || '',
                            language: selectedUser.language || 'en',
                            isAdmin: selectedUser.isAdmin
                          })
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                        disabled={saving}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveUser}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowUserDetails(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create User Modal */}
        {showCreateModal && (
          <CreateUserModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={fetchUsers}
          />
        )}
      </div>
    </div>
  )
}