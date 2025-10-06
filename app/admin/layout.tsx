'use client'

import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav className="bg-white border-b mb-4">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center space-x-4 text-sm">
          <Link href="/admin" className="text-gray-700 hover:text-black">Households</Link>
          <Link href="/admin/items" className="text-gray-700 hover:text-black">Items</Link>
        </div>
      </nav>
      {children}
    </div>
  )}


