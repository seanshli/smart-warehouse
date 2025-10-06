'use client'

import { useEffect, useState } from 'react'

interface AdminItem { id: string; name: string; quantity: number; household: { id: string; name: string }; room?: { id: string; name: string } | null; cabinet?: { id: string; name: string } | null }

export default function AdminItemsPage() {
  const [items, setItems] = useState<AdminItem[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/items${q ? `?q=${encodeURIComponent(q)}` : ''}`)
    if (res.ok) {
      const data = await res.json()
      setItems(data.items || [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Admin: Items</h1>
      <div className="mb-4 flex space-x-2">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name..." className="border rounded px-2 py-1 text-sm" />
        <button onClick={load} className="px-3 py-1 border rounded text-sm">Search</button>
      </div>
      {loading ? 'Loading...' : (
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-1 pr-4">Name</th>
              <th className="py-1 pr-4">Qty</th>
              <th className="py-1 pr-4">Household</th>
              <th className="py-1 pr-4">Room</th>
              <th className="py-1 pr-4">Cabinet</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => (
              <tr key={it.id} className="border-t">
                <td className="py-1 pr-4">{it.name}</td>
                <td className="py-1 pr-4">{it.quantity}</td>
                <td className="py-1 pr-4">{it.household?.name}</td>
                <td className="py-1 pr-4">{it.room?.name || '—'}</td>
                <td className="py-1 pr-4">{it.cabinet?.name || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}


