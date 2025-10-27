'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from 'next-themes'
import LanguageProvider from '@/components/LanguageProvider'
import { HouseholdProvider } from '@/components/HouseholdProvider'
import SettingsLoader from '@/components/SettingsLoader'
import ErrorBoundary from '@/components/ErrorBoundary'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <ThemeProvider attribute="class" enableSystem>
          <LanguageProvider>
            <HouseholdProvider>
              <SettingsLoader />
              {children}
              <Toaster position="top-right" />
            </HouseholdProvider>
          </LanguageProvider>
        </ThemeProvider>
      </SessionProvider>
    </ErrorBoundary>
  )
}


