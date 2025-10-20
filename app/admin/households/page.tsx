'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { 
  HomeIcon, 
  UserGroupIcon, 
  CubeIcon, 
  ChartBarIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  KeyIcon,
  UserMinusIcon
} from '@heroicons/react/24/outline'

interface AdminUser { id: string; email: string; name: string | null; createdAt?: string }
interface AdminMember { id: string; role: string; joinedAt: string; user: AdminUser }
interface AdminHousehold {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: { items: number; members: number };
  members: AdminMember[];
  rooms?: { id: string; name: string }[];
  categories?: { id: string; name: string; level: number }[];
}

export default function AdminHouseholdsPage() {
  const { data: session } = useSession()
  const [households, setHouseholds] = useState<AdminHousehold[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedHousehold, setSelectedHousehold] = useState<string | null>(null)
  const [cleanupLoading, setCleanupLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      const [res, sres] = await Promise.all([
        fetch('/api/admin/households'),
        fetch('/api/admin/stats')
      ])
      if (!res.ok) {
        setError('Forbidden or failed to load')
        setLoading(false)
        return
      }
      const data = await res.json()
      setHouseholds(data.households || [])
      setStats(sres.ok ? await sres.json() : null)
      setLoading(false)
    }
    load()
  }, [])

  // Filter households based on search term
  const filteredHouseholds = households.filter(household => 
    household.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    household.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    household.members.some(member => 
      member.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading households...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold">Access Denied</div>
          <p className="text-gray-600 mt-2">{error}</p>
          <Link href="/admin-auth/signin" className="mt-4 inline-block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
            Admin Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                    <dd className="text-2xl font-bold text-gray-900">{stats.users}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <HomeIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Households</dt>
                    <dd className="text-2xl font-bold text-gray-900">{stats.households}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CubeIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Items</dt>
                    <dd className="text-2xl font-bold text-gray-900">{stats.items}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Avg Items/Household</dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {stats.households > 0 ? Math.round(stats.items / stats.households) : 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Households ({filteredHouseholds.length})</h2>
            <div className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search households, members, or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                />
              </div>
              <button
                onClick={async () => {
                  if (!confirm('This will remove duplicate households. Are you sure?')) return
                  setCleanupLoading(true)
                  try {
                    const response = await fetch('/api/admin/cleanup-households', { method: 'POST' })
                    if (response.ok) {
                      const result = await response.json()
                      alert(`Cleanup completed! Removed ${result.deletedCount} duplicate households.`)
                      location.reload()
                    } else {
                      alert('Failed to cleanup duplicates')
                    }
                  } catch (error) {
                    alert('Failed to cleanup duplicates')
                  } finally {
                    setCleanupLoading(false)
                  }
                }}
                disabled={cleanupLoading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {cleanupLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Cleaning...
                  </>
                ) : (
                  <>
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Cleanup Duplicates
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Households List */}
      <div className="space-y-6">
        {filteredHouseholds.map(h => (
          <div key={h.id} className="bg-white shadow rounded-lg overflow-hidden">
            {/* Household Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold text-gray-900 truncate">{h.name}</h3>
                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <UserGroupIcon className="h-4 w-4 mr-1" />
                      {h._count.members} members
                    </span>
                    <span className="flex items-center">
                      <CubeIcon className="h-4 w-4 mr-1" />
                      {h._count.items} items
                    </span>
                    <span>Created: {new Date(h.createdAt).toLocaleDateString()}</span>
                  </div>
                  {h.description && (
                    <p className="mt-2 text-sm text-gray-600">{h.description}</p>
                  )}
                </div>
                <div className="ml-4 flex-shrink-0">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedHousehold(selectedHousehold === h.id ? null : h.id)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      {selectedHousehold === h.id ? 'Hide Details' : 'Show Details'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Household Details */}
            {selectedHousehold === h.id && (
              <div className="px-6 py-4 space-y-6">
                {/* Structure Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">Rooms</h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {h.rooms?.length || 0}
                      </span>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {(h.rooms || []).map(r => (
                        <div key={r.id} className="text-sm text-gray-700 py-1 px-2 bg-white rounded border">
                          {r.name}
                        </div>
                      ))}
                      {(!h.rooms || h.rooms.length === 0) && (
                        <p className="text-sm text-gray-400 italic">No rooms created</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">Categories</h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {h.categories?.length || 0}
                      </span>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {(h.categories || []).map(c => (
                        <div key={c.id} className="text-sm text-gray-700 py-1 px-2 bg-white rounded border">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mr-2">
                            L{c.level}
                          </span>
                          {c.name}
                        </div>
                      ))}
                      {(!h.categories || h.categories.length === 0) && (
                        <p className="text-sm text-gray-400 italic">No categories created</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">Items</h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {h._count.items}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <p>Total items in household</p>
                      <p className="text-xs text-gray-500 mt-1">
                        View detailed items in the Items section
                      </p>
                    </div>
                  </div>
                </div>

                {/* Members Table */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Members ({h.members.length})</h4>
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {h.members.map(m => (
                          <tr key={m.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8">
                                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                    <span className="text-sm font-medium text-gray-700">
                                      {(m.user.name || m.user.email).charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {m.user.name || 'No name'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {m.user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                m.role === 'OWNER' ? 'bg-red-100 text-red-800' :
                                m.role === 'USER' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {m.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(m.joinedAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={async () => {
                                  const pw = prompt('New password for user?')
                                  if (!pw) return
                                  try {
                                    await fetch(`/api/admin/users/${m.user.id}/password`, { 
                                      method: 'POST', 
                                      headers: { 'Content-Type': 'application/json' }, 
                                      body: JSON.stringify({ password: pw }) 
                                    })
                                    alert('Password reset successfully')
                                  } catch (error) {
                                    alert('Failed to reset password')
                                  }
                                }}
                                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <KeyIcon className="h-3 w-3 mr-1" />
                                Reset Password
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm(`Remove ${m.user.email} from household?`)) return
                                  try {
                                    await fetch(`/api/admin/households/${h.id}/members?memberId=${m.id}`, { method: 'DELETE' })
                                    location.reload()
                                  } catch (error) {
                                    alert('Failed to remove member')
                                  }
                                }}
                                className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50"
                              >
                                <UserMinusIcon className="h-3 w-3 mr-1" />
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Household Actions */}
                <div className="border-t pt-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Household Actions</h4>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={async () => {
                        const name = prompt('Household name', h.name)
                        if (name == null) return
                        try {
                          await fetch(`/api/admin/households/${h.id}`, { 
                            method: 'PATCH', 
                            headers: { 'Content-Type': 'application/json' }, 
                            body: JSON.stringify({ name }) 
                          })
                          location.reload()
                        } catch (error) {
                          alert('Failed to rename household')
                        }
                      }}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Rename Household
                    </button>

                    <button
                      onClick={async () => {
                        const email = prompt('Invite user by email')
                        const role = prompt('Role (OWNER/USER/VISITOR)', 'USER')
                        if (!email || !role) return
                        try {
                          await fetch(`/api/admin/households/${h.id}/members`, { 
                            method: 'POST', 
                            headers: { 'Content-Type': 'application/json' }, 
                            body: JSON.stringify({ email, role }) 
                          })
                          location.reload()
                        } catch (error) {
                          alert('Failed to add member')
                        }
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Member
                    </button>

                    <button
                      onClick={async () => {
                        if (!confirm(`Delete household "${h.name}" and ALL its data? This action cannot be undone.`)) return
                        try {
                          await fetch(`/api/admin/households/${h.id}`, { method: 'DELETE' })
                          location.reload()
                        } catch (error) {
                          alert('Failed to delete household')
                        }
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete Household
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* No households found */}
      {filteredHouseholds.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No households found matching "{searchTerm}"</p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-4 text-red-600 hover:text-red-500"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  )
}
