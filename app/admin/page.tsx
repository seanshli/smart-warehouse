'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface AdminUser { id: string; email: string; name: string | null }
interface AdminMember { id: string; role: string; user: AdminUser }
interface AdminHousehold {
  id: string;
  name: string;
  description: string | null;
  _count: { items: number; members: number };
  members: AdminMember[];
  rooms?: { id: string; name: string }[];
  categories?: { id: string; name: string; level: number }[];
}

export default function AdminPage() {
  const { data: session } = useSession()
  const [households, setHouseholds] = useState<AdminHousehold[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

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

  if (loading) return <div className="p-6">Loading...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Admin: Households</h1>
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border rounded p-3"><div className="text-xs text-gray-500">Users</div><div className="text-xl font-semibold">{stats.users}</div></div>
          <div className="bg-white border rounded p-3"><div className="text-xs text-gray-500">Households</div><div className="text-xl font-semibold">{stats.households}</div></div>
          <div className="bg-white border rounded p-3"><div className="text-xs text-gray-500">Items</div><div className="text-xl font-semibold">{stats.items}</div></div>
        </div>
      )}
      <div className="space-y-6">
        {households.map(h => (
          <div key={h.id} className="bg-white border rounded-md p-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium">{h.name}</h2>
                <p className="text-gray-400 text-xs">ID: {h.id}</p>
                {h.description && <p className="text-gray-500 text-sm">{h.description}</p>}
              </div>
              <div className="text-sm text-gray-500">{h._count.members} members • {h._count.items} items</div>
            </div>
            {/* Household structure overview */}
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-gray-50 border rounded p-3">
                <div className="text-xs text-gray-500 mb-1">Rooms ({h.rooms?.length || 0})</div>
                <ul className="text-sm max-h-28 overflow-auto space-y-1">
                  {(h.rooms || []).map(r => (
                    <li key={r.id} className="text-gray-700">{r.name}</li>
                  ))}
                  {(!h.rooms || h.rooms.length === 0) && <li className="text-gray-400">No rooms</li>}
                </ul>
              </div>
              <div className="bg-gray-50 border rounded p-3">
                <div className="text-xs text-gray-500 mb-1">Categories ({h.categories?.length || 0})</div>
                <ul className="text-sm max-h-28 overflow-auto space-y-1">
                  {(h.categories || []).map(c => (
                    <li key={c.id} className="text-gray-700">L{c.level} • {c.name}</li>
                  ))}
                  {(!h.categories || h.categories.length === 0) && <li className="text-gray-400">No categories</li>}
                </ul>
              </div>
              <div className="bg-gray-50 border rounded p-3">
                <div className="text-xs text-gray-500 mb-1">Items</div>
                <div className="text-sm text-gray-700">Total: {h._count.items}</div>
                <p className="text-xs text-gray-400 mt-1">Use user-facing app to drill into items per room/cabinet for now.</p>
              </div>
            </div>
            <div className="mt-3">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-1 pr-4">Member</th>
                    <th className="py-1 pr-4">Email</th>
                    <th className="py-1 pr-4">Role</th>
                    <th className="py-1 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {h.members.map(m => (
                    <tr key={m.id} className="border-t">
                      <td className="py-1 pr-4">{m.user.name || '—'}</td>
                      <td className="py-1 pr-4">{m.user.email}</td>
                      <td className="py-1 pr-4">{m.role}</td>
                      <td className="py-1 pr-4 space-x-2">
                        <button className="px-2 py-1 text-xs border rounded" onClick={async () => {
                          const pw = prompt('New password for user?')
                          if (!pw) return
                          await fetch(`/api/admin/users/${m.user.id}/password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) })
                          alert('Password reset')
                        }}>Reset Password</button>
                        <button className="px-2 py-1 text-xs border rounded" onClick={async () => {
                          if (!confirm('Remove member from household?')) return
                          await fetch(`/api/admin/households/${h.id}/members?memberId=${m.id}`, { method: 'DELETE' })
                          location.reload()
                        }}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex space-x-2">
              <button className="px-2 py-1 text-xs border rounded" onClick={async () => {
                const name = prompt('Household name', h.name)
                if (name == null) return
                await fetch(`/api/admin/households/${h.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
                location.reload()
              }}>Rename</button>
              <button className="px-2 py-1 text-xs border rounded" onClick={async () => {
                const email = prompt('Invite user by email')
                const role = prompt('Role (OWNER/USER/VISITOR)', 'USER')
                if (!email || !role) return
                await fetch(`/api/admin/households/${h.id}/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, role }) })
                location.reload()
              }}>Add Member</button>
              <button className="px-2 py-1 text-xs border rounded text-red-600" onClick={async () => {
                if (!confirm('Delete household and all data?')) return
                await fetch(`/api/admin/households/${h.id}`, { method: 'DELETE' })
                location.reload()
              }}>Delete Household</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


