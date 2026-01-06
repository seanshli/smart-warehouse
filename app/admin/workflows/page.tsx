'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/components/LanguageProvider'
import WorkflowsTab from '@/app/community/[id]/WorkflowsTab'

export default function AdminWorkflowsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session?.user) {
      router.push('/admin-auth/signin')
      return
    }

    // Check admin access
    fetch('/api/admin/context')
      .then(res => res.json())
      .then(data => {
        const hasAdminAccess = data.isSuperAdmin || 
                              (data.communityAdmins && data.communityAdmins.length > 0) ||
                              (data.buildingAdmins && data.buildingAdmins.length > 0)
        
        if (!hasAdminAccess && !(session.user as any)?.isAdmin) {
          router.push('/admin-auth/signin')
        }
      })
      .catch(() => {
        // Fallback: check isAdmin flag
        if (!(session.user as any)?.isAdmin) {
          router.push('/admin-auth/signin')
        }
      })
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Super admin can manage workflows globally (no specific community/building)
  // Pass empty strings to allow global access
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Workflow Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage workflow types, templates, and instances. Super admins can assign suppliers to workflows.
        </p>
      </div>
      <WorkflowsTab communityId="" buildingId={undefined} />
    </div>
  )
}

