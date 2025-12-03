'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/components/LanguageProvider'
import { 
  ShieldCheckIcon,
  UserGroupIcon,
  CogIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

interface AdminUser {
  id: string
  email: string
  name: string
  adminRole: string
  language: string
  createdAt: string
}

interface RoleOption {
  value: string
  label: string
  description: string
}

export default function AdminRolesPage() {
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [availableRoles, setAvailableRoles] = useState<RoleOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ adminRole: '', language: '' })
  const [deletingUser, setDeletingUser] = useState<string | null>(null)

  useEffect(() => {
    loadRoles()
  }, [])

  const loadRoles = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/roles')
      if (!res.ok) {
        throw new Error('Failed to load admin roles')
      }
      const data = await res.json()
      setAdminUsers(data.adminUsers || [])
      setAvailableRoles(data.availableRoles || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user.id)
    setEditForm({
      adminRole: user.adminRole,
      language: user.language
    })
  }

  const handleSaveEdit = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          adminRole: editForm.adminRole,
          language: editForm.language
        })
      })

      if (!res.ok) {
        throw new Error('Failed to update user role')
      }

      setEditingUser(null)
      await loadRoles()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const handleCancelEdit = () => {
    setEditingUser(null)
    setEditForm({ adminRole: '', language: '' })
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove admin privileges from this user? They will no longer have admin access.')) {
      return
    }

    try {
      setDeletingUser(userId)
      const res = await fetch(`/api/admin/roles?userId=${userId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to remove admin privileges')
      }

      await loadRoles()
      setDeletingUser(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setDeletingUser(null)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPERUSER': return 'bg-red-100 text-red-800'
      case 'USER_MANAGEMENT': return 'bg-blue-100 text-blue-800'
      case 'ITEM_MANAGEMENT': return 'bg-green-100 text-green-800'
      case 'HOUSEHOLD_MODIFICATION': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin roles...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-600">{error}</div>
          <button
            onClick={loadRoles}
            className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('adminRoleManagement')}</h1>
        <p className="text-gray-600 mt-1">{t('adminRoleManagementDescription')}</p>
      </div>

      {/* Available Roles Info */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            <ShieldCheckIcon className="h-5 w-5 inline mr-2" />
            Available Roles
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {availableRoles.map((role) => (
              <div key={role.value} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900">{role.label}</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(role.value)}`}>
                    {role.value.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{role.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Admin Users */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Admin Users ({adminUsers.length})
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Manage admin user roles and language preferences
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Language
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {adminUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                          <UserGroupIcon className="h-5 w-5 text-red-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name || 'No name'}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUser === user.id ? (
                      <select
                        value={editForm.adminRole}
                        onChange={(e) => setEditForm({ ...editForm, adminRole: e.target.value })}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                      >
                        {availableRoles.map((role) => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.adminRole)}`}>
                        {user.adminRole.replace('_', ' ')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUser === user.id ? (
                      <select
                        value={editForm.language}
                        onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                      >
                        <option value="en">English</option>
                        <option value="tw">Traditional Chinese</option>
                        <option value="ch">Simplified Chinese</option>
                        <option value="jp">Japanese</option>
                      </select>
                    ) : (
                      <span className="text-sm text-gray-900">{user.language?.toUpperCase() || 'EN'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingUser === user.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSaveEdit(user.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="inline-flex items-center px-3 py-1 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-gray-600 hover:bg-gray-700"
                        >
                          <XCircleIcon className="h-3 w-3 mr-1" />
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50"
                        >
                          <PencilIcon className="h-3 w-3 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={deletingUser === user.id}
                          className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Remove admin privileges"
                        >
                          <TrashIcon className="h-3 w-3 mr-1" />
                          {deletingUser === user.id ? 'Removing...' : 'Remove'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
