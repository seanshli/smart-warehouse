'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'
import LanguageProvider from '@/components/LanguageProvider'
import { HouseholdProvider } from '@/components/HouseholdProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <HouseholdProvider>
          {children}
          <Toaster position="top-right" />
        </HouseholdProvider>
      </LanguageProvider>
    </SessionProvider>
  )
}


