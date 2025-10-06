'use client'

import React, { useState, useEffect } from 'react'
import { useHousehold, PermissionGate, RoleGate } from './HouseholdProvider'
import { UserRole } from '@/lib/permissions'

interface Member {
  id: string
  role: string
  joinedAt: string
  user: {
    id: string
    email: string
    name: string | null
    image: string | null
  }
  canManage: boolean
}

interface HouseholdMemberManagementProps {
  householdId: string
}

export function HouseholdMemberManagement({ householdId }: HouseholdMemberManagementProps) {
  const { permissions } = useHousehold()
  const [members, setMembers] = useState<Member[]>([])
  const [assignableRoles, setAssignableRoles] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('USER')
  const [invitationCode, setInvitationCode] = useState('')
  const [isLoadingInvitation, setIsLoadingInvitation] = useState(false)

  useEffect(() => {
    fetchMembers()
    fetchInvitationCode()
  }, [householdId])

  const fetchInvitationCode = async () => {
    try {
      const response = await fetch('/api/household/invitation')
      if (response.ok) {
        const data = await response.json()
        setInvitationCode(data.invitationCode)
      }
    } catch (error) {
      console.error('Failed to fetch invitation code:', error)
    }
  }

  const regenerateInvitationCode = async () => {
    setIsLoadingInvitation(true)
    try {
      const response = await fetch('/api/household/invitation', {
        method: 'POST',
      })
      if (response.ok) {
        const data = await response.json()
        setInvitationCode(data.invitationCode)
        toast.success('Invitation code regenerated successfully')
      } else {
        toast.error('Failed to regenerate invitation code')
      }
    } catch (error) {
      console.error('Failed to regenerate invitation code:', error)
      toast.error('Failed to regenerate invitation code')
    } finally {
      setIsLoadingInvitation(false)
    }
  }

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/household/members?householdId=${householdId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch members')
      }

      const data = await response.json()
      setMembers(data.members)
      setAssignableRoles(data.assignableRoles)
    } catch (err) {
      console.error('Error fetching members:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMemberEmail.trim()) return

    try {
      const response = await fetch('/api/household/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          householdId,
          targetUserEmail: newMemberEmail,
          role: newMemberRole
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add member')
      }

      setNewMemberEmail('')
      setNewMemberRole('USER')
      setShowAddMember(false)
      fetchMembers()
    } catch (err) {
      console.error('Error adding member:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    try {
      const response = await fetch(`/api/household/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update role')
      }

      fetchMembers()
    } catch (err) {
      console.error('Error updating role:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      const response = await fetch(`/api/household/members/${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove member')
      }

      fetchMembers()
    } catch (err) {
      console.error('Error removing member:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'USER':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'VISITOR':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Household Members
        </h3>
        <PermissionGate permission="canManageMembers">
          <button
            onClick={() => setShowAddMember(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Add Member
          </button>
        </PermissionGate>
      </div>

      {/* Invitation Code Section */}
      <PermissionGate permission="canManageHousehold">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-blue-900">Invitation Code</h3>
              <p className="text-sm text-blue-700">
                Share this code with others to let them join your household
              </p>
              <div className="mt-2 flex items-center space-x-2">
                <code className="bg-blue-100 text-blue-900 px-3 py-1 rounded font-mono text-lg">
                  {invitationCode}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(invitationCode)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>
            </div>
            <button
              onClick={regenerateInvitationCode}
              disabled={isLoadingInvitation}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingInvitation ? 'Regenerating...' : 'Regenerate'}
            </button>
          </div>
          <div className="mt-3 text-xs text-blue-600">
            <p>• Share this code with family members to invite them</p>
            <p>• New users can enter this code during signup to join your household</p>
            <p>• Regenerate if you suspect the code has been compromised</p>
          </div>
        </div>
      </PermissionGate>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {showAddMember && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">
            Add New Member
          </h4>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Enter member's email address"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Role
              </label>
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value as UserRole)}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {assignableRoles.map((role) => (
                  <option key={role} value={role} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Add Member
              </button>
              <button
                type="button"
                onClick={() => setShowAddMember(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {members.map((member) => (
              <tr key={member.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {member.user.image ? (
                        <img
                          className="h-10 w-10 rounded-full"
                          src={member.user.image}
                          alt={member.user.name || member.user.email}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {member.user.name || 'No name'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {member.user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <PermissionGate permission="canManageMembers">
                    {member.canManage ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                        className="text-sm border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        {assignableRoles.map((role) => (
                          <option key={role} value={role} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                            {role}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(member.role)}`}>
                        {member.role}
                      </span>
                    )}
                  </PermissionGate>
                  {!permissions?.canManageMembers && (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(member.role)}`}>
                      {member.role}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(member.joinedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <PermissionGate permission="canManageMembers">
                    {member.canManage && member.role !== 'OWNER' && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Remove
                      </button>
                    )}
                  </PermissionGate>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
