'use client'

import { Session } from 'next-auth'
import ErrorBoundary from '@/components/ErrorBoundary'
import { ComponentType } from 'react'

interface ClientHomeProps {
  session: Session
  Dashboard: ComponentType<any>
}

export default function ClientHome({ session, Dashboard }: ClientHomeProps) {
  return (
    <div className="min-h-screen">
      <ErrorBoundary>
        <Dashboard />
      </ErrorBoundary>
    </div>
  )
}
